/**
 * Bridge: UI ↔ backend contracts (Jev / Hermes fusion / tier firewall).
 * Offline-first: uses connectFeed + engagementEngine; optional live API when USE_MOCK_ENGINE=false.
 */

import { API_BASE_URL, USE_MOCK_ENGINE } from '../config/env';
import {
  CHANNELS,
  CHAT_THREADS,
  COMMUNITY_POSTS,
  DATING_PROFILES,
  EXPLORE_NODES,
  ChatThread,
  CognitiveLevel,
  CommunityChannel,
  CommunityPost,
  DatingProfile,
  ExploreNode,
} from '../data/connectFeed';
import { filterByTierFirewall, rankForSession } from './engagementEngine';

/** Mock mutual-interest ids — Premium may DM Elite only when mutual. */
const MUTUAL_ELITE_IDS = new Set<string>(['p9']);

const COGNITIVE_RANK: Record<CognitiveLevel, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Advanced: 3,
};

const VENUE_OPTIONS = [
  { name: 'The Ned', area: 'Members lounge · geohash gcpvj0···', slot: 'Thu 8:30 PM' },
  { name: 'Aman', area: 'Private dining · geohash gcpvj3···', slot: 'Fri 7:00 PM' },
  { name: 'Private members club', area: 'Invite-only · geohash gcpvj7···', slot: 'Sat 9:15 PM' },
] as const;

/** Mirrors connect-core llm_layer/schemas.py AgentCFusionResult */
export type FusionConnectionStatus =
  | 'APPROVED_FOR_DM'
  | 'PENDING_MUTUAL_INTEREST'
  | 'SUPPRESSED';

export interface FusionWeights {
  w_vector: number;
  w_visual: number;
}

export interface AgentAStub {
  niche_alignment_score: number;
  cognitive_resonance_score: number;
  interaction_velocity_ratio: number;
  shared_niche_themes: string[];
  drift_indicator: 'STABLE' | 'EXPANDING' | 'DIVERGING';
  confidence: number;
}

export interface AgentBStub {
  visual_authenticity_score: number;
  bot_anomaly_detected: boolean;
  guardrail_flag: 'CLEAN' | 'SUSPICIOUS' | 'POLICY_VIOLATION';
  confidence: number;
  attenuation_recommended: boolean;
}

export interface AgentCFusionResult {
  composite_compatibility_score: number;
  weights_applied: FusionWeights;
  connection_status: FusionConnectionStatus;
  icebreaker_hook: string;
  connection_synergy_reason: string;
  agent_a: AgentAStub;
  agent_b: AgentBStub;
}

const WEIGHT_MIN = 0.2;
const WEIGHT_MAX = 0.8;
const APPROVED_THRESHOLD = 0.75;

function eliteChannelSlugs(): Set<string> {
  return new Set(CHANNELS.filter((ch) => ch.isEliteOnly).map((ch) => ch.slug));
}

function clampWeight(v: number): number {
  return Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, Math.round(v * 1000) / 1000));
}

/** Premium never sees Elite dating profiles or ghostMode profiles. */
export function getDatingFeed(isElite: boolean): DatingProfile[] {
  const base = isElite
    ? DATING_PROFILES
    : DATING_PROFILES.filter((p) => p.tier !== 'Elite' && !p.ghostMode);

  return rankForSession(
    base.map((p) => ({
      ...p,
      novelty: p.engagementSeed,
      socialProof: p.tier === 'Elite' ? 0.9 : 0.62,
      affinity: p.engagementSeed,
      relationship: p.engagementSeed,
      interestMatch: p.engagementSeed * 0.95,
    }))
  );
}

export function getCommunityChannels(isElite: boolean): CommunityChannel[] {
  if (isElite) return [...CHANNELS];
  return CHANNELS.filter((ch) => !ch.isEliteOnly);
}

