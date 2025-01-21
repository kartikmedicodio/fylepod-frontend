import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize user from localStorage if available
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [pendingFormsCount, setPendingFormsCount] = useState(0);
  const [completedFormsCount, setCompletedFormsCount] = useState(0);
  const navigate = useNavigate();

  // Update localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user?._id) {
      fetchPendingForms();
    }
  }, [user?._id]);

  const fetchPendingForms = async (userId = null) => {
    try {
      const id = userId || user?._id;
      if (!id) return;

      const response = await api.get(`/management/user/${id}`, {
        params: {
          status: 'pending'
        }
      });
      
      const pendingForms = response.data.data.entries || [];
      setPendingFormsCount(pendingForms.length);
    } catch (err) {
      console.error('Error fetching pending forms count:', err);
    }
  };

  const fetchFormsCount = async (userId = null) => {
    try {
      const id = userId || user?._id;
      if (!id) return;

      // Fetch pending forms
      const pendingResponse = await api.get(`/management/user/${id}`, {
        params: { status: 'pending' }
      });
      setPendingFormsCount(pendingResponse.data.data.entries?.length || 0);

      // Fetch completed forms
      const completedResponse = await api.get(`/management/user/${id}`, {
        params: { status: 'completed' }
      });
      setCompletedFormsCount(completedResponse.data.data.entries?.length || 0);
    } catch (err) {
      console.error('Error fetching forms count:', err);
    }
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        // Verify token is still valid with backend
        const response = await api.get('/auth/me');
        const freshUserData = response.data.data.user;
        
        // Update stored user data with fresh data from server
        localStorage.setItem('user', JSON.stringify(freshUserData));
        setUser(freshUserData);
      } else {
        // If either token or user data is missing, clear both
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data.data;
      
      // Store both token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      await fetchPendingForms(userData._id);
      
      window.location.href = '/pending-forms';
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear both token and user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPendingFormsCount(0);
    navigate('/login');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    pendingFormsCount,
    completedFormsCount,
    refreshFormsCount: fetchFormsCount
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 