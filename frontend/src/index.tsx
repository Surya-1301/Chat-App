import 'react-native-gesture-handler';
import React from 'react';
import { registerRootComponent } from 'expo';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

registerRootComponent(Root);