export const theme = {
  colors: {
    primary: '#007AFF',
    primaryDark: '#0A66C2',
    background: '#F6F7F9',
    surface: '#FFFFFF',
    border: '#E6E8EB',
    text: '#111827',
    textMuted: '#6B7280',
    success: '#10B981',
    danger: '#EF4444'
  },
  spacing: (n: number) => n * 8,
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24
  },
  text: {
    title: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: '#111827'
    },
    subtitle: {
      fontSize: 14,
      color: '#6B7280'
    },
    body: {
      fontSize: 16,
      color: '#111827'
    },
    small: {
      fontSize: 12,
      color: '#6B7280'
    }
  },
};
