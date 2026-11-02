// Engine Adapter Service
// This service acts as the abstraction layer between the app and the data sources.
// It switches between mock engine (development/testing) and production backend (real API)
// based on the USE_MOCK_ENGINE flag.

import { API_BASE_URL, USE_MOCK_ENGINE } from '../config/env';
import { 
  User, Post, Message, Match, Notification, AuthResponse, 
  ApiResponse, PaginatedResponse 
} from './apiContract';

/**
 * Configuration for API calls
 */
const API_CONFIG = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Production headers will be added when token is available
    // 'Authorization': `Bearer ${token}`,
    // 'X-Tenant-ID': tenantId
  },
  timeout: 10000
};

/**
 * Helper function to make API calls
 */
const fetchApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  if (USE_MOCK_ENGINE) {
    return mockFetch<T>(endpoint, options);
  }

  // Production fetch implementation
  try {
    const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
      ...API_CONFIG,
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...(options.headers || {}),
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      data: null as unknown as T,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Mock Data Engine
 * Simulates API responses with realistic data for development and testing
 */
const mockFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Route handling based on endpoint
  switch (true) {
    case endpoint.includes('/auth/login'):
      return mockAuthLogin(options);
    case endpoint.includes('/auth/register'):
      return mockAuthRegister(options);
    case endpoint.includes('/users/me'):
      return mockGetCurrentUser();
    case endpoint.includes('/users/'):
      return mockGetUserById(endpoint);
    case endpoint.includes('/posts'):
      return mockGetPosts();
    case endpoint.includes('/messages'):
      return mockGetMessages();
    case endpoint.includes('/matches'):
      return mockGetMatches();
    case endpoint.includes('/notifications'):
      return mockGetNotifications();
    default:
      return { success: true, data: null as unknown as T };
  }
};

