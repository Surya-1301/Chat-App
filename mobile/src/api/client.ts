import axios from 'axios';
import { config } from '../config/env';

export const api = axios.create({ 
  baseURL: config.API_URL,
  timeout: 10000
});

// Add request interceptor for auth
api.interceptors.request.use((config) => {
  // Add auth token from secure storage here when implemented
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access');
    }
    return Promise.reject(error);
  }
);
