/**
 * Axios API Configuration
 * Centralizes API calls with proper base URL and error handling
 */

import axios from 'axios';

// Use relative URL for production (same origin) or env variable for development
const baseURL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000'
);

// Create axios instance with base configuration
const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('[API Config] Initialized with base URL:', baseURL || 'same-origin');

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Silent error handling - errors will be caught by components
    return Promise.reject(error);
  }
);

export default api;
