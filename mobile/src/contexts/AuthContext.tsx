import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { client, setAuthToken } from '../api/client';

type AuthPayload = { token: string; user?: any };

type AuthContextType = {
  token: string | null;
  userId: string | null;
  login: (email: string, password: string) => Promise<AuthPayload>;
  register: (payload: { name: string; email: string; password: string }) => Promise<AuthPayload>;
  googleLogin: (idToken: string) => Promise<AuthPayload>;
  logout: () => Promise<void>;
};

const noop = async (..._args: any[]) => { return null as any; };

export const AuthContext = createContext<AuthContextType>({
  token: null,
  userId: null,
  login: noop,
  register: noop,
  googleLogin: noop,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('token');
        if (t) {
          setToken(t);
          setAuthToken(t);
        }
      } catch (e) {
        console.error('AuthProvider load token error', e);
      }
    })();
  }, []);

  const normalize = (res: any) => res?.data ?? res ?? {};

  const login = async (email: string, password: string) => {
    const res = await client.post('/auth/login', { email, password });
    const data = normalize(res);
    if (!data?.token) throw new Error(data?.message || 'Invalid response');
    await AsyncStorage.setItem('token', data.token);
    setAuthToken(data.token);
    setToken(data.token);
    setUserId(data.user?.id ?? null);
    return { token: data.token, user: data.user };
  };

  const register = async (payload: { name: string; email: string; password: string }) => {
    const res = await client.post('/auth/register', payload);
    const data = normalize(res);
    if (!data?.token) throw new Error(data?.message || 'Invalid response');
    await AsyncStorage.setItem('token', data.token);
    setAuthToken(data.token);
    setToken(data.token);
    setUserId(data.user?.id ?? null);
    return { token: data.token, user: data.user };
  };

  const googleLogin = async (idToken: string) => {
    const res = await client.post('/auth/google', { idToken });
    const data = normalize(res);
    if (!data?.token) throw new Error(data?.message || 'Invalid response');
    await AsyncStorage.setItem('token', data.token);
    setAuthToken(data.token);
    setToken(data.token);
    setUserId(data.user?.id ?? null);
    return { token: data.token, user: data.user };
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
    } catch (e) {}
    setAuthToken(null);
    setToken(null);
    setUserId(null);
  };

  console.log('EXPO_PUBLIC_API_URL=', process.env.EXPO_PUBLIC_API_URL);
  const BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
  console.log('API base used by client =', BASE);

  return (
    <AuthContext.Provider value={{ token, userId, login, register, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};