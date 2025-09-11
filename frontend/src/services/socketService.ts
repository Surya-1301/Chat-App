import { io, Socket } from 'socket.io-client';
import { config } from '../config/env';

export interface SocketMessage {
  _id: string;
  content: string;
  from: string;
  to: string;
  conversation: string;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
  replyTo?: string;
  reactions?: Record<string, string>;
}

export interface SocketEvents {
  'message:new': (data: { message: SocketMessage }) => void;
  'message:read': (data: { by: string }) => void;
  'typing:start': (data: { from: string }) => void;
  'typing:stop': (data: { from: string }) => void;
  'user:status': (data: { userId: string; status: string }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Set<Function>> = new Map();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(config.SOCKET_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        this.socket.on('connect', () => {
          console.log('🔌 Socket connected successfully');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('🔌 Socket connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);
          if (reason === 'io server disconnect') {
            // Server disconnected us, try to reconnect
            this.socket?.connect();
          }
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
        });

        this.socket.on('reconnect_failed', () => {
          console.error('🔌 Socket reconnection failed after', this.maxReconnectAttempts, 'attempts');
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data: any, callback?: (response: any) => void): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data, callback);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
      if (callback) callback({ ok: false, error: 'Socket not connected' });
    }
  }

  on<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  off<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  // Send message with delivery confirmation
  sendMessage(to: string, content: string): Promise<{ ok: boolean; message?: SocketMessage; error?: string }> {
    return new Promise((resolve) => {
      this.emit('message:send', { to, content }, (response) => {
        resolve(response);
      });
    });
  }

  // Mark messages as read
  markAsRead(from: string): void {
    this.emit('message:read', { from });
  }

  // Start typing indicator
  startTyping(to: string): void {
    this.emit('typing:start', { to });
  }

  // Stop typing indicator
  stopTyping(to: string): void {
    this.emit('typing:stop', { to });
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
export default socketService;