// Mock implementation functions
const mockAuthLogin = async (_: RequestInit): Promise<ApiResponse<AuthResponse>> => {
  const mockUser: User = {
    id: 'user_123',
    email: 'test@example.com',
    name: 'Alex Johnson',
    age: 28,
    bio: 'Software engineer who loves hiking and photography. Looking for meaningful connections.',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    tier: Math.random() > 0.5 ? 'Basic' : 'Elite',
    interests: ['Hiking', 'Photography', 'Travel', 'Cooking'],
    location: { lat: 40.7128, lng: -74.0060, city: 'New York', country: 'USA' },
    preferences: { minAge: 25, maxAge: 35, radius: 25, lookingFor: ['Female', 'Non-binary'] },
    badges: [
      { id: 'badge_1', name: 'Early Adopter', description: 'Joined during beta launch', icon: '🏅', rarity: 'Rare', earnedAt: '2026-01-15' },
      { id: 'badge_2', name: 'Conversation Starter', description: 'Sent 50+ messages', icon: '💬', rarity: 'Epic', earnedAt: '2026-03-22' }
    ],
    stats: { matches: 12, messages: 87, profileViews: 156, posts: 8, compatibilityScore: 85 },
    createdAt: '2026-01-15T10:30:00Z',
    lastActive: new Date().toISOString()
  };
  
  return {
    success: true,
    data: {
      user: mockUser,
      token: 'mock_jwt_token_' + Math.random().toString(36).substr(2, 9),
      refreshToken: 'mock_refresh_token_' + Math.random().toString(36).substr(2, 9),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
  };
};

const mockAuthRegister = async (_: RequestInit): Promise<ApiResponse<AuthResponse>> => {
  // Similar to login but for registration
  return mockAuthLogin(_);
};

const mockGetCurrentUser = async (): Promise<ApiResponse<User>> => {
  return {
    success: true,
    data: {
      id: 'user_123',
      email: 'test@example.com',
      name: 'Alex Johnson',
      age: 28,
      bio: 'Software engineer who loves hiking and photography. Looking for meaningful connections.',
      avatar: 'https://runtime.vercel.app/_next/image?url=https%3A%2F%2Frandomuser.me%2Fapi%2Fportraits%2Fmen%2F32.jpg&w=256&q=75',
      tier: 'Elite',
      interests: ['Hiking', 'Photography', 'Travel', 'Cooking'],
      location: { lat: 40.7128, lng: -74.0060, city: 'New York', country: 'USA' },
      preferences: { minAge: 25, maxAge: 35, radius: 25, lookingFor: ['Female', 'Non-binary'] },
      badges: [
        { id: 'badge_1', name: 'Early Adoter', description: 'Joined during beta launch', icon: '🏅', rarity: 'Rare', earnedAt: '2026-01-15' },
        { id: 'badge_2', name: 'Conversation Starter', description: 'Sent 50+ messages', icon: '💬', rarity: 'Epic', earnedAt: '2026-03-22' }
      ],
      stats: { matches: 12, messages: 87, profileViews: 156, posts: 8, compatibilityScore: 85 },
      createdAt: '2026-01-15T10:30:00Z',
      lastActive: new Date().toISOString()
    }
  };
};

const mockGetUserById = async (endpoint: string): Promise<ApiResponse<User>> => {
  // Extract user ID from endpoint like /users/user_456
  const userId = endpoint.split('/').pop();
  return {
    success: true,
    data: {
      id: userId || 'user_456',
      email: 'potential.match@example.com',
      name: 'Taylor Smith',
      age: 26,
      bio: 'Graphic designer and dog lover. Enjoy coffee shops and weekend adventures.',
      avatar: 'https://runtime.vercel.app/_next/image?url=https%3A%2F%2Frandomuser.me%2Fapi%2Fportraits%2Fwomen%2F44.jpg&w=256&q=75',
      tier: Math.random() > 0.7 ? 'Elite' : 'Basic',
      interests: ['Art', 'Coffee', 'Dogs', 'Painting'],
      location: { lat: 40.7589, lng: -73.9851, city: 'New York', country: 'USA' },
      preferences: { minAge: 24, maxAge: 32, radius: 15, lookingFor: ['Male'] },
      badges: [
        { id: 'badge_3', name: 'Pet Lover', description: 'Volunteers at animal shelters', icon: '🐾', rarity: 'Common', earnedAt: '2026-02-10' }
      ],
      stats: { matches: 8, messages: 45, profileViews: 92, posts: 5, compatibilityScore: 78 },
      createdAt: '2026-02-10T14:20:00Z',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  };
};

const mockGetPosts = async (): Promise<ApiResponse<PaginatedResponse<Post>>> => {
  const mockPosts: Post[] = [
    {
      id: 'post_1',
      userId: 'user_456',
      content: 'Just finished a amazing hike in the Catskills! The fall colors are incredible this year. Anyone else love autumn hiking? 🍂',
      media: [
        { id: 'media_1', url: 'https://images.unsplash.com/photo-1506905925346-21cda4d32841?w=500', type: 'image' },
        { id: 'media_2', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500', type: 'image' }
      ],
      type: 'image',
      likes: 42,
      comments: [],
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      location: { lat: 42.0, lng: -74.0, city: 'Catskills' }
    },
    {
      id: 'post_2',
      userId: 'user_789',
      content: 'Trying out a new recipe for homemade pasta tonight. Cooking is my therapy! What\'s your favorite comfort food?',
      media: [],
      type: 'text',
      likes: 28,
      comments: [],
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  return {
    success: true,
    data: {
      data: mockPosts,
      pagination: {
        page: 1,
        limit: 10,
        total: mockPosts.length,
        totalPages: 1
      }
      
    }
  };
};

const mockGetMessages = async (): Promise<ApiResponse<PaginatedResponse<Message>>> => {
  const mockMessages: Message[] = [
    {
      id: 'msg_1',
      matchId: 'match_123',
      senderId: 'user_123',
      receiverId: 'user_456',
      content: 'Hey! I saw your post about hiking in the Catskills. That looks amazing! Have you been to Bear Mountain?',
      type: 'text',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      status: 'read'
    },
    {
      id: 'msg_2',
      matchId: 'match_123',
      senderId: 'user_456',
      receiverId: 'user_123',
      content: 'Thanks! Yes, Bear Mountain is great too. I\'m actually planning to go there next weekend. Would you like to join?',
      type: 'text',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: 'sent'
    }
  ];
  
  return {
    success: true,
    data: {
      data: mockMessages,
      pagination: {
        page: 1,
        limit: 20,
        total: mockMessages.length,
        totalPages: 1
      }
    }
  };
};

const mockGetMatches = async (): Promise<ApiResponse<PaginatedResponse<Match>>> => {
  const mockMatches: Match[] = [
    {
      id: 'match_123',
      userId: 'user_123',
      matchedUserId: 'user_456',
      status: 'accepted',
      matchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      lastMessage: 'Would you like to join?',
      lastMessageTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      user: {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Alex Johnson',
        avatar: 'https://runtime.vercel.app/_next/image?url=https%3A%2F%2Frandomuser.me%2Fapi%2Fportraits%2Fmen%2F32.jpg&w=256&q=75'
      },
      matchedUser: {
        id: 'user_456',
        email: 'potential.match@example.com',
        name: 'Taylor Smith',
        avatar: 'https://runtime.vercel.app/_next/image?url=https%3A%2F%2Frandomuser.me%2Fapi%2Fportraits%2Fwomen%2F44.jpg&w=256&q=75'
      },
      messages: [
        {
          id: 'msg_1',
          matchId: 'match_123',
          senderId: 'user_123',
          receiverId: 'user_456',
          content: 'Hey! I saw your post about hiking in the Catskills. That looks amazing! Have you been to Bear Mountain?',
          type: 'text',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          status: 'read'
        }
      ]
    }
  ];
  
  return {
    success: true,
    data: {
      data: mockMatches,
      pagination: {
        page: 1,
        limit: 10,
        total: mockMatches.length,
        totalPages: 1
      }
    }
  };
};

const mockGetNotifications = async (): Promise<ApiResponse<PaginatedResponse<Notification>>> => {
  const mockNotifications: Notification[] = [
    {
      id: 'notif_1',
      userId: 'user_123',
      type: 'match',
      title: 'New Match!',
      content: 'You matched with Taylor Smith!',
      data: { matchId: 'match_123' },
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      read: false,
      actionUrl: '/matches/match_123'
    },
    {
      id: 'notif_2',
      userId: 'user_123',
      type: 'message',
      title: 'New Message',
      content: 'Taylor Smith sent you a message',
      data: { matchId: 'match_123' },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      actionUrl: '/matches/match_123/chat'
    }
  ];
  
  return {
    success: true,
    data: {
      data: mockNotifications,
      pagination: {
        page: 1,
        limit: 10,
        total: mockNotifications.length,
        totalPages: 1
      }
    }
  };
};

// Service interface exposed to the rest of the app
export const engineAdapter = {
  // Auth endpoints
  login: (email: string, password: string) => 
    fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  
  // User endpoints
  getCurrentUser: () => fetchApi<User>('/users/me'),
  getUserById: (userId: string) => fetchApi<User>(`/users/${userId}`),
  
  // Post endpoints
  getPosts: (page: number = 1, limit: number = 10) => 
    fetchApi<PaginatedResponse<Post>>(`/posts?page=${page}&limit=${limit}`),
  
  createPost: (postData: Omit<Post, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'likes' | 'comments'>) => 
    fetchApi<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    }),
  
  // Message endpoints
  getMessages: (matchId: string) => 
    fetchApi<PaginatedResponse<Message>>(`/messages?matchId=${matchId}`),
  
  sendMessage: (matchId: string, content: string, type: 'text' | 'image' | 'video' = 'text') => 
    fetchApi<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify({ matchId, content, type })
    }),
  
  // Match endpoints
  getMatches: () => fetchApi<PaginatedResponse<Match>>('/matches'),
  
  // Notification endpoints
  getNotifications: () => fetchApi<PaginatedResponse<Notification>>('/notifications'),
  
  markNotificationAsRead: (notificationId: string) => 
    fetchApi<void>(`/notifications/${notificationId}/read`, {
      method: 'PATCH'
    })
};

export default engineAdapter;