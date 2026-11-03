import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TierPrivilegeBanner } from '../../components/TierPrivilegeBanner';
import { DATING_PROFILES, DatingProfile } from '../../data/connectFeed';
import {
  extendFeed,
  getSessionStats,
  getVariableRewardHint,
  rankForSession,
  shouldShowPullToSurprise,
  trackDwell,
  trackInteraction,
} from '../../services/engagementEngine';
import { useTier } from '../../context/TierContext';
import { paletteFor } from '../../theme/tokens';

const { width } = Dimensions.get('window');

type RespondTarget = {
  profile: DatingProfile;
  promptId?: string;
  assetType: 'photo' | 'prompt';
};

type RankedProfile = DatingProfile & {
  novelty?: number;
  socialProof?: number;
  affinity?: number;
};

type PromptDmResult = { status: 'queued' | 'blocked'; reason: string };

/** Soft optional bridge — screens still run if module APIs change. */
type DatingBridge = {
  getDatingFeed?: (isElite: boolean) => DatingProfile[];
  requestPromptDm?: ((
    payload: {
      profileId: string;
      promptId?: string;
      assetType: 'photo' | 'prompt';
      message: string;
      viewerIsElite?: boolean;
    }
  ) => PromptDmResult | Promise<PromptDmResult> | void) &
    ((
      profileId: string,
      promptId: string,
      message: string,
      viewerIsElite?: boolean
    ) => PromptDmResult | Promise<PromptDmResult> | void);
};

function loadBridge(): DatingBridge | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../../services/connectBridge') as DatingBridge;
  } catch {
    return null;
  }
}

const bridge = loadBridge();

function filterLocalFeed(isElite: boolean): DatingProfile[] {
  if (isElite) return [...DATING_PROFILES];
  // Premium: Elite + ghostMode are invisible (not locked icons)
  return DATING_PROFILES.filter((p) => p.tier !== 'Elite' && !p.ghostMode);
}

function resolveCorpus(isElite: boolean): DatingProfile[] {
  if (bridge?.getDatingFeed) return bridge.getDatingFeed(isElite);
  return filterLocalFeed(isElite);
}

function toRankable(profiles: DatingProfile[], tick = Date.now()): RankedProfile[] {
  return rankForSession(
    profiles.map((p) => ({
      ...p,
      novelty: p.engagementSeed * (0.85 + (tick % 17) / 100),
      socialProof: p.tier === 'Elite' ? 0.92 : 0.62,
      affinity: p.engagementSeed,
    })),
    tick
  );
}

function FadeCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>{children}</Animated.View>
  );
}

