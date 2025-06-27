import api from '../utils/api';
const API_URL = import.meta.env.VITE_API_URL;

const caseService = {
  getCaseDetails: async (caseId) => {
    try {
      const response = await api.get(`${API_URL}/management/${caseId}`);
      console.log("case details",response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  uploadDocuments: async (formData, onProgress) => {
    try {
      const response = await api.post(`${API_URL}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress?.(progress);
        },
      });
      console.log("upload documents",response.data);
      return response.data;
    } catch (error) {
      console.error('Upload API error:', error.response?.data || error);
      throw error;
    }
  },
};

export default caseService; 