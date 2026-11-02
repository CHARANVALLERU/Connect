// Main Application Entry - Hinge UI Clone with Backend Integration
// Entry point that renders the app with all providers

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View, Text, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { TierProvider } from './context/TierContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  // Set status bar for Hinge-like appearance
  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      (StatusBar as any).setBackgroundColor?.('#ffffff');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <TierProvider>
            <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
              <StatusBar barStyle="dark-content" />
              <AppNavigator />
            </SafeAreaView>
          </TierProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
