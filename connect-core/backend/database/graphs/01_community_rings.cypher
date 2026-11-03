// Neo4j Database System Initialization Script
// Community rings + Elite isolation markers

CREATE CONSTRAINT unique_user_id IF NOT EXISTS FOR (u:User) REQUIRE u.user_id IS UNIQUE;
CREATE CONSTRAINT unique_niche_id IF NOT EXISTS FOR (c:NicheCommunity) REQUIRE c.niche_key IS UNIQUE;

MERGE (c1:NicheCommunity {niche_key: "DEVELOPER", privacy_level: "OPEN"})
SET c1.description = "System developers open board ring",
    c1.slug = "c/developers"
RETURN c1;

MERGE (c2:NicheCommunity {niche_key: "BUSINESSMAN", privacy_level: "OPEN"})
SET c2.description = "Global corporate leaders discussion feed",
    c2.slug = "c/businessmen"
RETURN c2;

MERGE (c3:NicheCommunity {niche_key: "GAMER", privacy_level: "OPEN"})
SET c3.description = "Competitive and multiplayer culture board",
    c3.slug = "c/gamers"
RETURN c3;

MERGE (c4:NicheCommunity {niche_key: "TRAVELLER", privacy_level: "OPEN"})
SET c4.description = "Remote work and travel routing board",
    c4.slug = "c/travellers"
RETURN c4;

MERGE (c5:NicheCommunity {niche_key: "CONSPIRACY", privacy_level: "OPEN"})
SET c5.description = "Open speculation and systems critique board",
    c5.slug = "c/conspiracies"
RETURN c5;

MERGE (c6:NicheCommunity {niche_key: "ANGEL_SYNDICATE", privacy_level: "ELITE_ISOLATED"})
SET c6.description = "Locked investment channel. Absolute invisibility layer active.",
    c6.slug = "c/angel-syndicate"
RETURN c6;

MERGE (c7:NicheCommunity {niche_key: "YACHT_CHARTERS", privacy_level: "ELITE_ISOLATED"})
SET c7.description = "Elite lifestyle coordination board. Premium cannot discover.",
    c7.slug = "c/yacht-charters"
RETURN c7;

// Example membership link:
// MATCH (u:User {user_id: $uid}), (c:NicheCommunity {niche_key: $nkey})
// MERGE (u)-[r:MEMBER_OF {affinity_weight: $weight}]->(c)
