import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Image,
  LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TierPrivilegeBanner } from '../../components/TierPrivilegeBanner';
import { EXPLORE_NODES, ExploreNode } from '../../data/connectFeed';
import { useTier } from '../../context/TierContext';
import * as bridge from '../../services/connectBridge';
import {
  getVariableRewardHint,
  trackInteraction,
} from '../../services/engagementEngine';
import { paletteFor } from '../../theme/tokens';

const COGNITIVE_FILTERS = ['Any', 'High', 'Advanced'] as const;
const SIM_MIN = 0.55;
const SIM_MAX = 0.95;

type ConnectResult = {
  node: ExploreNode;
  icebreaker: string;
  synergy: string;
};

function clampSim(v: number) {
  return Math.min(SIM_MAX, Math.max(SIM_MIN, Math.round(v * 100) / 100));
}

function resolveNodes(
  isElite: boolean,
  minAlignment: number,
  cognitive: string,
  dismissed: Set<string>
): ExploreNode[] {
  try {
    const fn = (bridge as { getExploreNodes?: typeof bridge.getExploreNodes }).getExploreNodes;
    if (fn) {
      return fn(isElite, minAlignment, cognitive).filter((n) => !dismissed.has(n.id));
    }
  } catch {
    /* local filter */
  }
  return EXPLORE_NODES.filter((n) => {
    if (dismissed.has(n.id)) return false;
    if (n.tier === 'Elite' && !isElite) return false;
    if (n.alignment < minAlignment) return false;
    if (cognitive === 'High' && !['High', 'Advanced'].includes(n.cognitive)) return false;
    if (cognitive === 'Advanced' && n.cognitive !== 'Advanced') return false;
    return true;
  }).sort((a, b) => b.alignment - a.alignment);
}

function SimilarityControl({
  value,
  onChange,
  styles,
  c,
  isElite,
}: {
  value: number;
  onChange: (v: number) => void;
  styles: ReturnType<typeof makeStyles>;
  c: ReturnType<typeof paletteFor>;
  isElite: boolean;
}) {
  const [trackW, setTrackW] = useState(0);
  const pct = Math.round(value * 100);
  const fill = (value - SIM_MIN) / (SIM_MAX - SIM_MIN);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackW(e.nativeEvent.layout.width);
  };

  const setFromX = (x: number) => {
    if (trackW <= 0) return;
    const t = Math.min(1, Math.max(0, x / trackW));
    onChange(clampSim(SIM_MIN + t * (SIM_MAX - SIM_MIN)));
  };

  return (
    <View>
      <Text style={styles.controlLabel}>Mindset Similarity: {pct}% Minimum</Text>
      <View style={styles.simRow}>
        <Pressable
          style={styles.stepper}
          onPress={() => onChange(clampSim(value - 0.01))}
          hitSlop={6}
        >
          <Text style={styles.stepperText}>−</Text>
        </Pressable>
        <Pressable
          style={styles.track}
          onLayout={onTrackLayout}
          onPress={(e) => setFromX(e.nativeEvent.locationX)}
        >
          <View style={[styles.trackFill, { width: `${Math.round(fill * 100)}%` }]} />
          <View
            style={[
              styles.trackThumb,
              { left: `${Math.min(98, Math.max(2, Math.round(fill * 100)))}%` },
            ]}
          />
          {/* Dense tick marks for precise tap zones */}
          <View style={styles.tickRow} pointerEvents="none">
            {Array.from({ length: 41 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.tick,
                  i % 5 === 0 && styles.tickMajor,
                  { backgroundColor: i / 40 <= fill ? (isElite ? '#0B0B0C' : '#fff') : c.border },
                ]}
              />
            ))}
          </View>
        </Pressable>
        <Pressable
          style={styles.stepper}
          onPress={() => onChange(clampSim(value + 0.01))}
          hitSlop={6}
        >
          <Text style={styles.stepperText}>+</Text>
        </Pressable>
      </View>
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeText}>55%</Text>
        <Text style={styles.rangeText}>95%</Text>
      </View>
    </View>
  );
}

