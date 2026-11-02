// API Configuration for Backend Engine Integration
export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_API_BASE_URL || 'http://192.168.1.7:5000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const USE_MOCK_ENGINE = process.env.EXPO_PUBLIC_USE_MOCK !== 'false' && process.env.EXPO_USE_MOCK !== 'false';

// Get tenant ID from environment
export const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID || process.env.EXPO_TENANT_ID || 'bbdbca1b-1b75-4b7c-b0ee-dacb5c6bfd4f';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    cursor: string | null;
    hasNextPage: boolean;
    limit: number;
  };
}

// Auth Response Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  tier: 'BASIC' | 'ELITE' | 'VERIFIED';
  role: string;
  isActive: boolean;
  appProfileData: string; // JSON string - parse as needed
  createdAt: string;
  updatedAt?: string;
  lastActive?: string;
}

export interface UserProfile extends User {
  age?: number;
  bio?: string;
  avatar?: string;
  interests?: string[];
  location?: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  };
  preferences?: {
    minAge: number;
    maxAge: number;
    radius: number;
    lookingFor: string[];
  };
  badges?: any[];
  stats?: {
    matches: number;
    messages: number;
    profileViews: number;
    posts: number;
    compatibilityScore: number;
  };
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

// Post/Feed Types
export interface Post {
  id: string;
  content: string;
  type: 'text' | 'image' | 'video';
  media: string[];
  likes: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  tenantId: string;
  user?: {
    id: string;
    name: string;
    tier: string;
    appProfileData: string;
  };
}

// Match Types
export interface Match {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  lastMessage?: string;
  lastMessageTime?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  matchedUserId: string;
  tenantId: string;
  fromUser?: {
    id: string;
    name: string;
    tier: string;
    appProfileData: string;
  };
  matchedUser?: {
    id: string;
    name: string;
    tier: string;
    appProfileData: string;
  };
  messages?: Message[];
}

// Message Types
export interface Message {
  id: string;
  content?: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'SYSTEM';
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  media: string;
  createdAt: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  tenantId: string;
  sender?: {
    id: string;
    name: string;
    tier: string;
  };
}

// Chat Room Types
export interface ChatRoom {
  id: string;
  user: {
    id: string;
    name: string;
    tier: string;
    appProfileData: string;
  };
  status: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}
