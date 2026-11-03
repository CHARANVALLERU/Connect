/** Rich mock corpus for Dating / Community / Chat / Explore — Expo Go offline ready */

export type CognitiveLevel = 'Low' | 'Medium' | 'High' | 'Advanced';
export type AppTier = 'Premium' | 'Elite';

export interface DatingProfile {
  id: string;
  name: string;
  age: number;
  title: string;
  tier: AppTier;
  cognitive: CognitiveLevel;
  distance: string;
  photo: string;
  niche: string;
  prompts: { id: string; question: string; answer: string }[];
  engagementSeed: number;
  /** When true, Premium viewers never see this profile (Elite progressive disclosure). */
  ghostMode?: boolean;
}

export interface CommunityChannel {
  id: string;
  slug: string;
  name: string;
  activeLabel: string;
  requiredTier: AppTier;
  isEliteOnly: boolean;
}

export interface CommunityPost {
  id: string;
  author: string;
  channelSlug: string;
  body: string;
  upvotes: number;
  comments: number;
  minutesAgo: number;
  novelty: number;
}

export interface ChatThread {
  id: string;
  name: string;
  avatar: string;
  tier: AppTier;
  preview: string;
  unread: number;
  icebreaker?: string;
  locked: boolean;
  lastAt: string;
  messages: { id: string; from: 'me' | 'them'; text: string; time: string; read?: boolean }[];
}

export interface ExploreNode {
  id: string;
  name: string;
  age: number;
  title: string;
  avatar: string;
  alignment: number;
  cognitive: CognitiveLevel;
  clusters: string[];
  niches: string[];
  tier: AppTier;
}

