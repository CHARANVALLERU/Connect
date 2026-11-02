// Universal Card Component
// Adapts styling based on theme tier

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'basic' | 'premium' | 'elite';
  elevation?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Card({ children, style, variant = 'premium', elevation = 'md' }: CardProps) {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();

  const baseStyle = {
    backgroundColor: variant === 'elite' ? colors.card : colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  };

  const elevationStyles = {
    sm: { shadowRadius: 2, padding: 12 },
    md: { shadowRadius: 4, padding: 16 },
    lg: { shadowRadius: 8, padding: 20 }
   };

  const mergedStyle = {
    ...baseStyle,
    ...(elevationStyles[elevation] || elevationStyles.md),
    ...(style || {}),
  };

  return (
    <View style={mergedStyle}>
      {children}
    </View>
  );
}
