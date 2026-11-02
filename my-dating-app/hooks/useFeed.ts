import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/apiService';
import { Post } from '../services/apiConfig';

export function useFeed() {
  const [items, setItems] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async (reset = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const newCursor = reset ? undefined : cursor;
      const data = await apiService.getFeed(newCursor);
      
      if (reset) {
        setItems(data.items);
      } else {
        setItems(prev => [...prev, ...data.items]);
      }
      
      setCursor(data.pagination.cursor);
      setHasNextPage(data.pagination.hasNextPage);
    } catch (err: any) {
      setError(err.message || 'Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  }, [cursor, isLoading]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isLoading) {
      fetchFeed(false);
    }
  }, [hasNextPage, isLoading, fetchFeed]);

  const refresh = useCallback(() => {
    setCursor(null);
    fetchFeed(true);
  }, [fetchFeed]);

  useEffect(() => {
    fetchFeed(true);
  }, []);

  return {
    items,
    cursor,
    hasNextPage,
    isLoading,
    error,
    loadMore,
    refresh,
  };
}

export function usePremiumFeed() {
  const [items, setItems] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPremiumFeed = useCallback(async (reset = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const newCursor = reset ? undefined : cursor;
      const data = await apiService.getPremiumFeed(newCursor);
      
      if (reset) {
        setItems(data.items);
      } else {
        setItems(prev => [...prev, ...data.items]);
      }
      
      setCursor(data.pagination.cursor);
      setHasNextPage(data.pagination.hasNextPage);
    } catch (err: any) {
      setError(err.message || 'Failed to load premium feed');
    } finally {
      setIsLoading(false);
    }
  }, [cursor, isLoading]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isLoading) {
      fetchPremiumFeed(false);
    }
  }, [hasNextPage, isLoading, fetchPremiumFeed]);

  const refresh = useCallback(() => {
    setCursor(null);
    fetchPremiumFeed(true);
  }, [fetchPremiumFeed]);

  useEffect(() => {
    fetchPremiumFeed(true);
  }, []);

  return {
    items,
    cursor,
    hasNextPage,
    isLoading,
    error,
    loadMore,
    refresh,
  };
}

export function usePost() {
  const createPost = async (content: string, type: string = 'text', media?: any[]) => {
    try {
      const post = await apiService.createPost(content, type, media);
      return post;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create post');
    }
  };

  const likePost = async (postId: string) => {
    try {
      const post = await apiService.likePost(postId);
      return post;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to like post');
    }
  };

  return { createPost, likePost };
}
