import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, GestureResponderEvent, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface Props {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export default function PrimaryButton({ title, onPress, disabled, loading, style }: Props) {
  return (
    <View style={[styles.wrapper, style, { pointerEvents: (disabled || loading) ? 'none' : 'auto' }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.button, (disabled || loading) && styles.buttonDisabled]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.title}>{title}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing(1.5),
    alignItems: 'center',
    borderRadius: theme.radius.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
