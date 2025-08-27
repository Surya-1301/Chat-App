import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { client, setAuthToken } from '../api/client';

type AuthPayload = { token: string; user?: any };

type AuthContextType = {
  token: string | null;
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthPayload>;
  register: (payload: { name: string; email: string; password: string }) => Promise<AuthPayload>;
  logout: () => Promise<void>;
};

const noop = async () => ({ token: '', user: null } as AuthPayload);

export const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  loading: true,
  login: noop,
  register: noop,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('token');
        const uRaw = await AsyncStorage.getItem('user');
        const u = uRaw ? JSON.parse(uRaw) : null;
        if (t) {
          setToken(t);
          setAuthToken(t);
        }
        if (u) setUser(u);
      } catch (err) {
        console.error('AuthProvider load error', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const normalize = (res: any) => res?.data ?? res ?? {};

  const login = async (email: string, password: string) => {
    const res = await client.post('/auth/login', { email, password });
    const data = normalize(res);
    if (!data?.token) throw new Error(data?.message || 'No token returned');
    await AsyncStorage.setItem('token', data.token);
    if (data.user) await AsyncStorage.setItem('user', JSON.stringify(data.user));
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user ?? null);
    return { token: data.token, user: data.user };
  };

  const register = async (payload: { name: string; email: string; password: string }) => {
    const res = await client.post('/auth/register', payload);
    const data = normalize(res);
    if (!data?.token) throw new Error(data?.message || 'No token returned');
    await AsyncStorage.setItem('token', data.token);
    if (data.user) await AsyncStorage.setItem('user', JSON.stringify(data.user));
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user ?? null);
    return { token: data.token, user: data.user };
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (e) {
      console.warn('logout remove storage error', e);
    }
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};