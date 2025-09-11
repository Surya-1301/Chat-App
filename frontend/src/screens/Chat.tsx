import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Animated } from '../web-shims/react-native-web';
import PrimaryButton from '../components/PrimaryButton';
import { theme } from '../theme';
import { io } from 'socket.io-client';
import { api } from '../api/client';
import { config } from '../config/env';
import { Message, User, NavigationProps, ApiResponse } from '../types';

export default function Chat({ route }: NavigationProps) {
  const { token, me, other } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>('');
  const socketRef = useRef<any>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const typingAnimation = useMemo(() => new Animated.Value(0), []);

  // Animate typing indicator
  useEffect(() => {
    if (otherTyping) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(typingAnimation, { toValue: 0, duration: 500, useNativeDriver: true })
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      typingAnimation.setValue(0);
    }
  }, [otherTyping, typingAnimation]);

  async function loadHistory() {
    try {
      setLoading(true);
      const { data }: { data: ApiResponse<Message> } = await api.get(
        '/conversations/' + other._id + '/messages', 
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setMessages(data.messages || []);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to load messages';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function markRead() {
    if (socketRef.current) {
      socketRef.current.emit('message:read', { from: other._id });
    }
  }

  useEffect(() => {
    (async () => {
      await loadHistory();
      // Mark as read when opening chat
      markRead();
    })();
  }, []);

  useEffect(() => {
    const s = io(config.SOCKET_URL, {
      auth: { token },
    });
    socketRef.current = s;

    s.on('connect', () => {
      console.log('Socket connected');
    });

    s.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to chat server');
    });

    // Real-time message updates
    s.on('message:new', ({ message }: { message: Message }) => {
      if ((message.from === me._id && message.to === other._id) || (message.from === other._id && message.to === me._id)) {
        setMessages((prev) => [...prev, message]);
        // If incoming message, mark as read immediately
        if (message.from === other._id) {
          markRead();
        }
      }
    });

    // Message read receipts
    s.on('message:read', ({ by }: { by: string }) => {
      if (by === other._id) {
        setMessages((prev) => prev.map((m) => {
          if (m.from === me._id && m.to === other._id && !m.readAt) {
            return { ...m, readAt: new Date().toISOString() };
          }
          return m;
        }));
      }
    });

    // Typing indicators
    s.on('typing:start', ({ from }: { from: string }) => { 
      if (from === other._id) setOtherTyping(true); 
    });
    s.on('typing:stop', ({ from }: { from: string }) => { 
      if (from === other._id) setOtherTyping(false); 
    });

    // User online/offline status
    s.on('user:status', ({ userId, status }: { userId: string, status: string }) => {
      if (userId === other._id) {
        setOtherOnline(status === 'online');
        if (status === 'offline') {
          // Get last seen time
          api.get(`/users/${other._id}`, { headers: { Authorization: 'Bearer ' + token } })
            .then(({ data }) => {
              if (data.user?.lastSeen) {
                setLastSeen(new Date(data.user.lastSeen).toLocaleString());
              }
            })
            .catch(() => {});
        }
      }
    });

    return () => { 
      s.disconnect(); 
    }
  }, []);

  function send() {
    const content = text.trim();
    if (!content || sending) return;
    
    setSending(true);
    socketRef.current.emit('message:send', { to: other._id, content }, (res: any) => {
      if (res?.ok) { 
        setText(''); 
      } else {
        Alert.alert('Error', res?.error || 'Failed to send message');
      }
      setSending(false);
    });
  }

  function onTypingChange(val: string) {
    setText(val);
    if (!socketRef.current) return;
    if (!typing) {
      setTyping(true);
      socketRef.current.emit('typing:start', { to: other._id });
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setTyping(false);
      socketRef.current.emit('typing:stop', { to: other._id });
    }, 1000);
  }

  function renderStatus(item: Message) {
    const isMine = item.from === me._id;
    if (!isMine) return null;
    const delivered = !!item.deliveredAt;
    const read = !!item.readAt;
    const ticks = read ? '✓✓' : delivered ? '✓✓' : '✓';
    const color = read ? '#34B7F1' : '#666';
    return (
      <Text style={[styles.messageStatusText, { color }]}>{ticks}</Text>
    );
  }

  function renderHeader() {
    return (
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{other.name}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: otherOnline ? '#4CAF50' : '#9E9E9E' }]} />
            <Text style={styles.userStatusText}>
              {otherOnline ? 'Online' : lastSeen ? `Last seen ${lastSeen}` : 'Offline'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <div className="auth-outer chat-outer">
        <div className="container chat-container">
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e46033" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-outer chat-outer">
      <div className="container chat-container">
        {renderHeader()}
        <FlatList
          style={styles.messageList}
          data={messages}
          keyExtractor={(m: any) => m._id}
          renderItem={({ item }: { item: any }) => (
            <View style={[
              styles.messageContainer,
              item.from === me._id ? styles.myMessage : styles.otherMessage
            ]}>
              <Text style={styles.messageText}>{item.content}</Text>
              {renderStatus(item)}
            </View>
          )}
          onMomentumScrollEnd={markRead}
          onScrollEndDrag={markRead}
          inverted
        />
        {otherTyping && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>{other.name} is typing</Text>
            <Animated.View style={[styles.typingDots, { opacity: typingAnimation }]}> 
              <Text style={styles.typingDotsText}>...</Text>
            </Animated.View>
          </View>
        )}
        <View style={styles.inputContainer}>
          <TextInput 
            value={text} 
            onChangeText={onTypingChange} 
            placeholder='Type a message' 
            style={styles.textInput}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity onPress={send} disabled={sending || !text.trim()} style={[styles.sendBtn, (sending || !text.trim()) && { opacity: 0.5 }]}> 
            <Text style={styles.sendText}>{sending ? '...' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  chatContainer: {
    backgroundColor: '#23232a',
    borderRadius: 10,
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
    padding: 20,
    maxWidth: 500,
    margin: '40px auto',
    minHeight: 600,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  chatOuter: {
    backgroundColor: '#25252b',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  messageList: {
    flex: 1,
    padding: 8
  },
  messageContainer: {
    padding: 12,
    margin: 4,
    borderRadius: 16,
    maxWidth: '80%'
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6'
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF'
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20
  },
  messageStatusText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  typingText: {
    padding: 8,
    color: '#666',
    fontStyle: 'italic'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 20,
    fontSize: 16,
    maxHeight: 100
  },
  sendBtn: {
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  sendText: {
    color: '#fff',
    fontWeight: '700'
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5
  },
  userStatusText: {
    fontSize: 12,
    color: '#666'
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 8
  },

  typingDots: {
    transform: [{ scale: 0.8 }],
    opacity: 0.7
  },
  typingDotsText: {
    fontSize: 18,
    fontWeight: 'bold'
  }
});
