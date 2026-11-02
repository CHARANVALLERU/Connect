import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { UserProfile } from '../services/apiConfig';

export function useUserProfile(userId?: string) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiService.getUserProfile(userId);
      setUser(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!userId) return null;
    
    try {
      const updated = await apiService.updateUserProfile(userId, data);
      setUser(updated);
      return updated;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  return {
    user,
    isLoading,
    error,
    refresh: fetchProfile,
    updateProfile,
  };
}

export function useCurrentUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiService.getMe();
      setUser(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load current user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      const updated = await apiService.updateUserProfile(user?.id!, data);
      setUser(updated);
      return updated;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  useEffect(() => {
    fetchCurrentProfile();
  }, []);

  return {
    user,
    isLoading,
    error,
    refresh: fetchCurrentProfile,
    updateProfile,
  };
}
