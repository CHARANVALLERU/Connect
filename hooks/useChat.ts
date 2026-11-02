import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { ChatRoom, Message } from '../services/apiConfig';

export function useChatRooms() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiService.getRooms();
      setRooms(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load chat rooms');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRoom = async (matchedUserId: string) => {
    try {
      const room = await apiService.createRoom(matchedUserId);
      return room;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create room');
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return {
    rooms,
    isLoading,
    error,
    refresh: fetchRooms,
    createRoom,
  };
}

export function useMessages(roomId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async (reset = false) => {
    if (!roomId || isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const newCursor = reset ? undefined : (cursor || undefined);
      const data: any = await apiService.getMessages(roomId, newCursor);
      
      if (reset) {
        setMessages(data?.items || []);
      } else {
        setMessages(prev => [...prev, ...(data?.items || [])]);
      }
      
      setCursor(data?.pagination?.cursor || null);
      setHasNextPage(data?.pagination?.hasNextPage || false);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, cursor, isLoading]);

  const sendMessage = async (content: string, type: string = 'text') => {
    try {
      const message: any = await apiService.sendMessage(roomId!, content, type);
      setMessages(prev => [...prev, message]);
      return message;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send message');
    }
  };

  const markAsRead = async () => {
    try {
      await apiService.markAsRead(roomId!);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const loadMore = useCallback(() => {
    if (hasNextPage && !isLoading) {
      fetchMessages(false);
    }
  }, [hasNextPage, isLoading, fetchMessages]);

  useEffect(() => {
    if (roomId) {
      fetchMessages(true);
    }
  }, [roomId]);

  return {
    messages,
    cursor,
    hasNextPage,
    isLoading,
    error,
    sendMessage,
    markAsRead,
    loadMore,
  };
}
