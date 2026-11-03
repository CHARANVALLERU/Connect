import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CommunitiesScreen } from "../screens/CommunitiesScreen";
import { DirectMessagesScreen } from "../screens/DirectMessagesScreen";
import { DiscoveryScreen } from "../screens/DiscoveryScreen";

export type RootTabParamList = {
  Communities: undefined;
  Messages: undefined;
  Discovery: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * Privilege-gated navigation tabs.
 * Elite-only boards are filtered server-side; Premium never receives Elite routes.
 */
export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#0F3D2E",
        tabBarInactiveTintColor: "#6B7280",
      }}
    >
      <Tab.Screen name="Communities" component={CommunitiesScreen} />
      <Tab.Screen name="Messages" component={DirectMessagesScreen} />
      <Tab.Screen name="Discovery" component={DiscoveryScreen} />
    </Tab.Navigator>
  );
}
