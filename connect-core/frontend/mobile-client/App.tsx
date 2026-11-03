import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootTabs } from "./navigation/RootTabs";

/**
 * Connect mobile shell — privilege-gated tabs for Communities, DMs, Discovery.
 * Tier header (x-connect-tier) is attached by api client at call time.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootTabs />
        <StatusBar style="dark" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
