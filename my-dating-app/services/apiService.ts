import { API_CONFIG, TENANT_ID, Post, UserProfile, Match, Message, ChatRoom } from './apiConfig';
import { authService } from './authService';

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
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(email: string, password: string, name: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Discovery/Feed Methods
  async getFeed(cursor?: string, limit: number = 20): Promise<{ items: Post[]; hasNextPage: boolean }> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append('cursor', cursor);

    const data = await this.request(`/discovery/feed?${params.toString()}`);
    return data.data;
  }

  async getPremiumFeed(cursor?: string, limit: number = 20): Promise<{ items: Post[]; hasNextPage: boolean }> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append('cursor', cursor);

    const data = await this.request(`/discovery/feed/premium?${params.toString()}`);
    return data.data;
  }

  async createPost(content: string, type: string = 'text', media?: any[]) {
    return this.request('/discovery/posts', {
      method: 'POST',
      body: JSON.stringify({ content, type, media }),
    });
  }

  async likePost(postId: string) {
    return this.request(`/discovery/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  // Chat Methods
  async getRooms(): Promise<ChatRoom[]> {
    const data = await this.request('/chat/rooms');
    return data.data;
  }

  async createRoom(matchedUserId: string) {
    return this.request('/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({ matchedUserId }),
    });
  }

  async getMessages(roomId: string, cursor?: string, limit: number = 50) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append('cursor', cursor);

    const data = await this.request(`/chat/rooms/${roomId}/messages?${params.toString()}`);
    return data.data;
  }

  async sendMessage(roomId: string, content: string, type: string = 'text') {
    return this.request(`/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
  }

  async markAsRead(roomId: string) {
    return this.request(`/chat/rooms/${roomId}/read`, {
      method: 'PATCH',
    });
  }

  // User Methods
  async getUserProfile(userId: string): Promise<UserProfile> {
    return this.request(`/users/${userId}`);
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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
