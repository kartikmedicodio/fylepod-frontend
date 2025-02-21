import api from '../utils/api';
import { setStoredToken, removeStoredToken, getStoredToken } from '../utils/auth';

export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    if (!response.data || response.data.status !== 'success') {
      throw new Error('Invalid response from server');
    }
    
    const token = response.data.token || response.data.data?.token;
    
    if (!token) {
      throw new Error('No token in response');
    }

    setStoredToken(token);
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    removeStoredToken();
  }
};

export const getCurrentUser = async () => {
  try {
    const token = getStoredToken();
    
    const response = await api.get('/auth/me');
    
    if (!response.data || response.data.status !== 'success') {
      throw new Error('Invalid response from server');
    }
    
    return response.data.data.user;
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (userData) => {
  const response = await api.put('/auth/profile', userData);
  return response.data;
}; 