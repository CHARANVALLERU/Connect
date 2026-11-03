# Connect

**Niche communities · Cognitive matching · Tier-gated privacy**

A React Native / Expo mobile app with a Python AI backend. Connect brings deliberate social & romantic discovery — Hinge-style dating, Reddit-style niche communities, WhatsApp-style messaging, and semantic vector matching — all under a strict two-tier (Premium / Elite) privacy firewall.

---

## Architecture at a Glance

```
Mobile Client (Expo Go / standalone)
       │  REST / WebSocket
       ▼
connect-core/backend
  ├── api-gateway   – Envoy proxy, tier header inspection
  ├── engines/
  │   ├── jev_layer    – TypeSafe System 1 (<100 ms rules engine)
  │   └── llm_layer    – Hermes / Qwen agents (A · B · C fusion)
  ├── streaming/
  │   ├── kafka        – Event broker (public + secure-elite partitions)
  │   └── flink        – H3 geohash obscuring, behavioral metrics
  └── database/
      ├── transactional – PostgreSQL
      ├── graphs        – Neo4j community rings
      └── vectors       – Pinecone semantic embeddings
```

---

## Screens

| Tab | Pattern | Feature |
|-----|---------|---------|
| **Dating** | Hinge UI | Prompt-locked DM requests, variable-reward feed ranking |
| **Community** | Reddit/Discord | Kafka topic streams, Elite firewall invisibility |
| **Chat** | WhatsApp | Progressive disclosure gating, in-chat venue scheduler & invoicing |
| **Explore** | Vector discovery | Cosine similarity slider, Agent A/B/C fusion match cards |

---

## Quick Start (Expo Go)

```bash
# 1. Install dependencies
npm install

# 2. Start the Metro bundler
npm start          # opens Expo Go QR code

# Demo login (no backend required):
# Elite account  → elite@test.com  / ElitePass123!
# Premium account → premium@test.com / PremiumPass123!
```

Scan the QR code with **Expo Go** on iOS or Android. All data is mocked offline — no backend connection needed for the demo.

---

## Backend (connect-core)

```bash
cd connect-core
pip install -r requirements.txt
docker-compose up          # Kafka · Flink · Neo4j · PostgreSQL
```

Set `USE_MOCK_ENGINE=false` in `.env` and point `API_BASE_URL` to your gateway to switch the mobile app to live mode.

---

## Environment Variables

Copy `.env.example` → `.env` and fill in your keys:

```
API_BASE_URL=http://localhost:8080
USE_MOCK_ENGINE=true
PINECONE_API_KEY=...
NEO4J_URI=bolt://localhost:7687
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

---

## Project Structure

```
Connect/
├── App.tsx                   # Root with SafeArea + Nav + Theme + Auth + Tier providers
├── navigation/
│   ├── AppNavigator.tsx      # Auth gate (Login ↔ Main)
│   └── ConnectNavigator.tsx  # Bottom tab navigator
├── screens/connect/
│   ├── DatingScreen.tsx      # Hinge-style profile feed
│   ├── CommunityScreen.tsx   # Channel list + post feed
│   ├── ChatListScreen.tsx    # Thread list with unread badges
│   ├── ChatThreadScreen.tsx  # Full chat + venue scheduler + invoicing
│   └── ExploreScreen.tsx     # Vector match cards + similarity slider
├── components/
│   ├── TierPrivilegeBanner.tsx  # Elite obsidian-gold / Premium upsell header
│   └── ConnectStatusBar.tsx     # Tier-aware status bar
├── services/
│   ├── connectBridge.ts      # UI ↔ backend contract layer (offline-first)
│   ├── engagementEngine.ts   # Instagram-style variable-reward ranking
│   ├── engineAdapter.ts      # REST adapter with mock fallback
│   └── authService.ts        # JWT auth helpers
├── context/
│   ├── AuthContext.tsx        # Login / logout / user state
│   ├── TierContext.tsx        # Premium ↔ Elite feature flags
│   └── ThemeContext.tsx       # Theme tokens
├── data/connectFeed.ts        # Rich mock corpus (profiles · posts · threads · nodes)
├── theme/tokens.ts            # Elite obsidian-gold + Premium cream-green palettes
└── connect-core/              # Python AI backend (see above)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.88 · Expo SDK 58 · TypeScript 6 |
| Navigation | React Navigation 7 (bottom tabs + native stack) |
| Engagement | Custom variable-reward engine (novelty · social proof · affinity) |
| Backend | Python 3.14 · FastAPI · Apache Kafka · Apache Flink |
| AI Agents | Hermes / Qwen 3.5 (Agent A profile · Agent B guard · Agent C fusion) |
| Graphs | Neo4j (community rings) · Pinecone (vector embeddings) |
| Streaming | Kafka topics · Flink H3 geohash obscuring |

---

## License

Private — all rights reserved. Contact the Connect team for licensing enquiries.

