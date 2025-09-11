import React from 'react';
import { theme } from '../theme';

interface Props {
  title: string;
  onPress: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  style?: React.CSSProperties | any;
}

export default function PrimaryButton({ title, onPress, disabled, loading, style }: Props) {
  const blocked = Boolean(disabled || loading);
  const wrapperStyle: React.CSSProperties = { width: '100%', ...(style || {}) };
  const buttonStyle: React.CSSProperties = {
    backgroundColor: theme.colors.primary,
    padding: '10px 16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.lg,
    border: 'none',
    cursor: blocked ? 'not-allowed' : 'pointer',
    opacity: blocked ? 0.6 : 1,
  };

  return (
    <div style={wrapperStyle}>
      <button onClick={onPress} disabled={blocked} style={buttonStyle}>
        {loading ? 'Loading...' : <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{title}</span>}
      </button>
    </div>
  );
}
