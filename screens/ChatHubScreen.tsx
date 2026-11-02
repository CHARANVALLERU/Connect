// Chat Hub Screen
// Real-time chat interface with mock responses

import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTier } from '../context/TierContext';
import { useRoute } from '@react-navigation/native';
import { engineAdapter } from '../services/engineAdapter';
import { Message, Match } from '../services/apiContract';
import MessageBubble from '../components/MessageBubble';
import Card from '../components/Card';

export default function ChatHubScreen() {
  const route = useRoute();
  const matchId = (route.params as any)?.matchId || 'match_123';
  const { getThemeColors, getTypography } = useTheme();
  const { state: tierState } = useTier();
  const colors = getThemeColors();
  const typography = getTypography();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const [simulateTyping, setSimulateTyping] = useState(false);

  const loadMatchAndMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const matchResponse = await engineAdapter.getMatches();
      const foundMatch = matchResponse.success 
        ? matchResponse.data.data.find(m => m.id === matchId)
        : null;
      
      const messagesResponse = await engineAdapter.getMessages(matchId);
      
      setMatch(foundMatch || null);
      setMessages(messagesResponse.success ? messagesResponse.data.data : []);
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setIsLoading(false);
    }
    
    // Simulate opponent typing after delay
    setSimulateTyping(true);
    setTimeout(() => setSimulateTyping(false), 2000);
  }, [matchId]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !matchId) return;
    
    setInputText('');
    
    // Add local message immediately
    const newMessage: Message = {
      id: 'msg_' + Date.now(),
      matchId,
      senderId: 'user_123',
      receiverId: match?.matchedUserId || 'user_456',
      content: inputText.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
      status: 'sent',
      isEliteMessage: tierState.isElite,
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Simulate network delay
    setTimeout(async () => {
      try {
        const response = await engineAdapter.sendMessage(matchId, inputText.trim());
        if (response.success) {
          // Update with actual response
          setMessages(prev => prev.map(m => 
            m.id === newMessage.id ? { ...m, ...response.data } : m
          ));
          
          // Simulate opponent reply after random delay
          if (Math.random() > 0.3) {
            setTimeout(() => {
              const replyMessage: Message = {
                id: 'msg_reply_' + Date.now(),
                matchId,
                senderId: match?.matchedUserId || 'user_456',
                receiverId: 'user_123',
                content: generateReply(inputText),
                type: 'text',
                timestamp: new Date().toISOString(),
                status: 'sent',
                isEliteMessage: false,
              };
              setMessages(prev => [...prev, replyMessage]);
            }, Math.random() * 3000 + 1000);
          }
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }, 800);
  }, [inputText, matchId, match, tierState.isElite]);

  const generateReply = (message: string): string => {
    const replies = [
      "That's interesting! Tell me more about it.",
      "I completely agree with that perspective.",
      "That sounds like a great experience!",
      "I'd love to hear more about your thoughts on that.",
      "That's a fascinating point of view.",
      "I can see why you feel that way.",
      "That sounds like an amazing idea!",
      "I appreciate you sharing that with me."
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  };

  useEffect(() => {
    loadMatchAndMessages();
  }, [loadMatchAndMessages]);

  const renderTypingIndicator = () => (
    <View className="bg-surface rounded-lg p-3 mb-2" style={{ alignSelf: 'flex-start' }}>
      <Text className={`${typography.caption} text-secondary`}>Partner is typing...</Text>
    </View>
  );

  const renderMatchHeader = () => (
    <Card variant={tierState.isElite ? 'elite' : 'basic'} elevation="sm">
      <View className="flex-row items-center">
        <View className="w-12 h-12 rounded-full bg-surface mr-4" />
        <View className="flex-1">
          <Text className={`${typography.h3} font-semibold`} style={{ color: colors.text }}>
            {match?.matchedUser?.name || 'Match'}
          </Text>
          <Text className={`${typography.caption}`} style={{ color: colors.secondary }}>
            {match?.matchedUser?.bio || 'Connected through shared interests'}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-3 border-b border-border">
          <Text className={`${typography.h2} font-semibold`} style={{ color: colors.text }}>
            Chat
          </Text>
        </View>
        
        {/* Match Info */}
        {match && renderMatchHeader()}
        
        {/* Messages List */}
        <ScrollView
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {isLoading && (
            <View className="items-center justify-center py-8">
              <Text className={`${typography.body}`} style={{ color: colors.secondary }}>
                Loading conversation...
              </Text>
            </View>
          )}
          
          {!isLoading && messages.length === 0 && (
            <View className="items-center justify-center py-8">
              <Text className={`${typography.body}`} style={{ color: colors.secondary }}>
                No messages yet
              </Text>
            </View>
          )}
          
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMe={msg.senderId === 'user_123'}
              showTimestamp={index === 0 || msg.senderId !== messages[index - 1]?.senderId}
            />
          ))}
          
          {simulateTyping && renderTypingIndicator()}
        </ScrollView>
        
        {/* Input Area */}
        <View className="px-4 pb-4">
          <View className="bg-surface rounded-lg p-2 border border-border">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={colors.secondary}
              className="px-3 py-2 text-body text-text"
              multiline
              maxLength={500}
            />
          </View>
          <View className="flex-row justify-between mt-2">
            <Text className={`${typography.caption}`} style={{ color: colors.secondary }}>
              {inputText.length}/500
            </Text>
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
              className={`px-4 py-2 rounded-lg ${!inputText.trim() ? 'bg-secondary' : 'bg-primary'}`}
            >
              <Text className="text-white text-sm font-semibold">Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
