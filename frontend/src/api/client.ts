import axios from 'axios';

// Prefer CRA env var, fall back to Expo-style for backwards compatibility.
const BASE = (process.env.REACT_APP_API_URL as string) || (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:4000';
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
