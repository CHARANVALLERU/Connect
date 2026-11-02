import { io, Socket } from 'socket.io-client';
import { API_CONFIG, TENANT_ID, USE_MOCK_ENGINE } from '../services/apiConfig';
import { authService } from '../services/authService';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private joinedRooms = new Set<string>();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (USE_MOCK_ENGINE) {
        this.isConnected = true;
        resolve();
        return;
      }

      const token = authService.getToken();
      if (!token) {
        reject(new Error('No authentication token available'));
        return;
      }

      // Clean up existing connection
      if (this.socket) {
        this.socket.disconnect();
      }

      this.socket = io(API_CONFIG.baseURL.replace('/api/v1', ''), {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.joinedRooms.clear();
    }
  }

  isConnectedToRoom(roomId: string): boolean {
    return (this.socket?.connected && this.joinedRooms.has(roomId)) ?? false;
  }

  joinRoom(roomId: string) {
    this.joinedRooms.add(roomId);
    this.socket?.emit('join-room', roomId);
  }

  leaveRoom(roomId: string) {
    this.joinedRooms.delete(roomId);
    this.socket?.emit('leave-room', roomId);
  }

  sendMessage(roomId: string, content: string, type: 'text' | 'image' | 'video' | 'system' = 'text') {
    this.socket?.emit('send-message', {
      roomId,
      content,
      type,
    });
  }

  sendTyping(roomId: string) {
    this.socket?.emit('typing', { roomId });
  }

  markAsRead(roomId: string) {
    this.socket?.emit('mark-read', { roomId });
  }

  // Event listeners
  onMessage(callback: (message: any) => void) {
    this.socket?.on('message', callback);
    return () => this.socket?.off('message', callback);
  }

  onNewMessage(callback: (data: { roomId: string; message: any }) => void) {
    this.socket?.on('new-message', callback);
    return () => this.socket?.off('new-message', callback);
  }

  onTyping(callback: (data: { userId: string; roomId: string }) => void) {
    this.socket?.on('typing', callback);
    return () => this.socket?.off('typing', callback);
  }

  onMessagesRead(callback: (data: { roomId: string; userId: string }) => void) {
    this.socket?.on('messages-read', callback);
    return () => this.socket?.off('messages-read', callback);
  }

  onError(callback: (error: any) => void) {
    this.socket?.on('error', callback);
    return () => this.socket?.off('error', callback);
  }
}

export const socketService = new SocketService();
export default SocketService;
