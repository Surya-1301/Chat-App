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
} from '../web-shims/react-native-web';
import io, { Socket } from 'socket.io-client';
import { AuthContext } from '../contexts/AuthContext';

type Message = {
  id: string;
  text: string;
  ts: number;
  from: string;
  fromId?: string;
  toId?: string;
  roomId?: string | null;
  delivered?: boolean;
  read?: boolean;
};

type RouteProps = {
  params?: {
    roomId?: string | null;
    roomName?: string;
    // For private chats pass recipientSocketId (or recipient user id if server maps users)
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
  const { token, userId } = useContext(AuthContext); // userId exposed by AuthContext
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
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      // identify to server (prefer stable userId, fallback to token or socket id)
      socketRef.current?.emit('identify', { token, userId, socketId: socketRef.current?.id });
      if (roomId) socketRef.current?.emit('join', roomId);
      prevRoomRef.current = roomId ?? null;
    });

    socketRef.current.on('message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      // if the incoming message is to this user (private) send delivered ack
      if (msg.toId && socketRef.current) {
        socketRef.current.emit('delivered', { messageId: msg.id, to: msg.toId, fromId: msg.fromId });
      }
    });

    socketRef.current.on('private_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      // acknowledge delivery to sender
      if (msg.toId && socketRef.current) {
        socketRef.current.emit('delivered', { messageId: msg.id, to: msg.toId, fromId: msg.fromId });
      }
    });

    socketRef.current.on('delivered', ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.map(m => m.id === messageId ? {...m, delivered: true} : m));
    });

    socketRef.current.on('read', ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.map(m => m.id === messageId ? {...m, read: true} : m));
    });

    socketRef.current.on('typing', (payload: { userId: string; room?: string | null; typing: boolean; fromId?:string }) => {
      const { userId, room, typing } = payload;
      if (room && room !== roomId) return;
      // for private typing payload may contain fromId and toId; only show if matches recipient
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;
    if (prevRoomRef.current && prevRoomRef.current !== roomId) {
      socketRef.current.emit('leave', prevRoomRef.current);
    }
    if (roomId) socketRef.current.emit('join', roomId);
    prevRoomRef.current = roomId ?? null;

    // If this is a private chat, mark messages as read when opening
    if (recipientId && socketRef.current) {
      const unread = messages.filter(m => m.toId === socketRef.current?.id && !m.read);
      unread.forEach(m => socketRef.current?.emit('read', { messageId: m.id, fromId: m.fromId }));
      setMessages((prev) => prev.map(m => (m.toId === socketRef.current?.id ? {...m, read:true} : m)));
    }
  }, [roomId, recipientId]);

  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      try {
  (listRef.current as HTMLDivElement).scrollTop = 999999;
      } catch (e) {}
    }
  }, [messages]);

  const send = () => {
    if (!message.trim() || !socketRef.current) return;
    const payload: Message = {
      id: genId(),
      text: message.trim(),
      ts: Date.now(),
      from: 'Me',
      fromId: userId ?? socketRef.current.id,
      toId: recipientId ?? undefined,
      roomId: recipientId ? undefined : roomId ?? null,
      delivered: false,
      read: false,
    };

    if (recipientId) {
      socketRef.current.emit('private_message', payload);
    } else {
      socketRef.current.emit('message', payload);
    }

    setMessages((prev) => [...prev, payload]);
    setMessage('');
    Keyboard.dismiss();
    emitTyping(false);
  };

  const emitTyping = (isTyping: boolean) => {
    if (!socketRef.current) return;
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
        {/* Header */}
        <View style={styles.appHeader}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>‹ Back</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{recipientName ?? roomName}</Text>
            <Text style={styles.headerSubtitle}>
              {typingUsers.length > 0 ? 'Someone is typing…' :
                messages.some(m => m.read) ? 'Read' : messages.some(m => m.delivered) ? 'Delivered' : ''}
            </Text>
          </View>
          <Pressable onPress={() => {/* open room info */}} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Info</Text>
          </Pressable>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item: Message) => item.id}
          renderItem={({item}: { item: Message }) => (
            <View style={[styles.bubble,
              item.fromId === socketRef.current?.id ? styles.ownBubble : styles.otherBubble]}>
              <Text style={styles.from}>{item.from}{ item.read ? ' ✓✓' : item.delivered ? ' ✓' : ''}</Text>
              <Text>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={{paddingBottom: 12}}
        />

        {/* Footer */}
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
  header: {padding: 12, borderBottomWidth: 1, borderColor: '#eee'}, // kept for compatibility
  headerText: {fontSize: 18, fontWeight: '600'},
  subText: {fontSize: 12, color: '#888'},
  footer: {flexDirection:'row', alignItems:'center', padding:8, borderTopWidth:1, borderColor:'#eee', backgroundColor:'#fff'},
  iconButton: {padding:8, marginHorizontal:4},
  inputWrapper: {flex:1},
  inputRow: {flexDirection: 'row', padding: 12, borderTopWidth: 1, borderColor: '#eee', alignItems:'center'},
  input: {flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 20, marginRight: 8, backgroundColor:'#fff'},
  sendButton: {backgroundColor: '#007aff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, marginLeft:6},
  sendText: {color: '#fff', fontWeight: '600'},
  bubble: {padding: 8, margin: 8, borderRadius: 8, maxWidth: '80%'},
  ownBubble: {alignSelf: 'flex-end', backgroundColor: '#daf1ff'},
  otherBubble: {alignSelf: 'flex-start', backgroundColor: '#f1f1f1'},
  from: {fontSize: 12, color: '#555', marginBottom: 4},
});