import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Loader2 } from 'lucide-react';
import { getDocuments } from '../services/document.service';
import { useAuth } from '../contexts/AuthContext';

const ExtractedData = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const docs = await getDocuments(user?.role === 'admin' ? { all: true } : undefined);
        setDocuments(docs);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user?.role]);

  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return "N/A";
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full p-6">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Extracted Data</h1>
            <p className="text-sm text-gray-500 mt-1">
              {user?.role === 'admin' 
                ? 'View extracted data from all documents' 
                : 'View extracted data from your documents'}
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {Array.isArray(documents) && documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc._id || doc.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-medium">
                      {doc.originalname || doc.name || 'Untitled Document'}
                    </h2>
                    {user?.role === 'admin' && doc.uploadedBy && (
                      <p className="text-sm text-gray-500 mt-1">
                        Uploaded by: {doc.uploadedBy.name || doc.uploadedBy.email || 'Unknown'}
                      </p>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                    {doc.type || 'Unknown Type'}
                  </span>
                </div>
                {doc.extractedData ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(doc.extractedData).map(([key, value]) => (
                      <div key={key} className="border rounded-lg p-3">
                        <p className="text-sm text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="font-medium">
                          {renderValue(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">
                    {doc.status === 'processing' 
                      ? 'Document is being processed...' 
                      : 'No extracted data available'}
                  </p>
                )}
                {doc.status === 'processing' && (
                  <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 animate-pulse rounded-full w-1/2"></div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No documents found with extracted data
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExtractedData; 