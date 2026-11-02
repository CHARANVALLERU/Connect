import { API_CONFIG, TENANT_ID, USE_MOCK_ENGINE, Post, UserProfile, Match, Message, ChatRoom } from './apiConfig';
import { authService } from './authService';

const MOCK_PROFILES = [
  {
    id: 'user_456',
    name: 'Taylor Smith',
    age: 26,
    tier: 'ELITE',
    bio: 'Graphic designer & adventure lover. Always looking for the best coffee in the city.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
    interests: ['Art', 'Coffee', 'Hiking', 'Photography'],
    prompts: [
      { question: 'A life goal of mine', answer: 'Hike Patagonia from north to south.' },
      { question: 'Dating me is like', answer: 'Having an infinite playlist of indie music and spontaneous road trips.' }
    ]
  },
  {
    id: 'user_789',
    name: 'Alex Rivera',
    age: 28,
    tier: 'BASIC',
    bio: 'Architect, amateur chef, and avid runner. Say hi if you love good food!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    interests: ['Architecture', 'Cooking', 'Running', 'Travel'],
    prompts: [
      { question: 'Together we could', answer: 'Cook elaborate 3-course dinners on Tuesday nights.' }
    ]
  },
  {
    id: 'user_101',
    name: 'Morgan Blake',
    age: 25,
    tier: 'ELITE',
    bio: 'Founder & software engineer. Cat parent, bookworm, and vinyl collector.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    interests: ['Tech', 'Books', 'Cats', 'Music'],
    prompts: [
      { question: 'Best travel story', answer: 'Got lost in Tokyo and found the best hidden ramen shop in Shinjuku.' }
    ]
  }
];

const MOCK_POSTS: Post[] = [
  {
    id: 'post_1',
    userId: 'user_456',
    content: 'Just finished an amazing hike in the Catskills! Anyone else love autumn hiking? 🍂',
    type: 'image',
    media: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
      'https://images.unsplash.com/photo-1506905925346-21cda4d32841?w=800'
    ],
    likes: 42,
    views: 120,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    tenantId: TENANT_ID,
    user: {
      id: 'user_456',
      name: 'Taylor Smith',
      tier: 'ELITE',
      appProfileData: JSON.stringify(MOCK_PROFILES[0])
    }
  },
  {
    id: 'post_2',
    userId: 'user_789',
    content: 'Trying out a new recipe for homemade pasta tonight. Cooking is my therapy! 🍝',
    type: 'image',
    media: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800'
    ],
    likes: 28,
    views: 95,
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    tenantId: TENANT_ID,
    user: {
      id: 'user_789',
      name: 'Alex Rivera',
      tier: 'BASIC',
      appProfileData: JSON.stringify(MOCK_PROFILES[1])
    }
  },
  {
    id: 'post_3',
    userId: 'user_101',
    content: 'Weekend vinyl hunting in Brooklyn. Found an original 1971 pressing! 🎶',
    type: 'image',
    media: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800'
    ],
    likes: 54,
    views: 180,
    createdAt: new Date(Date.now() - 10 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
    tenantId: TENANT_ID,
    user: {
      id: 'user_101',
      name: 'Morgan Blake',
      tier: 'ELITE',
      appProfileData: JSON.stringify(MOCK_PROFILES[2])
    }
  }
];

const MOCK_ROOMS: ChatRoom[] = [
  {
    id: 'room_1',
    status: 'ACCEPTED',
    lastMessage: 'Hey! Loved your hiking photos, where was that taken?',
    lastMessageTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    unreadCount: 1,
    user: {
      id: 'user_456',
      name: 'Taylor Smith',
      tier: 'ELITE',
      appProfileData: JSON.stringify(MOCK_PROFILES[0])
    }
  },
  {
    id: 'room_2',
    status: 'ACCEPTED',
    lastMessage: 'What kind of pasta did you make?',
    lastMessageTime: new Date(Date.now() - 3 * 3600000).toISOString(),
    unreadCount: 0,
    user: {
      id: 'user_789',
      name: 'Alex Rivera',
      tier: 'BASIC',
      appProfileData: JSON.stringify(MOCK_PROFILES[1])
    }
  }
];

