import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import CRMService from '../services/crm.service';
import { Mail, Phone, Building, FileCheck, File, FileText, ArrowLeft, ChevronDown } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import api from '../utils/api';


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
  const [categories, setCategories] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCompanyUsers = async () => {
      try {
        const response = await CRMService.getCompanyUsers();
        const users = response.data.users;
        console.log("all users",users);
        const filteredUsers = users.filter(u => 
          u.company_name === user.company_name && 
          u.role !== 'admin'  // Exclude admin users
        );
        console.log("filtered users",filteredUsers);
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        console.log('Categories response:', response);
        
        const categoriesList = response.data.data.categories || [];
        console.log('Categories list:', categoriesList);
        setCategories(categoriesList);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setIsDropdownOpen(false);
  };

  const handleSubmitAssignment = async () => {
    if (!selectedUser || !selectedCategory) {
      alert('Please select both a user and a category');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // First create management entry
      const managementResponse = await api.post('/management', {
        userId: selectedUser._id,
        categoryId: selectedCategory._id,
        createdBy: JSON.parse(localStorage.getItem('user'))?._id
      });

      console.log('Management entry created:', managementResponse.data);

      // Then send invitation email
      const invitationResponse = await api.post('/invitations/send', {
        userId: selectedUser._id,
        categoryId: selectedCategory._id
      });

      console.log('Invitation sent:', invitationResponse.data);

      // Refresh pending applications
      const response = await CRMService.getUserCompletedApplications(selectedUser._id);
      const allApplications = response.data.entries || [];
      setPendingApplications(allApplications.filter(app => app.categoryStatus === 'pending'));
      
      // Show success message and reset selection
      alert('Form assigned and invitation sent successfully!');
      setSelectedCategory(null);
    } catch (err) {
      console.error('Error:', err);
      alert(err.response?.data?.message || 'Failed to assign form and send invitation');
    } finally {
      setIsSubmitting(false);
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
              <div className="flex items-center justify-between">
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
                
                {/* Assign Application Dropdown */}
                <div className="flex items-center space-x-3 mb-4">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Create Process:
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <span className="text-gray-500">
                        {selectedCategory ? selectedCategory.name : 'Select the Template'}
                      </span>
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          {categories.map((category) => (
                            <button
                              key={category._id}
                              onClick={() => handleCategorySelect(category)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                              role="menuitem"
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleSubmitAssignment}
                    disabled={!selectedCategory || isSubmitting}
                    className={`ml-4 px-4 py-2 text-sm font-medium rounded-md flex items-center ${
                      selectedCategory && !isSubmitting
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg 
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24"
                        >
                          <circle 
                            className="opacity-25" 
                            cx="12" 
                            cy="12" 
                            r="10" 
                            stroke="currentColor" 
                            strokeWidth="4"
                          />
                          <path 
                            className="opacity-75" 
                            fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create'
                    )}
                  </button>
                </div>
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
      <div className="flex h-screen">
        {/* Left side - Company Details (Fixed) */}
        <div className="fixed w-1/4 bg-white border-r h-screen">
          <div className="p-6 overflow-y-auto max-h-screen">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Company Profile</h1>
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl font-bold text-primary-600">
                  {user?.company_id?.company_name?.charAt(0) || user.company_name?.charAt(0)}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-500 block mb-2">Company Name</label>
                <p className="text-gray-900 font-medium break-words">
                  {user?.company_id?.company_name || user.company_name}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 block mb-2">Description</label>
                <p className="text-gray-900 break-words">
                  {user.company_description || "A leading organization dedicated to excellence and innovation."}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 block mb-2">Address</label>
                <div className="flex items-start text-gray-900"> {/* Changed to items-start */}
                  <Building className="w-4 h-4 mr-2 flex-shrink-0 mt-1 text-gray-500" />
                  <span className="break-words">{user.company_address || "123 Business Avenue, Suite 100, New York, NY 10001"}</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 block mb-2">Contact</label>
                <div className="space-y-2">
                  <div className="flex items-start text-gray-900"> {/* Changed to items-start */}
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0 mt-1 text-gray-500" />
                    <span className="break-words">{user.company_phone || "+1 (555) 123-4567"}</span>
                  </div>
                  <div className="flex items-start text-gray-900"> {/* Changed to items-start */}
                    <Mail className="w-4 h-4 mr-2 flex-shrink-0 mt-1 text-gray-500" />
                    <span className="break-words">{user.company_email || "contact@company.com"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Users List (Scrollable) */}
        <div className="w-2/3 ml-[33.333333%]">
          <div className="p-6 pb-0">
            <h2 className="text-xl font-semibold text-gray-900">Company Directory</h2>
            <p className="text-gray-500">All team members ({companyUsers.length})</p>
          </div>

          <div className="p-6 pt-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div className="flex items-center text-sm text-gray-600">
                        <Building className="w-4 h-4 mr-2" />
                        <span className="truncate">{user.company_id?.company_name}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
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