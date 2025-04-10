import api from '../utils/api';

/**
 * Get all queries for the current user (filtered by backend based on user role)
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status
 * @param {string} filters.managementId - Filter by management ID
 * @returns {Promise<Object>} Response data containing queries
 */
export const getQueries = async (filters = {}) => {
  try {
    const response = await api.get('/queries', {
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching queries:', error);
    throw error;
  }
};

/**
 * Get a single query by ID
 * @param {string} queryId - The ID of the query to fetch
 * @returns {Promise} - Promise with the query data
 */
export const getQuery = async (queryId) => {
  try {
    const response = await api.get(`/queries/${queryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching query ${queryId}:`, error);
    throw error;
  }
};

/**
 * Add a response to a query
 * @param {string} queryId - The ID of the query to respond to
 * @param {string} content - The content of the response
 * @returns {Promise} - Promise with the updated query data
 */
export const addResponse = async (queryId, content) => {
  try {
    const response = await api.post(`/queries/${queryId}/responses`, { content });
    return response.data;
  } catch (error) {
    console.error(`Error adding response to query ${queryId}:`, error);
    throw error;
  }
};

/**
 * Update the status of a query
 * @param {string} queryId - The ID of the query to update
 * @param {string} status - The new status for the query
 * @returns {Promise} - Promise with the updated query data
 */
export const updateQueryStatus = async (queryId, status) => {
  try {
    const response = await api.patch(`/queries/${queryId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating query status:', error);
    throw error;
  }
};

/**
 * Get all queries for a specific management case
 * @param {string} managementId - The ID of the management case
 * @returns {Promise} - Promise with the queries data
 */
export const getManagementQueries = async (managementId) => {
  try {
    const response = await api.get(`/queries/management/${managementId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching queries for management ${managementId}:`, error);
    throw error;
  }
};

/**
 * Create a new query
 * @param {Object} queryData - The data for the new query
 * @param {string} queryData.managementId - The ID of the management case
 * @param {string} queryData.query - The query content
 * @returns {Promise} - Promise with the created query data
 */
export const createQuery = async (queryData) => {
  try {
    const response = await api.post('/queries', queryData);
    return response.data;
  } catch (error) {
    console.error('Error creating query:', error);
    throw error;
  }
}; 