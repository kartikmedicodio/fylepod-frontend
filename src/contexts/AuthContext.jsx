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
        
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        const userData = await getCurrentUser();
        
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          removeStoredToken();
        }
      } catch (error) {
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
      const response = await loginService(credentials);
      
      if (!response?.data?.token) {
        throw new Error('No token received from server');
      }

      if (!response?.data?.user) {
        throw new Error('No user data received from server');
      }

      const { token, user } = response.data;
      
      setStoredToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      return user;
    } catch (error) {
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