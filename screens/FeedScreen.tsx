// Feed Screen
// Instagram-style social feed with mock data

import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTier } from '../context/TierContext';
import { engineAdapter } from '../services/engineAdapter';
import { Post, User } from '../services/apiContract';
import Card from '../components/Card';

export default function FeedScreen() {
  const { getThemeColors, getTypography } = useTheme();
  const { state: tierState } = useTier();
  const colors = getThemeColors();
  const typography = getTypography();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await engineAdapter.getPosts();
      if (response.success) {
        setPosts(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const renderPost = (post: Post) => (
    <Card key={post.id} variant={tierState.isElite ? 'elite' : 'basic'}>
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 rounded-full bg-surface mr-3" />
        <View className="flex-1">
          <Text className={`${typography.body} font-semibold`} style={{ color: colors.text }}>
            {post.userId}
          </Text>
          <Text className={`${typography.caption}`} style={{ color: colors.secondary }}>
            {new Date(post.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
      
      {post.content && (
        <Text className={`${typography.body} mb-3`} style={{ color: colors.text }}>
          {post.content}
        </Text>
      )}
      
      {post.media.length > 0 && (
        <View className="flex-row flex-wrap -mx-1">
          {post.media.slice(0, 3).map((media) => (
            <View key={media.id} className="w-[32%] h-20 mx-1 mb-2 bg-surface rounded-lg" />
          ))}
        </View>
      )}
      
      <View className="flex-row mt-3 items-center">
        <TouchableOpacity className="mr-6">
          <Text className={`${typography.caption}`} style={{ color: colors.secondary }}>
            {post.likes} likes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text className={`${typography.caption}`} style={{ color: colors.secondary }}>
            {post.comments.length} comments
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 py-3 border-b border-border">
        <Text className={`${typography.h2} font-semibold`} style={{ color: colors.text }}>
          Discover
        </Text>
        <Text className={`${typography.caption}`} style={{ color: colors.secondary }}>
          Browse recent updates
        </Text>
      </View>
      
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        className="flex-1"
      >
        {loading && (
          <View className="items-center justify-center py-8">
            <Text className={`${typography.body}`} style={{ color: colors.secondary }}>
              Loading posts...
            </Text>
          </View>
        )}
        
        {!loading && posts.length === 0 && (
          <View className="items-center justify-center py-8">
            <Text className={`${typography.body}`} style={{ color: colors.secondary }}>
              No posts found
            </Text>
          </View>
        )}
        
        {posts.map(renderPost)}
      </ScrollView>
      
      {tierState.isElite && (
        <TouchableOpacity className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center">
          <Text className="text-white text-2xl">+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
