import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTier } from '../context/TierContext';

/**
 * Status bar that follows Premium (dark icons on cream) vs Elite (light icons on obsidian).
 * Must render inside TierProvider.
 */
export function ConnectStatusBar() {
  const { state } = useTier();
  const isElite = state.isElite;
  const style = isElite ? 'light' : 'dark';

  return <StatusBar style={style} />;
}
