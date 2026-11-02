import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFeed, usePost } from '../hooks/useFeed';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';

const { width, height } = Dimensions.get('window');

// Helper to parse profile data
function parseProfileData(profileData: string): any {
  try {
    return JSON.parse(profileData);
  } catch {
    return {};
  }
}

interface PostCardProps {
  post: any;
  onLike: () => void;
  onComment: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment }) => {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const profileData = parseProfileData(post.user?.appProfileData || '{}');
  
  return (
    <View style={styles.card}>
      {/* Photo Carousel */}
      <View style={styles.photoContainer}>
        <Image
          source={{ 
            uri: profileData.avatar || 'https://via.placeholder.com/400x500?text=No+Photo' 
          }}
          style={styles.photo}
          resizeMode="cover"
        />
        
        {/* Photo Indicators */}
        {post.media?.length > 1 && (
          <View style={styles.photoIndicators}>
            {post.media.map((_: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.photoIndicator,
                  index === currentPhoto && styles.photoIndicatorActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Photo Navigation */}
        <TouchableOpacity
          style={styles.photoNavLeft}
          onPress={() => setCurrentPhoto(Math.max(0, currentPhoto - 1))}
        >
          <Text style={styles.photoNavText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.photoNavRight}
          onPress={() => setCurrentPhoto(Math.min(post.media?.length - 1 || 0, currentPhoto + 1))}
        >
          <Text style={styles.photoNavText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <View style={styles.nameAgeRow}>
          <Text style={styles.name}>{post.user?.name || 'User'}</Text>
          <Text style={styles.age}>{profileData.age || '?'}</Text>
        </View>
        
        {profileData.job && (
          <Text style={styles.detail}>{profileData.job}</Text>
        )}
        
        {profileData.location?.city && (
          <Text style={styles.distance}>{profileData.location.city}</Text>
        )}
      </View>

      {/* Post Content (Prompt-style) */}
      <View style={styles.contentContainer}>
        <View style={styles.promptCard}>
          <Text style={styles.promptQuestion}>What I'm looking for</Text>
          <Text style={styles.promptAnswer}>{post.content}</Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>Comment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Text style={styles.actionIcon}>♥</Text>
            <Text style={styles.actionLabel}>Like</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const HingeDiscoverScreen: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { items: posts, isLoading, error, refresh, loadMore } = useFeed();
  const { likePost } = usePost();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter out own posts
  const filteredPosts = posts.filter((post: any) => post.userId !== user?.id);

  const handleLike = async (postId: string) => {
    try {
      await likePost(postId);
      Alert.alert('Liked!', 'You liked this profile');
    } catch (err) {
      Alert.alert('Error', 'Failed to like profile');
    }
  };

  const handleComment = (post: any) => {
    Alert.prompt(
      'Add a Comment',
      'Write something nice!',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: async (comment) => {
            if (comment) {
              try {
                await apiService.sendMessage(post.id, comment, 'text');
                Alert.alert('Comment Sent!', 'Your comment was sent');
              } catch (err) {
                Alert.alert('Error', 'Failed to send comment');
              }
            }
          } 
        },
      ],
      'plain-text'
    );
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentIndex < filteredPosts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.warningText}>Please log in to discover profiles</Text>
      </View>
    );
  }

  if (isLoading && posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>Loading profiles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={refresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (filteredPosts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No profiles to discover</Text>
        <Text style={styles.emptySubtext}>Check back later for new matches!</Text>
      </View>
    );
  }

  const currentPost = filteredPosts[currentIndex];
  const remainingPosts = filteredPosts.slice(currentIndex + 1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Current Profile Card */}
      {currentPost && (
        <View style={styles.cardWrapper}>
          <PostCard
            post={currentPost}
            onLike={() => handleLike(currentPost.id)}
            onComment={() => handleComment(currentPost)}
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButtonLarge, styles.passButton]}
          onPress={() => handleSwipe('left')}
          activeOpacity={0.8}
        >
          <Text style={styles.passIcon}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButtonLarge, styles.likeButton]}
          onPress={() => handleSwipe('right')}
          activeOpacity={0.8}
        >
          <Text style={styles.likeIcon}>♥</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButtonLarge, styles.starButton]}
          onPress={() => handleComment(currentPost)}
          activeOpacity={0.8}
        >
          <Text style={styles.starIcon}>⭐</Text>
        </TouchableOpacity>
      </View>

      {/* Show More Button */}
      <TouchableOpacity
        style={styles.showMoreButton}
        onPress={refresh}
      >
        <Text style={styles.showMoreText}>Refresh Profiles</Text>
      </TouchableOpacity>

      {/* Next Card Preview */}
      {remainingPosts.length > 0 && (
        <View style={styles.nextCardPreview}>
          <Image
            source={{ 
              uri: parseProfileData(remainingPosts[0]?.user?.appProfileData || '{}').avatar 
                || 'https://via.placeholder.com/100' 
            }}
            style={styles.nextCardPhoto}
          />
          <Text style={styles.nextCardText}>
            {remainingPosts[0]?.user?.name} • {parseProfileData(remainingPosts[0]?.user?.appProfileData || '{}').age || '?'}
          </Text>
        </View>
      )}
    </View>
  );
};

export default HingeDiscoverScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  menuButton: {
    padding: 10,
  },
  menuIcon: {
    fontSize: 24,
    color: '#000000',
  },
  filterButton: {
    padding: 10,
  },
  filterIcon: {
    fontSize: 24,
    color: '#000000',
  },
  cardWrapper: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  photoContainer: {
    width: '100%',
    height: height * 0.45,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoIndicators: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  photoIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  photoIndicatorActive: {
    backgroundColor: '#ffffff',
    width: 16,
  },
  photoNavLeft: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoNavRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoNavText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '300',
  },
  profileInfo: {
    padding: 16,
  },
  nameAgeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  age: {
    fontSize: 24,
    fontWeight: '400',
    color: '#000000',
    marginLeft: 6,
  },
  detail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  distance: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 0,
  },
  promptCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  promptQuestion: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 6,
    fontWeight: '500',
  },
  promptAnswer: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    gap: 30,
  },
  actionButtonLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  passButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  likeButton: {
    backgroundColor: '#ff6b6b',
  },
  starButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#ffd700',
  },
  passIcon: {
    fontSize: 32,
    color: '#ff6b6b',
    fontWeight: '300',
  },
  likeIcon: {
    fontSize: 32,
    color: '#ffffff',
  },
  starIcon: {
    fontSize: 28,
    color: '#ffd700',
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  showMoreText: {
    fontSize: 14,
    color: '#007aff',
    fontWeight: '600',
  },
  nextCardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  nextCardPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  nextCardText: {
    fontSize: 14,
    color: '#666666',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  warningText: {
    fontSize: 18,
    color: '#ff6b6b',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
