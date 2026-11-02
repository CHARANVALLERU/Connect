// Profile Studio Screen
// Comprehensive profile management with Elite upgrade portal

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Image, Alert, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTier } from '../context/TierContext';
import { useAuth } from '../context/AuthContext';
import { engineAdapter } from '../services/engineAdapter';
import { User, Post } from '../services/apiContract';
import Card from '../components/Card';

export default function ProfileStudioScreen() {
  const { getThemeColors, getTypography } = useTheme();
  const { state: tierState } = useTier();
  const { state: authState, updateUser } = useAuth();
  const colors = getThemeColors();
  const typography = getTypography();

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const loadProfileData = async () => {
    try {
      const userResponse = await engineAdapter.getCurrentUser();
      const postsResponse = await engineAdapter.getPosts();
      
      if (userResponse.success) {
        setUser(userResponse.data);
        updateUser(userResponse.data);
      }
      if (postsResponse.success) {
        setPosts(postsResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      name: editName || user.name,
      bio: editBio || user.bio,
    };
    
    try {
      // In mock mode, just update locally
      setUser(updatedUser);
      updateUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleUpgradeToElite = () => {
    // Navigate to payment/upgrade flow
    // For demo, just show modal
    setShowUpgradeModal(true);
  };

  const renderProfileHeader = () => (
    <Card variant={tierState.isElite ? 'elite' : 'basic'} elevation="lg">
      <View className="items-center p-6">
        {/* Avatar */}
        <View className="w-24 h-24 rounded-full bg-surface mb-4 overflow-hidden">
          {user?.avatar && (
            <Image
              source={{ uri: user.avatar }}
              className="w-full h-full"
              resizeMode="cover"
            />
          )}
        </View>
        
        {/* Name */}
        <View className="items-center mb-2">
          <Text className={`${typography.h1} font-semibold mb-1`} style={{ color: colors.text }}>
            {user?.name || 'Anonymous'}
          </Text>
          <Text className={`${typography.caption}`} style={{ color: colors.secondary }}>
            @{user?.email?.split('@')[0] || 'user'}
          </Text>
        </View>
        
        {/* Tier Badge */}
        <View className="flex-row items-center mb-4">
          <Text className={`${typography.caption} ${tierState.isElite ? 'text-gold' : 'text-primary'}`}>
            {tierState.currentTier} Member
          </Text>
          {tierState.isElite && (
            <Text className={`${typography.caption} text-gold ml-2`}>(Premium)</Text>
          )}
        </View>
        
        {/* Bio */}
        {isEditing ? (
          <TextInput
            value={editBio}
            onChangeText={setEditBio}
            placeholder="Update your bio..."
            multiline
            className="w-full p-3 border border-border rounded-lg text-body text-text mb-4"
          />
        ) : (
          <Text className={`${typography.body} text-center mb-4`} style={{ color: colors.text }}>
            {user?.bio || 'No bio provided'}
          </Text>
        )}
        
        {/* Stats */}
        <View className="flex-row justify-around w-full mb-4">
          <View className="items-center">
            <Text className={`${typography.h3} font-bold`} style={{ color: colors.primary }}>
              {user?.stats?.matches || 0}
            </Text>
            <Text className={`${typography.caption}`} style={{ color: colors.secondary }}>
              Matches
            </Text>
          </View>
          <View className="items-center">
            <Text className={`${typography.h3} font-bold`} style={{ color: colors.primary }}>
              {user?.stats?.messages || 0}
            </Text>
            <Text className={`${typography.caption}`} style={{ color: colors.secondary }}>
              Messages
            </Text>
          </View>
          <View className="items-center">
            <Text className={`${typography.h3} font-bold`} style={{ color: colors.primary }}>
              {user?.stats?.profileViews || 0}
            </Text>
            <Text className={`${typography.caption}`} style={{ color: colors.secondary }}>
              Views
            </Text>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View className="flex-row w-full">
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            className="flex-1 bg-surface border border-border py-3 rounded-lg mr-2"
          >
            <Text className={`${typography.body} text-center`} style={{ color: colors.text }}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={!isEditing}
            className="flex-1 bg-primary py-3 rounded-lg"
          >
            <Text className="text-white text-center font-semibold">Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const renderUpgradeModal = () => (
    <View className="absolute inset-0 bg-black/50 items-center justify-center p-4 z-10">
      <Card variant="elite" elevation="lg" className="w-full max-w-md">
        <View className="p-6">
          <Text className={`${typography.h2} text-center mb-4 text-gold`}>
            Upgrade to Elite
          </Text>
          <Text className={`${typography.body} text-center mb-6 text-gray-300`}>
            Unlock exclusive features and premium experience
          </Text>
          
          <View className="space-y-3 mb-6">
            <View className="flex-row items-center">
              <Text className="text-gold text-lg mr-2">✓</Text>
              <Text className={`${typography.body} text-gray-300`}>Elite Directory Access</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gold text-lg mr-2">✓</Text>
              <Text className={`${typography.body} text-gray-300`}>Priority Matching</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gold text-lg mr-2">✓</Text>
              <Text className={`${typography.body} text-gray-300`}>Advanced Analytics</Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => {
              // Navigate to payment screen
              Alert.alert('Upgrade Successful', 'You now have Elite access!', [
                { text: 'OK', onPress: () => setShowUpgradeModal(false) }
              ]);
              // Update tier state
              // setTier('Elite');
            }}
            className="bg-gold py-4 rounded-lg items-center"
          >
            <Text className="text-white font-semibold">Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );

  const renderRecentPosts = () => (
    <View className="mt-4">
      <Text className={`${typography.h3} font-semibold mb-3`} style={{ color: colors.text }}>
        Recent Posts
      </Text>
      {posts.slice(0, 3).map(post => (
        <Card key={post.id} variant={tierState.isElite ? 'elite' : 'basic'} elevation="sm" className="mb-3">
          <Text className={`${typography.body} mb-2`} style={{ color: colors.text }}>
            {post.content}
          </Text>
          {post.media.length > 0 && (
            <Text className={`${typography.caption} text-secondary`}>📷 {post.media.length} photos</Text>
          )}
        </Card>
      ))}
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 py-3">
        {renderProfileHeader()}
        {renderRecentPosts()}
      </View>
      
      {!tierState.isElite && (
        <View className="px-4 py-4">
          <Card variant="elite" elevation="md" className="items-center">
            <Text className={`${typography.body} text-center mb-3 text-gray-300`}>
              Unlock Elite features to enhance your experience
            </Text>
            <TouchableOpacity
              onPress={handleUpgradeToElite}
              className="bg-gold px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Upgrade to Elite</Text>
            </TouchableOpacity>
          </Card>
        </View>
      )}
      
      {showUpgradeModal && renderUpgradeModal()}
    </ScrollView>
  );
}
