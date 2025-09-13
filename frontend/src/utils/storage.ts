const webStorage = {
  getItem: async (k: string) => Promise.resolve(localStorage.getItem(k)),
  setItem: async (k: string, v: string) => Promise.resolve(localStorage.setItem(k, v)),
  removeItem: async (k: string) => Promise.resolve(localStorage.removeItem(k)),
};

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const storage = {
  getItem: webStorage.getItem,
  setItem: webStorage.setItem,
  removeItem: webStorage.removeItem,

  setToken: async (t: string) => webStorage.setItem(TOKEN_KEY, t),
  getToken: async () => webStorage.getItem(TOKEN_KEY),
  removeToken: async () => webStorage.removeItem(TOKEN_KEY),

  setUser: async (u: any) => webStorage.setItem(USER_KEY, JSON.stringify(u)),
  getUser: async () => {
    const raw = await webStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  removeUser: async () => webStorage.removeItem(USER_KEY),
};
