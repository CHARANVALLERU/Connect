// Main Application Entry - Connect
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { TierProvider, useTier } from './context/TierContext';
import { ConnectStatusBar } from './components/ConnectStatusBar';
import { elite, premium } from './theme/tokens';
import AppNavigator from './navigation/AppNavigator';

function AppChrome({ children }: { children: React.ReactNode }) {
  const { state } = useTier();
  const bg = state.isElite ? elite.bg : premium.bg;
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top', 'bottom', 'left', 'right']}>
      <ConnectStatusBar />
      {children}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <TierProvider>
            <AppChrome>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </AppChrome>
          </TierProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: premium.bg,
  },
});
