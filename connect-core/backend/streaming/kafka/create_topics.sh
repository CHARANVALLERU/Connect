#!/usr/bin/env bash
set -euo pipefail

KAFKA_CLUSTER="localhost:9092"

echo "Configuring structural messaging topics for Connect platform..."

# Premium Common Topics
kafka-topics.sh --bootstrap-server $KAFKA_CLUSTER --create --topic user-behavior-premium --partitions 8 --replication-factor 3 --config cleanup.policy=compact
kafka-topics.sh --bootstrap-server $KAFKA_CLUSTER --create --topic proximity-updates-premium --partitions 16 --replication-factor 3

# Elite Isolated Topics
kafka-topics.sh --bootstrap-server $KAFKA_CLUSTER --create --topic user-behavior-elite --partitions 4 --replication-factor 3 --config cleanup.policy=compact --config min.insync.replicas=2
kafka-topics.sh --bootstrap-server $KAFKA_CLUSTER --create --topic proximity-updates-elite --partitions 4 --replication-factor 3 --config min.insync.replicas=2

# Access Control Lists (ACLs) - Hard Network Boundaries
kafka-acls.sh --bootstrap-server $KAFKA_CLUSTER --add --allow-principal User:PremiumConsumer --operation Read --topic user-behavior-premium
kafka-acls.sh --bootstrap-server $KAFKA_CLUSTER --add --allow-principal User:EliteConsumer --operation All --topic user-behavior-elite
