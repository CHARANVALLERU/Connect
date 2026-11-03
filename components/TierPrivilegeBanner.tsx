import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTier } from '../context/TierContext';
import { elite, premium } from '../theme/tokens';

const HUBS = ['Local Hub: New York', 'Local Hub: London', 'Local Hub: Dubai'] as const;

type Props = {
  hubLabel?: string;
  onUpsellPress?: () => void;
  onHubPress?: () => void;
};

/**
 * Absolute-top tier banner.
 * Premium: subtle upsell. Elite: obsidian-gold Ghost Mode + hub.
 * When parent omits hubLabel, hub press cycles NY → London → Dubai.
 */
export function TierPrivilegeBanner({
  hubLabel,
  onUpsellPress,
  onHubPress,
}: Props) {
  const { state } = useTier();
  const pulse = useRef(new Animated.Value(0.55)).current;
  const [hubIndex, setHubIndex] = useState(0);
  const displayHub = hubLabel ?? HUBS[hubIndex];

  useEffect(() => {
    if (!state.isElite) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.55, duration: 1600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [state.isElite, pulse]);

  const handleHubPress = () => {
    if (hubLabel == null) {
      setHubIndex((i) => (i + 1) % HUBS.length);
    }
    onHubPress?.();
  };

  if (!state.isElite) {
    return (
      <Pressable onPress={onUpsellPress} style={styles.premiumBar}>
        <Text style={styles.brand}>CONNECT</Text>
        <Text style={styles.upsell}>Unlock Elite · Ghost Mode →</Text>
      </Pressable>
    );
  }

  return (
    <Animated.View style={{ opacity: pulse }}>
      <LinearGradient
        colors={['#1A1508', '#0B0B0C', '#1A1508']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.eliteBar}
      >
        <View style={styles.eliteRow}>
          <View style={styles.goldBadge}>
            <Text style={styles.goldBadgeText}>ELITE</Text>
          </View>
          <Text style={styles.brandElite}>CONNECT</Text>
          <Text style={styles.ghost}>Ghost Mode · On</Text>
        </View>
        <Pressable onPress={handleHubPress} style={styles.hubRow}>
          <Text style={styles.hubText}>{displayHub}</Text>
          <Text style={styles.proxy}>Proxy Obscurity: Enabled</Text>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  premiumBar: {
    backgroundColor: premium.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: premium.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3,
    color: premium.accent,
  },
  upsell: {
    fontSize: 12,
    color: premium.textMuted,
    fontWeight: '500',
  },
  eliteBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: elite.accent,
  },
  eliteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goldBadge: {
    backgroundColor: elite.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  goldBadgeText: {
    color: '#0B0B0C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandElite: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3,
    color: elite.accent,
  },
  ghost: {
    fontSize: 11,
    color: elite.textMuted,
  },
  hubRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hubText: {
    color: elite.text,
    fontSize: 12,
  },
  proxy: {
    color: elite.accentSoft,
    fontSize: 11,
  },
});