function PressScale({
  onPress,
  children,
  style,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: object;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.985, useNativeDriver: true, speed: 40 }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start()
      }
      onPress={onPress}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function DatingScreen() {
  const { state: tierState, setTier } = useTier();
  const isElite = tierState.isElite;
  const c = paletteFor(isElite);

  const [tick, setTick] = useState(Date.now());
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [surpriseBanner, setSurpriseBanner] = useState(false);
  const [fomoBanner, setFomoBanner] = useState<string | null>(null);
  const [hubLabel, setHubLabel] = useState('Local Hub: New York');
  const [streak, setStreak] = useState(() => getSessionStats().streak);
  const [respondTarget, setRespondTarget] = useState<RespondTarget | null>(null);
  const [draft, setDraft] = useState('');
  const dwellStart = useRef<Record<string, number>>({});
  const refreshCount = useRef(0);
  const fomoClear = useRef<ReturnType<typeof setTimeout> | null>(null);

  const corpus = useMemo(() => resolveCorpus(isElite), [isElite]);

  const [feed, setFeed] = useState<RankedProfile[]>(() => toRankable(resolveCorpus(isElite)));

  const showFomo = useCallback((hint: string) => {
    if (fomoClear.current) clearTimeout(fomoClear.current);
    setFomoBanner(hint);
    fomoClear.current = setTimeout(() => setFomoBanner(null), 2400);
  }, []);

  useEffect(() => {
    setFeed(toRankable(corpus, tick));
    setPage(0);
  }, [corpus, tick]);

  // Intermittent FOMO toast (~18% via engagementEngine)
  useEffect(() => {
    const tryHint = () => {
      const hint = getVariableRewardHint?.();
      if (hint) showFomo(hint);
    };
    const initial = setTimeout(tryHint, 5200);
    const interval = setInterval(tryHint, 32000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      if (fomoClear.current) clearTimeout(fomoClear.current);
    };
  }, [showFomo]);

  const styles = useMemo(() => makeStyles(c, isElite), [c, isElite]);

  const openRespond = useCallback(
    (profile: DatingProfile, assetType: 'photo' | 'prompt', promptId?: string) => {
      trackInteraction(assetType === 'photo' ? 'photo_tap' : 'prompt_tap', profile.id);
      setRespondTarget({ profile, assetType, promptId });
      setDraft('');
      setStreak(getSessionStats().streak);
    },
    []
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshCount.current += 1;
    trackInteraction('refresh');
    const surprise = shouldShowPullToSurprise(refreshCount.current);
    setTimeout(() => {
      const nextTick = Date.now();
      setTick(nextTick);
      setFeed(toRankable(resolveCorpus(isElite), nextTick));
      setPage(0);
      setRefreshing(false);
      setStreak(getSessionStats().streak);
      if (surprise) {
        setSurpriseBanner(true);
        setTimeout(() => setSurpriseBanner(false), 2200);
      } else {
        const hint = getVariableRewardHint?.();
        if (hint) showFomo(hint);
      }
    }, 650);
  }, [isElite, showFomo]);

  const loadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    setFeed((prev) => [
      ...prev,
      ...extendFeed(
        corpus.map((p) => ({
          ...p,
          novelty: p.engagementSeed,
          socialProof: p.tier === 'Elite' ? 0.9 : 0.7,
          affinity: p.engagementSeed,
        })),
        next
      ),
    ]);
  }, [page, corpus]);

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
      changed,
    }: {
      viewableItems: Array<{ item: any; key: string; index?: number | null; isViewable: boolean }>;
      changed: Array<{ item: any; key: string; index?: number | null; isViewable: boolean }>;
    }) => {
      const now = Date.now();
      changed.forEach((token) => {
        const id = token.item?.id as string | undefined;
        if (!id) return;
        if (token.isViewable) {
          dwellStart.current[id] = now;
        } else if (dwellStart.current[id]) {
          trackDwell(id, now - dwellStart.current[id]);
          delete dwellStart.current[id];
          setStreak(getSessionStats().streak);
        }
      });
      viewableItems.forEach((token) => {
        const id = token.item?.id as string | undefined;
        if (id && token.isViewable) trackInteraction('view', id);
      });
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;

  const submitRespond = useCallback(async () => {
    const text = draft.trim();
    if (!text || !respondTarget) {
      Alert.alert('Write something', 'A non-empty reply is required to request a DM.');
      return;
    }
    trackInteraction('respond', respondTarget.profile.id);

    if (bridge?.requestPromptDm) {
      const result = await Promise.resolve(
        typeof bridge.requestPromptDm === 'function'
          ? bridge.requestPromptDm({
              profileId: respondTarget.profile.id,
              promptId: respondTarget.promptId ?? 'photo',
              assetType: respondTarget.assetType,
              message: text,
              viewerIsElite: isElite,
            })
          : undefined
      );
      if (result?.status === 'blocked') {
        Alert.alert('Thread locked', result.reason);
        return;
      }
      Alert.alert(
        'DM request queued',
        `${result?.reason ?? 'Agent C fusing…'}\n\nCheck Chat for progressive unlock.`
      );
    } else {
      Alert.alert(
        'DM request queued',
        'Agent C will fuse authenticity + niche overlap before unlocking the thread.\n\nCheck Chat for progressive unlock.'
      );
    }
    setRespondTarget(null);
    setDraft('');
    setStreak(getSessionStats().streak);
  }, [draft, respondTarget, isElite]);

  const pickHub = useCallback(() => {
    if (!isElite) return;
    const hubs = ['New York', 'London', 'Dubai', 'Singapore'];
    Alert.alert(
      'Global Hub',
      'Proxy obscurity routes your presence through a vetted metro.',
      hubs.map((h) => ({
        text: h,
        onPress: () => setHubLabel(`Local Hub: ${h}`),
      }))
    );
  }, [isElite]);

  const keyExtractor = useCallback((item: RankedProfile) => item.id, []);

  const renderCard = useCallback(
    ({ item }: { item: RankedProfile }) => (
      <FadeCard style={styles.card}>
        <PressScale
          style={styles.heroWrap}
          onPress={() => openRespond(item, 'photo')}
        >
          <Image source={{ uri: item.photo }} style={styles.hero} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.82)']}
            style={styles.heroFade}
          />
          <View style={styles.metaChipRow}>
            <View style={[styles.chip, item.tier === 'Elite' && styles.chipElite]}>
              <Text style={styles.chipText}>Verified · {item.tier}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Fluid Intel · {item.cognitive}</Text>
            </View>
            {item.ghostMode && isElite ? (
              <View style={[styles.chip, styles.chipElite]}>
                <Text style={styles.chipText}>Ghost</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.name}>
              {item.name}, {item.age}
            </Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.distance}>{item.distance}</Text>
            <Text style={styles.tapHint}>Tap photo to respond</Text>
          </View>
        </PressScale>

        {item.prompts.map((prompt) => (
          <View key={prompt.id} style={styles.promptCard}>
            <Pressable onPress={() => openRespond(item, 'prompt', prompt.id)}>
              <Text style={styles.promptQ}>{prompt.question}</Text>
              <Text style={styles.promptA}>{prompt.answer}</Text>
            </Pressable>
            <Pressable
              style={styles.respondBtn}
              onPress={() => openRespond(item, 'prompt', prompt.id)}
            >
              <Text style={styles.respondText}>Respond</Text>
            </Pressable>
          </View>
        ))}
      </FadeCard>
    ),
    [styles, openRespond, isElite]
  );

  const listHeader = (
    <View style={styles.headerBlock}>
      {surpriseBanner ? (
        <View style={styles.surpriseBanner}>
          <Text style={styles.surpriseText}>Surprise match surfaced</Text>
        </View>
      ) : null}
      {fomoBanner && !surpriseBanner ? (
        <View style={styles.surpriseBanner}>
          <Text style={styles.surpriseText}>{fomoBanner}</Text>
        </View>
      ) : null}
      <View style={styles.headerRow}>
        <Text style={styles.forYou}>For You · ranked for deep intent</Text>
        {streak > 0 ? (
          <View style={styles.streakChip}>
            <Text style={styles.streakText}>Session streak · {streak}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <TierPrivilegeBanner
        hubLabel={hubLabel}
        onUpsellPress={() => setTier('Elite')}
        onHubPress={pickHub}
      />
      <FlatList
        data={feed}
        keyExtractor={keyExtractor}
        renderItem={renderCard}
        contentContainerStyle={styles.listPad}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.55}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={7}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
        }
        ListHeaderComponent={listHeader}
        ListFooterComponent={
          <View style={styles.footer}>
            <ActivityIndicator color={c.accent} />
            <Text style={styles.footerText}>Loading more aligned profiles…</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No profiles in range</Text>
            <Text style={styles.emptySub}>
              {isElite
                ? 'Pull to refresh for a new ranking tick.'
                : 'Upgrade to Elite to surface Ghost Mode and Elite vectors.'}
            </Text>
          </View>
        }
      />

      <Modal visible={!!respondTarget} animationType="slide" transparent>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Thread-locked reply</Text>
            <Text style={styles.sheetSub}>
              {respondTarget?.assetType === 'photo'
                ? `Responding to ${respondTarget?.profile.name}'s photo`
                : `Responding to ${respondTarget?.profile.name}'s prompt`}{' '}
              opens a gated DM request attached to this asset.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Write something specific…"
              placeholderTextColor={c.textMuted}
              value={draft}
              onChangeText={setDraft}
              multiline
              autoFocus
            />
            <View style={styles.sheetActions}>
              <Pressable
                onPress={() => {
                  setRespondTarget(null);
                  setDraft('');
                }}
              >
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.send} onPress={submitRespond}>
                <Text style={styles.sendText}>Send request</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof paletteFor>, isElite: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    listPad: { paddingBottom: 32 },
    headerBlock: { marginBottom: 4 },
    headerRow: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    forYou: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      color: c.textMuted,
    },
    streakChip: {
      backgroundColor: isElite ? 'rgba(212,175,55,0.18)' : c.glow,
      borderWidth: 1,
      borderColor: isElite ? c.accent : c.border,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
    },
    streakText: {
      color: isElite ? c.accent : c.accentSoft,
      fontSize: 11,
      fontWeight: '700',
    },
    surpriseBanner: {
      marginHorizontal: 12,
      marginTop: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: isElite ? 'rgba(212,175,55,0.2)' : c.accent,
      alignItems: 'center',
    },
    surpriseText: {
      color: isElite ? c.accent : '#FFFFFF',
      fontWeight: '800',
      fontSize: 13,
      letterSpacing: 0.3,
    },
    card: {
      marginHorizontal: 12,
      marginBottom: 22,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    heroWrap: { height: width * 1.05, position: 'relative' },
    hero: { width: '100%', height: '100%' },
    heroFade: { ...StyleSheet.absoluteFill as any, top: '38%' },
    metaChipRow: {
      position: 'absolute',
      top: 14,
      left: 12,
      right: 12,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      backgroundColor: 'rgba(0,0,0,0.55)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    chipElite: {
      borderWidth: 1,
      borderColor: '#D4AF37',
    },
    chipText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    heroCopy: { position: 'absolute', left: 16, right: 16, bottom: 18 },
    name: { color: '#fff', fontSize: 28, fontWeight: '700' },
    title: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
    distance: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 6 },
    tapHint: {
      color: 'rgba(255,255,255,0.55)',
      fontSize: 11,
      marginTop: 8,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    promptCard: {
      padding: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      backgroundColor: isElite ? c.surfaceMuted : c.surface,
    },
    promptQ: { fontSize: 13, color: c.textMuted, marginBottom: 8, fontStyle: 'italic' },
    promptA: { fontSize: 16, color: c.text, lineHeight: 22, marginBottom: 14 },
    respondBtn: {
      backgroundColor: c.accent,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    respondText: { color: isElite ? '#0B0B0C' : '#FFFFFF', fontWeight: '700', fontSize: 13 },
    footer: { paddingVertical: 24, alignItems: 'center', gap: 8 },
    footerText: { color: c.textMuted, fontSize: 12 },
    empty: { padding: 40, alignItems: 'center' },
    emptyTitle: { color: c.text, fontSize: 17, fontWeight: '700' },
    emptySub: { color: c.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center' },
    sheetBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 20,
      paddingBottom: 32,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      marginBottom: 14,
    },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: c.text },
    sheetSub: { fontSize: 13, color: c.textMuted, marginTop: 6, marginBottom: 14 },
    input: {
      minHeight: 96,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 12,
      color: c.text,
      textAlignVertical: 'top',
      backgroundColor: c.surfaceMuted,
    },
    sheetActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
    },
    cancel: { color: c.textMuted, fontSize: 15 },
    send: {
      backgroundColor: c.accent,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 10,
    },
    sendText: { color: isElite ? '#0B0B0C' : '#fff', fontWeight: '700' },
  });
}
