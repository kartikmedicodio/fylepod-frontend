import api from '../utils/api';
import { setStoredToken, removeStoredToken, getStoredToken, setStoredUser } from '../utils/auth';
import { disconnectSocket } from '../utils/socket';

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
    // Disconnect the socket before logging out to clean up resources
    console.log('Logging out, disconnecting socket');
    disconnectSocket();
    
    // Call the logout endpoint
    await api.post('/auth/logout');
  } finally {
    // Always remove the token even if the API call fails
    removeStoredToken();
  }
};

export const getCurrentUser = async () => {
  try {
    const token = getStoredToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.get('/auth/me');
    
    if (!response.data || response.data.status !== 'success') {
      throw new Error('Invalid response from server');
    }
    
    const userData = response.data.data.user;
    
    // Store the user data in localStorage for offline access
    if (userData) {
      setStoredUser(userData);
    }
    
    return userData;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

export const updateProfile = async (userData) => {
  const response = await api.put('/auth/profile', userData);
  return response.data;
}; 