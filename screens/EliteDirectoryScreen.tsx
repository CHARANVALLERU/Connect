// Elite Directory Screen
// Exclusive premium directory for Elite tier users

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTier } from '../context/TierContext';
import { useNavigation } from '@react-navigation/native';
import { engineAdapter } from '../services/engineAdapter';
import { User } from '../services/apiContract';
import Card from '../components/Card';

export default function EliteDirectoryScreen() {
  const navigation = useNavigation<any>();
  const { getThemeColors, getTypography } = useTheme();
  const { state: tierState } = useTier();
  const colors = getThemeColors();
  const typography = getTypography();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All Members' },
    { id: 'new', label: 'New Members' },
    { id: 'verified', label: 'Verified' },
    { id: 'elite', label: 'Elite Members' }
   ];

  const loadEliteUsers = async () => {
    setLoading(true);
    try {
      // In mock mode, filter mock users
      const response = await engineAdapter.getUserById('user_456');
      // Add more mock users for demo
      const mockUsers: User[] = [
        {
          id: 'user_456',
          email: 'taylor@example.com',
          name: 'Taylor Smith',
          age: 26,
          bio: 'Graphic designer, dog lover, coffee enthusiast',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          tier: 'Elite',
          primaryNiche: 'creative',
          obscuredDistance: 'Location masked (Verified Elite)',
          cognitiveComplexityLevel: 'High',
          interests: ['Art', 'Coffee', 'Dogs', 'Painting'],
          location: { sector: 'dr5ru', city: 'New York', country: 'USA' },
          preferences: { minAge: 24, maxAge: 32, radius: 15, lookingFor: ['Male'] },
          badges: [
            { id: 'badge_verified', name: 'Verified', description: 'Identity verified', icon: '✅', rarity: 'Epic', earnedAt: '2026-02-15' },
            { id: 'badge_elite', name: 'Elite Member', description: 'Premium access', icon: '⭐', rarity: 'Legendary', earnedAt: '2026-03-01' }
          ],
          stats: { matches: 8, messages: 45, profileViews: 92, posts: 5, compatibilityScore: 78 },
          createdAt: '2026-02-15T10:00:00Z',
          lastActive: new Date().toISOString()
        },
        {
          id: 'user_789',
          email: 'james@example.com',
          name: 'James Chen',
          age: 29,
          bio: 'Tech entrepreneur, adventure seeker, photography enthusiast',
          avatar: 'https://randomuser.me/api/portraits/men/68.jpg',
          tier: 'Elite',
          primaryNiche: 'businessman',
          obscuredDistance: 'Location masked (Verified Elite)',
          cognitiveComplexityLevel: 'High',
          interests: ['Tech', 'Travel', 'Photography', 'Startups'],
          location: { sector: 'dr5ru', city: 'New York', country: 'USA' },
          preferences: { minAge: 24, maxAge: 35, radius: 25, lookingFor: ['Female'] },
          badges: [
            { id: 'badge_elite', name: 'Elite Member', description: 'Premium access', icon: '⭐', rarity: 'Legendary', earnedAt: '2026-01-20' },
            { id: 'badge_photographer', name: 'Pro Photographer', description: 'Professional photography', icon: '📸', rarity: 'Rare', earnedAt: '2026-02-10' }
          ],
          stats: { matches: 15, messages: 112, profileViews: 234, posts: 12, compatibilityScore: 92 },
          createdAt: '2026-01-20T10:00:00Z',
          lastActive: new Date().toISOString()
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to load elite users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (user: User) => {
    navigation.navigate('ProfileStudio', { userId: user.id });
  };

  const renderUserCard = (user: User) => (
    <Card key={user.id} variant="elite" elevation="lg" className="mb-4">
      <TouchableOpacity onPress={() => handleUserPress(user)} className="flex-row items-center">
        <View className="w-16 h-16 rounded-full bg-surface mr-4 overflow-hidden">
          {user.avatar && (
            <Image
              source={{ uri: user.avatar }}
              className="w-full h-full"
              resizeMode="cover"
            />
          )}
        </View>
        
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className={`${typography.body} font-semibold flex-1`} style={{ color: colors.text }}>
              {user.name}
            </Text>
            {user.badges?.find(b => b.id === 'badge_verified') && (
              <Text className="text-gold text-xs font-medium">Verified</Text>
            )}
          </View>
          
          <Text className={`${typography.caption} mb-2`} style={{ color: colors.secondary }}>
            {user.bio}
          </Text>
          
          <View className="flex-row items-center">
            <Text className={`${typography.caption} mr-4`} style={{ color: colors.secondary }}>
              {user.age} years old
            </Text>
            <Text className={`${typography.caption}`} style={{ color: colors.secondary }}>
              {user.location.city}, {user.location.country}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  useEffect(() => {
    if (tierState.isElite) {
      loadEliteUsers();
    }
  }, [tierState.isElite]);

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 py-3 border-b border-border">
        <Text className={`${typography.h2} font-semibold`} style={{ color: colors.text }}>
          Elite Directory
        </Text>
        <Text className={`${typography.caption}`} style={{ color: colors.secondary }}>
          Premium members only
        </Text>
      </View>
      
      {/* Filters */}
      <View className="flex-row px-4 py-3 bg-surface border-b border-border">
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.id}
            onPress={() => setSelectedFilter(filter.id)}
            className={`px-4 py-2 rounded-full mr-2 ${selectedFilter === filter.id 
              ? 'bg-primary' 
              : 'bg-secondary'}`}
          >
            <Text className={`${typography.caption} ${selectedFilter === filter.id 
              ? 'text-white' 
              : 'text-text'}`}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <ScrollView className="flex-1 px-4 py-4">
        {loading && (
          <View className="items-center justify-center py-8">
            <Text className={`${typography.body}`} style={{ color: colors.secondary }}>
              Loading elite members...
            </Text>
          </View>
        )}
        
        {!loading && users.length === 0 && (
          <View className="items-center justify-center py-8">
            <Text className={`${typography.body}`} style={{ color: colors.secondary }}>
              No elite members found
            </Text>
          </View>
        )}
        
        {users.map(renderUserCard)}
      </ScrollView>
    </View>
  );
}
