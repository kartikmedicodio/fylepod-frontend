import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login as loginService, logout as logoutService } from '../services/auth.service';
import { setStoredToken, getStoredToken, removeStoredToken, setStoredUser, getStoredUser, removeStoredUser } from '../utils/auth';
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

        // Try to get user from localStorage first
        const storedUser = getStoredUser();
        
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
          
          // Refresh user data in the background
          try {
            const freshUserData = await getCurrentUser();
            if (freshUserData) {
              setUser(freshUserData);
              setStoredUser(freshUserData);
            }
          } catch (error) {
            console.error('Error refreshing user data:', error);
          }
        } else {
          // If no stored user, fetch from API
          try {
            const userData = await getCurrentUser();
            
            if (userData) {
              setUser(userData);
              setIsAuthenticated(true);
              setStoredUser(userData);
            } else {
              setUser(null);
              setIsAuthenticated(false);
              removeStoredToken();
              removeStoredUser();
            }
          } catch (error) {
            console.error('User data fetch error:', error);
            setUser(null);
            setIsAuthenticated(false);
            removeStoredToken();
            removeStoredUser();
          }
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        setUser(null);
        setIsAuthenticated(false);
        removeStoredToken();
        removeStoredUser();
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
      
      // Fetch complete user data from /auth/me endpoint
      try {
        const completeUserData = await getCurrentUser();
        if (completeUserData) {
          setUser(completeUserData);
          setStoredUser(completeUserData);
        }
      } catch (error) {
        console.error('Error fetching complete user data:', error);
        // Still save the basic user info we have
        setStoredUser(user);
      }
      
      return user;
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      removeStoredToken();
      removeStoredUser();
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
      removeStoredUser();
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