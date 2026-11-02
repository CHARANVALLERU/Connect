-- =============================================================================
-- Apache Flink SQL: Implicit Behavioral Stream Processing
-- Computes rolling 15-minute cognitive metrics and engagement velocity
-- =============================================================================

CREATE TABLE user_behavior_event_stream (
    user_id STRING,
    tier STRING,
    session_id STRING,
    post_length INT,
    vocabulary_richness DOUBLE,
    dwell_time_ms BIGINT,
    event_time TIMESTAMP(3),
    WATERMARK FOR event_time AS event_time - INTERVAL '10' SECOND
) WITH (
    'connector' = 'kafka',
    'topic' = 'connect.telemetry.behavior.raw',
    'properties.bootstrap.servers' = 'localhost:9092',
    'properties.group.id' = 'flink-behavior-aggregator',
    'scan.startup.mode' = 'latest-offset',
    'format' = 'json'
);

CREATE TABLE aggregated_behavior_sink (
    user_id STRING,
    tier STRING,
    window_end TIMESTAMP(3),
    avg_dwell_time_ms DOUBLE,
    total_interactions BIGINT,
    rolling_lexical_diversity DOUBLE,
    interaction_velocity_per_min DOUBLE,
    PRIMARY KEY (user_id) NOT ENFORCED
) WITH (
    'connector' = 'upsert-kafka',
    'topic' = 'connect.behavior.aggregated.snapshots',
    'properties.bootstrap.servers' = 'localhost:9092',
    'key.format' = 'json',
    'value.format' = 'json'
);

-- Continuous 15-Minute Sliding Aggregation Window
INSERT INTO aggregated_behavior_sink
SELECT
    user_id,
    tier,
    TUMBLE_END(event_time, INTERVAL '15' MINUTE) AS window_end,
    AVG(dwell_time_ms) AS avg_dwell_time_ms,
    COUNT(1) AS total_interactions,
    AVG(vocabulary_richness) AS rolling_lexical_diversity,
    CAST(COUNT(1) AS DOUBLE) / 15.0 AS interaction_velocity_per_min
FROM user_behavior_event_stream
GROUP BY
    user_id,
    tier,
    TUMBLE(event_time, INTERVAL '15' MINUTE);
