import api from "../utils/api";

let processingController = null;

export const uploadDocument = async (file, metadata) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", metadata.name);
  formData.append("type", metadata.type);

  const { data } = await api.post("/documents", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data.document;
};

export const getDocuments = async (checkProcessing = false) => {
  try {
    // Cancel previous processing request if exists
    if (checkProcessing && processingController) {
      processingController.abort();
    }

    // Create new controller for processing requests
    const controller = checkProcessing ? new AbortController() : null;
    if (checkProcessing) {
      processingController = controller;
    }

    const response = await api.get("/documents", {
      params: { checkProcessing },
      ...(controller && { signal: controller.signal }),
    });

    if (!response.data?.data?.documents) {
      console.error("Invalid response format:", response.data);
      return [];
    }
    return response.data.data.documents;
  } catch (error) {
    if (error.name === "AbortError") {
      // Ignore abort errors
      return [];
    }
    console.error("Error fetching documents:", error);
    throw error;
  } finally {
    if (checkProcessing) {
      processingController = null;
    }
  }
};

export const getDocument = async (documentId) => {
  try {
    const response = await api.get(`/documents/${documentId}`);
    return response.data.data.document;
  } catch (error) {
    console.error("Error fetching document:", error);
    throw error;
  }
};

export const downloadDocument = async (id) => {
  const response = await api.get(`/documents/${id}/download`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "document.pdf"); // You might want to get the actual filename from the backend
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const deleteDocument = async (id) => {
  try {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};
