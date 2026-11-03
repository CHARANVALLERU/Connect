import React from "react";
import { StyleSheet, Text, View } from "react-native";

/**
 * WhatsApp-style 1:1 DM shell.
 * Premium→Elite threads only open when Elite initiates (server-enforced).
 */
export function DirectMessagesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Direct messages</Text>
      <Text style={styles.sub}>
        Approved matches arrive with a context-aware icebreaker from Agent C.
      </Text>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No open threads yet</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F7F5F0" },
  heading: { fontSize: 24, fontWeight: "700", color: "#0F3D2E", marginBottom: 6 },
  sub: { fontSize: 14, color: "#6B7280", marginBottom: 24 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { color: "#9CA3AF", fontSize: 15 },
});
