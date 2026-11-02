// Message Bubble Component
// Displays individual messages with tier-aware styling

import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Message } from '../services/apiContract';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  showTimestamp?: boolean;
  style?: ViewStyle;
}

export default function MessageBubble({ message, isMe, showTimestamp = true, style }: MessageBubbleProps) {
  const { getThemeColors, getTypography } = useTheme();
  const colors = getThemeColors();
  const typography = getTypography();

  const isEliteMessage = message.isEliteMessage || false;
  const containerColor = isMe 
    ? (isEliteMessage ? colors.gold : colors.primary)
    : (isEliteMessage ? colors.surface : colors.card);
  
  const textColor = isMe 
    ? 'white'
    : colors.text;
  
  const borderColor = isMe 
    ? (isEliteMessage ? '#FFD700' : colors.primary)
    : colors.border;

  return (
    <View
      style={[{
        backgroundColor: containerColor,
        borderRadius: 12,
        padding: 12,
        marginVertical: 4,
        maxWidth: '80%',
        borderWidth: isEliteMessage ? 1 : 0,
        borderColor: isEliteMessage ? borderColor : 'transparent',
        alignSelf: isMe ? 'flex-end' : 'flex-start',
      }, style]}
    >
      <Text className={`${typography.body} text-${textColor}`}>
        {message.content}
      </Text>
      {showTimestamp && (
        <Text className={`${typography.caption} text-${textColor} mt-1`} style={{ opacity: 0.8 }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </View>
  );
}
