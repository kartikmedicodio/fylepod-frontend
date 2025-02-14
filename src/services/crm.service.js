import axios from 'axios';
import { API_URL } from '../config';

const CRMService = {
  // Get all users from the same company
  async getCompanyUsers() {
    const response = await axios.get(`${API_URL}/auth/users`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  // Get completed applications for a specific user
  async getUserCompletedApplications(userId) {
    const response = await axios.get(`${API_URL}/management/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  // Get extracted data for a specific document
  async getExtractedData(documentId) {
    const response = await axios.get(`${API_URL}/documents/${documentId}/extracted`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  // Get pending applications for a user
  async getUserPendingApplications(userId) {
    const response = await axios.get(`${API_URL}/users/${userId}/applications/pending`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  // Get all categories
  async getCategories() {
    const response = await axios.get(`${API_URL}/categories`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  // Assign application to a user
  async assignApplication(data) {
    const response = await axios.post(`${API_URL}/applications/assign`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },
};

export default CRMService; 