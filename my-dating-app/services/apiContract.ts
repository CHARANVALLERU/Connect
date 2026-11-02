// API Contract Interfaces
// This file defines the TypeScript interfaces for all data models used in the app.
// These interfaces are designed to work with both mock engine and production backend.

export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  bio: string;
  avatar: string;
  tier: 'Basic' | 'Elite';
  interests: string[];
  location: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  };
  preferences: {
    minAge: number;
    maxAge: number;
    radius: number;
    lookingFor: string[];
  };
  badges: Badge[];
  stats: UserStats;
  createdAt: string;
  lastActive: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  earnedAt: string;
}

export interface UserStats {
  matches: number;
  messages: number;
  profileViews: number;
  posts: number;
  compatibilityScore: number;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  media: MediaItem[];
  type: 'text' | 'image' | 'video';
  likes: number;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  location?: {
    lat: number;
    lng: number;
    city?: string;
  };
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
  duration?: number;
}

export interface Comment {
  id: string;
  userId: string;
  postId: string;
  content: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  replies?: Reply[];
}

export interface Reply {
  id: string;
  userId: string;
  commentId: string;
  content: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
}

export interface Match {
  id: string;
  userId: string;
  matchedUserId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  matchedAt: string;
  lastMessage?: string;
  lastMessageTime?: string;
  user: Partial<User>;
  matchedUser: Partial<User>;
  messages?: Message[];
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'system';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  media?: MediaItem[];
  isEliteMessage?: boolean; // For Elite-specific features
}

export interface Notification {
  id: string;
  userId: string;
  type: 'match' | 'message' | 'like' | 'upgrade' | 'system';
  title: string;
  content: string;
  data?: any;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface TenantApp {
  id: string;
  name: string;
  description: string;
  logo: string;
  isActive: boolean;
  settings: TenantSettings;
}

export interface TenantSettings {
  enableChat: boolean;
  enableVideoChat: boolean;
  enableEliteFeatures: boolean;
  maxUsers: number;
  customBranding: boolean;
  premiumModules: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
}