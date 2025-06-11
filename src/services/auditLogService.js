import api from '../utils/api';

/**
 * Fetch audit logs for a specific management case
 * @param {string} managementId
 * @param {object} params - Optional query params (page, limit, etc.)
 * @returns {Promise<object>} Response data
 */
export const fetchAuditLogsByManagement = async (managementId, params = {}) => {
  const response = await api.get(`/audit-logs/management/${managementId}`, { params });
  return response.data;
};
