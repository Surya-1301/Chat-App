import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import socketService, { SocketMessage } from '../services/socketService';
import { api } from '../api/client';

export interface UseRealTimeChatProps {
  token: string;
  otherUserId: string;
  conversationId?: string;
}

export interface UseRealTimeChatReturn {
  messages: SocketMessage[];
  loading: boolean;
  sending: boolean;
  otherTyping: boolean;
  otherOnline: boolean;
  lastSeen: string;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: () => void;
  startTyping: () => void;
  stopTyping: () => void;
  isConnected: boolean;
}

export const useRealTimeChat = ({ token, otherUserId, conversationId }: UseRealTimeChatProps): UseRealTimeChatReturn => {
  const [messages, setMessages] = useState<SocketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Load message history
  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `/conversations/${otherUserId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(data.messages || []);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to load messages';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, otherUserId]);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    socketService.markAsRead(otherUserId);
  }, [otherUserId]);

  // Start typing indicator
  const startTyping = useCallback(() => {
    socketService.startTyping(otherUserId);
  }, [otherUserId]);

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    socketService.stopTyping(otherUserId);
  }, [otherUserId]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || sending) return;
    
    setSending(true);
    try {
      const result = await socketService.sendMessage(otherUserId, content.trim());
      if (result.ok && result.message) {
        // Message sent successfully, it will be added via socket event
        setText('');
      } else {
        Alert.alert('Error', result.error || 'Failed to send message');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [otherUserId, sending]);

  // Handle typing with debounce
  const handleTyping = useCallback((isTyping: boolean) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (isTyping) {
      startTyping();
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 1000);
    }
  }, [startTyping, stopTyping]);

  // Connect to socket
  const connectSocket = useCallback(async () => {
    try {
      await socketService.connect(token);
      setIsConnected(true);
      
      // Set up event listeners
      socketService.on('message:new', ({ message }) => {
        if ((message.from === otherUserId && message.to === otherUserId) || 
            (message.from === otherUserId && message.to === otherUserId)) {
          setMessages(prev => [...prev, message]);
          // Mark incoming messages as read
          if (message.from === otherUserId) {
            markAsRead();
          }
        }
      });

      socketService.on('message:read', ({ by }) => {
        if (by === otherUserId) {
          setMessages(prev => prev.map(m => {
            if (m.from === otherUserId && m.to === otherUserId && !m.readAt) {
              return { ...m, readAt: new Date().toISOString() };
            }
            return m;
          }));
        }
      });

      socketService.on('typing:start', ({ from }) => {
        if (from === otherUserId) {
          setOtherTyping(true);
        }
      });

      socketService.on('typing:stop', ({ from }) => {
        if (from === otherUserId) {
          setOtherTyping(false);
        }
      });

      socketService.on('user:status', ({ userId, status }) => {
        if (userId === otherUserId) {
          setOtherOnline(status === 'online');
          if (status === 'offline') {
            // Get last seen time
            api.get(`/users/${otherUserId}`, { headers: { Authorization: `Bearer ${token}` } })
              .then(({ data }) => {
                if (data.user?.lastSeen) {
                  setLastSeen(new Date(data.user.lastSeen).toLocaleString());
                }
              })
              .catch(() => {});
          }
        }
      });

    } catch (error) {
      console.error('Failed to connect to socket:', error);
      setIsConnected(false);
      
      // Retry connection after delay
      reconnectTimeoutRef.current = setTimeout(() => {
        connectSocket();
      }, 5000);
    }
  }, [token, otherUserId, markAsRead]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    socketService.disconnect();
  }, []);

  // Initialize
  useEffect(() => {
    loadHistory();
    connectSocket();
    
    return cleanup;
  }, [loadHistory, connectSocket, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    messages,
    loading,
    sending,
    otherTyping,
    otherOnline,
    lastSeen,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    isConnected,
  };
};
