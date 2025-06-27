import api from '../utils/api';
const API_URL = import.meta.env.VITE_API_URL;


const employeeService = {
  getEmployeeBasicDetails: async (employeeId) => {
    try {
      const response = await api.get(`${API_URL}/auth/users/${employeeId}`);
      console.log("basic details",response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUserCases: async (userId) => {
    try {
      const response = await api.get(`${API_URL}/management/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getEmployeeDocuments: async (employeeId) => {
    try {
      const response = await api.get(`${API_URL}/users/${employeeId}/documents`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default employeeService; 