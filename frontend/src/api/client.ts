import axios from 'axios';

// Prefer CRA env var, fall back to Expo-style for backwards compatibility.
const BASE = 'https://chat-app-flax-zeta.vercel.app/api';
export const client = axios.create({
  baseURL: BASE,
  timeout: 15000,
});

// Provide legacy alias `api` used across the codebase
export const api = client;

export function setAuthToken(token?: string | null) {
  if (token) client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete client.defaults.headers.common['Authorization'];
}
