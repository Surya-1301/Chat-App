import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface TypingIndicatorProps {
  isTyping: boolean;
  userName: string;
}

export default function TypingIndicator({ isTyping, userName }: TypingIndicatorProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTyping) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(dot1, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 1, duration: 400, delay: 400, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(dot1, { toValue: 0, duration: 400, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 0, duration: 400, delay: 200, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 0, duration: 400, delay: 400, useNativeDriver: true }),
          ]),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    }
  }, [isTyping, dot1, dot2, dot3]);

  if (!isTyping) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{userName} is typing</Text>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bubble: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
    marginHorizontal: 2,
  },
});