class ApiService {
  private getHeaders(): Record<string, string> {
    const token = authService.getToken();
    return {
      ...API_CONFIG.headers,
      'X-Tenant-ID': TENANT_ID,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && token) {
        // Token expired, try to refresh
        const refreshed = await authService.refreshToken();
        if (refreshed) {
          return this.request<T>(endpoint, options);
        }
      }
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth Methods
  async login(email: string, password: string) {
    if (USE_MOCK_ENGINE) {
      const isElite = email.toLowerCase().includes('elite');
      const user = isElite ? MOCK_PROFILES[0] : MOCK_PROFILES[1];
      return {
        user: {
          ...user,
          email,
          role: 'USER',
          isActive: true,
          appProfileData: JSON.stringify(user),
          createdAt: new Date().toISOString()
        },
        tokens: {
          accessToken: 'mock_jwt_token',
          refreshToken: 'mock_refresh_token',
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        }
      };
    }
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(email: string, password: string, name: string) {
    if (USE_MOCK_ENGINE) {
      const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        tier: 'BASIC' as const,
        role: 'USER',
        isActive: true,
        appProfileData: JSON.stringify({ age: 25, bio: 'Hello from Hinge clone!' }),
        createdAt: new Date().toISOString()
      };
      return {
        user: newUser,
        tokens: {
          accessToken: 'mock_jwt_token',
          refreshToken: 'mock_refresh_token',
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        }
      };
    }
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async getMe(): Promise<UserProfile> {
    if (USE_MOCK_ENGINE) {
      const p = MOCK_PROFILES[0];
      return {
        id: p.id,
        email: 'taylor@example.com',
        name: p.name,
        tier: 'ELITE',
        role: 'USER',
        isActive: true,
        appProfileData: JSON.stringify(p),
        createdAt: new Date().toISOString()
      };
    }
    const res = await this.request<{ data: UserProfile } | UserProfile>('/auth/me');
    return (res as any).data || res;
  }

  // Discovery/Feed Methods
  async getFeed(cursor?: string, limit: number = 20): Promise<{ items: Post[]; hasNextPage: boolean }> {
    if (USE_MOCK_ENGINE) {
      return { items: MOCK_POSTS, hasNextPage: false };
    }
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (cursor) params.append('cursor', cursor);

      const data = await this.request<{ data: { items: Post[]; hasNextPage: boolean } }>(`/discovery/feed?${params.toString()}`);
      return data?.data || { items: MOCK_POSTS, hasNextPage: false };
    } catch {
      return { items: MOCK_POSTS, hasNextPage: false };
    }
  }

  async getPremiumFeed(cursor?: string, limit: number = 20): Promise<{ items: Post[]; hasNextPage: boolean }> {
    if (USE_MOCK_ENGINE) {
      return { items: MOCK_POSTS.filter(p => p.user?.tier === 'ELITE'), hasNextPage: false };
    }
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (cursor) params.append('cursor', cursor);

      const data = await this.request<{ data: { items: Post[]; hasNextPage: boolean } }>(`/discovery/feed/premium?${params.toString()}`);
      return data?.data || { items: MOCK_POSTS, hasNextPage: false };
    } catch {
      return { items: MOCK_POSTS, hasNextPage: false };
    }
  }

  async createPost(content: string, type: string = 'text', media?: any[]) {
    if (USE_MOCK_ENGINE) {
      const newPost: Post = {
        id: `post_${Date.now()}`,
        userId: 'user_me',
        content,
        type: type as any,
        media: media || [],
        likes: 0,
        views: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId: TENANT_ID
      };
      MOCK_POSTS.unshift(newPost);
      return newPost;
    }
    return this.request('/discovery/posts', {
      method: 'POST',
      body: JSON.stringify({ content, type, media }),
    });
  }

  async likePost(postId: string) {
    if (USE_MOCK_ENGINE) {
      const post = MOCK_POSTS.find(p => p.id === postId);
      if (post) post.likes += 1;
      return { success: true };
    }
    try {
      return await this.request(`/discovery/posts/${postId}/like`, {
        method: 'POST',
      });
    } catch {
      return { success: true };
    }
  }

