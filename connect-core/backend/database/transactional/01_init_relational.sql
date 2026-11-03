-- PostgreSQL Production Schema Migration File
-- Connect Core Engine Storage Initialization Sequence
-- Zero-raw-finance: only tokenized IAP/Play Billing receipt references

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash_secure CHAR(60) NOT NULL,
    user_tier VARCHAR(16) NOT NULL CHECK (user_tier IN ('PREMIUM', 'ELITE')),
    primary_niche VARCHAR(32) NOT NULL DEFAULT 'DEVELOPER',
    ghost_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    geohash_sector VARCHAR(12) NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Zero-Storage Payment Engine Validation Tokens Table
CREATE TABLE IF NOT EXISTS tier_subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    app_store_receipt_token TEXT NOT NULL,
    verification_status VARCHAR(32) NOT NULL,
    active_until TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS identity_attestations (
    attestation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL CHECK (provider IN ('PERSONA', 'STRIPE_IDENTITY', 'GITHUB', 'CORPORATE_REGISTRY')),
    verified_financial BOOLEAN NOT NULL DEFAULT FALSE,
    human_uniqueness VARCHAR(16) NOT NULL DEFAULT 'UNVERIFIED'
        CHECK (human_uniqueness IN ('VERIFIED', 'PARTIAL', 'UNVERIFIED')),
    provider_token_ref TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_gating_tier ON users(user_id, user_tier);
CREATE INDEX IF NOT EXISTS idx_subscription_tokens ON tier_subscriptions(user_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_identity_attestations_user ON identity_attestations(user_id);
