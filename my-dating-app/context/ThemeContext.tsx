// Theme Context
// Manages the dual-state UI theme (Basic vs Elite) with dynamic styling

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { NativeWindStyleSheet } from 'nativewind';

// Define theme tokens for Basic and Elite tiers
const basicTheme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#1A1A1A',
    primary: '#4A90E2',
    secondary: '#6C757D',
    accent: '#E9ECEF',
    border: '#DEE2E6',
    card: '#FFFFFF',
    gold: '#FFD700',
    platinum: '#E5E4E2'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  typography: {
    h1: 'font-bold text-32',
    h2: 'font-semibold text-24',
    h3: 'font-medium text-20',
    body: 'text-16',
    caption: 'text-12 text-gray-600'
  },
  shadows: {
    small: 'shadow-sm',
    medium: 'shadow-md',
    large: 'shadow-lg'
  }
};

const eliteTheme = {
  colors: {
    background: '#0A0A0A', // Deep obsidian
    surface: '#1A1A1A', // Charcoal
    text: '#E5E5E5', // Platinum/white
    primary: '#D4AF37', // Gold accent
    secondary: '#404040',
    accent: '#2D2D2D',
    border: '#404040',
    card: '#1F1F1F',
    gold: '#FFD700',
    platinum: '#E5E4E2'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  typography: {
    h1: 'font-bold text-32 text-gold',
    h2: 'font-semibold text-24 text-platinum',
    h3: 'font-medium text-20 text-gray-300',
    body: 'text-16 text-gray-300',
    caption: 'text-12 text-gray-500'
  },
  shadows: {
    small: 'shadow-sm',
    medium: 'shadow-md',
    large: 'shadow-lg'
  }
};

interface ThemeState {
  currentTheme: 'basic' | 'elite';
  isElite: boolean;
  transition: boolean;
}

interface ThemeAction {
  type: 'TOGGLE_THEME' | 'SET_THEME' | 'START_TRANSITION' | 'END_TRANSITION';
  payload?: 'basic' | 'elite';
}

const initialThemeState: ThemeState = {
  currentTheme: 'basic',
  isElite: false,
  transition: false,
};

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'TOGGLE_THEME':
      const newTheme = state.currentTheme === 'basic' ? 'elite' : 'basic';
      return {
        ...state,
        currentTheme: newTheme,
        isElite: newTheme === 'elite',
        transition: true,
      };
    case 'SET_THEME':
      return {
        ...state,
        currentTheme: action.payload || 'basic',
        isElite: action.payload === 'elite',
        transition: false,
      };
    case 'START_TRANSITION':
      return { ...state, transition: true };
    case 'END_TRANSITION':
      return { ...state, transition: false };
    default:
      return state;
  }
}

const ThemeContext = createContext<{ state: ThemeState; toggleTheme: () => void; setTheme: (theme: 'basic' | 'elite') => void; getThemeColors: () => typeof basicTheme; getTypography: () => typeof basicTheme.typography } | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(themeReducer, initialThemeState);

  const toggleTheme = useCallback(() => {
    dispatch({ type: 'TOGGLE_THEME' });
    // Animate theme transition
    setTimeout(() => dispatch({ type: 'END_TRANSITION' }), 300);
  }, []);

  const setTheme = useCallback((theme: 'basic' | 'elite') => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, []);

  const getThemeColors = useCallback(() => {
    return state.currentTheme === 'elite' ? eliteTheme.colors : basicTheme.colors;
  }, [state.currentTheme]);

  const getTypography = useCallback(() => {
    return state.currentTheme === 'elite' ? eliteTheme.typography : basicTheme.typography;
  }, [state.currentTheme]);

  // Apply dynamic NativeWind styles based on theme
  useEffect(() => {
    NativeWindStyleSheet.setStyleSheetId(state.currentTheme);
  }, [state.currentTheme]);

  return (
    <ThemeContext.Provider value={{ state, toggleTheme, setTheme, getThemeColors, getTypography }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export selectors for convenience
export const selectTheme = (state: ThemeState) => state.currentTheme;
export const selectIsElite = (state: ThemeState) => state.isElite;
export const selectThemeColors = (state: ThemeState) => {
  return state.currentTheme === 'elite' ? eliteTheme.colors : basicTheme.colors;
};