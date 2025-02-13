import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import CRMService from '../services/crm.service';
import { Mail, Phone, Building, Building2, FileCheck, File, FileText, ArrowLeft, ChevronDown, Globe, X } from 'lucide-react';
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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showHeaderText, setShowHeaderText] = useState(true);

  useEffect(() => {
    const fetchCompanyUsers = async () => {
      try {
        const response = await CRMService.getCompanyUsers();
        const users = response.data.users;
        console.log("all users",users);
        
        const filteredUsers = users.filter(u => 
          u?.company_id?.company_name === user?.company_id?.company_name && 
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
  }, [user?.company_id?.company_name]);


  useEffect(() => {
    if (userId && companyUsers.length > 0) {
      handleUserClick(userId);
      setShowHeaderText(false);
    } else {
      setShowHeaderText(true);
    }
  }, [userId, companyUsers]);

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
    // Early return if no userId
    if (!userId) return;

    const selectedUser = companyUsers.find(u => u._id === userId);
    
    // Early return if no selectedUser found
    if (!selectedUser) {
      console.error('No user found with ID:', userId);
      setCompletedApplications([]);
      setPendingApplications([]);
      return;
    }

    setSelectedUser(selectedUser);
    
    try {
      const response = await CRMService.getUserCompletedApplications(selectedUser._id);
      
      // Check if response exists and has data
      if (!response?.data?.entries) {
        // If no entries, set empty arrays for both completed and pending
        setCompletedApplications([]);
        setPendingApplications([]);
        return;
      }
      
      const allApplications = response.data.entries;
      
      // Filter applications based on categoryStatus, with null checks
      const completed = allApplications.filter(app => app?.categoryStatus === 'completed') || [];
      const pending = allApplications.filter(app => app?.categoryStatus === 'pending') || [];
      
      setCompletedApplications(completed);
      setPendingApplications(pending);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      // Set empty arrays in case of error
      setCompletedApplications([]);
      setPendingApplications([]);
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
        createdBy: JSON.parse(localStorage.getItem('user'))?.id
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
      
      // Show success toast and reset selection
      setToastMessage('Process created successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000); // Hide toast after 3 seconds
      setSelectedCategory(null);
      
      // Automatically switch to pending tab after creation
      setActiveTab('pending');
    } catch (err) {
      console.error('Error:', err);
      setToastMessage(err.response?.data?.message || 'Failed to create process');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to safely format currency
  const formatCurrency = (value) => {
    return value != null ? `$${Number(value).toFixed(2)}` : '$0.00';
  };

  // Helper function to safely display numbers
  const formatNumber = (value) => {
    return value != null ? Number(value).toFixed(2) : '0';
  };

  // Helper function to format address
  const formatAddress = (addressObj) => {
    // If address is already a string, return it
    if (typeof addressObj === 'string') return addressObj;
    
    // If address is an object, format it
    if (typeof addressObj === 'object' && addressObj !== null) {
      const {
        floorAptSuite,
        streetNumber,
        streetName,
        district,
        city,
        stateProvince,
        country,
        zipCode
      } = addressObj;

      return [
        floorAptSuite,
        streetNumber,
        streetName,
        district,
        city,
        stateProvince,
        country,
        zipCode
      ]
        .filter(Boolean) // Remove empty/null/undefined values
        .join(', ');
    }

    // Return a default value if address is invalid
    return 'No address available';
  };

  const renderUserProfile = () => {
    if (!selectedUser) return null;

    return (
      <div className="flex h-screen bg-gray-50">
        {/* Left Sidebar - Employee Details */}
        <div className="w-96 border-r bg-white overflow-y-auto">
          <div className="p-6">
            {/* Back button */}
            <button
              onClick={() => {
                navigate('/crm');
                setSelectedUser(null);
              }}
              className="flex items-center mb-6 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Directory
            </button>

            {/* Profile Header */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary-600">
                  {selectedUser.name.charAt(0)}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h2>
              <p className="text-sm text-primary-600 mt-1">
                {selectedUser.role === 'user' ? 'Employee' : selectedUser.role}
              </p>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center text-sm text-gray-900">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{selectedUser.email}</span>
                  </div>
                </div>
                {selectedUser.phone && (
                  <div>
                    <div className="flex items-center text-sm text-gray-900">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{selectedUser.phone}</span>
                    </div>
                  </div>
                )}
                {selectedUser.address && (
                  <div>
                    <div className="flex items-start text-sm text-gray-900">
                      <Building className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
                      <span className="break-words">{formatAddress(selectedUser?.address)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Company Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Company Name</label>
                  <div className="flex items-center text-sm text-gray-900">
                    <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{selectedUser?.company_id?.company_name || selectedUser.company_name}</span>
                  </div>
                </div>
                {selectedUser.department && (
                  <div>
                    <label className="text-xs text-gray-500">Department</label>
                    <p className="text-sm text-gray-900">{selectedUser.department}</p>
                  </div>
                )}
                {selectedUser.position && (
                  <div>
                    <label className="text-xs text-gray-500">Position</label>
                    <p className="text-sm text-gray-900">{selectedUser.position}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Account Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Account Status</label>
                  <div className="flex items-center mt-1">
                    <div className={`w-2 h-2 rounded-full ${selectedUser.status === 'active' ? 'bg-green-500' : 'bg-gray-500'} mr-2`}></div>
                    <span className="text-sm capitalize">{selectedUser.status || 'Active'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Member Since</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Last Active</label>
                  <p className="text-sm text-gray-900">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary-600">
                  {completedApplications.length}
                </p>
                <p className="text-xs text-gray-600">Completed Forms</p>
              </div>
              <div className="bg-primary-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary-600">
                  {pendingApplications.length}
                </p>
                <p className="text-xs text-gray-600">Pending Forms</p>
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
                    to={`/crm/user/${selectedUser._id}/application/${app._id}`}
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
              <div className="w-24 h-24 bg-primary-50 rounded-lg flex items-center justify-center mb-6">
                <Building2 className="w-12 h-12 text-primary-600" />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-500 block mb-2">Lexon Legal Solutions</label>
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
                <div className="flex items-start text-gray-900">
                  <Building className="w-4 h-4 mr-2 flex-shrink-0 mt-1 text-gray-500" />
                  <span className="break-words">
                    {formatAddress(user?.company_address) || "1234 Lexington Ave, Suite 500, New York, NY 10022, USA"}
                  </span>
                </div>
              </div>

              <div>x
                <label className="text-sm text-gray-500 block mb-2">Contact</label>
                <div className="space-y-2">
                  <div className="flex items-start text-gray-900">
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0 mt-1 text-gray-500" />
                    <span className="break-words">{user.company_phone || "+1 (212) 555-7890"}</span>
                  </div>
                  <div className="flex items-start text-gray-900">
                    <Mail className="w-4 h-4 mr-2 flex-shrink-0 mt-1 text-gray-500" />
                    <span className="break-words">{user.company_email || "lexon.legal@gmail.com"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Employees List (Scrollable) */}
        <div className="w-2/3 ml-[33.333333%]">
          <div className="p-6 pb-0">
            <h2 className="text-xl font-semibold text-gray-900">Company Directory</h2>
            <p className="text-gray-500">Employees ({companyUsers.length})</p>
          </div>

          <div className="p-6 pt-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companyUsers.map((employee) => (
                <Link
                  key={employee._id}
                  to={`/crm/user/${employee._id}`}
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default navigation
                    handleUserClick(employee._id);
                    navigate(`/crm/user/${employee._id}`); // Programmatically navigate after handling the click
                  }}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-primary-600">
                        {employee.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {employee.role === 'user' ? 'Employee' : employee.role}
                    </p>
                    
                    <div className="w-full space-y-2 mt-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                      {employee.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{employee.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Building className="w-4 h-4 mr-2" />
                        <span className="truncate">{employee.company_id?.company_name}</span>
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
                    Status: <span className="text-green-600">Verified</span>
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
    const currentDocument = selectedApplication?.documentTypes.find(doc => doc._id === documentId);
    const extractedData = documentData.extractedData?.extracted_data;
    const documentType = documentData.extractedData?.document_type;

    // Passport-specific render function
    const renderPassportDetails = () => (
      <div className="space-y-6">
        {/* Passport Information Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-blue-50 rounded-full">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {extractedData.surname}, {extractedData.given_names}
              </h2>
              <p className="text-lg text-blue-600">Passport #{extractedData.passport_number}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 border-b pb-2">Personal Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p className="font-medium">{extractedData.nationality}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sex</p>
                  <p className="font-medium">{extractedData.sex}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">{extractedData.date_of_birth}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Place of Birth</p>
                  <p className="font-medium">{extractedData.place_of_birth}</p>
                </div>
              </div>
            </div>

            {/* Document Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 border-b pb-2">Document Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date of Issue</p>
                  <p className="font-medium">{extractedData.date_of_issue}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Expiration</p>
                  <p className="font-medium text-red-600">{extractedData.date_of_expiration}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Issuing Authority</p>
                  <p className="font-medium">{extractedData.authority}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status */}
       
      </div>
    );

    // Paystub-specific render function
    const renderPaystubDetails = () => (
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-emerald-50 rounded-full">
              <FileText className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{extractedData.employee_name || 'N/A'}</h2>
              <p className="text-lg text-emerald-600">Paycheck #{extractedData.paycheck_number || 'N/A'}</p>
            </div>
          </div>

          {/* Pay Period Info */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
            <div>
              <p className="text-sm text-gray-500">Pay Date</p>
              <p className="font-medium">{extractedData.pay_date || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Period Start</p>
              <p className="font-medium">{extractedData.pay_period_start || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Period End</p>
              <p className="font-medium">{extractedData.pay_period_end || 'N/A'}</p>
            </div>
          </div>

          {/* Employer Details */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Employer</p>
                <p className="font-medium">{extractedData.employer_name || 'N/A'}</p>
                <p className="text-sm text-gray-600">{formatAddress(extractedData.employer_address)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Employee Address</p>
                <p className="text-sm text-gray-600">{formatAddress(extractedData.employee_address)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Hours Worked</span>
                <span className="font-medium">{formatNumber(extractedData.hours_worked)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Hourly Rate</span>
                <span className="font-medium">{formatCurrency(extractedData.hourly_rate)}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                <span className="text-gray-600">Gross Pay (This Period)</span>
                <span className="font-medium text-emerald-600">
                  {formatCurrency(extractedData.this_period_gross_pay)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                <span className="text-gray-600">YTD Gross Pay</span>
                <span className="font-medium text-emerald-600">
                  {formatCurrency(extractedData.year_to_date_gross_pay)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Deductions Card */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Required Deductions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Required Deductions</h3>
            <div className="space-y-2">
              {extractedData.required_deductions && Object.entries(extractedData.required_deductions).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="font-medium text-red-600">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Other Deductions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Other Deductions</h3>
            <div className="space-y-2">
              {extractedData.other_deductions && Object.entries(extractedData.other_deductions).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="font-medium">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Net Pay Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex justify-between items-center p-4 bg-emerald-100 rounded-lg">
              <div>
                <p className="text-lg font-medium text-emerald-800">Net Pay</p>
                <p className="text-sm text-emerald-600">This Period</p>
              </div>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(extractedData.net_pay)}</p>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
              <div>
                <p className="text-lg font-medium text-gray-800">YTD Deductions</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <p className="text-2xl font-bold text-gray-700">
                {formatCurrency(extractedData.total_year_to_date_deductions)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 flex items-center">
          <button 
            onClick={() => navigate(`/crm/user/${userId}/application/${applicationId}`)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentDocument?.name || documentType?.charAt(0).toUpperCase() + documentType?.slice(1)} Details
            </h1>
            <p className="text-gray-500">
              {selectedApplication?.categoryName}
            </p>
          </div>
        </div>

        {documentLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : documentData.isAvailable && extractedData ? (
          // Render different layouts based on document type
          documentType.toLowerCase() === 'passport' ? renderPassportDetails() :
          documentType.toLowerCase() === 'paystub' ? renderPaystubDetails() : (
            <div className="space-y-6">
              {/* Personal Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 bg-primary-50 rounded-full">
                    <FileText className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{extractedData.full_name}</h2>
                    <p className="text-lg text-primary-600">{extractedData.profession}</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  {extractedData.contact_info?.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{extractedData.contact_info.phone}</span>
                    </div>
                  )}
                  {extractedData.contact_info?.address && (
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span>{extractedData.contact_info.address}</span>
                    </div>
                  )}
                  {extractedData.contact_info?.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span>{extractedData.contact_info.website}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Experience Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Work Experience</h3>
                <div className="space-y-4">
                  {extractedData.experience?.map((exp, idx) => (
                    <div key={idx} className="flex items-center space-x-4">
                      <div className="p-3 bg-primary-50 rounded-full">
                        <FileText className="w-8 h-8 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{exp.job_title}</h4>
                        <p className="text-primary-600 text-sm mb-1">{exp.company}</p>
                        <p className="text-gray-500 text-sm mb-2">{exp.years}</p>
                        {exp.responsibilities && (
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {exp.responsibilities.map((resp, idx) => (
                              <li key={idx}>{resp}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Education</h3>
                <h4 className="font-semibold text-gray-900">{extractedData.education?.degree}</h4>
                <p className="text-primary-600 mb-4">{extractedData.education?.institution}</p>
                {extractedData.education?.awards && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Awards & Achievements</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {extractedData.education.awards.map((award, idx) => (
                        <li key={idx}>{award}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Skills & Hobbies */}
              <div className="grid md:grid-cols-2 gap-6">
                {extractedData.skills && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.skills.map((skill, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {extractedData.hobbies && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Hobbies</h3>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.hobbies.map((hobby, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                        >
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-900 font-medium mb-2">No Data Available</p>
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

  const Toast = ({ message, show }) => {
    if (!show) return null;

    return (
      <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
        <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7"></path>
          </svg>
          <span className="font-medium">{message}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          showText={showHeaderText} 
          selectedUser={selectedUser}
          activeTab={applicationId ? undefined : activeTab}
        />
        <Toast message={toastMessage} show={showToast} />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CRM; 