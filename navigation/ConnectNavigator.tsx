import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DatingScreen from '../screens/connect/DatingScreen';
import CommunityScreen from '../screens/connect/CommunityScreen';
import ChatListScreen from '../screens/connect/ChatListScreen';
import ChatThreadScreen from '../screens/connect/ChatThreadScreen';
import ExploreScreen from '../screens/connect/ExploreScreen';
import { useTier } from '../context/TierContext';
import { paletteFor } from '../theme/tokens';
import { CHAT_THREADS } from '../data/connectFeed';

const Tab = createBottomTabNavigator();
const ChatStack = createNativeStackNavigator();

function ChatStackNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatList" component={ChatListScreen} />
      <ChatStack.Screen name="ChatThread" component={ChatThreadScreen} />
    </ChatStack.Navigator>
  );
}

function TabIcon({
  label,
  focused,
  color,
  isElite,
}: {
  label: string;
  focused: boolean;
  color: string;
  isElite: boolean;
}) {
  const scale = useRef(new Animated.Value(focused ? 1.08 : 1)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.12 : 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  const glyphs: Record<string, string> = {
    Dating: '♡',
    Community: '#',
    Chat: '◈',
    Explore: '◎',
  };

  return (
    <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
      {focused && isElite ? <View style={styles.eliteGlow} /> : null}
      <Text style={[styles.icon, { color, opacity: focused ? 1 : 0.65 }]}>{glyphs[label]}</Text>
    </Animated.View>
  );
}

export default function ConnectNavigator() {
  const { state } = useTier();
  const c = paletteFor(state.isElite);
  const unread = CHAT_THREADS.reduce((n, t) => n + (t.locked ? 0 : t.unread), 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: state.isElite ? c.accentSoft : c.border,
          borderTopWidth: state.isElite ? 1.5 : StyleSheet.hairlineWidth,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
          elevation: state.isElite ? 12 : 4,
          shadowColor: state.isElite ? c.accent : '#000',
          shadowOpacity: state.isElite ? 0.22 : 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.tabInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
        tabBarIcon: ({ focused, color }) => (
          <TabIcon label={route.name} focused={focused} color={color} isElite={state.isElite} />
        ),
      })}
    >
      <Tab.Screen name="Dating" component={DatingScreen} options={{ title: 'Dating' }} />
      <Tab.Screen name="Community" component={CommunityScreen} options={{ title: 'Community' }} />
      <Tab.Screen
        name="Chat"
        component={ChatStackNavigator}
        options={{
          title: 'Chat',
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: c.accent,
            color: state.isElite ? '#0B0B0C' : '#fff',
            fontSize: 10,
            fontWeight: '800',
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
        }}
      />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: 'Explore' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 28, height: 24 },
  icon: { fontSize: 18, fontWeight: '700' },
  eliteGlow: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(212,175,55,0.28)',
  },
});
