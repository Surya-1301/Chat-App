import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { storage } from '../utils/storage';
import { NavigationProps } from '../types';
import PrimaryButton from '../components/PrimaryButton';
import { theme } from '../theme';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function Auth({ navigation }: NavigationProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, register, googleLogin } = useContext(AuthContext);

  // web-only: use the single web client id env var (may be unset in dev)
  const webClientId =
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';

  // Do not throw here — warn and disable Google sign-in if client id is missing
  const googleEnabled = Boolean(webClientId);
  if (!googleEnabled) {
    // warn once (won't block app)
    // eslint-disable-next-line no-console
    console.warn(
      'Google web client id not set. Set EXPO_PUBLIC_GOOGLE_CLIENT_ID when starting Expo (web) to enable Google Sign-In.'
    );
  }

  // safe: pass clientId (may be empty string). request will be null/undefined if not configured.
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: webClientId || undefined,
    scopes: ['profile', 'email'],
  } as any);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      if (idToken) {
        (async () => {
          try {
            setLoading(true);
            await googleLogin(idToken);
            navigation.replace('Users');
          } catch (err: unknown) {
            console.error('Google sign-in failed', err);
            Alert.alert('Google sign-in failed', (err as any)?.message ?? 'Try again');
          } finally {
            setLoading(false);
            setGoogleLoading(false);
          }
        })();
      } else {
        setGoogleLoading(false);
      }
    } else {
      setGoogleLoading(false);
    }
  }, [response]);

  async function handleGoogleSignIn() {
    if (!googleEnabled) {
      Alert.alert('Google Sign-In disabled', 'Google client id is not configured for web.');
      return;
    }
    if (!request) {
      Alert.alert('Google Sign-In not configured', 'Auth request not initialized.');
      return;
    }
    if (googleLoading) return;
    try {
      setGoogleLoading(true);
      await promptAsync({ useProxy: false } as any);
    } catch (err) {
      console.error('promptAsync error', err);
      Alert.alert('Sign-in error', 'Unable to start Google sign-in. Try again.');
      setGoogleLoading(false);
    }
  }

  async function submit() {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const result = await login(email, password);
        const token = result?.token ?? (result as any)?.data?.token ?? null;
        const user = result?.user ?? (result as any)?.data?.user ?? null;

        if (!token) {
          Alert.alert('Login failed', 'Server did not return a token.');
          return;
        }

        await storage.setToken(token);
        if (user) await storage.setUser(user);
        navigation.replace('Users', { token, user });
      } else {
        const result = await register({ name, email, password });
        const token = result?.token ?? (result as any)?.data?.token ?? null;
        const user = result?.user ?? (result as any)?.data?.user ?? null;

        if (!token) {
          Alert.alert('Register failed', 'Server did not return a token.');
          return;
        }

        await storage.setToken(token);
        if (user) await storage.setUser(user);
        navigation.replace('Users', { token, user });
      }
    } catch (e: any) {
      console.error('[Auth] submit error', e);
      const msg = e?.response?.data?.message ?? e?.message ?? 'An error occurred';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>

      {!isLogin && (
        <TextInput
          placeholder="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          id="name"
          name="name"
          accessibilityLabel="Name"
        />
      )}

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        id="email"
        name="email"
        accessibilityLabel="Email"
        style={styles.input}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        id="password"
        name="password"
        accessibilityLabel="Password"
        style={styles.input}
      />

      <PrimaryButton
        title={loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
        onPress={submit}
        disabled={loading}
        loading={loading}
        style={{ marginTop: theme.spacing(1) }}
      />

      <PrimaryButton
        title={isLogin ? 'Need an account? Register' : 'Have an account? Login'}
        onPress={() => setIsLogin(!isLogin)}
        disabled={loading}
        style={{ backgroundColor: theme.colors.primaryDark, marginTop: theme.spacing(1) }}
      />

      <PrimaryButton
        title="Sign in with Google"
        onPress={handleGoogleSignIn}
        disabled={!googleEnabled || !request || loading || googleLoading}
        style={{ marginTop: theme.spacing(1), backgroundColor: '#DB4437' }}
      />

      {/* optional: show small hint when disabled */}
      {!googleEnabled && (
        <Text style={{ textAlign: 'center', color: '#666', marginTop: 8 }}>
          Google Sign-In disabled — set EXPO_PUBLIC_GOOGLE_CLIENT_ID to enable.
        </Text>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing(2),
    backgroundColor: theme.colors.background,
  },
  title: {
    ...theme.text.title,
    textAlign: 'center',
    marginBottom: theme.spacing(2),
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing(1.5),
    borderRadius: theme.radius.lg,
    fontSize: 16,
    marginBottom: theme.spacing(1.2),
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});
