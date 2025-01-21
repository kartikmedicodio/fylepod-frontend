import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CRMService from '../services/crm.service';
import { Mail, Phone, Building, X, FileCheck, File, ExternalLink, FileText } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';

const CRM = () => {
  const [companyUsers, setCompanyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [completedApplications, setCompletedApplications] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [extractedData, setExtractedData] = useState({});
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCompanyUsers = async () => {
      try {
        const response = await CRMService.getCompanyUsers();
        const users = response.data.users;
        const filteredUsers = users.filter(u => u.company_name === user.company_name);
        setCompanyUsers(filteredUsers);
      } catch (err) {
        setError('Failed to fetch company users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyUsers();
  }, [user.company_name]);

  const handleUserClick = async (selectedUser) => {
    setSelectedUser(selectedUser);
    setModalLoading(true);
    try {
      const response = await CRMService.getUserCompletedApplications(selectedUser._id);
      setCompletedApplications(response.data.entries || []);
    } catch (err) {
      console.error('Failed to fetch completed applications:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDocumentClick = async (doc) => {
    setSelectedDocument(doc);
    setDocumentLoading(true);
    try {
      const documentId = doc._id;
      if (!documentId) {
        console.error('No document ID available');
        return;
      }
      
      const response = await CRMService.getExtractedData(documentId);
      console.log('API Response:', response);
      
      if (response.data && response.data.data) {
        setDocumentData(response.data.data);
      } else {
        setDocumentData({
          message: 'No extracted data available for this document',
          isAvailable: false
        });
      }
    } catch (err) {
      console.error('Failed to fetch document data:', err);
      setDocumentData({
        message: 'Failed to fetch document data. Please try again later.',
        isAvailable: false,
        error: true
      });
    } finally {
      setDocumentLoading(false);
    }
  };

  const ExtractedDataModal = () => {
    if (!selectedDocument) return null;

    console.log('Document Data:', documentData);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <div>
              <h2 className="text-xl font-semibold">Document Details</h2>
              <p className="text-sm text-gray-500">{selectedDocument.name}</p>
            </div>
            <button
              onClick={() => setSelectedDocument(null)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-8rem)]">
            {documentLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : documentData ? (
              <div className="space-y-6">
                {/* Document Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Document Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium">{documentData.type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-medium">{documentData.status || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Extracted Content */}
                {documentData.extractedData && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Extracted Content</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-4">
                        {/* Document Type */}
                        <div>
                          <p className="text-sm text-gray-600">Document Type</p>
                          <p className="font-medium">{documentData.extractedData.document_type || 'N/A'}</p>
                        </div>

                        {/* Extracted Data Fields */}
                        {documentData.extractedData.extracted_data && (
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(documentData.extractedData.extracted_data).map(([key, value]) => (
                              <div key={key} className="border-b border-gray-100 pb-2">
                                <p className="text-sm text-gray-600">{key}</p>
                                <p className="font-medium">{value}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Management Information */}
                {documentData.management && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Management Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Management ID</p>
                          <p className="font-medium text-xs">{documentData.management.managementId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Document Type ID</p>
                          <p className="font-medium text-xs">{documentData.management.documentTypeId}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const DocumentsModal = () => {
    if (!selectedApplication) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <div>
              <h2 className="text-xl font-semibold">{selectedApplication.categoryName}</h2>
              <p className="text-sm text-gray-500">
                Completed on: {new Date(selectedApplication.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => setSelectedApplication(null)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-8rem)]">
            <div className="grid grid-cols-1 gap-4">
              {selectedApplication.documentTypes.map((doc) => (
                <div
                  key={doc._id}
                  className="bg-white border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleDocumentClick(doc)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-50 rounded">
                      <FileText className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium capitalize">{doc.name}</h3>
                      <p className="text-sm text-gray-500">
                        Status: <span className="text-green-600">{doc.status}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        ID: {doc._id}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Modal = () => {
    if (!selectedUser) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">User Profile & Applications</h2>
            <button
              onClick={() => setSelectedUser(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
            {/* User Profile Section */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl font-bold text-primary-600">
                    {selectedUser.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedUser.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{selectedUser.email}</span>
                      </div>
                      {selectedUser.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{selectedUser.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Building className="w-4 h-4 mr-2" />
                        <span>Company: {selectedUser.company_name || 'N/A'}</span>
                      </div>
                      {selectedUser.lawfirm_name && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Building className="w-4 h-4 mr-2" />
                          <span>Law Firm: {selectedUser.lawfirm_name}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {selectedUser.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Completed Applications Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Completed Applications</h3>
              {modalLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : completedApplications.length > 0 ? (
                <div className="space-y-4">
                  {completedApplications.map((app) => (
                    <div
                      key={app._id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedApplication(app)}
                    >
                      <div className="flex items-center space-x-3">
                        <FileCheck className="w-5 h-5 text-green-500" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{app.categoryName}</h3>
                            <span className="text-xs text-gray-500">
                              {new Date(app.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-600">
                              Documents: {app.documentTypes.length}
                            </p>
                            <div className="ml-4 grid grid-cols-2 gap-2 mt-1">
                              {app.documentTypes.slice(0, 4).map((doc) => (
                                <p key={doc._id} className="text-sm text-gray-500 flex items-center">
                                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                                  {doc.name}
                                </p>
                              ))}
                              {app.documentTypes.length > 4 && (
                                <p className="text-sm text-primary-600">
                                  +{app.documentTypes.length - 4} more
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  No completed applications found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-red-500 text-center p-4">
          {error}
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Company Directory</h1>
          <p className="text-gray-500">{user.company_name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {companyUsers.map((user) => (
            <div
              key={user._id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleUserClick(user)}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary-600">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{user.role}</p>
                
                <div className="w-full space-y-2 mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="w-4 h-4 mr-2" />
                    <span>{user.company_name || 'N/A'}</span>
                  </div>
                  {user.lawfirm_name && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-2" />
                      <span>Law Firm: {user.lawfirm_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
          <Modal />
          <DocumentsModal />
          <ExtractedDataModal />
        </main>
      </div>
    </div>
  );
};

export default CRM; 