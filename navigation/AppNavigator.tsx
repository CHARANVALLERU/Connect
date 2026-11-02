import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HingeNavigator from './HingeNavigator';
import FeedScreen from '../screens/FeedScreen';
import EliteDirectoryScreen from '../screens/EliteDirectoryScreen';
import ChatHubScreen from '../screens/ChatHubScreen';
import ProfileStudioScreen from '../screens/ProfileStudioScreen';

const Stack = createNativeStackNavigator();

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
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="HingeMain" component={HingeNavigator} />
          <Stack.Screen name="Feed" component={FeedScreen} />
          <Stack.Screen name="EliteDirectory" component={EliteDirectoryScreen} />
          <Stack.Screen name="ChatHub" component={ChatHubScreen} />
          <Stack.Screen name="ProfileStudio" component={ProfileStudioScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const LoadingScreen: React.FC = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
      <Text style={{ fontSize: 64 }}>💕</Text>
      <Text style={{ fontSize: 42, fontWeight: '300', letterSpacing: 2, marginTop: 16, color: '#000000' }}>hinge</Text>
    </View>
  );
};
