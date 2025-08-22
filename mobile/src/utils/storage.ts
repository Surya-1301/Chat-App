import * as SecureStore from 'expo-secure-store';

export const storage = {
  async setToken(token: string) {
    try {
      await SecureStore.setItemAsync('authToken', token);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('authToken');
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  },

  async removeToken() {
    try {
      await SecureStore.deleteItemAsync('authToken');
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  },

  async setUser(user: any) {
    try {
      await SecureStore.setItemAsync('user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user:', error);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      const userStr = await SecureStore.getItemAsync('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to retrieve user:', error);
      return null;
    }
  },

  async clearAuth() {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('user');
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }
};
