import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

const OPEN_BOARDS = [
  { slug: "c/developers", title: "Developers" },
  { slug: "c/gamers", title: "Gamers" },
  { slug: "c/businessmen", title: "Businessmen" },
  { slug: "c/travellers", title: "Travellers" },
  { slug: "c/conspiracies", title: "Conspiracies" },
];

export function CommunitiesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Niche boards</Text>
      <Text style={styles.sub}>
        Elite-only boards never appear in Premium feeds — filtered at the gateway.
      </Text>
      <FlatList
        data={OPEN_BOARDS}
        keyExtractor={(item) => item.slug}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.slug}>{item.slug}</Text>
            <Text style={styles.title}>{item.title}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F7F5F0" },
  heading: { fontSize: 24, fontWeight: "700", color: "#0F3D2E", marginBottom: 6 },
  sub: { fontSize: 14, color: "#6B7280", marginBottom: 16 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#D1D5DB" },
  slug: { fontSize: 12, color: "#9CA3AF" },
  title: { fontSize: 17, color: "#111827", marginTop: 2 },
});
