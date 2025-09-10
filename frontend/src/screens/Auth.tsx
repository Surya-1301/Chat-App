import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Alert, StyleSheet } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import { storage } from '../utils/storage';
import { NavigationProps } from '../types';
import { theme } from '../theme';

export default function Auth({ navigation }: NavigationProps) {
  const { login, register } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    console.log('Auth.submit called', { isLogin, email, password, name }); // <--- debug: verifies button click
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const result = await login(email, password);
        console.log('login result', result); // <--- debug: shows backend response
        const token = result?.token ?? null;
        if (!token) {
          Alert.alert('Login failed', 'Server did not return a token.');
          return;
        }
        await storage.setToken(token);
        if (result.user) await storage.setUser(result.user);
        navigation.replace('Users', { token, user: result.user });
      } else {
        const result = await register({ name, email, password });
        console.log('register result', result); // <--- debug
        const token = result?.token ?? null;
        if (!token) {
          Alert.alert('Register failed', 'Server did not return a token.');
          return;
        }
        await storage.setToken(token);
        if (result.user) await storage.setUser(result.user);
        navigation.replace('Users', { token, user: result.user });
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
          nativeID="name"                     // added: maps to id on web
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
        nativeID="email"                    // added: maps to id on web
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
        nativeID="password"                 // added: maps to id on web
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

      <Text
        style={styles.switchText}
        onPress={() => setIsLogin(!isLogin)}
      >
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  switchText: {
    textAlign: 'center',
    color: '#007BFF',
    marginTop: 16,
  },
});
