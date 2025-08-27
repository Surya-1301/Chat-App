import React from 'react';
import { View, Text } from 'react-native';
import { AuthProvider } from './contexts/AuthContext';

// runtime-safe require of Root (handles missing file / wrong path)
let Root: React.ComponentType = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>App root not found — check ./Root import</Text>
  </View>
);

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod: any = require('./Root');
  Root = mod?.default ?? mod;
} catch (err) {
  // keep fallback Root and log error for debugging
  // eslint-disable-next-line no-console
  console.warn('Failed to load ./Root:', err);
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}