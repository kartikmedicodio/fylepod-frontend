import axios from 'axios';
import { getStoredToken, removeStoredToken } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    console.log('API Request to:', config.url);
    console.log('Token present:', !!token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added token to request headers');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      console.log('Unauthorized request, clearing token');
      removeStoredToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 