  // Chat Methods
  async getRooms(): Promise<ChatRoom[]> {
    if (USE_MOCK_ENGINE) {
      return MOCK_ROOMS;
    }
    try {
      const data = await this.request<{ data: ChatRoom[] }>('/chat/rooms');
      return data?.data || MOCK_ROOMS;
    } catch {
      return MOCK_ROOMS;
    }
  }

  async createRoom(matchedUserId: string) {
    if (USE_MOCK_ENGINE) {
      const matchProfile = MOCK_PROFILES.find(p => p.id === matchedUserId) || MOCK_PROFILES[0];
      const newRoom: ChatRoom = {
        id: `room_${Date.now()}`,
        status: 'ACCEPTED',
        unreadCount: 0,
        user: {
          id: matchProfile.id,
          name: matchProfile.name,
          tier: matchProfile.tier,
          appProfileData: JSON.stringify(matchProfile)
        }
      };
      MOCK_ROOMS.push(newRoom);
      return newRoom;
    }
    return this.request('/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({ matchedUserId }),
    });
  }

  async getMessages(roomId: string, cursor?: string, limit: number = 50) {
    if (USE_MOCK_ENGINE) {
      return [
        {
          id: 'msg_1',
          matchId: roomId,
          senderId: 'user_456',
          receiverId: 'user_123',
          content: 'Hey! Loved your hiking photos, where was that taken?',
          type: 'TEXT',
          status: 'READ',
          media: '',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          tenantId: TENANT_ID,
          sender: { id: 'user_456', name: 'Taylor Smith', tier: 'ELITE' }
        }
      ];
    }
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (cursor) params.append('cursor', cursor);

      const data = await this.request<{ data: any }>(`/chat/rooms/${roomId}/messages?${params.toString()}`);
      return data?.data || [];
    } catch {
      return [];
    }
  }

  async sendMessage(roomId: string, content: string, type: string = 'text') {
    if (USE_MOCK_ENGINE) {
      return {
        id: `msg_${Date.now()}`,
        matchId: roomId,
        senderId: 'user_me',
        receiverId: 'user_456',
        content,
        type: 'TEXT',
        status: 'SENT',
        media: '',
        createdAt: new Date().toISOString(),
        tenantId: TENANT_ID
      };
    }
    return this.request(`/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
  }

  async markAsRead(roomId: string) {
    if (USE_MOCK_ENGINE) {
      const room = MOCK_ROOMS.find(r => r.id === roomId);
      if (room) room.unreadCount = 0;
      return { success: true };
    }
    try {
      return await this.request(`/chat/rooms/${roomId}/read`, {
        method: 'PATCH',
      });
    } catch {
      return { success: true };
    }
  }

  // User Methods
  async getUserProfile(userId: string): Promise<UserProfile> {
    if (USE_MOCK_ENGINE) {
      const p = MOCK_PROFILES.find(x => x.id === userId) || MOCK_PROFILES[0];
      return {
        id: p.id,
        email: `${p.name.toLowerCase().replace(' ', '.')}@example.com`,
        name: p.name,
        tier: p.tier as any,
        role: 'USER',
        isActive: true,
        appProfileData: JSON.stringify(p),
        createdAt: new Date().toISOString()
      };
    }
    try {
      return await this.request(`/users/${userId}`);
    } catch {
      const p = MOCK_PROFILES[0];
      return {
        id: p.id,
        email: 'taylor@example.com',
        name: p.name,
        tier: 'ELITE',
        role: 'USER',
        isActive: true,
        appProfileData: JSON.stringify(p),
        createdAt: new Date().toISOString()
      };
    }
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    if (USE_MOCK_ENGINE) {
      const p = MOCK_PROFILES.find(x => x.id === userId) || MOCK_PROFILES[0];
      Object.assign(p, data);
      return {
        id: p.id,
        email: `${p.name.toLowerCase().replace(' ', '.')}@example.com`,
        name: p.name,
        tier: p.tier as any,
        role: 'USER',
        isActive: true,
        appProfileData: JSON.stringify(p),
        createdAt: new Date().toISOString()
      };
    }
    const res = await this.request<{ data: UserProfile } | UserProfile>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return (res as any).data || res;
  }

  // Helper to parse profile data
  parseProfileData(profileData: string): any {
    try {
      return JSON.parse(profileData);
    } catch {
      return {};
    }
  }
}

export const apiService = new ApiService();
export default ApiService;
