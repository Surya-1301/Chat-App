import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

export const storage = {
  async setToken(token: string) {
    if (isWeb) localStorage.setItem('token', token);
    else await SecureStore.setItemAsync('token', token);
  },
  async getToken(): Promise<string | null> {
    return isWeb ? localStorage.getItem('token') : await SecureStore.getItemAsync('token');
  },
  async removeToken() {
    if (isWeb) localStorage.removeItem('token');
    else await SecureStore.deleteItemAsync('token');
  },
  async setUser(user: any) {
    const v = JSON.stringify(user ?? {});
    if (isWeb) localStorage.setItem('user', v);
    else await SecureStore.setItemAsync('user', v);
  },
  async getUser(): Promise<any | null> {
    const v = isWeb ? localStorage.getItem('user') : await SecureStore.getItemAsync('user');
    return v ? JSON.parse(v) : null;
  },
  async removeUser() {
    if (isWeb) localStorage.removeItem('user');
    else await SecureStore.deleteItemAsync('user');
  },
};
