import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Upload, Loader2, Check } from 'lucide-react';
import api from '../utils/api';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';

const UploadDocuments = () => {
  const { categoryId } = useParams();
  const { user } = useAuth();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await api.get(`/categories/${categoryId}`);
        setCategory(response.data.data.category);
      } catch (err) {
        setError(err.message || 'Failed to fetch category details');
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  const handleFileUpload = async (documentType, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType.name);
      formData.append('categoryId', categoryId);

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadedFiles(prev => ({
        ...prev,
        [documentType._id]: response.data.data.document
      }));
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    }
  };

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to={`/login?redirect=/upload/${categoryId}`} />;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">{category?.name}</h1>
          <p className="text-gray-600 mt-1">{category?.description}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Required Documents</h2>
          <div className="space-y-4">
            {category?.documentTypes.map((docType) => (
              <div
                key={docType._id}
                className="border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{docType.name}</h3>
                    <p className="text-sm text-gray-500">
                      {docType.required ? 'Required' : 'Optional'}
                    </p>
                  </div>
                  {uploadedFiles[docType._id] ? (
                    <div className="flex items-center text-green-600">
                      <Check className="w-5 h-5 mr-2" />
                      <span>Uploaded</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer bg-primary-50 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-100">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileUpload(docType, e.target.files[0])}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      <Upload className="w-5 h-5 inline-block mr-2" />
                      Upload
                    </label>
                  )}
                </div>
                {uploadedFiles[docType._id] && (
                  <div className="text-sm text-gray-600 mt-2">
                    File: {uploadedFiles[docType._id].originalname}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UploadDocuments; 