export const DATING_PROFILES: DatingProfile[] = [
  {
    id: 'p1',
    name: 'Alexander',
    age: 29,
    title: 'Founder / Principal Software Architect',
    tier: 'Elite',
    cognitive: 'Advanced',
    distance: '< 2 Kilometers Away (Obscured Grid)',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900&q=80',
    niche: 'developer',
    engagementSeed: 0.92,
    ghostMode: true,
    prompts: [
      {
        id: 'pr1',
        question: 'My idea of a perfect weekend involves...',
        answer: 'Building distributed multi-agent systems over Flink, then a quiet dinner with someone who can keep up.',
      },
      {
        id: 'pr2',
        question: 'I geek out about...',
        answer: 'GraphRAG pruning that cuts context bloat by 90% without losing the signal.',
      },
    ],
  },
  {
    id: 'p2',
    name: 'Elena',
    age: 31,
    title: 'Strategic Venture General Partner',
    tier: 'Elite',
    cognitive: 'Advanced',
    distance: 'Less than 5 kilometers away',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&q=80',
    niche: 'investor',
    engagementSeed: 0.88,
    ghostMode: true,
    prompts: [
      {
        id: 'pr3',
        question: 'Green flags I look for...',
        answer: 'People who debate ideas without needing to win the room.',
      },
    ],
  },
  {
    id: 'p3',
    name: 'Maya',
    age: 27,
    title: 'Systems Designer · Remote Nomad',
    tier: 'Premium',
    cognitive: 'High',
    distance: 'Within your local sector',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994d69daeb?w=900&q=80',
    niche: 'traveller',
    engagementSeed: 0.81,
    prompts: [
      {
        id: 'pr4',
        question: 'Together we could...',
        answer: 'Map off-grid Iceland routes and still ship code before breakfast.',
      },
    ],
  },
  {
    id: 'p4',
    name: 'Jordan',
    age: 30,
    title: 'Product Lead · Multiplayer Platforms',
    tier: 'Premium',
    cognitive: 'High',
    distance: 'Location masked',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80',
    niche: 'gamer',
    engagementSeed: 0.76,
    prompts: [
      {
        id: 'pr5',
        question: 'I am convinced that...',
        answer: 'Latency budgets are a love language.',
      },
    ],
  },
  {
    id: 'p5',
    name: 'Sofia',
    age: 28,
    title: 'ML Researcher · Alignment Lab',
    tier: 'Premium',
    cognitive: 'Advanced',
    distance: '< 5 Kilometers Away',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&q=80',
    niche: 'developer',
    engagementSeed: 0.9,
    prompts: [
      {
        id: 'pr6',
        question: 'A life goal of mine...',
        answer: 'Ship an agent that never stores raw coordinates or finance docs — and still feels personal.',
      },
    ],
  },
  {
    id: 'p6',
    name: 'Priya',
    age: 32,
    title: 'Quant Strategist · Dark Pool Ops',
    tier: 'Elite',
    cognitive: 'Advanced',
    distance: 'Obscured · Sector adjacent',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&q=80',
    niche: 'investor',
    engagementSeed: 0.94,
    ghostMode: true,
    prompts: [
      {
        id: 'pr7',
        question: 'The way to win me over is...',
        answer: 'Show me a risk model that survives contact with reality — then ask better questions.',
      },
      {
        id: 'pr8',
        question: 'I geek out about...',
        answer: 'Microstructure that looks like poetry when you plot the order book.',
      },
    ],
  },
  {
    id: 'p7',
    name: 'Noah',
    age: 26,
    title: 'Indie Hacker · Community Ops',
    tier: 'Premium',
    cognitive: 'High',
    distance: 'Within 8 kilometers',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&q=80',
    niche: 'developer',
    engagementSeed: 0.73,
    prompts: [
      {
        id: 'pr9',
        question: 'A perfect first date...',
        answer: 'Coffee, a whiteboard, and arguing about whether Discord or Slack ruins culture first.',
      },
    ],
  },
  {
    id: 'p8',
    name: 'Amara',
    age: 29,
    title: 'Creative Director · Live Ops Events',
    tier: 'Premium',
    cognitive: 'Medium',
    distance: 'Local sector · Soft pin',
    photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=900&q=80',
    niche: 'gamer',
    engagementSeed: 0.79,
    prompts: [
      {
        id: 'pr10',
        question: 'I am weirdly competitive about...',
        answer: 'Who can design a matchmaking loop that feels fair and still addictive.',
      },
      {
        id: 'pr11',
        question: 'Together we could...',
        answer: 'Turn a LAN night into a pop-up gallery for people who ship.',
      },
    ],
  },
  {
    id: 'p9',
    name: 'Kai',
    age: 34,
    title: 'Captain · Private Charter Network',
    tier: 'Elite',
    cognitive: 'High',
    distance: 'Grid obscured · Coastal ring',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=900&q=80',
    niche: 'traveller',
    engagementSeed: 0.86,
    ghostMode: false,
    prompts: [
      {
        id: 'pr12',
        question: 'Green flags I look for...',
        answer: 'Someone who packs light, tips crew, and does not need Wi-Fi to be interesting.',
      },
    ],
  },
];

export const CHANNELS: CommunityChannel[] = [
  { id: 'c1', slug: '/c/developers', name: 'Developers', activeLabel: '14.2k Active', requiredTier: 'Premium', isEliteOnly: false },
  { id: 'c2', slug: '/c/businessmen', name: 'Businessmen', activeLabel: '8.1k Active', requiredTier: 'Premium', isEliteOnly: false },
  { id: 'c3', slug: '/c/gamers', name: 'Gamers', activeLabel: '22.4k Active', requiredTier: 'Premium', isEliteOnly: false },
  { id: 'c4', slug: '/c/travellers', name: 'Travellers', activeLabel: '6.7k Active', requiredTier: 'Premium', isEliteOnly: false },
  { id: 'c5', slug: '/c/conspiracies', name: 'Conspiracies', activeLabel: '11.0k Active', requiredTier: 'Premium', isEliteOnly: false },
  { id: 'c6', slug: '/c/angel-syndicate', name: 'Angel Syndicate', activeLabel: 'Vetted Elite', requiredTier: 'Elite', isEliteOnly: true },
  { id: 'c7', slug: '/c/yacht-charters', name: 'Yacht Charters', activeLabel: 'Vetted Elite', requiredTier: 'Elite', isEliteOnly: true },
];

