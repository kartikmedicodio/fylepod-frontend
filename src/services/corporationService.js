import api from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL;
const corporationService = {
  // Get all corporations with pagination
  getAllCorporations: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`${API_URL}/companies`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get corporation by ID - Fix the endpoint URL
  getCorporationById: async (id) => {
    try {
      const response = await api.get(`${API_URL}/companies/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search corporations
  searchCorporations: async (query) => {
    try {
      const response = await api.get(`/companies?search=${query}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateCorporation: async (corporationId, updateData) => {
    try {
      const response = await api.put(`${API_URL}/companies/update/${corporationId}`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default corporationService; 