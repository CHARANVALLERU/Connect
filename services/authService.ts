import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, TENANT_ID, AuthResponse, UserProfile, ApiResponse } from './apiConfig';

const TOKEN_KEYS = {
  ACCESS_TOKEN: '@auth_access_token',
  REFRESH_TOKEN: '@auth_refresh_token',
  USER_DATA: '@auth_user_data',
  TOKEN_EXPIRY: '@auth_token_expiry',
};

class AuthService {
  private accessToken: string | null = null;
  private refreshTokenString: string | null = null;
  private user: UserProfile | null = null;
  private tokenExpiry: number | null = null;

  async initialize(): Promise<void> {
    try {
      const [storedToken, storedRefresh, storedUser, storedExpiry] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(TOKEN_KEYS.USER_DATA),
        AsyncStorage.getItem(TOKEN_KEYS.TOKEN_EXPIRY),
      ]);

      this.accessToken = storedToken;
      this.refreshTokenString = storedRefresh;
      this.user = storedUser ? JSON.parse(storedUser) : null;
      this.tokenExpiry = storedExpiry ? parseInt(storedExpiry, 10) : null;
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          ...API_CONFIG.headers,
          'X-Tenant-ID': TENANT_ID,
        },
        body: JSON.stringify({ email, password }),
      });

      const data: ApiResponse<AuthResponse> = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Login failed');
      }

      const { user, tokens } = data.data;

      // Store tokens and user data
      this.accessToken = tokens.accessToken;
      this.refreshTokenString = tokens.refreshToken;
      this.user = user;
      this.tokenExpiry = new Date(tokens.expiresAt).getTime();

      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken),
        AsyncStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, tokens.refreshToken),
        AsyncStorage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(user)),
        AsyncStorage.setItem(TOKEN_KEYS.TOKEN_EXPIRY, tokens.expiresAt),
      ]);

      return data.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signup(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/auth/signup`, {
        method: 'POST',
        headers: {
          ...API_CONFIG.headers,
          'X-Tenant-ID': TENANT_ID,
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data: ApiResponse<AuthResponse> = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Signup failed');
      }

      const { user, tokens } = data.data;

      // Store tokens and user data
      this.accessToken = tokens.accessToken;
      this.refreshTokenString = tokens.refreshToken;
      this.user = user;
      this.tokenExpiry = new Date(tokens.expiresAt).getTime();

      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken),
        AsyncStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, tokens.refreshToken),
        AsyncStorage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(user)),
        AsyncStorage.setItem(TOKEN_KEYS.TOKEN_EXPIRY, tokens.expiresAt),
      ]);

      return data.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async refreshToken(): Promise<boolean> {
    if (!this.refreshTokenString) return false;

    try {
      const response = await fetch(`${API_CONFIG.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          ...API_CONFIG.headers,
          'X-Tenant-ID': TENANT_ID,
        },
        body: JSON.stringify({ refreshToken: this.refreshTokenString }),
      });

      const data: ApiResponse<{ tokens: { accessToken: string; refreshToken: string; expiresAt: string } }> = await response.json();

      if (!data.success || !data.data) {
        await this.logout();
        return false;
      }

      const { accessToken, refreshToken, expiresAt } = data.data.tokens;

      this.accessToken = accessToken;
      this.refreshTokenString = refreshToken;
      this.tokenExpiry = new Date(expiresAt).getTime();

      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken),
        AsyncStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken),
        AsyncStorage.setItem(TOKEN_KEYS.TOKEN_EXPIRY, expiresAt),
      ]);

      return true;
    } catch (error) {
      console.error('Refresh token error:', error);
      await this.logout();
      return false;
    }
  }

  async getProfile(): Promise<UserProfile | null> {
    if (!this.accessToken) return null;

    try {
      const response = await fetch(`${API_CONFIG.baseURL}/auth/me`, {
        headers: {
          ...API_CONFIG.headers,
          'X-Tenant-ID': TENANT_ID,
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const data: ApiResponse<UserProfile> = await response.json();

      if (!data.success || !data.data) {
        // Try to refresh token and retry
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.getProfile();
        }
        return null;
      }

      this.user = data.data;
      await AsyncStorage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(data.data));
      
      return data.data;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    if (this.accessToken) {
      try {
        await fetch(`${API_CONFIG.baseURL}/auth/logout`, {
          method: 'POST',
          headers: {
            ...API_CONFIG.headers,
            'X-Tenant-ID': TENANT_ID,
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.accessToken = null;
    this.refreshTokenString = null;
    this.user = null;
    this.tokenExpiry = null;

    await AsyncStorage.multiRemove([
      TOKEN_KEYS.ACCESS_TOKEN,
      TOKEN_KEYS.REFRESH_TOKEN,
      TOKEN_KEYS.USER_DATA,
      TOKEN_KEYS.TOKEN_EXPIRY,
    ]);
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && (!!this.tokenExpiry || this.isTokenExpired());
  }

  isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry - 60000; // Refresh 1 min before expiry
  }

  getUser(): UserProfile | null {
    return this.user;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  isElite(): boolean {
    return this.user?.tier === 'ELITE' || this.user?.tier === 'VERIFIED';
  }
}

export const authService = new AuthService();
export default AuthService;
