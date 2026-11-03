/**
 * Instagram-style variable-reward ranking for Connect feeds.
 * Mixes novelty, social proof, affinity, and intermittent "surprise" boosts
 * so the next card stays unpredictable enough to sustain screentime.
 */

import { Platform } from 'react-native';

export interface Rankable {
  id: string;
  engagementSeed?: number;
  novelty?: number;
  socialProof?: number;
  affinity?: number;
}

export type InteractionKind =
  | 'view'
  | 'dwell'
  | 'respond'
  | 'upvote'
  | 'downvote'
  | 'refresh'
  | 'photo_tap'
  | 'prompt_tap'
  | 'open_thread'
  | 'semantic_connect'
  | 'dismiss'
  | 'schedule'
  | 'invoice'
  | 'send_message'
  | 'expand';

interface SessionStats {
  interactions: number;
  dwellMs: number;
  streak: number;
  lastInteractionAt: number;
  refreshCount: number;
  expandDepth: number;
  votePolarity: number;
}

const session: SessionStats = {
  interactions: 0,
  dwellMs: 0,
  streak: 0,
  lastInteractionAt: 0,
  refreshCount: 0,
  expandDepth: 0,
  votePolarity: 0,
};

const STREAK_WINDOW_MS = 90_000;

const FOMO_HINTS = [
  '3 people just matched near you',
  'New high-alignment node',
  'Someone responded to your prompt',
  'A mutual just came online',
  'Elite cluster pulse nearby',
] as const;

let hapticsModule: typeof import('expo-haptics') | null | undefined;

async function getHaptics() {
  if (hapticsModule !== undefined) return hapticsModule;
  try {
    hapticsModule = await import('expo-haptics');
  } catch {
    hapticsModule = null;
  }
  return hapticsModule;
}

/** Soft haptic when Expo supports it (no-op on web / missing native module). */
export async function softHaptic(
  style: 'light' | 'medium' | 'success' | 'selection' = 'light'
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await getHaptics();
    if (!Haptics) return;
    if (style === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (style === 'selection') {
      await Haptics.selectionAsync();
    } else {
      await Haptics.impactAsync(
        style === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      );
    }
  } catch {
    /* Expo Go / simulator may deny haptics */
  }
}

function hashTick(id: string, tick: number): number {
  let h = tick * 2654435761;
  for (let i = 0; i < id.length; i++) {
    h = (h ^ id.charCodeAt(i) * 1597334677) >>> 0;
  }
  return (h % 1000) / 1000;
}

/** Rank items with intermittent reinforcement (random boost ~12% of items). */
export function rankForSession<T extends Rankable>(items: T[], sessionTick = Date.now()): T[] {
  const streakBoost = session.streak > 3 ? 1.08 : 1;
  const polarityBias = Math.max(-0.05, Math.min(0.08, session.votePolarity * 0.01));
  const dwellBias = Math.min(0.06, session.dwellMs / 600_000);
  return [...items]
    .map((item) => {
      const seed = item.engagementSeed ?? 0.5;
      const novelty = item.novelty ?? 0.5;
      const social = item.socialProof ?? 0.5;
      const affinity = (item.affinity ?? seed) * streakBoost + polarityBias + dwellBias;
      const surprise = hashTick(item.id, sessionTick) > 0.88 ? 0.18 : 0;
      const jitter = hashTick(item.id, Math.floor(sessionTick / 60000)) * 0.08;
      const score =
        affinity * 0.35 + novelty * 0.25 + social * 0.2 + seed * 0.12 + surprise + jitter;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}

/** Extend a feed by reshuffling a clone — infinite scroll feel without empty states. */
export function extendFeed<T extends Rankable>(items: T[], page: number): T[] {
  const tick = Date.now() + page * 9973;
  return rankForSession(items, tick).map((it, idx) => ({
    ...it,
    id: `${it.id}_p${page}_${idx}`,
  }));
}

/** Record time spent on a card / post (ms). Feeds streak + FOMO chips. */
export function trackDwell(itemId: string, ms: number): void {
  if (!itemId || ms <= 0) return;
  session.dwellMs += Math.min(ms, 60_000);
  bumpStreak();
}

/** Record discrete engagement; kinds drive ranking affinity later. */
export function trackInteraction(
  kind: InteractionKind,
  itemId?: string,
  _meta?: Record<string, unknown>
): void {
  session.interactions += 1;
  if (kind === 'refresh') session.refreshCount += 1;
  if (kind === 'expand') session.expandDepth += 1;
  if (kind === 'upvote') session.votePolarity += 1;
  if (kind === 'downvote') session.votePolarity -= 1;
  bumpStreak();

  if (
    kind === 'respond' ||
    kind === 'semantic_connect' ||
    kind === 'upvote' ||
    kind === 'send_message'
  ) {
    void softHaptic(kind === 'semantic_connect' ? 'success' : 'light');
  } else if (kind === 'photo_tap' || kind === 'prompt_tap' || kind === 'open_thread') {
    void softHaptic('selection');
  }

  if (__DEV__ && itemId) {
    // eslint-disable-next-line no-console
    console.debug(`[engagement] ${kind}`, itemId);
  }
}

function bumpStreak(): void {
  const now = Date.now();
  if (now - session.lastInteractionAt < STREAK_WINDOW_MS) {
    session.streak += 1;
  } else {
    session.streak = 1;
  }
  session.lastInteractionAt = now;
}

/**
 * Intermittent variable reward on pull-to-refresh (~28% after 1st pull).
 * Keeps "Surprise match surfaced" unpredictable.
 */
export function shouldShowPullToSurprise(refreshIndex = session.refreshCount): boolean {
  if (refreshIndex <= 0) return false;
  return hashTick(`surprise_${refreshIndex}`, refreshIndex * 7919) > 0.72;
}

/** ~18% chance FOMO chip — intermittent reinforcement for session stickiness. */
export function getVariableRewardHint(): string | null {
  if (Math.random() > 0.18) return null;
  const idx = Math.floor(Math.random() * FOMO_HINTS.length);
  return FOMO_HINTS[idx];
}

/** True every 3rd page — "You're on a roll" streak CTA for infinite scroll. */
export function getInfiniteScrollHook(page: number): boolean {
  return page > 0 && page % 3 === 0;
}

/**
 * Progressive disclosure firewall: Premium never sees Elite or ghostMode nodes.
 * Elite viewers get the full set.
 */
export function filterByTierFirewall<T extends { tier?: string; ghostMode?: boolean }>(
  items: T[],
  isElite: boolean
): T[] {
  if (isElite) return [...items];
  return items.filter((n) => {
    const tier = (n.tier || '').toLowerCase();
    if (tier === 'elite') return false;
    if (n.ghostMode) return false;
    return true;
  });
}

/** Sticky session chip data for Dating / Community headers. */
export function getSessionStats(): Readonly<SessionStats> {
  return { ...session };
}

/** Test / hot-reload helper — not used by screens in prod paths. */
export function resetSessionStats(): void {
  session.interactions = 0;
  session.dwellMs = 0;
  session.streak = 0;
  session.lastInteractionAt = 0;
  session.refreshCount = 0;
  session.expandDepth = 0;
  session.votePolarity = 0;
}
