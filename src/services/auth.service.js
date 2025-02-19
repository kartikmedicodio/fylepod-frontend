import api from '../utils/api';

export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    console.log('Raw login response:', response);
    
    if (!response.data || response.data.status !== 'success') {
      throw new Error('Invalid response from server');
    }
    
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
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    console.log('Raw getCurrentUser response:', response);
    
    if (!response.data || response.data.status !== 'success') {
      throw new Error('Invalid response from server');
    }
    
    // Extract the user data from the nested structure
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