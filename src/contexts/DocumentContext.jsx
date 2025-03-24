import React, { createContext, useContext, useState } from 'react';

const DocumentContext = createContext();

export const useDocumentContext = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return context;
};

export const DocumentProvider = ({ children }) => {
  const [documentDetailsMap, setDocumentDetailsMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchDocumentDetails = async (documents) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token || documents.length === 0) {
        setIsLoading(false);
        return;
      }

      // Get all document IDs
      const documentIds = documents.map(doc => doc.id);
      
      // Make a single API call to fetch all document details
      const response = await fetch(`https://api-dev.relayzen.com/api/documents/management-docs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          managementId: documents[0]?.managementId,
          docTypeIds: documentIds
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert the response to a map for easy lookup
      const detailsMap = data.data.documents.reduce((acc, doc) => {
        acc[doc.managementDocumentId] = doc;
        return acc;
      }, {});

      setDocumentDetailsMap(detailsMap);
    } catch (error) {
      console.error('Error fetching document details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DocumentContext.Provider 
      value={{ 
        documentDetailsMap, 
        isLoading, 
        fetchDocumentDetails 
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}; 