export function getCommunityFeed(isElite: boolean): CommunityPost[] {
  const allowed = new Set(getCommunityChannels(isElite).map((ch) => ch.slug));
  const eliteSlugs = eliteChannelSlugs();
  const posts = COMMUNITY_POSTS.filter((p) => {
    if (!allowed.has(p.channelSlug)) return false;
    if (!isElite && eliteSlugs.has(p.channelSlug)) return false;
    return true;
  }).map((p) => ({
    ...p,
    engagementSeed: Math.min(1, p.upvotes / 1000),
    socialProof: Math.min(1, p.comments / 200),
    affinity: p.novelty,
    novelty: p.novelty,
    recencyMinutes: p.minutesAgo,
    comments: p.comments,
    upvotes: p.upvotes,
    interestMatch: p.novelty,
  }));
  return rankForSession(posts);
}

export function getChatThreads(): ChatThread[] {
  return [...CHAT_THREADS];
}

export function getExploreNodes(
  isElite: boolean,
  minAlignment: number,
  cognitive: string
): ExploreNode[] {
  const cogKey = (cognitive || 'Any').trim();
  const minCog =
    cogKey === 'Any' || cogKey === 'any'
      ? 0
      : (COGNITIVE_RANK[cogKey as CognitiveLevel] ?? 0);
  const tiered = filterByTierFirewall(EXPLORE_NODES, isElite);
  return tiered
    .filter(
      (n) =>
        n.alignment >= minAlignment && (COGNITIVE_RANK[n.cognitive] ?? 0) >= minCog
    )
    .sort((a, b) => b.alignment - a.alignment);
}

type PromptDmPayload = {
  profileId: string;
  promptId?: string;
  assetType?: 'photo' | 'prompt';
  message: string;
  viewerIsElite?: boolean;
};

/**
 * Prompt-DM request. Accepts positional args or a single payload object.
 * Premium → Elite is blocked unless mutual interest exists.
 */
export function requestPromptDm(
  profileIdOrPayload: string | PromptDmPayload,
  promptId?: string,
  message?: string,
  viewerIsElite = false
): { status: 'queued' | 'blocked'; reason: string; fusion?: AgentCFusionResult } {
  let profileId: string;
  let resolvedPromptId: string | undefined;
  let resolvedMessage: string;
  let resolvedElite: boolean;
  let assetType: 'photo' | 'prompt' | undefined;

  if (typeof profileIdOrPayload === 'string') {
    profileId = profileIdOrPayload;
    resolvedPromptId = promptId;
    resolvedMessage = message ?? '';
    resolvedElite = viewerIsElite;
  } else {
    profileId = profileIdOrPayload.profileId;
    resolvedPromptId = profileIdOrPayload.promptId;
    resolvedMessage = profileIdOrPayload.message;
    resolvedElite = profileIdOrPayload.viewerIsElite ?? false;
    assetType = profileIdOrPayload.assetType;
  }

  const trimmed = resolvedMessage?.trim() ?? '';
  if (!profileId) {
    return { status: 'blocked', reason: 'Missing profile or prompt.' };
  }
  if (!trimmed) {
    return { status: 'blocked', reason: 'Message cannot be empty.' };
  }

  const profile = DATING_PROFILES.find((p) => p.id === profileId);
  if (!profile) {
    return { status: 'blocked', reason: 'Profile not found.' };
  }

  if (!resolvedPromptId) {
    if (assetType === 'photo') {
      resolvedPromptId = profile.prompts[0]?.id ?? 'photo';
    } else {
      return { status: 'blocked', reason: 'Missing profile or prompt.' };
    }
  }

  const promptExists =
    resolvedPromptId === 'photo' ||
    profile.prompts.some((pr) => pr.id === resolvedPromptId);
  if (!promptExists) {
    return { status: 'blocked', reason: 'Prompt not found on profile.' };
  }

  const tierPermitted =
    resolvedElite ||
    profile.tier !== 'Elite' ||
    MUTUAL_ELITE_IDS.has(profile.id);

  const fusion = runFusionMatch({
    nodeId: profileId,
    alignment: profile.engagementSeed,
    cognitive: profile.cognitive,
    niches: [profile.niche],
    clusters: profile.prompts.map((p) => p.question.slice(0, 24)),
    tier: profile.tier,
    viewerIsElite: resolvedElite,
    tierDmPermitted: tierPermitted,
  });

  if (fusion.connection_status === 'SUPPRESSED') {
    return {
      status: 'blocked',
      reason:
        'Premium→Elite DM requires mutual interest. Upgrade or wait for a reciprocal unlock.',
      fusion,
    };
  }

  return {
    status: 'queued',
    reason: `Prompt reply queued for ${profile.name} (${resolvedPromptId}). ${fusion.icebreaker_hook}`,
    fusion,
  };
}

