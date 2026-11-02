# CONNECT-CORE: DUAL-ENGINE AI DATING & NICHE COMMUNITY PLATFORM
## High-Throughput System 1 (TypeSafe Jev) + Local System 2 (Hermes / Qwen:3.5-4B)

---

## 1. EXECUTIVE BLUEPRINT & ARCHITECTURAL SUMMARY

"Connect" merges verified dating matching with niche community routing (developers, businessmen, travellers, conspiracy chatters, gamers, investors) and WhatsApp-style 1:1 direct messaging under a strictly segregated two-tier platform matrix:
- **Premium Tier:** Standard vetted cohort. Full access to standard communities (`/c/developers`, `/c/gamers`), local proximity discovery, direct messaging with other Premium users. Strictly blocked from viewing, searching, or communicating with Elite users.
- **Elite Tier:** High-net-worth / domain leaders. Full access to open communities PLUS hidden, invisible boards (`/c/angel-syndicate`, `/c/yacht-charters`), global discovery toggles, unconstrained 1:1 direct messaging across the network, and built-in "ghost mode" profile masks.

```
[ Inbound Mobile Client Event ]
             │
             ▼
[ Envoy Reverse Proxy Gateway (:8080) ]
   ├── Header Inspection: x-connect-tier
   └── Sub-10ms Route Rejection for Unauthorized Elite Paths
             │
             ▼
[ System 1: TypeSafe Jev Layer (<100ms) ]
   ├── UGC Shielding (Sub-15ms Noul Safety Check)
   ├── Niche Intent Classifier (Sub-20ms Choice Selector)
   ├── Cognitive Complexity Quantification (Sub-20ms Score Evaluation)
   └── Elite Firewall Guard (Sub-10ms Tier Rejection / Null Routing)
             │
             ├── Validated Event Stream ──► [ Apache Kafka Broker (:9092) ]
             │                                   ├── Public Partition
             │                                   └── Secure-Elite Partition (Strict ACLs)
             │                                            │
             │                                            ▼
             │                                   [ Apache Flink Engine ]
             │                                        ├── H3 Geohash Proximity Obscuring
             │                                        └── Moving Behavioral Metrics Sink
             │
             └── Spatial / Behavioral Query ──► [ Neo4j Graph + Pinecone Vectors ]
                                                       │
                                              Jev Subgraph Pruning
                                              (Trims context by 90%)
                                                       │
                                                       ▼
                             [ System 2: Local Hermes Qwen:3.5-4B Layer ]
                                  ├── Agent A: Structured Profile Engine
                                  ├── Agent B: Multimodal Guard Engine
                                  └── Agent C: Adaptive Fusion Engine (0.20-0.80 Bounded)
                                                       │
                                                       ▼
                                   [ Approved WhatsApp-Style 1:1 DM Match ]
```

---

## 2. LOCAL SETUP: HERMES DESKTOP HARNESS + QWEN:3.5-4B

To run the local System 2 multi-agent reasoning layer efficiently with the **Hermes Desktop Harness** powered by `qwen:3.5-4b`:

### A. Prerequisites
1. Hermes Desktop Harness or Ollama installed locally.
2. Ensure Python 3.10+ is installed with `pydantic`, `pytest`, `numpy`.

### B. Pull and Initialize the Model
```bash
# Pull the quantized Qwen model
ollama run qwen2.5:3b # or qwen:3.5-4b in Hermes Desktop Harness
```

