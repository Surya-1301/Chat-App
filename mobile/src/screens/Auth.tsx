import React, { useState } from 'react';
import { View, Text, TextInput, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { api } from '../api/client';
import { storage } from '../utils/storage';
import { AuthResponse, NavigationProps } from '../types';
import PrimaryButton from '../components/PrimaryButton';
import { theme } from '../theme';

export default function Auth({ navigation }: NavigationProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      console.log('[Auth] submit pressed', { isLogin, emailPresent: !!email, passwordPresent: !!password });
      if (!email || !password || (!isLogin && !name)) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      setLoading(true);
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload: any = isLogin ? { email, password } : { name, email, password };
      console.log('[Auth] calling API', { endpoint, payload });
      
      const { data }: { data: AuthResponse } = await api.post(endpoint, payload);
      console.log('[Auth] success', data);
      
      await storage.setToken(data.token);
      await storage.setUser(data.user);
      
      navigation.replace('Users', { token: data.token, user: data.user });
    } catch (e: any) {
      console.error('[Auth] error', e?.message || e);
      const errorMessage = e?.response?.data?.message || 'An error occurred. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>
      
      {!isLogin && (
        <TextInput 
          placeholder='Name' 
          value={name} 
          onChangeText={setName} 
          style={styles.input}
          autoCapitalize="words"
        />
      )}
      
      <TextInput 
        placeholder='Email' 
        autoCapitalize='none' 
        value={email} 
        onChangeText={setEmail} 
        style={styles.input}
        keyboardType="email-address"
      />
      
      <TextInput 
        placeholder='Password' 
        secureTextEntry 
        value={password} 
        onChangeText={setPassword} 
        style={styles.input}
      />
      
      <PrimaryButton 
        title={loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')} 
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
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
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
    gap: theme.spacing(1.5),
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
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)'
  }
});
