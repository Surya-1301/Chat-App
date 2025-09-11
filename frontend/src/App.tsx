import React from 'react';
import { View, Text } from './web-shims/react-native-web';
import { AuthProvider } from './contexts/AuthContext';

// runtime-safe require of Root (handles missing file / wrong path)
const FallbackRoot: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>App root not found — check ./Root import</Text>
  </View>
);

// Use React.lazy + dynamic import to load ./Root if present. If import fails,
// the fallback component will be rendered instead.
const LazyRoot = React.lazy(async () => {
  try {
    // Use dynamic import which is understood by bundlers.
    const mod = await import('./Root');
    return { default: (mod as any)?.default ?? mod };
  } catch (e) {
    return { default: FallbackRoot };
  }
});

function RootLoader() {
  return (
    <React.Suspense fallback={<FallbackRoot />}>
      <LazyRoot />
    </React.Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
  <RootLoader />
    </AuthProvider>
  );
}