/** High-end venue suggestions for a thread (obscured geohash sector). */
export function scheduleVenue(threadId: string): {
  venues: { name: string; area: string; slot: string }[];
} {
  const thread = CHAT_THREADS.find((t) => t.id === threadId);
  const suffix = thread ? ` · ${thread.name.split(' ')[0]}` : '';
  return {
    venues: VENUE_OPTIONS.map((v) => ({
      name: v.name,
      area: v.area + suffix,
      slot: v.slot,
    })),
  };
}

/** Draft encrypted digital invoice — no bank rails exchanged. */
export function generateInvoice(
  threadId: string,
  amount = 250
): {
  invoiceId: string;
  amount: number;
  currency: 'USD';
  status: 'draft';
  note: string;
} {
  const thread = CHAT_THREADS.find((t) => t.id === threadId);
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 250;
  return {
    invoiceId: `inv_${threadId}_${Date.now().toString(36)}`,
    amount: safeAmount,
    currency: 'USD',
    status: 'draft',
    note: thread
      ? `Draft invoice for ${thread.name} — encrypted, no bank accounts exchanged.`
      : 'Draft invoice — encrypted, no bank accounts exchanged.',
  };
}

/**
 * Progressive disclosure unlock check.
 * Unlocked threads are always allowed; locked threads need Elite or mutual interest.
 */
export function unlockThread(threadId: string): {
  allowed: boolean;
  reason: string;
} {
  const thread = CHAT_THREADS.find((t) => t.id === threadId);
  if (!thread) {
    return { allowed: false, reason: 'Thread not found.' };
  }
  if (!thread.locked) {
    return { allowed: true, reason: 'Thread already unlocked.' };
  }
  return {
    allowed: false,
    reason:
      'Respond to a Dating prompt or earn community reputation before unconstrained chat unlocks.',
  };
}

export type FusionMatchInput = {
  nodeId: string;
  alignment: number;
  cognitive: CognitiveLevel | string;
  niches: string[];
  clusters: string[];
  tier: string;
  viewerIsElite?: boolean;
  tierDmPermitted?: boolean;
};

/**
 * Local Hermes / Agent A→B→C fusion stub mirroring fusion_orchestrator.py invariants:
 * W_vec, W_vis ∈ [0.20, 0.80]; composite ≥ 0.75 → APPROVED_FOR_DM.
 */
