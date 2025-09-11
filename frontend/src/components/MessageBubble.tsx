import React, { useState, MouseEvent } from 'react';
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
    if (onReaction) onReaction(message._id, reaction);
    setShowReactions(false);
  };

  const handleContext = (e: MouseEvent) => {
    e.preventDefault();
    setShowReactions((s) => !s);
  };

  const containerStyle: React.CSSProperties = { margin: '8px 0' };
  const baseMessageStyle: React.CSSProperties = {
    padding: 12,
    margin: 4,
    borderRadius: 16,
    maxWidth: '80%',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  };
  const myMessageStyle: React.CSSProperties = { ...baseMessageStyle, marginLeft: 'auto', backgroundColor: theme.colors.primary, color: '#fff' };
  const otherMessageStyle: React.CSSProperties = { ...baseMessageStyle, marginRight: 'auto', backgroundColor: '#fff', border: '1px solid #e0e0e0' };
  const footerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 };
  const smallText: React.CSSProperties = { fontSize: 12, color: '#666' };

  return (
    <div style={containerStyle}>
      {message.replyTo && (
        <div style={{ padding: '0 8px', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>Replying to: {message.replyTo}</span>
        </div>
      )}

      <div
        style={isMine ? myMessageStyle : otherMessageStyle}
        onContextMenu={handleContext}
        onClick={() => onReply && onReply(message)}
        role="button"
        tabIndex={0}
      >
        <div style={{ fontSize: 16, lineHeight: '20px', color: isMine ? '#fff' : '#000' }}>{message.content}</div>
        <div style={footerStyle}>
          <span style={smallText}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isMine && (
            <span style={{ ...smallText, color: message.readAt ? '#34B7F1' : '#666' }}>
              {message.readAt ? '✓✓' : message.deliveredAt ? '✓' : ''}
            </span>
          )}
        </div>
      </div>

      {showReactions && (
        <div style={{ display: 'flex', gap: 6, padding: 8, marginTop: 4 }}>
          {REACTIONS.map((r) => (
            <button key={r} onClick={() => handleReaction(r)} style={{ padding: '4px 8px', borderRadius: 8, border: 'none', background: '#fff', cursor: 'pointer' }}>{r}</button>
          ))}
        </div>
      )}

      {message.reactions && Object.keys(message.reactions).length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
          {Object.entries(message.reactions).map(([userId, reaction]) => (
            <div key={userId} style={{ backgroundColor: '#f0f0f0', borderRadius: 12, padding: '2px 6px', fontSize: 12 }}>{reaction}</div>
          ))}
        </div>
      )}
    </div>
  );
}
