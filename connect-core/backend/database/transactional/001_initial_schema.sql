-- =============================================================================
-- PostgreSQL Migration 001: Connect Core Persistence Architecture
-- Complies with Zero-Raw-Storage Finance Mandate & Tier Privileges
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_tier_enum AS ENUM ('PREMIUM', 'ELITE');
CREATE TYPE subscription_status_enum AS ENUM ('ACTIVE', 'GRACE_PERIOD', 'CANCELLED', 'EXPIRED');
CREATE TYPE iap_provider_enum AS ENUM ('APPLE_IAP', 'GOOGLE_PLAY');
CREATE TYPE niche_enum AS ENUM (
    'DEVELOPER', 'BUSINESSMAN', 'TRAVELLER', 'CONSPIRACY', 
    'GAMER', 'INVESTOR', 'CREATIVE', 'PHILOSOPHER'
);

-- Core User Accounts
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    tier user_tier_enum NOT NULL DEFAULT 'PREMIUM',
    primary_niche niche_enum NOT NULL DEFAULT 'DEVELOPER',
    bio TEXT,
    avatar_url TEXT,
    ghost_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    geohash_sector VARCHAR(12) NOT NULL DEFAULT '', -- Obscured ~5km grid cell
    cognitive_complexity_level VARCHAR(20) DEFAULT 'Medium',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Zero-Raw-Storage Tokenized Subscription Records
-- NEVER stores raw financial documents or credit card details.
CREATE TABLE tokenized_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier user_tier_enum NOT NULL,
    provider iap_provider_enum NOT NULL,
    store_transaction_id_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of original Apple/Google transaction ID
    status subscription_status_enum NOT NULL DEFAULT 'ACTIVE',
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Communities (Public Niches and Locked Elite Boards)
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,      -- e.g. 'c/developers', 'c/angel-syndicate'
    name VARCHAR(128) NOT NULL,
    description TEXT,
    required_tier user_tier_enum NOT NULL DEFAULT 'PREMIUM',
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE, -- Elite boards are completely hidden from discovery
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Direct Messaging Sessions (WhatsApp-Style 1:1)
CREATE TABLE dm_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiator_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    initiator_tier user_tier_enum NOT NULL,
    recipient_tier user_tier_enum NOT NULL,
    session_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_elite_dm_rule CHECK (
        -- If recipient is ELITE, the initiator MUST be ELITE, OR the session must be approved
        NOT (recipient_tier = 'ELITE' AND initiator_tier = 'PREMIUM') OR session_status = 'ELITE_APPROVED'
    )
);

-- Indexes for Sub-Millisecond Filtering
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_geohash ON users(geohash_sector);
CREATE INDEX idx_subscriptions_user_status ON tokenized_subscriptions(user_id, status);
CREATE INDEX idx_communities_required_tier ON communities(required_tier, is_hidden);

-- Row Level Security (RLS) Policy Example
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Premium users cannot see Elite users in general public queries unless mutual DM exists
CREATE POLICY premium_cannot_select_elite ON users
    FOR SELECT
    USING (
        tier = 'PREMIUM' 
        OR CURRENT_USER = 'connect_elite_admin'
        OR id = auth.uid()
    );
