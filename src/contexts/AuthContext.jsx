import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login as loginService, logout as logoutService } from '../services/auth.service';
import { setStoredToken, getStoredToken } from '../utils/auth';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getStoredToken();
        if (token) {
          console.log('Token found, fetching user data...');
          const userData = await getCurrentUser();
          console.log('User data received:', userData);
          if (userData) {
            setUser(userData);
          }
        } else {
          console.log('No token found');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await loginService(credentials);
      console.log('Login response:', response);
      
      // The response seems to have this structure: { status: 'success', data: { ... } }
      if (!response?.data) {
        throw new Error('Invalid login response structure');
      }

      const { token, user } = response.data;
      if (!token || !user) {
        throw new Error('Missing token or user data in response');
      }

      setStoredToken(token);
      setUser(user);
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    await logoutService();
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  // Don't show loading indicator for the whole app
  // if (loading) {
  //   return <div>Loading...</div>;
  // }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 