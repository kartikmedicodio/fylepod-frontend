import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login as loginService, logout as logoutService } from '../services/auth.service';
import { setStoredToken, getStoredToken, removeStoredToken } from '../utils/auth';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const token = getStoredToken();
        console.log('Checking auth - token:', token ? 'exists' : 'missing');
        
        if (!token) {
          console.log('No token found during auth check');
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        console.log('Token found, fetching user data...');
        const userData = await getCurrentUser();
        console.log('User data received:', userData);
        
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
          console.log('Authentication successful');
        } else {
          console.log('User data invalid, clearing auth state');
          setUser(null);
          setIsAuthenticated(false);
          removeStoredToken();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
        removeStoredToken();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      console.log('Attempting login...');
      const response = await loginService(credentials);
      
      if (!response?.data?.token) {
        throw new Error('No token received from server');
      }

      if (!response?.data?.user) {
        throw new Error('No user data received from server');
      }

      const { token, user } = response.data;
      
      console.log('Setting auth data...');
      setStoredToken(token);
      setUser(user);
      setIsAuthenticated(true);
      console.log('Login successful');
      
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      removeStoredToken();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutService();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
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