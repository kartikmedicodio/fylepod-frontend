import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import CRMService from '../services/crm.service';
import { Mail, Phone, Building, FileCheck, File, FileText, ArrowLeft, ChevronDown } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';

const CRM = () => {
  const [companyUsers, setCompanyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [completedApplications, setCompletedApplications] = useState([]);
  const [documentData, setDocumentData] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId, applicationId, documentId } = useParams();
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [activeTab, setActiveTab] = useState('completed');
  const [pendingApplications, setPendingApplications] = useState([]);

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

  useEffect(() => {
    if (userId) {
      handleUserClick(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (documentId) {
      handleDocumentClick(documentId);
    }
  }, [documentId]);

  useEffect(() => {
    if (applicationId) {
      const app = activeTab === 'completed' 
        ? completedApplications.find(a => a._id === applicationId)
        : pendingApplications.find(a => a._id === applicationId);
      setSelectedApplication(app);
    }
  }, [applicationId, completedApplications, pendingApplications, activeTab]);

  const handleUserClick = async (userId) => {
    const selectedUser = companyUsers.find(u => u._id === userId);
    setSelectedUser(selectedUser);
    try {
      const response = await CRMService.getUserCompletedApplications(userId);
      const allApplications = response.data.entries || [];
      
      // Filter applications based on categoryStatus
      const completed = allApplications.filter(app => app.categoryStatus === 'completed');
      const pending = allApplications.filter(app => app.categoryStatus === 'pending');
      
      setCompletedApplications(completed);
      setPendingApplications(pending);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  };

  const handleDocumentClick = async (documentId) => {
    setDocumentLoading(true);
    try {
      const response = await CRMService.getExtractedData(documentId);
      if (response.data && response.data.isAvailable) {
        setDocumentData(response.data);
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

  const renderUserProfile = () => {
    if (!selectedUser) return null;

    return (
      <div className="flex h-screen bg-gray-50">
        {/* Left Sidebar - User Details */}
        <div className="w-80 border-r bg-white">
          <div className="p-6">
            {/* Profile Image */}
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-primary-600">
                {selectedUser.name.charAt(0)}
              </span>
            </div>

            {/* User Name */}
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{selectedUser.name}</h2>

            {/* User Details */}
            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Email</label>
                <div className="flex items-center text-sm text-gray-900">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{selectedUser.email}</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 block mb-1">Company</label>
                <div className="flex items-center text-sm text-gray-900">
                  <Building className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{selectedUser?.company_id?.company_name || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-auto">
          {/* Content Area */}
          <div className="p-6">
            {/* Tabs */}
            <div className="border-b mb-6">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`pb-4 px-2 border-b-2 transition-colors ${
                    activeTab === 'completed'
                      ? 'border-primary-500 text-primary-600 font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Completed Applications
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`pb-4 px-2 border-b-2 transition-colors ${
                    activeTab === 'pending'
                      ? 'border-primary-500 text-primary-600 font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Pending Applications
                </button>
              </div>
            </div>

            {/* Applications List */}
            <div className="space-y-4">
              {activeTab === 'completed' ? (
                // Completed Applications
                completedApplications.map((app) => (
                  <Link
                    key={app._id}
                    to={`/crm/user/${selectedUser._id}/application/${app._id}`}
                    className="block border rounded-lg p-4 hover:shadow-md transition-shadow"
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
                          <p className="text-sm text-gray-600">
                            Documents: {app.documentTypes.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                // Pending Applications
                pendingApplications.map((app) => (
                  <Link
                    key={app._id}
                    to={`/pending-forms/${selectedUser._id}/application/${app._id}`}
                    className="block border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <File className="w-5 h-5 text-orange-500" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{app.categoryName}</h3>
                          <span className="text-xs text-gray-500">
                            {new Date(app.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            Documents: {app.documentTypes.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCompanyDirectory = () => {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Company Directory</h1>
          <p className="text-gray-500">{user.company_name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {companyUsers.map((user) => (
            <Link
              key={user._id}
              to={`/crm/user/${user._id}`}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
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
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  const renderApplicationDocuments = () => {
    if (!selectedApplication) return null;

    return (
      <div className="p-6">
        <div className="mb-6 flex items-center">
          <button 
            onClick={() => navigate(`/crm/user/${userId}`)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedApplication.categoryName}</h1>
            <p className="text-gray-500">
              Completed on: {new Date(selectedApplication.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedApplication.documentTypes.map((doc) => (
            <div
              key={doc._id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/crm/user/${userId}/application/${applicationId}/document/${doc._id}`)}
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary-50 rounded-lg">
                  <FileText className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 capitalize">{doc.name}</h3>
                  <p className="text-sm text-gray-500">
                    Status: <span className="text-green-600">{doc.status}</span>
                  </p>
                </div>
              </div>
              
              {/* Preview section if available */}
              {doc.preview && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Preview</p>
                  <p className="text-xs text-gray-500 mt-1">{doc.preview}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDocumentDetails = () => {
    if (!documentData) return null;

    return (
      <div className="p-6">
        <div className="mb-6 flex items-center">
          <button 
            onClick={() => navigate(`/crm/user/${userId}/application/${applicationId}`)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Details</h1>
            <p className="text-gray-500">
              {selectedApplication?.categoryName} - Document View
            </p>
          </div>
        </div>

        {documentLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : documentData.isAvailable ? (
          <div className="space-y-6">
            {/* Document Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-3">Document Type</h3>
              <p className="font-medium text-gray-700">
                {documentData.extractedData?.document_type || documentData.type}
              </p>
            </div>

            {/* Extracted Data */}
            {documentData.extractedData?.extracted_data && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-3">Extracted Data</h3>
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(documentData.extractedData.extracted_data).map(([key, value]) => (
                    <div key={key} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">{key}</p>
                      <div className="font-medium text-gray-900">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">{documentData.message}</p>
          </div>
        )}
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

    if (documentId) {
      return renderDocumentDetails();
    }

    if (applicationId) {
      return renderApplicationDocuments();
    }

    if (userId) {
      return renderUserProfile();
    }

    return renderCompanyDirectory();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CRM; 