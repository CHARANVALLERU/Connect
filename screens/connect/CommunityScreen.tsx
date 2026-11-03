import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TierPrivilegeBanner } from '../../components/TierPrivilegeBanner';
import { CHANNELS, COMMUNITY_POSTS, CommunityChannel, CommunityPost } from '../../data/connectFeed';
import {
  getSessionStats,
  getVariableRewardHint,
  rankForSession,
  shouldShowPullToSurprise,
  trackInteraction,
} from '../../services/engagementEngine';
import { useTier } from '../../context/TierContext';
import { paletteFor } from '../../theme/tokens';

type VoteDir = 1 | -1 | 0;

type NestedComment = {
  id: string;
  author: string;
  body: string;
  minutesAgo: number;
};

type CommunityBridge = {
  getCommunityChannels?: (isElite: boolean) => CommunityChannel[];
  getCommunityFeed?: (isElite: boolean) => CommunityPost[];
};

function loadBridge(): CommunityBridge | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../../services/connectBridge') as CommunityBridge;
  } catch {
    return null;
  }
}

const bridge = loadBridge();

function filterLocalChannels(isElite: boolean): CommunityChannel[] {
  if (isElite) return [...CHANNELS];
  // Elite firewall: Elite-only channels completely absent for Premium (no lock icon)
  return CHANNELS.filter((ch) => !ch.isEliteOnly);
}

function filterLocalPosts(isElite: boolean, channels: CommunityChannel[]): CommunityPost[] {
  const allowed = new Set(channels.map((ch) => ch.slug));
  return COMMUNITY_POSTS.filter((p) => allowed.has(p.channelSlug));
}

function deriveComments(post: CommunityPost): NestedComment[] {
  const first = post.author.split(' ')[0] || 'Member';
  const snippet = post.body.slice(0, 42).trim();
  const pool: NestedComment[] = [
    {
      id: `${post.id}_c1`,
      author: `${first[0]}. Neighbor`,
      body: `Agree with ${first} — this tracks with what I'm seeing locally.`,
      minutesAgo: Math.max(1, post.minutesAgo - 2),
    },
    {
      id: `${post.id}_c2`,
      author: 'Ring moderator',
      body: `Cross-posting adjacent signal: "${snippet}${post.body.length > 42 ? '…' : ''}"`,
      minutesAgo: Math.max(1, Math.floor(post.minutesAgo / 2)),
    },
    {
      id: `${post.id}_c3`,
      author: 'Quiet lurker',
      body: 'Depth check passed. Keeping this thread open for niche overlap.',
      minutesAgo: 1,
    },
  ];
  const count = 2 + (post.id.charCodeAt(post.id.length - 1) % 2);
  return pool.slice(0, count);
}

function LivePulse({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[stylesShared.pulseDot, { backgroundColor: color, opacity }]} />;
}

