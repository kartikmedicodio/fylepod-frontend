import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Upload, Loader2, Check, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';

const UploadForm = () => {
  const { categoryId } = useParams();
  const { user } = useAuth();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploading, setUploading] = useState(false);

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
      setUploading(true);
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
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return <Navigate to={`/login?redirect=/upload-form/${categoryId}`} />;
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

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-primary-50 p-6 border-b">
            <h1 className="text-2xl font-semibold text-primary-900">{category?.name}</h1>
            <p className="mt-2 text-gray-600">{category?.description}</p>
          </div>

          {/* Document Upload Form */}
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            {/* Required Documents Section */}
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4 flex items-center text-red-600">
                <AlertCircle className="w-5 h-5 mr-2" />
                Required Documents
              </h2>
              <div className="space-y-4">
                {category?.documentTypes
                  .filter(doc => doc.required)
                  .map((docType) => (
                    <DocumentUploadField
                      key={docType._id}
                      docType={docType}
                      uploaded={uploadedFiles[docType._id]}
                      onUpload={handleFileUpload}
                      uploading={uploading}
                    />
                  ))}
              </div>
            </div>

            {/* Optional Documents Section */}
            {category?.documentTypes.some(doc => !doc.required) && (
              <div>
                <h2 className="text-lg font-medium mb-4 text-gray-600">
                  Optional Documents
                </h2>
                <div className="space-y-4">
                  {category?.documentTypes
                    .filter(doc => !doc.required)
                    .map((docType) => (
                      <DocumentUploadField
                        key={docType._id}
                        docType={docType}
                        uploaded={uploadedFiles[docType._id]}
                        onUpload={handleFileUpload}
                        uploading={uploading}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Document Upload Field Component
const DocumentUploadField = ({ docType, uploaded, onUpload, uploading }) => (
  <div className="border rounded-lg p-4 bg-gray-50">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-medium">{docType.name}</h3>
      </div>
      {uploaded ? (
        <div className="flex items-center text-green-600">
          <Check className="w-5 h-5 mr-2" />
          <span>Uploaded</span>
        </div>
      ) : (
        <label className="cursor-pointer bg-white border border-primary-300 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors">
          <input
            type="file"
            className="hidden"
            onChange={(e) => onUpload(docType, e.target.files[0])}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            disabled={uploading}
          />
          <div className="flex items-center">
            {uploading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Upload className="w-5 h-5 mr-2" />
            )}
            {uploading ? 'Uploading...' : 'Upload'}
          </div>
        </label>
      )}
    </div>
    {uploaded && (
      <div className="mt-2 text-sm text-gray-600">
        File: {uploaded.originalname}
      </div>
    )}
  </div>
);

export default UploadForm; 