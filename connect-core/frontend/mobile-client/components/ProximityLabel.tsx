import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  /** Server-computed relative string only — never raw coordinates */
  relativeDistance: string;
};

/**
 * Displays obscured proximity (e.g. "Less than 5 kilometers away").
 * Clients must never render lat/lng from the API.
 */
export function ProximityLabel({ relativeDistance }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{relativeDistance || "Location masked"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 4,
  },
  label: {
    fontSize: 13,
    color: "#4B5563",
  },
});
