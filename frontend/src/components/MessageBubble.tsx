import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { theme } from '../theme';
import { SocketMessage } from '../services/socketService';

interface MessageBubbleProps {
  message: SocketMessage;
  isMine: boolean;
  onReaction?: (messageId: string, reaction: string) => void;
  onReply?: (message: SocketMessage) => void;
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export default function MessageBubble({ message, isMine, onReaction, onReply }: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);

  const handleReaction = (reaction: string) => {
    if (onReaction) {
      onReaction(message._id, reaction);
    }
    setShowReactions(false);
  };

  const handleLongPress = () => {
    setShowReactions(!showReactions);
  };

  const renderStatus = () => {
    if (isMine) {
      const delivered = !!message.deliveredAt;
      const read = !!message.readAt;
      const ticks = read ? '✓✓' : delivered ? '✓✓' : '✓';
      const color = read ? '#34B7F1' : '#666';
      return (
        <Text style={[styles.statusText, { color }]}>{ticks}</Text>
      );
    }
    return null;
  };

  const renderReactions = () => {
    if (!showReactions) return null;

    return (
      <View style={[styles.reactionsContainer, isMine ? styles.reactionsRight : styles.reactionsLeft]}>
        {REACTIONS.map((reaction, index) => (
          <TouchableOpacity
            key={index}
            style={styles.reactionButton}
            onPress={() => handleReaction(reaction)}
          >
            <Text style={styles.reactionText}>{reaction}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReply = () => {
    if (!message.replyTo) return null;

    return (
      <View style={styles.replyContainer}>
        <Text style={styles.replyText} numberOfLines={1}>
          Replying to: {message.replyTo}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderReply()}
      
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isMine ? styles.myMessage : styles.otherMessage
        ]}
        onLongPress={handleLongPress}
        onPress={() => onReply && onReply(message)}
      >
        <Text style={styles.messageText}>{message.content}</Text>
        <View style={styles.messageFooter}>
          <Text style={styles.timestamp}>
            {new Date(message.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          {renderStatus()}
        </View>
      </TouchableOpacity>

      {renderReactions()}

      {/* Message reactions display */}
      {message.reactions && Object.keys(message.reactions).length > 0 && (
        <View style={[styles.reactionsDisplay, isMine ? styles.reactionsDisplayRight : styles.reactionsDisplayLeft]}>
          {Object.entries(message.reactions).map(([userId, reaction]) => (
            <View key={userId} style={styles.reactionItem}>
              <Text style={styles.reactionText}>{reaction}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  messageContainer: {
    padding: 12,
    margin: 4,
    borderRadius: 16,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#000',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
  },
  statusText: {
    fontSize: 10,
    color: '#666',
  },
  replyContainer: {
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  replyText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  reactionsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reactionsLeft: {
    alignSelf: 'flex-start',
    marginLeft: 16,
  },
  reactionsRight: {
    alignSelf: 'flex-end',
    marginRight: 16,
  },
  reactionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 2,
  },
  reactionText: {
    fontSize: 16,
  },
  reactionsDisplay: {
    flexDirection: 'row',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  reactionsDisplayLeft: {
    alignSelf: 'flex-start',
    marginLeft: 16,
  },
  reactionsDisplayRight: {
    alignSelf: 'flex-end',
    marginRight: 16,
  },
  reactionItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginHorizontal: 1,
    marginVertical: 1,
  },
});
