import React, {useState, useEffect, useRef, useContext} from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  ActivityIndicator,
} from '../web-shims/react-native-web';
import io, { Socket } from 'socket.io-client';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../api/client';
import { offlineManager } from '../utils/offline';

type Message = {
  _id: string;
  text: string;
  createdAt: number;
  from: string;
  fromId?: string;
  toId?: string;
  roomId?: string | null;
  delivered?: boolean;
  read?: boolean;
  isOffline?: boolean;
};

type RouteProps = {
  params?: {
    roomId?: string | null;
    roomName?: string;
    recipientId?: string | null;
    recipientName?: string | null;
  };
};

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:4000';

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
}

export default function ChatScreen({ route }: { route: RouteProps }) {
  const navigation = { goBack: () => window.history.back() } as any;
  const { token, userId } = useContext(AuthContext);
  const roomId = route?.params?.roomId ?? null;
  const roomName = route?.params?.roomName ?? 'Global';
  const recipientId = route?.params?.recipientId ?? null;
  const recipientName = route?.params?.recipientName ?? null;

  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const prevRoomRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listRef = useRef<any | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const conversationId = recipientId || roomId || 'global';

    const fetchMessages = async () => {
      setIsLoading(true);
      const cachedMessages = await offlineManager.getCachedMessages(conversationId);
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
      }

      if (isOnline) {
        try {
          const response = await api.get(`/conversations/messages/${recipientId}`);
          const serverMessages = response.data.messages;
          setMessages(serverMessages);
          await offlineManager.cacheMessages(conversationId, serverMessages);
          setHasMore(serverMessages.length > 0);
        } catch (error) {
          console.error("Failed to fetch messages:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchMessages();

    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('identify', { token, userId, socketId: socketRef.current?.id });
      if (roomId) socketRef.current?.emit('join', roomId);
      prevRoomRef.current = roomId ?? null;
      // Send queued messages on reconnect
      sendQueuedMessages();
    });

    socketRef.current.on('message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.toId && socketRef.current) {
        socketRef.current.emit('delivered', { messageId: msg._id, to: msg.toId, fromId: msg.fromId });
      }
    });

    socketRef.current.on('private_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.toId && socketRef.current) {
        socketRef.current.emit('delivered', { messageId: msg._id, to: msg.toId, fromId: msg.fromId });
      }
    });

    socketRef.current.on('delivered', ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.map(m => m._id === messageId ? {...m, delivered: true} : m));
    });

    socketRef.current.on('read', ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.map(m => m._id === messageId ? {...m, read: true} : m));
    });

    socketRef.current.on('typing', (payload: { userId: string; room?: string | null; typing: boolean; fromId?:string }) => {
      const { userId, room, typing } = payload;
      if (room && room !== roomId) return;
      setTypingUsers((current) => {
        if (typing) {
          if (current.includes(userId)) return current;
          return [...current, userId];
        } else {
          return current.filter((u) => u !== userId);
        }
      });
    });

    return () => {
      try {
        if (prevRoomRef.current) socketRef.current?.emit('leave', prevRoomRef.current);
        socketRef.current?.disconnect();
      } catch (e) {}
    };
  }, [recipientId, roomId, token, userId, isOnline]);

  useEffect(() => {
    if (listRef.current && messages.length > 0 && !isLoadingMore) {
      try {
        listRef.current.scrollToEnd({ animated: false });
      } catch (e) {}
    }
  }, [messages, isLoadingMore]);

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore || !recipientId || messages.length === 0 || !isOnline) return;

    setIsLoadingMore(true);
    const before = messages[0].createdAt;

    try {
      const response = await api.get(`/conversations/messages/${recipientId}?before=${new Date(before).toISOString()}&limit=20`);
      const newMessages = response.data.messages;

      if (newMessages.length > 0) {
        const conversationId = recipientId || roomId || 'global';
        const updatedMessages = [...newMessages, ...messages];
        setMessages(updatedMessages);
        await offlineManager.cacheMessages(conversationId, updatedMessages);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const send = async () => {
    if (!message.trim()) return;

    const conversationId = recipientId || roomId || 'global';

    const payload: Message = {
      _id: genId(),
      text: message.trim(),
      createdAt: Date.now(),
      from: 'Me',
      fromId: userId ?? socketRef.current?.id,
      toId: recipientId ?? undefined,
      roomId: recipientId ? undefined : roomId ?? null,
      delivered: false,
      read: false,
      isOffline: !isOnline,
    };

    setMessages((prev) => [...prev, payload]);
    setMessage('');
    Keyboard.dismiss();
    emitTyping(false);

    if (!isOnline) {
      await offlineManager.queueMessage(conversationId, payload);
      return;
    }

    if (socketRef.current) {
      if (recipientId) {
        socketRef.current.emit('private_message', payload);
      } else {
        socketRef.current.emit('message', payload);
      }
    }
  };

  const sendQueuedMessages = async () => {
    const conversationId = recipientId || roomId || 'global';
    const queuedMessages = await offlineManager.getQueuedMessages(conversationId);
    if (queuedMessages.length > 0 && socketRef.current) {
      queuedMessages.forEach((msg: Message) => {
        if (recipientId) {
          socketRef.current?.emit('private_message', { ...msg, isOffline: false });
        } else {
          socketRef.current?.emit('message', { ...msg, isOffline: false });
        }
      });
      await offlineManager.clearQueuedMessages(conversationId);
    }
  };

  const emitTyping = (isTyping: boolean) => {
    if (!socketRef.current || !isOnline) return;
    const payload: any = { userId: socketRef.current.id, room: roomId, typing: isTyping };
    if (recipientId) payload.toId = recipientId;
    socketRef.current.emit('typing', payload);
  };

  const onChangeText = (text: string) => {
    setMessage(text);
    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
      typingTimeoutRef.current = null;
    }, 1200);
  };

  const renderHeader = () => {
    if (isLoadingMore) {
      return <ActivityIndicator size="small" color="#007aff" style={{ marginVertical: 10 }} />;
    }
    return null;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.appHeader}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>‹ Back</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{recipientName ?? roomName}</Text>
          </View>
          <Pressable onPress={() => {}} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Info</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
        <View style={styles.appHeader}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>‹ Back</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{recipientName ?? roomName}</Text>
            {!isOnline && <Text style={styles.offlineText}>Offline</Text>}
            <Text style={styles.headerSubtitle}>
              {typingUsers.length > 0 ? 'Someone is typing…' :
                messages.some(m => m.read) ? 'Read' : messages.some(m => m.delivered) ? 'Delivered' : ''}
            </Text>
          </View>
          <Pressable onPress={() => {/* open room info */}} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Info</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item: Message) => item._id}
          renderItem={({item}: { item: Message }) => (
            <View style={[styles.bubble,
              item.fromId === (userId || socketRef.current?.id) ? styles.ownBubble : styles.otherBubble, item.isOffline ? styles.offlineBubble : {}]}>
              <Text style={styles.from}>{item.from}{ item.read ? ' ✓✓' : item.delivered ? ' ✓' : ''}</Text>
              <Text>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={{paddingBottom: 12}}
          onStartReached={loadMoreMessages}
          onStartReachedThreshold={0.1}
          ListHeaderComponent={renderHeader}
        />

        <View style={styles.footer}>
          <Pressable style={styles.iconButton} onPress={() => {/* attach file */}}>
            <Text>📎</Text>
          </Pressable>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={onChangeText}
              placeholder={recipientId ? `Message ${recipientName ?? 'user'}` : 'Type a message'}
              returnKeyType="send"
              onSubmitEditing={send}
            />
          </View>

          <Pressable style={styles.iconButton} onPress={() => {/* start voice */}}>
            <Text>🎤</Text>
          </Pressable>

          <Pressable onPress={send} style={styles.sendButton}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  appHeader: {height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal:12, borderBottomWidth:1, borderColor:'#eee', backgroundColor:'#fafafa'},
  headerButton: {padding:8},
  headerButtonText: {color:'#007aff', fontWeight:'600'},
  headerCenter: {flex:1, alignItems:'center'},
  headerTitle: {fontSize:16, fontWeight:'700'},
  headerSubtitle: {fontSize:12, color:'#888'},
  offlineText: {fontSize: 12, color: 'red'},
  header: {padding: 12, borderBottomWidth: 1, borderColor: '#eee'},
  subText: {fontSize: 12, color: '#888'},
  footer: {flexDirection:'row', alignItems:'center', padding:8, borderTopWidth:1, borderColor:'#eee', backgroundColor:'#fff'},
  iconButton: {padding:8, marginHorizontal:4},
  inputWrapper: {flex:1},
  input: {flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 20, marginRight: 8, backgroundColor:'#fff'},
  sendButton: {backgroundColor: '#007aff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, marginLeft:6},
  sendText: {color: '#fff', fontWeight: '600'},
  bubble: {padding: 8, margin: 8, borderRadius: 8, maxWidth: '80%'},
  ownBubble: {alignSelf: 'flex-end', backgroundColor: '#daf1ff'},
  otherBubble: {alignSelf: 'flex-start', backgroundColor: '#f1f1f1'},
  offlineBubble: {opacity: 0.6},
  from: {fontSize: 12, color: '#555', marginBottom: 4},
});