export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post1',
    author: 'u/dev_architect',
    channelSlug: '/c/developers',
    body: 'Is anyone shifting production workflows from REST endpoints to asynchronous Apache Kafka event queues?',
    upvotes: 842,
    comments: 142,
    minutesAgo: 12,
    novelty: 0.94,
  },
  {
    id: 'post2',
    author: 'u/gp_elena',
    channelSlug: '/c/businessmen',
    body: 'Tokenized IAP receipts for Elite gating beat storing any financial docs. How are you verifying without Persona latency spikes?',
    upvotes: 511,
    comments: 87,
    minutesAgo: 34,
    novelty: 0.86,
  },
  {
    id: 'post3',
    author: 'u/nomad_maya',
    channelSlug: '/c/travellers',
    body: 'Off-grid Iceland spots that still have decent Starlink for pair programming — drop your geohash-safe tips.',
    upvotes: 329,
    comments: 64,
    minutesAgo: 55,
    novelty: 0.8,
  },
  {
    id: 'post4',
    author: 'u/syndicate_ops',
    channelSlug: '/c/angel-syndicate',
    body: 'Quiet round forming for a graph+vector dating infra play. Soft circle only — no Premium visibility.',
    upvotes: 98,
    comments: 21,
    minutesAgo: 8,
    novelty: 0.97,
  },
  {
    id: 'post5',
    author: 'u/latency_jordan',
    channelSlug: '/c/gamers',
    body: 'Hitbox feel vs network tick rate — still underrated in matchmaking UX. Dating apps could learn from this.',
    upvotes: 701,
    comments: 203,
    minutesAgo: 90,
    novelty: 0.72,
  },
  {
    id: 'post6',
    author: 'u/amara_liveops',
    channelSlug: '/c/gamers',
    body: 'Seasonal event loops that reward show-up streaks without pay-to-win — what retention curves are you seeing week 3?',
    upvotes: 456,
    comments: 118,
    minutesAgo: 22,
    novelty: 0.88,
  },
  {
    id: 'post7',
    author: 'u/noah_ships',
    channelSlug: '/c/developers',
    body: 'Shipped a FOMO dwell tracker in-client only — no network. Variable reward ranking feels scarier than A/B tests.',
    upvotes: 612,
    comments: 95,
    minutesAgo: 41,
    novelty: 0.91,
  },
  {
    id: 'post8',
    author: 'u/signal_hunter',
    channelSlug: '/c/conspiracies',
    body: 'Why do every dating feed and casino share the same intermittent reinforcement schedule? Asking for a friend with a streak counter.',
    upvotes: 1204,
    comments: 311,
    minutesAgo: 18,
    novelty: 0.95,
  },
  {
    id: 'post9',
    author: 'u/charter_kai',
    channelSlug: '/c/yacht-charters',
    body: 'Aegean soft circle next month — crew vetted, no Premium invites. Bring a thesis, not a brochure.',
    upvotes: 74,
    comments: 16,
    minutesAgo: 6,
    novelty: 0.98,
  },
];

