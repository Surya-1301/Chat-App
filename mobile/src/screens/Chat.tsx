import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
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
  const socketRef = useRef<any>();
  const typingTimeout = useRef<any>();

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

    s.on('message:new', ({ message }: { message: Message }) => {
      if ((message.from === me._id && message.to === other._id) || (message.from === other._id && message.to === me._id)) {
        setMessages((prev) => [...prev, message]);
        // If incoming message, mark as read immediately
        if (message.from === other._id) {
          markRead();
        }
      }
    });

    s.on('message:read', ({ by }: { by: string }) => {
      // Recipient read my messages
      if (by === other._id) {
        setMessages((prev) => prev.map((m) => {
          if (m.from === me._id && m.to === other._id && !m.readAt) {
            return { ...m, readAt: new Date().toISOString() };
          }
          return m;
        }));
      }
    });

    s.on('typing:start', ({ from }: { from: string }) => { 
      if (from === other._id) setOtherTyping(true); 
    });
    s.on('typing:stop', ({ from }: { from: string }) => { 
      if (from === other._id) setOtherTyping(false); 
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
      <Text style={[styles.statusText, { color }]}>{ticks}</Text>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.messageList}
        data={messages}
        keyExtractor={(m) => m._id}
        renderItem={({ item }) => (
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
        <Text style={styles.typingText}>{other.name} is typing...</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
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
  statusText: {
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
  }
});
