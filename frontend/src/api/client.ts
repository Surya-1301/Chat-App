import axios from 'axios';

const BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
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
