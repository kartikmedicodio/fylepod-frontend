import api from '../utils/api';
import { setStoredToken, removeStoredToken, getStoredToken } from '../utils/auth';

export const login = async (credentials) => {
  try {
    // Log the credentials being sent (remove in production)
    console.log('Attempting login with credentials:', {
      ...credentials,
      password: '[REDACTED]'
    });

    const response = await api.post('/auth/login', credentials);
    console.log('Raw login response:', {
      status: response.status,
      data: response.data,
      hasToken: !!response.data?.token || !!response.data?.data?.token
    });
    
    if (!response.data || response.data.status !== 'success') {
      throw new Error('Invalid response from server');
    }
    
    // Make sure we're getting the token from the correct path in the response
    const token = response.data.token || response.data.data?.token;
    console.log('Token found:', !!token);
    
    if (!token) {
      throw new Error('No token in response');
    }

    console.log('Storing token...');
    setStoredToken(token);
    console.log('Token stored successfully');
    
    return response.data;
  } catch (error) {
    console.error('Login request failed:', error);
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
  } catch (error) {
    console.error('Logout request failed:', error);
  } finally {
    removeStoredToken();
  }
};

export const getCurrentUser = async () => {
  try {
    const token = getStoredToken();
    console.log('getCurrentUser - token exists:', !!token);
    
    const response = await api.get('/auth/me');
    console.log('Raw getCurrentUser response:', {
      status: response.status,
      data: response.data,
      hasUser: !!response.data?.data?.user
    });
    
    if (!response.data || response.data.status !== 'success') {
      throw new Error('Invalid response from server');
    }
    
    return response.data.data.user;
  } catch (error) {
    console.error('getCurrentUser request failed:', error);
    throw error;
  }
};

export const updateProfile = async (userData) => {
  const response = await api.put('/auth/profile', userData);
  return response.data;
}; 