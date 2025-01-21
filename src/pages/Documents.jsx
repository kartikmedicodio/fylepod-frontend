import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getDocuments } from "../services/document.service";
import { useAuth } from '../contexts/AuthContext';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { user } = useAuth();

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await getDocuments(user?.role === 'admin' ? { all: true } : undefined);
      console.log("Fetched documents:", docs);

      if (Array.isArray(docs)) {
        setDocuments(docs);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err.response?.data?.message || "Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (selectedFilter === 'all') return true;
    return doc.status === selectedFilter;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'admin' ? 'View all uploaded documents' : 'View your uploaded documents'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex space-x-2">
          {['all', 'processed', 'processing', 'failed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                selectedFilter === filter
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <div
              key={doc._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium text-gray-900 truncate max-w-[70%]">
                  {doc.name || doc.originalname}
                </h3>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(doc.status)}`}>
                  {doc.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="text-gray-500">
                  Type: <span className="text-gray-700">{doc.type || 'other'}</span>
                </div>
                <div className="text-gray-500">
                  Uploaded: <span className="text-gray-700">{new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
                {doc.uploadedBy && (
                  <div className="text-gray-500">
                    By: <span className="text-gray-700">
                      {doc.uploadedBy.name || doc.uploadedBy.email || 'Unknown'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500">
              {selectedFilter === 'all' 
                ? "No documents have been uploaded yet."
                : `No ${selectedFilter} documents found.`}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Documents;