import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HingeDiscoverScreen from '../screens/Hinge/HingeDiscoverScreen';
import HingeProfileScreen from '../screens/Hinge/HingeProfileScreen';
import HingeChatScreen from '../screens/Hinge/HingeChatScreen';

const Stack = createNativeStackNavigator();

export default function HingeNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Discover" component={HingeDiscoverScreen} />
      <Stack.Screen name="Profile" component={HingeProfileScreen} />
      <Stack.Screen name="Chat" component={HingeChatScreen} />
    </Stack.Navigator>
  );
}