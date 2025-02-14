import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import CRMService from '../services/crm.service';
import { Mail, Phone, Building, Building2, FileCheck, File, FileText, ArrowLeft, ChevronDown, Globe, X, Upload, Loader2, CheckCircle, Wand2 } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import PDFGenerator from '../components/PDFGenerator';
import { ResumeView, PaystubView, PassportView, NationalIDView } from '../components/DocumentTypes';
import { motion, AnimatePresence } from 'framer-motion';

// Update the processing steps to be shorter
const processingSteps = [
  { id: 1, text: "Analyzing..." },
  { id: 2, text: "Validating..." },
  { id: 3, text: "Processing..." },
  { id: 4, text: "Verifying..." }
];

const CRM = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId, applicationId, documentId } = useParams();

  // Initialize state from localStorage if available
  const [companyUsers, setCompanyUsers] = useState(() => {
    const saved = localStorage.getItem('companyUsers');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedUser, setSelectedUser] = useState(() => {
    const saved = localStorage.getItem('selectedUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [completedApplications, setCompletedApplications] = useState(() => {
    const saved = localStorage.getItem('completedApplications');
    return saved ? JSON.parse(saved) : [];
  });

  const [pendingApplications, setPendingApplications] = useState(() => {
    const saved = localStorage.getItem('pendingApplications');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('activeTab');
    return saved || 'completed';
  });

  // Save states to localStorage when they change
  useEffect(() => {
    localStorage.setItem('companyUsers', JSON.stringify(companyUsers));
  }, [companyUsers]);

  useEffect(() => {
    localStorage.setItem('selectedUser', JSON.stringify(selectedUser));
  }, [selectedUser]);

  useEffect(() => {
    localStorage.setItem('completedApplications', JSON.stringify(completedApplications));
  }, [completedApplications]);

  useEffect(() => {
    localStorage.setItem('pendingApplications', JSON.stringify(pendingApplications));
  }, [pendingApplications]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Load initial data if needed
  useEffect(() => {
    const loadInitialData = async () => {
      if (userId && (!selectedUser || selectedUser._id !== userId)) {
        const user = companyUsers.find(u => u._id === userId);
        if (user) {
          setSelectedUser(user);
          await handleUserClick(userId);
        }
      }
    };

    loadInitialData();
  }, [userId]);

  // Clear stored state on logout
  const clearStoredState = () => {
    localStorage.removeItem('companyUsers');
    localStorage.removeItem('selectedUser');
    localStorage.removeItem('completedApplications');
    localStorage.removeItem('pendingApplications');
    localStorage.removeItem('activeTab');
  };

  // Add this to your logout handler
  useEffect(() => {
    if (!user) {
      clearStoredState();
    }
  }, [user]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showHeaderText, setShowHeaderText] = useState(true);
  const [processingQueue, setProcessingQueue] = useState(new Set());
  const [processingProcessId, setProcessingProcessId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

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
    if (applicationId) {
      // Check both completed and pending applications
      const app = completedApplications.find(a => a._id === applicationId) || 
                  pendingApplications.find(a => a._id === applicationId);
      
      if (app) {
        setSelectedApplication(app);
        // Set activeTab based on the application's status
        setActiveTab(app.categoryStatus === 'completed' ? 'completed' : 'pending');
      }
    }
  }, [applicationId, completedApplications, pendingApplications]);

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

  useEffect(() => {
    let isMounted = true;  // Add mounted flag
    
    const loadDocumentData = async () => {
      if (!documentId || !userId || !applicationId) return;

      setDocumentLoading(true);
      try {
        // First ensure we have the application data if it's missing
        if (!selectedApplication) {
          const response = await CRMService.getUserCompletedApplications(userId);
          if (!isMounted) return;  // Check if still mounted
          
          if (response.data?.entries) {
            const app = response.data.entries.find(a => a._id === applicationId);
            if (app) {
              setSelectedApplication(app);
              setActiveTab(app.categoryStatus === 'completed' ? 'completed' : 'pending');
            }
          }
        }

        // Get the current document from the application
        const currentDocument = selectedApplication?.documentTypes.find(doc => doc._id === documentId);
        
        // If we have a documentId but no currentDocument, try to get it directly
        const docIdToUse = currentDocument?.documentId || documentId;
        
        const response = await CRMService.getExtractedData(docIdToUse);
        if (!isMounted) return;  // Check if still mounted
        
        console.log('Document data response:', response);
        
        if (response.data && response.data.isAvailable) {
          setDocumentData(response.data);
        } else {
          setDocumentData({
            message: 'No extracted data available for this document',
            isAvailable: false
          });
        }
      } catch (err) {
        if (!isMounted) return;  // Check if still mounted
        console.error('Failed to fetch document data:', err);
        setDocumentData({
          message: 'Failed to fetch document data. Please try again later.',
          isAvailable: false,
          error: true
        });
      } finally {
        if (isMounted) {  // Only update state if still mounted
          setDocumentLoading(false);
        }
      }
    };

    loadDocumentData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [documentId, applicationId, userId]); // Remove selectedApplication from dependencies

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
                      {typeof selectedUser.address === 'string' ? (
                        <span className="break-words">{selectedUser.address}</span>
                      ) : (
                        <span>
                          <div className="space-y-2">
                            {selectedUser.address.streetNumber && selectedUser.address.streetName && (
                              <span className="block">
                                {selectedUser.address.streetNumber} {selectedUser.address.streetName}
                              </span>
                            )}
                            {selectedUser.address.floorAptSuite && (
                              <span className="block">{selectedUser.address.floorAptSuite}</span>
                            )}
                            {selectedUser.address.district && (
                              <span className="block">{selectedUser.address.district}</span>
                            )}
                            {selectedUser.address.city && selectedUser.address.stateProvince && (
                              <span className="block">
                                {selectedUser.address.city}, {selectedUser.address.stateProvince} {selectedUser.address.zipCode}
                              </span>
                            )}
                            {selectedUser.address.country && (
                              <span className="block">{selectedUser.address.country}</span>
                            )}
                          </div>
                        </span>
                      )}
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

  const validateFileType = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    return allowedTypes.includes(file.type);
  };

  const checkDocumentProcessing = async (documentId) => {
    const maxAttempts = 20;
    const baseInterval = 2000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        console.log(`Checking document ${documentId} - Attempt ${attempts + 1}/${maxAttempts}`);
        
        const response = await api.get(`/documents/${documentId}`);
        const document = response.data.data.document;

        if (document.processingError || document.status === 'failed') {
          console.log(`Document ${documentId} processing failed after ${attempts + 1} attempts`);
          return null;
        }

        if (document.extractedData?.document_type) {
          console.log(`Document ${documentId} processed successfully after ${attempts + 1} attempts`);
          console.log('Extracted type:', document.extractedData.document_type);
          return document;
        }

        attempts++;
        const delay = baseInterval * Math.min(Math.pow(1.5, attempts), 8);
        console.log(`Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (err) {
        console.error(`Error checking document status (Attempt ${attempts + 1}):`, err);
        return null;
      }
    }

    console.log(`Document ${documentId} processing timed out after ${maxAttempts} attempts`);
    return null;
  };

  const updateDocumentStatus = async (managementId, documentTypeId) => {
    try {
      console.log('[Status Update] Starting:', { managementId, documentTypeId });
      
      const docResponse = await api({
        method: 'PATCH',
        url: `/management/${managementId}/documents/${documentTypeId}/status`,
        data: { status: 'completed' },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (docResponse.data.status === 'success') {
        console.log('[Status Update] Document status updated');

        try {
          const processResponse = await api.get(`/management/${managementId}`);
          
          if (processResponse.data?.data) {
            const process = processResponse.data.data;
            console.log('[Status Update] Retrieved process data:', process);
            
            if (process.documentTypes && Array.isArray(process.documentTypes)) {
              const allCompleted = process.documentTypes.every(doc => doc.status === 'completed');
              console.log('[Status Update] All documents completed:', allCompleted);

              if (allCompleted) {
                console.log('[Status Update] Updating management status');
                
                const managementResponse = await api({
                  method: 'PATCH',
                  url: `/management/${managementId}/status`,
                  data: { 
                    status: 'completed',
                    categoryStatus: 'completed'
                  },
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });

                if (managementResponse.data.status === 'success') {
                  console.log('[Status Update] Management status updated successfully');
                }
              }
            }
          }

          const updatedResponse = await CRMService.getUserCompletedApplications(userId);
          const allApplications = updatedResponse.data.entries || [];
          setPendingApplications(allApplications.filter(app => app.categoryStatus === 'pending'));
          
          console.log('[Status Update] Process completed');
          return true;
        } catch (processError) {
          console.error('[Status Update] Error getting process data:', processError);
          return true;
        }
      }

      return false;
    } catch (err) {
      console.error('[Status Update] Error:', err);
      throw err;
    }
  };

  const handleMultipleFileUpload = async (files, processId) => {
    try {
      setIsProcessing(true); // Start processing
      setProcessingProcessId(processId);

      // Step 1: Upload all files first with minimal metadata
      const uploadPromises = files.map(async (file) => {
        try {
          if (!validateFileType(file)) return null;
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('name', `${Date.now()}-${file.name}`);
          formData.append('managementId', processId);
          formData.append('form_category', selectedApplication.categoryName || 'other');
          formData.append('type', 'pending_extraction');
          
          // Use first pending doc type for initial upload
          const tempDocType = selectedApplication.documentTypes.find(dt => dt.status !== 'completed');
          if (tempDocType) {
            formData.append('documentTypeId', tempDocType.documentTypeId);
            formData.append('managementDocumentId', tempDocType._id);
          }

          const response = await api.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (response.data?.status === 'success' && response.data.data.document) {
            return response.data.data.document;
          }
          return null;
        } catch (err) {
          console.error(`Error uploading file ${file.name}:`, err);
          return null;
        }
      });

      // Wait for all uploads to complete
      const uploadedDocs = (await Promise.all(uploadPromises)).filter(Boolean);
      if (uploadedDocs.length === 0) {
        toast.error('No files were uploaded successfully');
        return;
      }

      // Step 2: Wait for all documents to be processed by OpenAI
      const processedDocs = await Promise.all(
        uploadedDocs.map(doc => checkDocumentProcessing(doc._id))
      );

      // Step 3: Match documents with required types and update statuses
      const docTypeMatches = new Map();
      const docsToDelete = new Set();

      processedDocs.forEach(doc => {
        if (!doc || !doc.extractedData?.document_type) {
          if (doc?._id) docsToDelete.add(doc._id);
          return;
        }

        const extractedType = doc.extractedData.document_type.toLowerCase().trim();
        const matchingDocType = selectedApplication.documentTypes.find(type => {
          const typeName = type.name.toLowerCase().trim();
          return typeName === extractedType && 
                 type.status !== 'completed' && 
                 !docTypeMatches.has(type.documentTypeId);
        });

        if (matchingDocType) {
          docTypeMatches.set(matchingDocType.documentTypeId, {
            docId: doc._id,
            extractedType,
            expectedType: matchingDocType.name
          });
        } else {
          docsToDelete.add(doc._id);
        }
      });

      // Step 4: Update statuses for matched documents
      if (docTypeMatches.size > 0) {
        await Promise.all(
          Array.from(docTypeMatches.entries()).map(([typeId, { docId, extractedType, expectedType }]) => {
            console.log(`Matched document: Expected "${expectedType}", Got "${extractedType}"`);
            return updateDocumentStatus(processId, typeId);
          })
        );

        toast.success(`${docTypeMatches.size} document${docTypeMatches.size !== 1 ? 's' : ''} processed successfully`);
      }

      // Step 5: Clean up unmatched documents
      if (docsToDelete.size > 0) {
        await Promise.all(
          Array.from(docsToDelete).map(docId =>
            api.delete(`/documents/${docId}`).catch(err => 
              console.error(`Error deleting document ${docId}:`, err)
            )
          )
        );
      }

      // Step 6: Refresh the application data
      if (selectedApplication) {
        await handleUserClick(userId);
      }

    } catch (err) {
      console.error('Error in multiple file upload:', err);
      toast.error('Error processing documents');
    } finally {
      setIsProcessing(false); // End processing
      setProcessingProcessId(null);
      setCurrentStep(0);
    }
  };

  const renderApplicationDocuments = () => {
    if (!selectedApplication) return null;

    // Helper function to get status color and text
    const getStatusDisplay = (status) => {
      switch (status) {
        case 'completed':
          return { color: 'text-green-600', text: 'Verified' };
        case 'pending':
          return { color: 'text-yellow-600', text: 'Pending' };
        default:
          return { color: 'text-gray-600', text: status };
      }
    };

    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center justify-between w-full">
            <div className='flex'>
              <button 
                onClick={() => navigate(`/crm/user/${userId}`)}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedApplication.categoryName}</h1>
                <p className="text-gray-500">
                  Status: {selectedApplication.categoryStatus}
                </p>
              </div>
            </div>
            {selectedApplication.categoryStatus === 'completed' && (
              <PDFGenerator managementId={selectedApplication._id} />
            )}
          </div>

          {/* Smart Upload button and Processing Indicator */}
          {selectedApplication.categoryStatus === 'pending' && (
            <div className="flex items-center gap-4">
              <AnimatePresence>
                {isProcessing && <ProcessingIndicator />}
              </AnimatePresence>
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium
                  bg-primary-600 hover:bg-primary-700 text-white cursor-pointer
                  transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Smart Upload
              </label>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleMultipleFileUpload(
                      Array.from(e.target.files),
                      selectedApplication._id
                    );
                  }
                }}
                accept="image/*,application/pdf"
                disabled={isProcessing}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedApplication.documentTypes.map((doc) => {
            const statusDisplay = getStatusDisplay(doc.status);
            
            return (
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
                      Status: <span className={statusDisplay.color}>{statusDisplay.text}</span>
                    </p>
                  </div>
                </div>
                
                {doc.preview && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Preview</p>
                    <p className="text-xs text-gray-500 mt-1">{doc.preview}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDocumentContent = (documentData) => {
    if (!documentData?.extractedData) return null;

    const { document_type, data } = documentData.extractedData;

    switch (document_type?.toLowerCase()) {
      case 'resume':
        return <ResumeView data={data} />;
      case 'paystub':
      case 'pay stub':  // Handle both formats
        return <PaystubView data={data} />;
      case 'passport':
        return <PassportView data={data} />;
      case 'national id card':  // Match the exact response format
        return <NationalIDView data={data} />;
      default:
        return (
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
            {JSON.stringify(documentData.extractedData, null, 2)}
          </pre>
        );
    }
  };

  const renderDocumentDetails = () => {
    if (!documentId) return null;

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
              {selectedApplication?.documentTypes.find(doc => doc._id === documentId)?.name || 'Document'} Details
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
        ) : !documentData ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-900 font-medium mb-2">Document Not Found</p>
            <p className="text-gray-500">The requested document could not be loaded.</p>
            <button 
              onClick={() => navigate(-1)} 
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : documentData.isAvailable ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {renderDocumentContent(documentData)}
          </div>
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

  // Update the ProcessingIndicator component with more compact styling
  const ProcessingIndicator = () => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % processingSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }, []);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 bg-blue-50 px-4 py-2.5 rounded-lg border border-blue-100"
      >
        <div className="relative">
          <div className="w-4 h-4"> {/* Slightly smaller spinner */}
            <motion.div
              className="absolute inset-0 border-2 border-blue-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-0.5 border-2 border-blue-300 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
        
        <div className="flex flex-col">
          <motion.span 
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm font-medium text-blue-700 min-w-[90px]" // Changed to text-sm and increased min-width
          >
            {processingSteps[currentStep].text}
          </motion.span>
          <div className="flex gap-1 mt-0.5"> {/* Reduced top margin */}
            {processingSteps.map((step, index) => (
              <motion.div
                key={step.id}
                className={`h-0.5 rounded-full ${
                  index === currentStep ? 'w-5 bg-blue-500' : 'w-1 bg-blue-200'
                }`}
                animate={{
                  width: index === currentStep ? 20 : 4, // Adjusted pixel values
                  backgroundColor: index === currentStep ? '#3B82F6' : '#BFDBFE'
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  // Update the file upload handler
  const handleFileUpload = async (file) => {
    try {
      setIsProcessing(true);
      // Your existing upload logic here
      await processFile(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsProcessing(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          showText={showHeaderText} 
          selectedUser={selectedUser}
          activeTab={activeTab}
          completedApplications={completedApplications}
          pendingApplications={pendingApplications}
        />
        <Toaster />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CRM; 