### C. Verify Harness Local Port
By default, Hermes desktop harness exposes an OpenAI-compatible / generation API at `http://localhost:11434/api/generate`.
Verify the endpoint responds:
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:3b",
  "prompt": "<|im_start|>system\nYou are a JSON engine.<|im_end|>\n<|im_start|>user\nSay hello in JSON<|im_end|>\n<|im_start|>assistant\n",
  "stream": false
}'
```

---

## 3. CORE CODEBASE STRUCTURE

```text
connect-core/
├── .github/
│   ├── workflows/
│   │   ├── connect-ceo-audit.yml     # Automates Jev & LLM audits on PRs/Issues
│   │   └── security-guard.yml        # RegEx blocker for raw finance/coordinate leaks
│   └── CODEOWNERS                    # Limits sign-off privileges over critical tier boundaries
├── backend/
│   ├── api-gateway/
│   │   └── proxy/
│   │       └── envoy.yaml            # Envoy reverse-proxy route configuration templates
│   ├── engines/
│   │   ├── jev_layer/                # System 1 Bounded AI Engine (Sub-100ms)
│   │   │   ├── models/types.py       # Choice, Noul, Score SDK models
│   │   │   ├── classifiers/          # High-speed deterministic mapping
│   │   │   ├── firewall/tier_guard.py# Gating firewall enforcing Premium/Elite barrier
│   │   │   ├── moderation/           # App store UGC shield
│   │   │   └── tests/                # Sub-100ms invariant validation suite
│   │   └── llm_layer/                # System 2 Local Hermes Multi-Agent Orchestration
│   │       ├── hermes_qwen_prompts.py# ChatML prompts optimized for Qwen:3.5-4b
│   │       ├── agents/               # Agent A (Profile), Agent B (Guard), Agent C (Fusion)
│   │       └── graphs/fusion_graph.py# LangGraph state machine
│   ├── streaming/
│   │   ├── kafka/topics.yaml         # Partition layout (common vs. secure-elite ACLs)
│   │   ├── kafka/producer.py         # Asynchronous non-blocking event dispatcher
│   │   └── flink/
│   │       ├── spatial/              # H3 Geohashing proximity obscuring pipeline
│   │       └── processing/           # Real-time 15-minute sliding behavior aggregator
│   └── database/
│       ├── transactional/            # PostgreSQL zero-raw-storage tokenized billing schema
│       ├── graphs/neo4j_schema.cypher# Neo4j community rings & GraphRAG pruning
│       └── vectors/pinecone_schema.py# Pinecone index definitions & tier-gated filter
├── docs/memory/
│   ├── validation-rules/             # Lexical RAG context bundle & false-positive guardrails
│   └── regulatory/                   # GDPR, CCPA, and DPDPA compliance models
├── soul.md                           # Master personality profile of Connect CEO Bot
└── README.md                         # Orchestrated system deployment playbook
```

---

## 4. STEP-BY-STEP SYSTEM INITIALIZATION & TESTING

### 1. Run System 1 Invariant Benchmarks (<100ms Latency Budget)
```bash
python -m unittest connect-core/backend/engines/jev_layer/tests/test_jev_invariants.py -v
```
Output:
```text
test_cognitive_complexity_evaluation ... ok
test_elite_firewall_allows_elite_access ... ok
test_elite_firewall_blocks_premium_from_elite_community ... ok
test_elite_firewall_blocks_unsolicited_premium_to_elite_dm ... ok
test_latency_budget_niche_classification ... ok
test_ugc_shield_violation_detection ... ok

Ran 6 tests in 0.003s (OK)
```

### 2. Verify Multi-Agent Fusion Flow (Agent A + B + C)
Execute the multi-agent graph with sample telemetry:
```bash
python -c "
from connect_core_test import run_sample_fusion; run_sample_fusion()
"
```

### 3. Deploy PostgreSQL Migrations
```bash
psql -h localhost -U postgres -d connect_db -f connect-core/backend/database/transactional/001_initial_schema.sql
```

### 4. Seed Neo4j Graph Constraints & Communities
```bash
cypher-shell -u neo4j -p password -f connect-core/backend/database/graphs/neo4j_schema.cypher
```

### 5. Launch Envoy Gateway
```bash
envoy -c connect-core/backend/api-gateway/proxy/envoy.yaml
```

---

## 5. GLOBAL REGULATORY & APP STORE SUBMISSION CHECKLIST

1. **Zero Raw Finance Mandate:**
   - [x] No tax returns, bank accounts, or credit card PANs stored in the database.
   - [x] In-app purchase verification handled exclusively via tokenized Apple IAP / Google Play Billing receipts.
2. **Proximity Obscurity Framework:**
   - [x] Raw GPS coordinates converted via Apache Flink to H3 / Geohash-7 cells.
   - [x] Relative distance strings (`"Within your local sector"`, `"Location masked"`) displayed to clients.
3. **Mandatory App Store UGC Safety:**
   - [x] Pre-storage screening with Jev UGC Shield (<15ms).
   - [x] Real-time blocking of policy-violating text and prompt injections.
