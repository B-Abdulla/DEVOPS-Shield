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
    console.log('[API Request]', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('[API Response]', response.status, response.config.url);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('[API Error Response]', error.response.status, error.response.statusText, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('[API Network Error] No response from server at', baseURL);
      console.error('[Debug] Request:', error.request);
    } else {
      // Request setup error
      console.error('[API Request Setup Error]', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
