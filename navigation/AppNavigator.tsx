import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTier } from '../context/TierContext';
import { paletteFor } from '../theme/tokens';
import LoginScreen from '../screens/LoginScreen';
import ConnectNavigator from './ConnectNavigator';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  const { state } = useTier();
  const c = paletteFor(state.isElite);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg }}>
      <Text style={{ fontSize: 28, fontWeight: '800', letterSpacing: 6, color: c.accent }}>
        CONNECT
      </Text>
      <ActivityIndicator style={{ marginTop: 20 }} color={c.accent} />
    </View>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={LoadingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={ConnectNavigator} />
      )}
    </Stack.Navigator>
  );
}
