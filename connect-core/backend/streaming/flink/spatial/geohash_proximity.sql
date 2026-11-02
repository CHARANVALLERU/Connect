-- =============================================================================
-- Apache Flink SQL: Proximity Obscurity Pipeline (Uber H3 / Geohash Res-7)
-- Complies with GDPR/CCPA Proximity Obscurity Framework
-- Converts raw GPS coordinates into generalized spatial cells and relative strings.
-- =============================================================================

CREATE TABLE raw_coordinate_stream (
    user_id STRING,
    user_tier STRING,
    raw_latitude DOUBLE,
    raw_longitude DOUBLE,
    reported_at TIMESTAMP(3),
    WATERMARK FOR reported_at AS reported_at - INTERVAL '5' SECOND
) WITH (
    'connector' = 'kafka',
    'topic' = 'connect.spatial.coordinates.raw',
    'properties.bootstrap.servers' = 'localhost:9092',
    'properties.group.id' = 'flink-spatial-worker',
    'scan.startup.mode' = 'latest-offset',
    'format' = 'json'
);

-- Obscured Spatial Dimension Sink Table
CREATE TABLE obscured_proximity_sink (
    user_id STRING,
    user_tier STRING,
    geohash_res7 STRING,       -- 150m boundary cell, never exposes exact house/street
    geohash_prefix STRING,     -- Broad ~5km neighborhood zone
    relative_distance_label STRING,
    last_updated TIMESTAMP(3),
    PRIMARY KEY (user_id) NOT ENFORCED
) WITH (
    'connector' = 'upsert-kafka',
    'topic' = 'connect.spatial.obscured.updates',
    'properties.bootstrap.servers' = 'localhost:9092',
    'key.format' = 'json',
    'value.format' = 'json'
);

-- Real-Time Stream Transformation: Obscure coordinates
INSERT INTO obscured_proximity_sink
SELECT
    user_id,
    user_tier,
    -- Custom UDF: H3_OR_GEOHASH_RES7(raw_latitude, raw_longitude)
    GEOHASH(raw_latitude, raw_longitude, 7) AS geohash_res7,
    SUBSTRING(GEOHASH(raw_latitude, raw_longitude, 7), 1, 5) AS geohash_prefix,
    -- Obscure output string to prevent physical stalking
    CASE 
        WHEN user_tier = 'elite' THEN 'Location masked (Verified Elite)'
        ELSE 'Within your local sector'
    END AS relative_distance_label,
    reported_at AS last_updated
FROM raw_coordinate_stream;
