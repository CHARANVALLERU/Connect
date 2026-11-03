import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ProximityLabel } from "../components/ProximityLabel";

/**
 * Local discovery — proximity shown as grid-relative strings only.
 */
export function DiscoveryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Discovery</Text>
      <Text style={styles.sub}>
        Matches are ranked by Jev+Agent fusion after GraphRAG pruning.
      </Text>
      <View style={styles.card}>
        <Text style={styles.name}>Sample Premium match</Text>
        <ProximityLabel relativeDistance="Less than 5 kilometers away" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F7F5F0" },
  heading: { fontSize: 24, fontWeight: "700", color: "#0F3D2E", marginBottom: 6 },
  sub: { fontSize: 14, color: "#6B7280", marginBottom: 16 },
  card: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
  },
  name: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 4 },
});
