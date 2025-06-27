import api from '../utils/api';

/**
 * Get all management cases for the current user
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Object>} Response data containing management cases
 */
export const getManagementCases = async (filters = {}) => {
  try {
    const response = await api.get('/management', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching management cases:', error);
    throw error;
  }
};

/**
 * Get a single management case by ID
 * @param {string} caseId - The ID of the management case to fetch
 * @returns {Promise<Object>} Response data containing the management case
 */
export const getManagementCase = async (caseId) => {
  try {
    const response = await api.get(`/management/${caseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching management case ${caseId}:`, error);
    throw error;
  }
};

/**
 * Get management cases for a specific user
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object>} Response data containing management cases
 */
export const getUserManagementCases = async (userId) => {
  try {
    const response = await api.get(`/management/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching management cases for user ${userId}:`, error);
    throw error;
  }
}; 