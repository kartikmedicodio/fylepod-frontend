import axios from 'axios';
import { API_URL } from '../config';

const CRMService = {
  // Get all users from the same company
  async getCompanyUsers() {
    try {
      const response = await axios.get(`${API_URL}/auth/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get completed applications for a specific user
  async getUserCompletedApplications(userId) {
    try {
      const response = await axios.get(`${API_URL}/management/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get extracted data for a specific document
  async getExtractedData(documentId) {
    try {
      const response = await axios.get(`${API_URL}/documents/${documentId}/extracted`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUserPendingApplications: (userId) => {
    return axios.get(`${API_URL}/users/${userId}/applications/pending`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },
};

export default CRMService; 