export function runFusionMatch(input: FusionMatchInput): AgentCFusionResult {
  const cogBoost =
    input.cognitive === 'Advanced' ? 0.08 : input.cognitive === 'High' ? 0.04 : 0;
  const nicheScore = Math.min(1, input.alignment + cogBoost * 0.5);
  const cognitiveScore = Math.min(1, input.alignment * 0.92 + cogBoost);

  const agent_a: AgentAStub = {
    niche_alignment_score: Math.round(nicheScore * 1000) / 1000,
    cognitive_resonance_score: Math.round(cognitiveScore * 1000) / 1000,
    interaction_velocity_ratio: 0.62,
    shared_niche_themes: input.niches.slice(0, 3),
    drift_indicator: 'STABLE',
    confidence: 0.88,
  };

  const agent_b: AgentBStub = {
    visual_authenticity_score: 0.91,
    bot_anomaly_detected: false,
    guardrail_flag: 'CLEAN',
    confidence: 0.9,
    attenuation_recommended: false,
  };

  const attenuate =
    agent_b.attenuation_recommended ||
    agent_b.confidence < 0.65 ||
    agent_b.guardrail_flag !== 'CLEAN';

  let w_visual = attenuate ? WEIGHT_MIN : clampWeight(Math.min(agent_b.confidence, 0.4));
  let w_vector = clampWeight(1 - w_visual);
  // Renormalize to ≈1.0 within bounds
  const sum = w_vector + w_visual;
  w_vector = clampWeight(w_vector / sum);
  w_visual = clampWeight(1 - w_vector);

  const scoreA =
    agent_a.niche_alignment_score * 0.5 + agent_a.cognitive_resonance_score * 0.5;
  const composite =
    Math.round((w_vector * scoreA + w_visual * agent_b.visual_authenticity_score) * 10000) /
    10000;

  const tierOk = input.tierDmPermitted ?? true;
  let connection_status: FusionConnectionStatus = 'PENDING_MUTUAL_INTEREST';
  if (!tierOk) {
    connection_status = 'SUPPRESSED';
  } else if (composite >= APPROVED_THRESHOLD) {
    connection_status = 'APPROVED_FOR_DM';
  }

  const nichePair =
    input.niches.length >= 2
      ? `${input.niches[0]} × ${input.niches[1]}`
      : input.niches[0] ?? 'shared cluster';
  const clusterHint = input.clusters.slice(0, 2).join(' · ') || 'adjacent signals';

  return {
    composite_compatibility_score: composite,
    weights_applied: { w_vector, w_visual },
    connection_status,
    icebreaker_hook:
      connection_status === 'SUPPRESSED'
        ? 'Cross-tier DM suppressed by firewall.'
        : `Agent C: You both orbit ${nichePair}. Lead with ${clusterHint} — keep it specific.`,
    connection_synergy_reason: `W_vec=${w_vector.toFixed(2)} · W_vis=${w_visual.toFixed(2)} · composite=${composite.toFixed(2)}`,
    agent_a,
    agent_b,
  };
}

/** Agent C–style semantic connect for Explore nodes (fusion path). */
export function semanticConnect(
  nodeId: string,
  viewerIsElite = false
): {
  status: string;
  icebreaker: string;
  synergy: string;
  fusion: AgentCFusionResult;
} {
  const node = EXPLORE_NODES.find((n) => n.id === nodeId);
  if (!node) {
    const empty = runFusionMatch({
      nodeId: 'miss',
      alignment: 0,
      cognitive: 'Low',
      niches: [],
      clusters: [],
      tier: 'Premium',
      tierDmPermitted: false,
    });
    return {
      status: 'miss',
      icebreaker: 'No semantic overlap found — try widening alignment.',
      synergy: '0.00',
      fusion: empty,
    };
  }

  const tierDmPermitted =
    viewerIsElite || node.tier !== 'Elite' || MUTUAL_ELITE_IDS.has(node.id);

  const fusion = runFusionMatch({
    nodeId: node.id,
    alignment: node.alignment,
    cognitive: node.cognitive,
    niches: node.niches,
    clusters: node.clusters,
    tier: node.tier,
    viewerIsElite,
    tierDmPermitted,
  });

  return {
    status: fusion.connection_status === 'APPROVED_FOR_DM' ? 'fused' : fusion.connection_status.toLowerCase(),
    icebreaker: fusion.icebreaker_hook,
    synergy: fusion.composite_compatibility_score.toFixed(2),
    fusion,
  };
}

/**
 * Optional live backend probe — returns null when offline / mock mode.
 * Maps to connect-core fusion / jev when EXPO_PUBLIC_USE_MOCK=false.
 */
export async function probeBackendHealth(): Promise<{ ok: boolean; mode: 'mock' | 'live' }> {
  if (USE_MOCK_ENGINE) {
    return { ok: true, mode: 'mock' };
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(`${API_BASE_URL}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    return { ok: res.ok, mode: 'live' };
  } catch {
    return { ok: false, mode: 'live' };
  }
}
