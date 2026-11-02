import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCurrentUser } from '../../hooks/useUser';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';

const HingeProfileScreen: React.FC = () => {
  const { user: authUser, logout } = useAuth();
  const { user, isLoading, refresh, updateProfile } = useCurrentUser();
  const [isElite, setIsElite] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showFullProfile, setShowFullProfile] = useState(false);

  // Initialize elite status
  useEffect(() => {
    if (authUser?.tier === 'ELITE' || authUser?.tier === 'VERIFIED') {
      setIsElite(true);
    }
  }, [authUser]);

  // Connect to socket when component mounts
  useEffect(() => {
    const connectSocket = async () => {
      try {
        await socketService.connect();
      } catch (error) {
        console.error('Socket connection failed:', error);
      }
    };
    connectSocket();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Feature Coming Soon', 'Account deletion will be available in a future update.');
          },
        },
      ]
    );
  };

  const handleEditProfile = async () => {
    try {
      Alert.prompt(
        'Edit Bio',
        'Update your bio:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: async (bio) => {
              if (bio && user) {
                await updateProfile({ ...user, appProfileData: JSON.stringify({ ...parseProfileData(user.appProfileData), bio }) });
                Alert.alert('Success', 'Profile updated!');
              }
            },
          },
        ],
        'plain-text',
        user ? parseProfileData(user.appProfileData).bio : ''
      );
    } catch (error) {
      console.error('Edit profile error:', error);
    }
  };

  const handleUpgradeToElite = () => {
    Alert.alert(
      'Upgrade to HingeX',
      'Get unlimited likes, see who liked you, and more!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => Alert.alert('Coming Soon', 'Premium features will be available soon!') },
      ]
    );
  };

  const profileData = user ? parseProfileData(user.appProfileData) : {};

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Photo */}
      <View style={styles.photoSection}>
        <Image
          source={{ uri: profileData.avatar || 'https://via.placeholder.com/400x300?text=No+Photo' }}
          style={styles.mainPhoto}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.addPhotoButton}>
          <Text style={styles.addPhotoText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Basic Info */}
      <View style={styles.infoSection}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{user?.name}, {profileData.age || '?'}</Text>
          {isElite && <Text style={styles.eliteBadge}>ELITE</Text>}
        </View>
        
        {profileData.job && (
          <Text style={styles.detail}>{profileData.job}{profileData.company ? ` • ${profileData.company}` : ''}</Text>
        )}
        
        {profileData.education && (
          <Text style={styles.detail}>{profileData.education}</Text>
        )}
        
        {profileData.location?.city && (
          <Text style={styles.distance}>{profileData.location.city}</Text>
        )}
        
        {profileData.bio && (
          <Text style={styles.bio}>{profileData.bio}</Text>
        )}
      </View>

      {/* Prompts Section */}
      <View style={styles.promptsSection}>
        <Text style={styles.sectionTitle}>Prompts</Text>
        <TouchableOpacity onPress={handleEditProfile}>
          <View style={styles.promptCard}>
            <Text style={styles.promptQuestion}>Together we could</Text>
            <Text style={styles.promptAnswer}>
              {profileData.intent || 'Build something meaningful together'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleEditProfile}>
          <View style={styles.promptCard}>
            <Text style={styles.promptQuestion}>My simple pleasure</Text>
            <Text style={styles.promptAnswer}>
              {profileData.hobbies?.[0] || 'Morning coffee ☕'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleEditProfile}>
          <View style={styles.promptCard}>
            <Text style={styles.promptQuestion}>I won't shut up about</Text>
            <Text style={styles.promptAnswer}>
              {profileData.interests?.[0] || 'My travels 🌍'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Settings Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.settingRow} onPress={() => setNotificationsEnabled(!notificationsEnabled)}>
          <Text style={styles.settingIcon}>🔔</Text>
          <Text style={styles.settingTitle}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#e0e0e0', true: '#ff6b6b' }}
            thumbColor="#ffffff"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingIcon}>🎯</Text>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Discovery Preferences</Text>
            <Text style={styles.settingValue}>
              Age {profileData.preferences?.minAge || 21}-{profileData.preferences?.maxAge || 40} • {(profileData.preferences?.radius || 25).toString()} mi
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingIcon}>📍</Text>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Location</Text>
            <Text style={styles.settingValue}>{profileData.location?.city || 'New York, NY'}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingIcon}>🔒</Text>
          <Text style={styles.settingTitle}>Privacy & Security</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {!isElite && (
          <TouchableOpacity style={styles.settingRow} onPress={handleUpgradeToElite}>
            <Text style={styles.settingIcon}>💎</Text>
            <Text style={[styles.settingTitle, styles.eliteTitle]}>HingeX Premium</Text>
            <Text style={styles.settingValue}>Upgrade</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Account Actions */}
      <View style={styles.accountSection}>
        <TouchableOpacity style={styles.accountButton} onPress={handleLogout}>
          <Text style={styles.accountButtonText}>Log Out</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.accountButton} onPress={handleDeleteAccount}>
          <Text style={[styles.accountButtonText, styles.deleteText]}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

// Helper to parse profile data
function parseProfileData(profileData: string): any {
  try {
    return JSON.parse(profileData);
  } catch {
    return {};
  }
}

export default HingeProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  editButton: {
    padding: 10,
  },
  editText: {
    fontSize: 16,
    color: '#007aff',
    fontWeight: '500',
  },
  photoSection: {
    position: 'relative',
    marginHorizontal: 20,
    marginTop: 20,
  },
  mainPhoto: {
    width: '100%',
    height: 250,
    borderRadius: 16,
  },
  addPhotoButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '300',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  eliteBadge: {
    marginLeft: 10,
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  eliteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  detail: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  distance: {
    fontSize: 16,
    color: '#999999',
    marginTop: 4,
  },
  bio: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
    marginTop: 12,
  },
  promptsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  promptCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
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
  settingsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  eliteTitle: {
    color: '#ff6b6b',
  },
  settingValue: {
    fontSize: 14,
    color: '#999999',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: '#cccccc',
    marginLeft: 8,
  },
  accountSection: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
  },
  accountButton: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  accountButtonText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  deleteText: {
    color: '#ff3b30',
  },
  bottomPadding: {
    height: 40,
  },
});
