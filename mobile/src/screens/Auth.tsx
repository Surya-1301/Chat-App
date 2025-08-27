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

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  // removed expoClientId to satisfy types

  if (typeof window !== 'undefined' && !webClientId) {
    throw new Error('Client Id property `webClientId` must be defined to use Google auth on this platform. Set EXPO_PUBLIC_GOOGLE_CLIENT_ID when starting Expo.');
  }

  // keep only keys supported by the typed config
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: webClientId,        // use clientId for web when types expect it
    androidClientId,
    iosClientId,
    webClientId,
    scopes: ['profile', 'email'],
  } as any); // cast to any to avoid strict type mismatches

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
    if (!request) {
      Alert.alert('Google Sign-in not configured', 'Missing Google client id or request initialization.');
      return;
    }
    if (googleLoading) return;
    try {
      setGoogleLoading(true);
      // cast options to any to avoid TS complaining about useProxy typing
      await promptAsync({ useProxy: true } as any);
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
        // call login with (email, password)
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
        // call register with full payload (name required)
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

  // print redirect URIs for debugging (cast options to any)
  console.log('Redirect URI (useProxy true) =', makeRedirectUri({ useProxy: true } as any));
  console.log('Redirect URI (no proxy) =', makeRedirectUri({ useProxy: false } as any));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>

      {!isLogin && (
        <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} autoCapitalize="words" />
      )}

      <TextInput placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />

      <PrimaryButton title={loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'} onPress={submit} disabled={loading} loading={loading} style={{ marginTop: theme.spacing(1) }} />

      <PrimaryButton title={isLogin ? 'Need an account? Register' : 'Have an account? Login'} onPress={() => setIsLogin(!isLogin)} disabled={loading} style={{ backgroundColor: theme.colors.primaryDark, marginTop: theme.spacing(1) }} />

      <PrimaryButton title="Sign in with Google" onPress={handleGoogleSignIn} disabled={!request || loading || googleLoading} style={{ marginTop: theme.spacing(1), backgroundColor: '#DB4437' }} />

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