export const CHAT_THREADS: ChatThread[] = [
  {
    id: 't1',
    name: 'Sarah',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    tier: 'Elite',
    preview: "Let's lock in a local meetup venue.",
    unread: 2,
    icebreaker: 'You both post frequently on off-grid travel spots in Iceland. Tap to view related community inputs.',
    locked: false,
    lastAt: '10:15 AM',
    messages: [
      { id: 'm1', from: 'them', text: 'The vector scaling database parameters you shared look fine.', time: '10:14 AM' },
      { id: 'm2', from: 'me', text: "Let's lock in a local meetup venue.", time: '10:15 AM', read: true },
    ],
  },
  {
    id: 't2',
    name: 'Elena',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    tier: 'Elite',
    preview: 'Thread locked — respond to a prompt to unlock.',
    unread: 0,
    locked: true,
    lastAt: 'Yesterday',
    messages: [],
  },
  {
    id: 't3',
    name: 'Maya',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994d69daeb?w=200&q=80',
    tier: 'Premium',
    preview: 'Ship the icebreaker from Agent C?',
    unread: 1,
    icebreaker: 'Shared niche: /c/developers × /c/travellers',
    locked: false,
    lastAt: 'Mon',
    messages: [
      { id: 'm3', from: 'them', text: 'Your Flink geohash note was sharp.', time: 'Mon' },
    ],
  },
  {
    id: 't4',
    name: 'Noah',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    tier: 'Premium',
    preview: 'Whiteboard + coffee still free Thursday?',
    unread: 0,
    icebreaker: 'Agent C: both shipping community ops tooling this week.',
    locked: false,
    lastAt: '9:02 AM',
    messages: [
      { id: 'm4', from: 'them', text: 'Your dwell-tracker note was spicy.', time: '8:58 AM' },
      { id: 'm5', from: 'me', text: 'Whiteboard + coffee still free Thursday?', time: '9:02 AM', read: true },
    ],
  },
  {
    id: 't5',
    name: 'Priya',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80',
    tier: 'Elite',
    preview: 'Elite-only — upgrade or mutual unlock required.',
    unread: 0,
    locked: true,
    lastAt: 'Tue',
    messages: [],
  },
];

export const EXPLORE_NODES: ExploreNode[] = [
  {
    id: 'e1',
    name: 'Elena',
    age: 31,
    title: 'Strategic Venture General Partner',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    alignment: 0.85,
    cognitive: 'Advanced',
    clusters: ['FinTech Systems', 'Epistemology', 'Micro-Networks'],
    niches: ['/c/businessmen', '/c/travellers'],
    tier: 'Elite',
  },
  {
    id: 'e2',
    name: 'Sofia',
    age: 28,
    title: 'ML Researcher · Alignment Lab',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=80',
    alignment: 0.91,
    cognitive: 'Advanced',
    clusters: ['Agent Safety', 'GraphRAG', 'Privacy Architecture'],
    niches: ['/c/developers'],
    tier: 'Premium',
  },
  {
    id: 'e3',
    name: 'Jordan',
    age: 30,
    title: 'Product Lead · Multiplayer Platforms',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    alignment: 0.78,
    cognitive: 'High',
    clusters: ['Latency UX', 'Live Ops', 'Community Loops'],
    niches: ['/c/gamers', '/c/developers'],
    tier: 'Premium',
  },
  {
    id: 'e4',
    name: 'Alexander',
    age: 29,
    title: 'Founder / Principal Software Architect',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
    alignment: 0.88,
    cognitive: 'Advanced',
    clusters: ['Streaming Systems', 'Dual-Engine AI', 'Tier Isolation'],
    niches: ['/c/developers', '/c/angel-syndicate'],
    tier: 'Elite',
  },
  {
    id: 'e5',
    name: 'Amara',
    age: 29,
    title: 'Creative Director · Live Ops Events',
    avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&q=80',
    alignment: 0.74,
    cognitive: 'Medium',
    clusters: ['Event Design', 'Retention Loops', 'Social Proof'],
    niches: ['/c/gamers'],
    tier: 'Premium',
  },
  {
    id: 'e6',
    name: 'Priya',
    age: 32,
    title: 'Quant Strategist · Dark Pool Ops',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80',
    alignment: 0.83,
    cognitive: 'Advanced',
    clusters: ['Market Microstructure', 'Risk Models', 'Quiet Capital'],
    niches: ['/c/businessmen', '/c/angel-syndicate'],
    tier: 'Elite',
  },
];
