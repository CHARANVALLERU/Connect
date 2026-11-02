// =============================================================================
// Neo4j Cypher Graph Schema: Niche Communities, Connection Rings & GraphRAG
// =============================================================================

// 1. Uniqueness Constraints and Fast Lookup Indexes
CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT community_slug_unique IF NOT EXISTS
FOR (c:Community) REQUIRE c.slug IS UNIQUE;

CREATE INDEX user_tier_index IF NOT EXISTS
FOR (u:User) ON (u.tier);

CREATE INDEX user_geohash_index IF NOT EXISTS
FOR (u:User) ON (u.geohash_prefix);

// 2. Sample Graph Initialization (Niche Communities)
MERGE (cDev:Community {slug: 'c/developers', name: 'Software Architects & Builders', tier: 'PREMIUM', is_hidden: false});
MERGE (cBiz:Community {slug: 'c/businessmen', name: 'Entrepreneurs & Operators', tier: 'PREMIUM', is_hidden: false});
MERGE (cTrav:Community {slug: 'c/travellers', name: 'Global Nomads & Explorers', tier: 'PREMIUM', is_hidden: false});
MERGE (cCon:Community {slug: 'c/conspiracies', name: 'Uncensored Rabbit Holes', tier: 'PREMIUM', is_hidden: false});
MERGE (cGame:Community {slug: 'c/gamers', name: 'Competitive Gaming Syndicate', tier: 'PREMIUM', is_hidden: false});

// Exclusive Invisible Elite Boards
MERGE (cAngel:Community {slug: 'c/angel-syndicate', name: 'Private Angel Syndicate', tier: 'ELITE', is_hidden: true});
MERGE (cYacht:Community {slug: 'c/yacht-charters', name: 'Monaco & Dubai Fleet Network', tier: 'ELITE', is_hidden: true});

// =============================================================================
// 3. GraphRAG Candidate Discovery & Jev Subgraph Pruning Query
// Filters candidate neighbors in the same sector while strictly pruning Elite nodes
// for Premium requesters.
// =============================================================================

// Params: $requesterId, $requesterTier, $geohashPrefix, $targetNiche
MATCH (me:User {id: $requesterId})
MATCH (candidate:User)
WHERE candidate.id <> me.id
  AND candidate.geohash_prefix = $geohashPrefix
  AND candidate.primary_niche = $targetNiche
  // THE ELITE FIREWALL IN GRAPH QUERY:
  // If requester is PREMIUM, candidate tier MUST NOT be ELITE
  AND ($requesterTier = 'ELITE' OR candidate.tier = 'PREMIUM')
  AND candidate.ghost_mode = false

// Traverse shared interest rings
OPTIONAL MATCH (me)-[:INTERESTED_IN]->(topic:Interest)<-[:INTERESTED_IN]-(candidate)
WITH candidate, count(topic) AS shared_topics_count

// Return bounded, pruned candidate set (<10 items) to prevent token context bloat
RETURN candidate.id AS candidate_id,
       candidate.tier AS candidate_tier,
       candidate.primary_niche AS candidate_niche,
       candidate.cognitive_level AS cognitive_level,
       candidate.geohash_prefix AS sector,
       shared_topics_count
ORDER BY shared_topics_count DESC
LIMIT 8;