export default function CommunityScreen() {
  const { state: tierState, setTier } = useTier();
  const isElite = tierState.isElite;
  const c = paletteFor(isElite);

  const [query, setQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, VoteDir>>({});
  const [voteDeltas, setVoteDeltas] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [commentCache, setCommentCache] = useState<Record<string, NestedComment[]>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(Date.now());
  const [surpriseBanner, setSurpriseBanner] = useState(false);
  const [fomoBanner, setFomoBanner] = useState<string | null>(null);
  const [hubLabel, setHubLabel] = useState('Local Hub: New York');
  const refreshCount = useRef(0);
  const fomoClear = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFomo = useCallback((hint: string) => {
    if (fomoClear.current) clearTimeout(fomoClear.current);
    setFomoBanner(hint);
    fomoClear.current = setTimeout(() => setFomoBanner(null), 2400);
  }, []);

  useEffect(() => {
    const tryHint = () => {
      const hint = getVariableRewardHint?.();
      if (hint) showFomo(hint);
    };
    const initial = setTimeout(tryHint, 6800);
    const interval = setInterval(tryHint, 36000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      if (fomoClear.current) clearTimeout(fomoClear.current);
    };
  }, [showFomo]);

  const allChannels = useMemo(() => {
    if (bridge?.getCommunityChannels) return bridge.getCommunityChannels(isElite);
    return filterLocalChannels(isElite);
  }, [isElite]);

  const visibleChannels = useMemo(() => {
    return allChannels.filter((ch) => {
      if (ch.isEliteOnly && !isElite) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return ch.slug.toLowerCase().includes(q) || ch.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allChannels, isElite, query]);

  // Drop selection if channel disappears (e.g. Premium after filter / search miss)
  useEffect(() => {
    if (selectedSlug && !visibleChannels.some((ch) => ch.slug === selectedSlug)) {
      setSelectedSlug(null);
    }
  }, [visibleChannels, selectedSlug]);

  const feed = useMemo(() => {
    const corpus = bridge?.getCommunityFeed
      ? bridge.getCommunityFeed(isElite)
      : filterLocalPosts(isElite, allChannels);

    const visibleSlugs = new Set(visibleChannels.map((ch) => ch.slug));
    const posts = corpus
      .filter((p) => {
        if (!visibleSlugs.has(p.channelSlug)) return false;
        if (selectedSlug && p.channelSlug !== selectedSlug) return false;
        return true;
      })
      .map((p) => ({
        ...p,
        engagementSeed: Math.min(1, p.upvotes / 1000),
        socialProof: Math.min(1, p.comments / 200),
        affinity: p.novelty,
        novelty: p.novelty,
      }));
    return rankForSession(posts, tick);
  }, [visibleChannels, selectedSlug, tick, isElite, allChannels]);

  const styles = useMemo(() => makeStyles(c, isElite), [c, isElite]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshCount.current += 1;
    trackInteraction('refresh');
    const surprise = shouldShowPullToSurprise(refreshCount.current);
    setTimeout(() => {
      setTick(Date.now());
      setRefreshing(false);
      if (surprise) {
        setSurpriseBanner(true);
        setTimeout(() => setSurpriseBanner(false), 2000);
      } else {
        const hint = getVariableRewardHint?.();
        if (hint) showFomo(hint);
      }
    }, 500);
  }, [showFomo]);

  const castVote = useCallback((id: string, dir: 1 | -1) => {
    setVotes((prev) => {
      const current = prev[id] ?? 0;
      const next: VoteDir = current === dir ? 0 : dir;
      setVoteDeltas((d) => {
        const prior = prev[id] ?? 0;
        const adjusted = (d[id] || 0) - prior + next;
        return { ...d, [id]: adjusted };
      });
      trackInteraction(dir === 1 ? 'upvote' : 'downvote', id);
      return { ...prev, [id]: next };
    });
  }, []);

  const toggleExpand = useCallback((id: string, post?: CommunityPost) => {
    setExpanded((e) => {
      const next = !e[id];
      if (next) {
        trackInteraction('expand', id);
        if (post) {
          setCommentCache((cache) => {
            if (cache[id]) return cache;
            return { ...cache, [id]: deriveComments(post) };
          });
        }
      }
      return { ...e, [id]: next };
    });
  }, []);

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

  const keyExtractor = useCallback((item: CommunityPost) => item.id, []);

  const renderChannelChip = (ch: CommunityChannel) => {
    const active = selectedSlug === ch.slug;
    return (
      <Pressable
        key={ch.id}
        onPress={() => setSelectedSlug((s) => (s === ch.slug ? null : ch.slug))}
        style={[styles.chip, active && styles.chipActive, ch.isEliteOnly && styles.chipElite]}
      >
        <View style={styles.chipInner}>
          <LivePulse color={active ? (isElite ? '#0B0B0C' : '#FFFFFF') : c.success} />
          <View>
            <Text style={[styles.chipSlug, active && styles.chipSlugActive]}>
              {ch.isEliteOnly ? '✦ ' : '#'}
              {ch.name}
            </Text>
            <Text style={[styles.chipActiveLabel, active && styles.chipActiveLabelOn]}>
              {ch.activeLabel}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderPost = useCallback(
    ({ item }: { item: CommunityPost }) => {
      const dir = votes[item.id] ?? 0;
      const score = item.upvotes + (voteDeltas[item.id] || 0);
      const isOpen = !!expanded[item.id];
      const preview =
        item.body.length > 120 && !isOpen ? `${item.body.slice(0, 118).trim()}…` : item.body;
      const comments = commentCache[item.id] ?? [];

      return (
        <Pressable style={styles.post} onPress={() => toggleExpand(item.id, item)}>
          <View style={styles.postTop}>
            <Text style={styles.postMeta}>
              {item.author} · {item.channelSlug}
            </Text>
            <Text style={styles.postTime}>{item.minutesAgo}m</Text>
          </View>
          <Text style={styles.postBody}>{preview}</Text>
          {!isOpen && item.body.length > 120 ? (
            <Text style={styles.readMore}>Tap to expand</Text>
          ) : null}
          {isOpen && comments.length > 0 ? (
            <View style={styles.commentThread}>
              {comments.map((cm) => (
                <View key={cm.id} style={styles.commentRow}>
                  <Text style={styles.commentMeta}>
                    {cm.author} · {cm.minutesAgo}m
                  </Text>
                  <Text style={styles.commentBody}>{cm.body}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              style={[styles.vote, dir === 1 && styles.voteUp]}
              onPress={(e) => {
                e.stopPropagation?.();
                castVote(item.id, 1);
              }}
            >
              <Text style={[styles.voteText, dir === 1 && styles.voteTextOn]}>▲ {score}</Text>
            </Pressable>
            <Pressable
              style={[styles.vote, dir === -1 && styles.voteDown]}
              onPress={(e) => {
                e.stopPropagation?.();
                castVote(item.id, -1);
              }}
            >
              <Text style={[styles.voteText, dir === -1 && styles.voteTextDown]}>▼</Text>
            </Pressable>
            <Text style={styles.comments}>{item.comments} comments</Text>
          </View>
        </Pressable>
      );
    },
    [votes, voteDeltas, expanded, commentCache, styles, castVote, toggleExpand]
  );

  const listHeader = (
    <View style={styles.channelsBlock}>
      {surpriseBanner ? (
        <View style={styles.surpriseBanner}>
          <Text style={styles.surpriseText}>Surprise thread surfaced</Text>
        </View>
      ) : null}
      {fomoBanner && !surpriseBanner ? (
        <View style={styles.surpriseBanner}>
          <Text style={styles.surpriseText}>{fomoBanner}</Text>
        </View>
      ) : null}
      <Text style={styles.section}>Channels · live</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <Pressable
          onPress={() => setSelectedSlug(null)}
          style={[styles.chip, selectedSlug === null && styles.chipActive]}
        >
          <Text style={[styles.chipSlug, selectedSlug === null && styles.chipSlugActive]}>
            All
          </Text>
        </Pressable>
        {visibleChannels.map(renderChannelChip)}
      </ScrollView>
      <View style={styles.fomoRow}>
        <Text style={styles.section}>Feed · curation matrix</Text>
        <Text style={styles.sessionHint}>
          {getSessionStats().interactions > 0
            ? `Session · ${getSessionStats().interactions} acts`
            : 'Pull to re-rank'}
        </Text>
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
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search niche communities…"
          placeholderTextColor={c.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={feed}
        keyExtractor={keyExtractor}
        renderItem={renderPost}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No posts in this channel</Text>
            <Text style={styles.emptySub}>Try another niche or clear search.</Text>
          </View>
        }
        contentContainerStyle={styles.listPad}
        removeClippedSubviews
        initialNumToRender={6}
        windowSize={8}
      />
    </View>
  );
}

const stylesShared = StyleSheet.create({
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 8,
    marginTop: 4,
  },
});

function makeStyles(c: ReturnType<typeof paletteFor>, isElite: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    searchWrap: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    search: {
      backgroundColor: c.surfaceMuted,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.text,
      fontSize: 15,
    },
    listPad: { paddingBottom: 40 },
    channelsBlock: { paddingTop: 14, paddingBottom: 6 },
    section: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textMuted,
      marginBottom: 10,
      marginHorizontal: 16,
      letterSpacing: 0.3,
    },
    chipRow: {
      paddingHorizontal: 12,
      gap: 8,
      paddingBottom: 4,
    },
    chip: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginRight: 4,
      minWidth: 88,
    },
    chipActive: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    chipElite: {
      borderColor: isElite ? c.accent : c.border,
    },
    chipInner: { flexDirection: 'row', alignItems: 'flex-start' },
    chipSlug: { color: c.text, fontSize: 13, fontWeight: '700' },
    chipSlugActive: { color: isElite ? '#0B0B0C' : '#FFFFFF' },
    chipActiveLabel: {
      color: c.textMuted,
      fontSize: 11,
      marginTop: 3,
      fontWeight: '600',
    },
    chipActiveLabelOn: {
      color: isElite ? 'rgba(11,11,12,0.7)' : 'rgba(255,255,255,0.85)',
    },
    fomoRow: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: 16,
    },
    sessionHint: { color: c.textMuted, fontSize: 11, fontWeight: '600' },
    surpriseBanner: {
      marginHorizontal: 12,
      marginBottom: 10,
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
    },
    post: {
      marginHorizontal: 12,
      marginBottom: 12,
      padding: 16,
      borderRadius: 14,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    postTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
      gap: 8,
    },
    postMeta: { color: c.textMuted, fontSize: 12, flex: 1, fontWeight: '600' },
    postTime: { color: c.textMuted, fontSize: 11 },
    postBody: { color: c.text, fontSize: 15, lineHeight: 22 },
    readMore: {
      color: c.accentSoft,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 8,
    },
    commentThread: {
      marginTop: 12,
      paddingLeft: 12,
      borderLeftWidth: 2,
      borderLeftColor: isElite ? 'rgba(212,175,55,0.45)' : c.border,
      gap: 10,
    },
    commentRow: {
      paddingVertical: 2,
    },
    commentMeta: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '700',
      marginBottom: 3,
    },
    commentBody: {
      color: c.text,
      fontSize: 13,
      lineHeight: 18,
    },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
    vote: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: c.surfaceMuted,
    },
    voteUp: {
      backgroundColor: isElite ? 'rgba(212,175,55,0.22)' : c.glow,
      borderWidth: 1,
      borderColor: c.accent,
    },
    voteDown: {
      backgroundColor: 'rgba(180,35,24,0.12)',
      borderWidth: 1,
      borderColor: c.danger,
    },
    voteText: { color: c.accent, fontWeight: '700', fontSize: 13 },
    voteTextOn: { color: isElite ? c.accent : c.accentSoft },
    voteTextDown: { color: c.danger },
    comments: { color: c.textMuted, fontSize: 13 },
    empty: { padding: 36, alignItems: 'center' },
    emptyTitle: { color: c.text, fontWeight: '700', fontSize: 16 },
    emptySub: { color: c.textMuted, marginTop: 6, fontSize: 13 },
  });
}
