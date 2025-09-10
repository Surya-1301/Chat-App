import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const storage = {
  setToken: async (t: string) => AsyncStorage.setItem(TOKEN_KEY, t),
  getToken: async () => AsyncStorage.getItem(TOKEN_KEY),
  removeToken: async () => AsyncStorage.removeItem(TOKEN_KEY),

  setUser: async (u: any) => AsyncStorage.setItem(USER_KEY, JSON.stringify(u)),
  getUser: async () => {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  removeUser: async () => AsyncStorage.removeItem(USER_KEY),
};