function ExploreCard({
  item,
  styles,
  isElite,
  onConnect,
  onDismiss,
}: {
  item: ExploreNode;
  styles: ReturnType<typeof makeStyles>;
  isElite: boolean;
  onConnect: () => void;
  onDismiss: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, item.id]);

  const alignPct = Math.round(item.alignment * 100);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.top}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {item.name}, {item.age}
          </Text>
          <Text style={styles.title}>{item.title}</Text>
        </View>
        <Text style={styles.pct}>{alignPct}%</Text>
      </View>

      <Text style={styles.alignLabel}>Alignment</Text>
      <View style={styles.alignTrack}>
        <View style={[styles.alignFill, { width: `${alignPct}%` }]} />
      </View>

      <Text style={styles.label}>Ideology Profile Alignment Cluster</Text>
      <Text style={styles.clusters}>{item.clusters.join(', ')}</Text>

      <Text style={styles.label}>Cognitive Engagement Footprint</Text>
      <Text style={styles.value}>{item.cognitive}</Text>

      <Text style={styles.label}>Matched Core Interests</Text>
      <Text style={styles.value}>{item.niches.join(', ')}</Text>

      <View style={styles.actions}>
        <Pressable style={styles.connect} onPress={onConnect}>
          <Text style={styles.connectText}>⚡ Connect Semantically</Text>
        </Pressable>
        <Pressable style={styles.dismiss} onPress={onDismiss}>
          <Text style={styles.dismissText}>✕</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function ExploreScreen() {
  const navigation = useNavigation<any>();
  const { state: tierState, setTier } = useTier();
  const isElite = tierState.isElite;
  const c = paletteFor(isElite);
  const [minSimilarity, setMinSimilarity] = useState(0.75);
  const [cognitive, setCognitive] = useState<(typeof COGNITIVE_FILTERS)[number]>('Advanced');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [connectResult, setConnectResult] = useState<ConnectResult | null>(null);
  const [fomoHint] = useState(() => {
    try {
      return getVariableRewardHint?.() ?? null;
    } catch {
      return null;
    }
  });

  const nodes = useMemo(
    () => resolveNodes(isElite, minSimilarity, cognitive, dismissed),
    [dismissed, minSimilarity, cognitive, isElite]
  );

  const styles = useMemo(() => makeStyles(c, isElite), [c, isElite]);

  const onConnect = (item: ExploreNode) => {
    trackInteraction('semantic_connect', item.id);
    let icebreaker =
      'Agent A scored niche vectors · Agent B authenticity · Agent C fused weights.';
    let synergy = item.alignment.toFixed(2);
    try {
      const fn = (bridge as { semanticConnect?: typeof bridge.semanticConnect }).semanticConnect;
      if (fn) {
        const res = fn(item.id);
        icebreaker = res.icebreaker;
        synergy = res.synergy;
      }
    } catch {
      /* keep defaults */
    }
    setConnectResult({ node: item, icebreaker, synergy });
  };

  const openChat = () => {
    setConnectResult(null);
    try {
      navigation.navigate('Chat');
    } catch {
      Alert.alert('Connected', 'Semantic connect queued — open Chat to continue.');
    }
  };

  const renderCard = ({ item }: { item: ExploreNode }) => (
    <ExploreCard
      item={item}
      styles={styles}
      isElite={isElite}
      onConnect={() => onConnect(item)}
      onDismiss={() => {
        trackInteraction('dismiss', item.id);
        setDismissed((s) => new Set(s).add(item.id));
      }}
    />
  );

  return (
    <View style={styles.root}>
      <TierPrivilegeBanner
        onUpsellPress={() => setTier('Elite')}
        onHubPress={() =>
          Alert.alert('Global Hub', 'Elite can toggle London / Dubai / New York hubs.')
        }
      />
      <View style={styles.headingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Explore Networks</Text>
          <Text style={styles.sub}>Cognitive Alignment Engine Space</Text>
        </View>
        {!!fomoHint && (
          <View style={styles.fomoChip}>
            <Text style={styles.fomoText}>{fomoHint}</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <SimilarityControl
          value={minSimilarity}
          onChange={setMinSimilarity}
          styles={styles}
          c={c}
          isElite={isElite}
        />
        <Text style={[styles.controlLabel, { marginTop: 14 }]}>Cognitive Tier Focus</Text>
        <View style={styles.sliderRow}>
          {COGNITIVE_FILTERS.map((f) => (
            <Pressable
              key={f}
              style={[styles.pill, cognitive === f && styles.pillActive]}
              onPress={() => setCognitive(f)}
            >
              <Text style={[styles.pillText, cognitive === f && styles.pillTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={nodes}
        keyExtractor={(n) => n.id}
        renderItem={renderCard}
        contentContainerStyle={{ padding: 12, paddingBottom: 40, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>No nodes in this similarity band.</Text>
            <Pressable
              style={styles.emptyCta}
              onPress={() => setMinSimilarity(clampSim(minSimilarity - 0.1))}
            >
              <Text style={styles.emptyCtaText}>Lower threshold</Text>
            </Pressable>
          </View>
        }
      />

      <Modal
        visible={!!connectResult}
        animationType="fade"
        transparent
        onRequestClose={() => setConnectResult(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setConnectResult(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalEyebrow}>Semantic connect</Text>
            <Text style={styles.modalTitle}>
              {connectResult?.node.name}
              {connectResult ? ` · ${Math.round(connectResult.node.alignment * 100)}%` : ''}
            </Text>
            <Text style={styles.modalSynergy}>
              Synergy score · {connectResult?.synergy ?? '—'}
            </Text>
            <Text style={styles.modalIce}>{connectResult?.icebreaker}</Text>
            <Pressable style={styles.modalPrimary} onPress={openChat}>
              <Text style={styles.modalPrimaryText}>Open Chat</Text>
            </Pressable>
            <Pressable style={styles.modalCancel} onPress={() => setConnectResult(null)}>
              <Text style={styles.modalCancelText}>Dismiss</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof paletteFor>, isElite: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    headingRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
    },
    heading: {
      fontSize: 22,
      fontWeight: '800',
      color: c.text,
    },
    sub: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    fomoChip: {
      maxWidth: 140,
      backgroundColor: c.glow,
      borderWidth: 1,
      borderColor: c.accent,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    fomoText: { fontSize: 10, color: c.accent, fontWeight: '700', lineHeight: 13 },
    controls: {
      marginHorizontal: 12,
      padding: 14,
      borderRadius: 14,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 8,
    },
    controlLabel: { fontSize: 12, color: c.textMuted, marginBottom: 8, fontWeight: '600' },
    simRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    stepper: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperText: { fontSize: 20, fontWeight: '700', color: c.text, lineHeight: 22 },
    track: {
      flex: 1,
      height: 28,
      borderRadius: 8,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    trackFill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: c.accent,
      opacity: 0.85,
    },
    trackThumb: {
      position: 'absolute',
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: isElite ? '#0B0B0C' : '#fff',
      marginLeft: -7,
      borderWidth: 2,
      borderColor: c.accent,
    },
    tickRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      alignItems: 'center',
    },
    tick: { width: 1, height: 8, opacity: 0.55 },
    tickMajor: { height: 14, width: 1.5, opacity: 0.9 },
    rangeLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
      paddingHorizontal: 44,
    },
    rangeText: { fontSize: 10, color: c.textMuted },
    sliderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.surfaceMuted,
    },
    pillActive: { backgroundColor: c.accent },
    pillText: { fontSize: 12, color: c.text, fontWeight: '600' },
    pillTextActive: { color: isElite ? '#0B0B0C' : '#fff' },
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    avatar: { width: 52, height: 52, borderRadius: 26 },
    name: { fontSize: 17, fontWeight: '800', color: c.text },
    title: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    pct: { fontSize: 18, fontWeight: '800', color: c.accent },
    alignLabel: {
      fontSize: 10,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    alignTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.surfaceMuted,
      overflow: 'hidden',
      marginBottom: 4,
    },
    alignFill: {
      height: '100%',
      backgroundColor: c.accent,
      borderRadius: 3,
    },
    label: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    clusters: { fontSize: 14, color: c.text, marginTop: 4, lineHeight: 20 },
    value: { fontSize: 14, color: c.text, marginTop: 4, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
    connect: {
      flex: 1,
      backgroundColor: c.accent,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    connectText: { color: isElite ? '#0B0B0C' : '#fff', fontWeight: '800', fontSize: 13 },
    dismiss: {
      width: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dismissText: { color: c.textMuted, fontSize: 18, fontWeight: '700' },
    emptyWrap: { alignItems: 'center', marginTop: 48, paddingHorizontal: 24 },
    empty: { textAlign: 'center', color: c.textMuted, marginBottom: 14 },
    emptyCta: {
      backgroundColor: c.accent,
      borderRadius: 12,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    emptyCtaText: { color: isElite ? '#0B0B0C' : '#fff', fontWeight: '800' },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: {
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: 22,
      borderWidth: 1,
      borderColor: c.border,
    },
    modalEyebrow: {
      fontSize: 11,
      color: c.accent,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: c.text, marginTop: 6 },
    modalSynergy: { fontSize: 13, color: c.textMuted, marginTop: 4, fontWeight: '600' },
    modalIce: { fontSize: 14, color: c.text, lineHeight: 21, marginTop: 14, marginBottom: 18 },
    modalPrimary: {
      backgroundColor: c.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    modalPrimaryText: { color: isElite ? '#0B0B0C' : '#fff', fontWeight: '800' },
    modalCancel: { marginTop: 12, alignItems: 'center', paddingVertical: 8 },
    modalCancelText: { color: c.textMuted, fontWeight: '600' },
  });
}
