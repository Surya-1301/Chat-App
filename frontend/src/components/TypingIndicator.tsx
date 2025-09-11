import React from 'react';

const DOT_STYLE: React.CSSProperties = { width: 6, height: 6, borderRadius: 3, backgroundColor: '#999', margin: '0 2px', display: 'inline-block', opacity: 0.3 };

interface TypingIndicatorProps {
  isTyping: boolean;
  userName: string;
}

export default function TypingIndicator({ isTyping, userName }: TypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <div style={{ padding: '8px 16px' }}>
      <div style={{ backgroundColor: '#f0f0f0', borderRadius: 20, padding: '8px 16px', display: 'inline-block', maxWidth: '80%' }}>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>{userName} is typing</div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ ...DOT_STYLE, animation: 'dotAnim 1s infinite' }} />
          <span style={{ ...DOT_STYLE, animation: 'dotAnim 1s 0.2s infinite' }} />
          <span style={{ ...DOT_STYLE, animation: 'dotAnim 1s 0.4s infinite' }} />
        </div>
      </div>
      <style>{`@keyframes dotAnim { 0% { opacity: 0.2 } 50% { opacity: 1 } 100% { opacity: 0.2 } }`}</style>
    </div>
  );
}
