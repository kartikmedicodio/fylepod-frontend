import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Upload, Loader2, CheckCircle, Wand2 } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';

const PendingForms = () => {
  const { user } = useAuth();
  const [pendingForms, setPendingForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState({});
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [autoFilling, setAutoFilling] = useState(false);

  useEffect(() => {
    if (user?._id) {
      Promise.all([fetchPendingForms(), fetchExistingDocuments()]);
    }
  }, [user?._id]);

  const fetchExistingDocuments = async () => {
    try {
      const response = await api.get('/documents', {
        params: {
          checkProcessing: false
        }
      });
      
      console.log('Existing documents:', response.data);
      setExistingDocuments(response.data.data.documents);
    } catch (err) {
      console.error('Error fetching existing documents:', err);
    }
  };

  const handleAutoFill = async (documents) => {
    try {
      setAutoFilling(true);
      let autoFilledCount = 0;

      for (const form of pendingForms) {
        for (const docType of form.documentTypes) {
          if (docType.status === 'completed') continue;

          const matchingDoc = documents.find(doc => 
            doc.type.toLowerCase().trim() === docType.name.toLowerCase().trim()
          );

          if (matchingDoc) {
            console.log(`Found matching document for ${docType.name}`);
            try {
              await updateDocumentStatus(form._id, docType.documentTypeId);
              autoFilledCount++;
            } catch (err) {
              console.error(`Error auto-filling document ${docType.name}:`, err);
            }
          }
        }
      }

      if (autoFilledCount > 0) {
        await fetchPendingForms();
      }
      
      alert(`Auto-filled ${autoFilledCount} document${autoFilledCount !== 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Error in auto-fill process:', err);
      setError('Failed to auto-fill documents');
    } finally {
      setAutoFilling(false);
    }
  };

  const fetchPendingForms = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/management/user/${user._id}`, {
        params: {
          status: 'pending'
        }
      });

      console.log('Fetched pending forms:', response.data);
      setPendingForms(response.data.data.entries);
    } catch (err) {
      console.error('Error fetching pending forms:', err);
      setError(err.response?.data?.message || 'Failed to fetch pending forms');
    } finally {
      setLoading(false);
    }
  };

  const updateDocumentStatus = async (managementId, documentTypeId) => {
    try {
      console.log('Updating status for:', { managementId, documentTypeId });
      
      const response = await api({
        method: 'PATCH',
        url: `/management/${managementId}/documents/${documentTypeId}/status`,
        data: { status: 'completed' },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Status update response:', response.data);

      if (response.data.status === 'success') {
        await fetchPendingForms();
      } else {
        throw new Error(response.data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating document status:', err);
      setError(err.response?.data?.message || 'Failed to update document status');
      throw err;
    }
  };

  const handleFileUpload = async (managementId, documentTypeId, file) => {
    try {
      setUploading(prev => ({ ...prev, [documentTypeId]: true }));
      
      const form = pendingForms.find(f => f._id === managementId);
      const documentType = form?.documentTypes.find(d => d.documentTypeId === documentTypeId);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('type', documentType?.name || 'other');
      formData.append('managementId', managementId);
      formData.append('documentTypeId', documentTypeId);
      formData.append('uploadedBy', user._id);

      const uploadResponse = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (uploadResponse.data && uploadResponse.data.data.document) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await updateDocumentStatus(managementId, documentTypeId);

        const successMessage = document.getElementById(`success-${documentTypeId}`);
        if (successMessage) {
          successMessage.classList.remove('hidden');
          setTimeout(() => {
            successMessage.classList.add('hidden');
          }, 3000);
        }

        await Promise.all([
          fetchPendingForms(),
          fetchExistingDocuments()
        ]);
      }
    } catch (err) {
      console.error('Error in upload process:', err);
      setError(err.response?.data?.message || 'Failed to complete the upload process');
    } finally {
      setUploading(prev => ({ ...prev, [documentTypeId]: false }));
    }
  };

  const renderContent = () => {
    if (!user) {
      return (
        <div className="text-center text-gray-500">
          Please log in to view your pending forms.
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 text-red-500 text-center">
          <p>{error}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Pending Forms</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleAutoFill(existingDocuments)}
              disabled={autoFilling || pendingForms.length === 0}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                ${(autoFilling || pendingForms.length === 0)
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-primary-600 hover:bg-primary-700 text-white cursor-pointer'
                }`}
            >
              {autoFilling ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Auto-fill Documents
            </button>
          </div>
        </div>
        
        {pendingForms.length === 0 ? (
          <div className="text-center text-gray-500 p-8 bg-white rounded-lg shadow">
            <p className="text-lg">No pending forms found</p>
            <p className="text-sm mt-2">You don't have any forms waiting for document uploads.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {existingDocuments.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  You have {existingDocuments.length} existing document{existingDocuments.length !== 1 ? 's' : ''} that might match your requirements.
                  Click "Auto-fill Documents" to automatically match them.
                </p>
              </div>
            )}

            {pendingForms.map((form) => (
              <div 
                key={form._id} 
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {form.categoryName}
                  </h2>
                  <span className="text-sm text-gray-500">
                    Assigned: {new Date(form.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {form.documentTypes.map((doc) => (
                    <div 
                      key={doc._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-gray-500">
                          Status: 
                          <span className={`ml-1 ${
                            doc.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {doc.status}
                          </span>
                          {doc.required && (
                            <span className="text-red-500 ml-2">*Required</span>
                          )}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div 
                          id={`success-${doc.documentTypeId}`}
                          className="hidden text-green-600 animate-fade-out"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </div>

                        {doc.status === 'pending' && (
                          <div>
                            <input
                              type="file"
                              id={doc._id}
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleFileUpload(form._id, doc.documentTypeId, e.target.files[0]);
                                }
                              }}
                            />
                            <label
                              htmlFor={doc._id}
                              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                                ${uploading[doc._id]
                                  ? 'bg-gray-300 cursor-not-allowed'
                                  : 'bg-primary-600 hover:bg-primary-700 text-white cursor-pointer'
                                }`}
                            >
                              {uploading[doc._id] ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              Upload
                            </label>
                          </div>
                        )}

                        {doc.status === 'completed' && (
                          <span className="text-green-600">
                            <CheckCircle className="w-5 h-5" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default PendingForms; 