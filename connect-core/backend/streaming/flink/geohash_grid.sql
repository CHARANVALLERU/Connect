CREATE TABLE raw_proximity_stream (
    user_id VARCHAR,
    raw_lat DOUBLE,
    raw_lng DOUBLE,
    user_tier VARCHAR,
    event_time TIMESTAMP(3),
    WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
    'connector' = 'kafka',
    'topic' = 'proximity-updates-all',
    'properties.bootstrap.servers' = 'localhost:9092',
    'format' = 'json'
);

-- Obscure location data via H3 Geohashing Resolution 7 index keys before data landing
CREATE VIEW structured_proximity_view AS
SELECT 
    user_id,
    user_tier,
    ST_GeoHash(raw_lng, raw_lat, 7) AS geohash_zone_key,
    event_time
FROM raw_proximity_stream;

-- Secure routing of spatial metadata based on account state properties
CREATE TABLE premium_proximity_sink (
    user_id VARCHAR,
    geohash_zone_key VARCHAR,
    event_time TIMESTAMP(3)
) WITH ( 'connector' = 'kafka', 'topic' = 'proximity-updates-premium', 'format' = 'json' );

CREATE TABLE elite_proximity_sink (
    user_id VARCHAR,
    geohash_zone_key VARCHAR,
    event_time TIMESTAMP(3)
) WITH ( 'connector' = 'kafka', 'topic' = 'proximity-updates-elite', 'format' = 'json' );

INSERT INTO premium_proximity_sink
SELECT user_id, geohash_zone_key, event_time FROM structured_proximity_view WHERE user_tier = 'PREMIUM';

INSERT INTO elite_proximity_sink
SELECT user_id, geohash_zone_key, event_time FROM structured_proximity_view WHERE user_tier = 'ELITE';
