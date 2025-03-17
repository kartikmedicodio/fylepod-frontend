import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../utils/api';
import { getStoredUser } from '../utils/auth';
import { format, isToday, isYesterday, isPast, formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { usePage } from '../contexts/PageContext';

// Helper function to check if all documents are approved
const checkAllDocumentsApproved = (documentTypes) => {
  if (!documentTypes || documentTypes.length === 0) return false;
  return documentTypes.every(doc => doc.status === 'approved');
};

// Helper component for status indicators
const ProcessingIndicator = ({ caseItem }) => {
  // Check if all documents are approved
  const allDocumentsApproved = checkAllDocumentsApproved(caseItem.documentTypes);
  
  // Check if preparation is complete (all docs approved and in final stage)
  const isPreparationComplete = allDocumentsApproved && caseItem.status.crossVerification;

  // Define steps with dynamic completion status
  const steps = [
    { name: 'Case Started', completed: true },
    { name: 'Data Collection', completed: caseItem.status.documentCollection },
    { name: 'In Review', completed: allDocumentsApproved },
    { name: 'Preparation', completed: isPreparationComplete }
  ];

  return (
    <div className="flex items-center justify-between w-full relative mt-6">
      {/* Progress Line */}
      <div className="absolute top-[20px] left-0 h-[3px] bg-gradient-to-r from-blue-600/20 to-blue-600/20 w-full">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700"
          style={{
            width: `${Math.min((steps.filter(step => step.completed).length / steps.length) * 100, 100)}%`,
            transition: 'width 1s ease-in-out'
          }}
        />
      </div>

      {steps.map((step, index) => (
        <div key={step.name} className="flex items-center">
          <div className="flex flex-col items-center relative">
            {/* Pulse Animation for Current Step */}
            {index === steps.findIndex(s => !s.completed) && (
              <div className="absolute z-0 w-[44px] h-[44px] top-5 left-1/2 -translate-x-1/2 -translate-y-1/2">
                {/* Multiple layers of pulse for enhanced effect */}
                <div className="absolute inset-0 rounded-full opacity-20 animate-step-ping-slow bg-blue-400/50" />
                <div className="absolute inset-0 rounded-full opacity-30 animate-step-ping bg-blue-500/50" />
                <div className="absolute inset-0 rounded-full opacity-40 animate-step-pulse-fast bg-blue-600/50" />
                <div className="absolute inset-0 rounded-full animate-step-pulse bg-blue-700/30 blur-[1px]" />
              </div>
            )}

            {/* Circle */}
            <div 
              className={`
                w-10 h-10 rounded-full flex items-center justify-center 
                transition-all duration-500 relative z-10
                transform hover:scale-110
                ${step.completed 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100' 
                  : index === steps.findIndex(s => !s.completed)
                    ? 'bg-white border-2 border-blue-600 text-blue-600 shadow-md'
                    : 'bg-gray-100 text-gray-400'
                }
              `}
            >
              {step.completed ? (
                <svg className="w-5 h-5 animate-fadeIn" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>

            {/* Label */}
            <span 
              className={`
                mt-4 text-sm font-medium whitespace-nowrap
                transition-all duration-300
                ${step.completed 
                  ? 'text-blue-700' 
                  : index === steps.findIndex(s => !s.completed)
                    ? 'text-blue-600 font-semibold scale-105'
                    : 'text-gray-400'
                }
              `}
            >
              {step.name}
            </span>

            {/* Status Indicator */}
            <span 
              className={`
                mt-1 text-xs
                transition-all duration-300
                ${step.completed 
                  ? 'text-green-600' 
                  : index === steps.findIndex(s => !s.completed)
                    ? 'text-blue-500'
                    : 'text-gray-400'
                }
              `}
            >
              {step.completed 
                ? 'Completed' 
                : index === steps.findIndex(s => !s.completed)
                  ? 'In Progress'
                  : 'Pending'
              }
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Add PropTypes validation
ProcessingIndicator.propTypes = {
  caseItem: PropTypes.shape({
    documentTypes: PropTypes.arrayOf(PropTypes.shape({
      status: PropTypes.string.isRequired
    })),
    status: PropTypes.shape({
      documentCollection: PropTypes.bool,
      crossVerification: PropTypes.bool
    }).isRequired
  }).isRequired
};

// Helper function to check if a date is overdue
const isOverdue = (date) => {
  if (!date) return false;
  return isPast(date) && !isToday(date);
};

// Helper function to format date in a user-friendly way
const formatDate = (date) => {
  if (!date) return '';
  
  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`;
  } else if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'h:mm a')}`;
  } else {
    return format(date, 'MMM d, yyyy');
  }
};

// Helper function to get status color classes
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'processing':
      return 'bg-yellow-100 text-yellow-800';
    case 'processed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const Dashboard = () => {
  // Comment out notification and inbox related state
  /*
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showNotificationDetails, setShowNotificationDetails] = useState(false);
  const [readNotifications, setReadNotifications] = useState(() => {
    const stored = localStorage.getItem('readNotifications');
    return stored ? JSON.parse(stored) : [];
  });
  const [deletedNotifications, setDeletedNotifications] = useState(() => {
    const stored = localStorage.getItem('deletedNotifications');
    return stored ? JSON.parse(stored) : [];
  });
  */
  const navigate = useNavigate();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const { setPageTitle } = usePage();

  useEffect(() => {
    setCurrentBreadcrumb([{ name: 'Dashboard', path: '/dashboard' }]);
    setPageTitle('Dashboard');
  }, [setCurrentBreadcrumb, setPageTitle]);

  // Comment out notification related effects
  /*
  useEffect(() => {
    localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
  }, [readNotifications]);
  
  useEffect(() => {
    localStorage.setItem('deletedNotifications', JSON.stringify(deletedNotifications));
  }, [deletedNotifications]);
  */

  // Comment out notification related functions
  /*
  const fetchNotifications = async () => {
    // ... existing notification fetch code ...
  };

  const markNotificationAsRead = (notificationId) => {
    // ... existing mark as read code ...
  };

  const markAllAsRead = () => {
    // ... existing mark all as read code ...
  };

  const deleteNotification = (event, notificationId) => {
    // ... existing delete notification code ...
  };

  const deleteAllRead = () => {
    // ... existing delete all read code ...
  };

  const clearDeletedHistory = () => {
    // ... existing clear history code ...
  };

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleRefresh = () => {
    fetchNotifications();
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };
  */

  // Helper function to get user's ID from stored user data
  const getUserId = () => {
    const userData = getStoredUser();
    return userData?.id || userData?._id;
  };

  // Helper function to normalize ID comparison
  const isSameId = (id1, id2) => {
    // Handle cases where id might be an object with _id property
    const normalizedId1 = typeof id1 === 'object' ? id1._id || id1.id : id1;
    const normalizedId2 = typeof id2 === 'object' ? id2._id || id2.id : id2;
    
    // Convert to string for comparison
    return String(normalizedId1) === String(normalizedId2);
  };

  const [recentCases, setRecentCases] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState('Cases');
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [recentError, setRecentError] = useState(null);

  // Function to fetch recent cases from the backend
  const fetchRecentCases = async () => {
    try {
      setLoadingRecent(true);
      setRecentError(null);
      
      const userId = getUserId();
      
      if (!userId) {
        setRecentError('Unable to load recent cases: No user ID found');
        return;
      }
      
      // Use the working all-managements endpoint instead of recent-cases
      const response = await api.get('/management/all-managements');
      
      // Check for status: "success" instead of success: true
      if (response.data.status === "success") {
        // Format the cases data for display
        const managements = response.data.data.managements || [];
        
        // Filter managements where user is the case manager or creator
        const filteredManagements = managements.filter(management => {
          const isCaseManager = isSameId(management.caseManagerId, userId);
          const isCreator = isSameId(management.createdBy, userId);
          return isCaseManager || isCreator;
        });
        
        // Sort by updated date (newest first) and take the first 3
        const sortedManagements = filteredManagements.sort((a, b) => 
          new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
        ).slice(0, 3);
        
        // Format the cases data for display, with improved status detection
        const formattedCases = sortedManagements.map(caseData => {
          // Count uploaded documents to determine document collection status
          const uploadedDocs = caseData.documentTypes?.filter(doc => doc.status === 'uploaded').length || 0;
          const totalDocCount = caseData.documentTypes?.length || 0; // Renamed to avoid linter error
          
          // Calculate document completion percentage
          const docCompletionPercent = totalDocCount > 0 ? (uploadedDocs / totalDocCount) * 100 : 0;
          
          return {
            _id: caseData._id,
            caseId: caseData.caseId || caseData._id.substring(0, 8),
            userName: caseData.userName || (caseData.userId?.name) || 'Unknown Client',
            title: caseData.title || caseData.formName || caseData.categoryName || 'Untitled Case',
            docCompletionPercent, // Add completion percentage
            totalDocCount, // Add total document count
            uploadedDocs, // Add uploaded document count
            deadline: caseData.deadline ? new Date(caseData.deadline) : null,
      status: {
              documentCollection: uploadedDocs > 0,
              aiVerification: caseData.verificationResults?.verifiedAt || caseData.lastVerifiedAt ? true : false,
              attorneyApproval: caseData.categoryStatus === 'approved' || caseData.isApproved || false,
              crossVerification: caseData.crossVerified || false
            }
          };
        });
        
        setRecentCases(formattedCases);
      } else {
        throw new Error(response.data.message || 'Failed to fetch recent cases');
      }
    } catch (err) {
      console.error('Error fetching recent cases:', err);
      setRecentError('Failed to load recent cases: ' + (err.message || 'Unknown error'));
    } finally {
      setLoadingRecent(false);
    }
  };
  
  // Function to fetch recent customers from the backend
  const fetchRecentCustomers = async () => {
    try {
      setLoadingRecent(true);
      setRecentError(null);
      
      const userId = getUserId();
      
      if (!userId) {
        setRecentError('Unable to load recent customers: No user ID found');
        return;
      }

      const response = await api.get('/auth/users');
      
      if (response.data.status === 'success') {
        const users = response.data.data.users;
        
        // Get current user's lawfirm ID
        const currentUser = users.find(user => isSameId(user._id, userId));
        const userLawfirmId = currentUser?.lawfirm_id?._id;

        const filteredUsers = users.filter(user => {
          const isValidRole = user.role === 'individual' || user.role === 'employee';
          const belongsToSameLawfirm = isSameId(user.lawfirm_id?._id, userLawfirmId);
          const isNotCurrentUser = !isSameId(user._id, userId);
          return isValidRole && belongsToSameLawfirm && isNotCurrentUser;
        });
        
        // Sort by creation date (newest first) and take the first 3
        const sortedUsers = filteredUsers
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);
        
        // Format the users data for display
        const formattedUsers = sortedUsers.map(user => ({
          _id: user._id,
          name: user.name,
          email: user.contact?.email || user.email,
          role: user.role,
          company: user.company_name || (user.role === 'employee' ? user.currentJob?.companyName : 'N/A'),
          jobTitle: user.currentJob?.jobTitle || 'N/A',
          location: user.address ? `${user.address.city}, ${user.address.country}` : 'N/A',
          phone: user.contact?.mobileNumber || user.contact?.residencePhone || 'N/A',
          createdAt: new Date(user.createdAt)
        }));
        
        setRecentCustomers(formattedUsers);
      } else {
        throw new Error(response.data.message || 'Failed to fetch customers');
      }
    } catch (err) {
      console.error('Error fetching recent customers:', err);
      setRecentError('Failed to load recent customers: ' + (err.message || 'Unknown error'));
    } finally {
      setLoadingRecent(false);
    }
  };
  
  // Fetch recent data when component mounts
  useEffect(() => {
    fetchRecentCases();
    // Add the below line if you implement customers fetching too
    fetchRecentCustomers();
  }, []);
  
  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'Cases' && recentCases.length === 0) {
      fetchRecentCases();
    } else if (tab === 'Customers' && recentCustomers.length === 0) {
      fetchRecentCustomers();
    }
  };

  // Function to safely format date
  const safeFormatDistanceToNow = (date) => {
    try {
      // Check if date is valid
      const timestamp = new Date(date).getTime();
      if (isNaN(timestamp)) {
        return 'Invalid date';
      }
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Function to handle notification click
  const handleNotificationClick = (notification) => {
    // ... existing notification click code ...
  };

  return (
    <>
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .animate-slideInRight {
            animation: slideInRight 0.3s ease-out forwards;
          }

          @keyframes step-ping {
            75%, 100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
          
          @keyframes step-ping-slow {
            75%, 100% {
              transform: scale(2);
              opacity: 0;
            }
          }
          
          @keyframes step-pulse {
            50% {
              opacity: .5;
            }
          }
          
          @keyframes step-pulse-fast {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: .5;
            }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .animate-step-ping {
            animation: step-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
          
          .animate-step-ping-slow {
            animation: step-ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
          
          .animate-step-pulse {
            animation: step-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          
          .animate-step-pulse-fast {
            animation: step-pulse-fast 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
          }
        `}
      </style>
    <div className="space-y-8">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Comment out Notifications Section */}
        {/* <div className="bg-white rounded-xl shadow-sm">
          // ... existing notifications section code ...
        </div> */}

        {/* Comment out Inbox Section */}
        {/* <div className="bg-white rounded-xl shadow-sm">
          // ... existing inbox section code ...
        </div> */}
      </div>

      {/* Recent Section */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-medium text-gray-900">Recent</h2>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-3 mb-8">
            <button 
              className={`px-4 py-2 rounded-md transition-all ${activeTab === 'Cases' 
                ? 'bg-blue-50 text-blue-700 font-medium' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              onClick={() => handleTabChange('Cases')}
            >
              Cases
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-all ${activeTab === 'Customers' 
                ? 'bg-blue-50 text-blue-700 font-medium' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              onClick={() => handleTabChange('Customers')}
            >
              Customers
            </button>
          </div>

          {/* Loading State */}
          {loadingRecent && (
            <div className="py-4 text-center text-gray-500">
              <div className="animate-spin h-5 w-5 mx-auto mb-2">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p>Loading...</p>
            </div>
          )}
          
          {/* Error State */}
          {recentError && (
            <div className="py-4 text-center text-red-500">
              <p>{recentError}</p>
              <button 
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                onClick={() => activeTab === 'Cases' ? fetchRecentCases() : fetchRecentCustomers()}
              >
                Retry
              </button>
            </div>
          )}
          
          {/* No Data State */}
          {!loadingRecent && !recentError && 
            ((activeTab === 'Cases' && recentCases.length === 0) || 
             (activeTab === 'Customers' && recentCustomers.length === 0)) && (
            <div className="py-8 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10 mx-auto mb-2 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-base font-medium">No {activeTab.toLowerCase()} available</p>
              <p className="text-sm mt-1">Your recent {activeTab.toLowerCase()} will appear here</p>
            </div>
          )}
          
          {/* Cases List */}
          {activeTab === 'Cases' && !loadingRecent && recentCases.length > 0 && (
            <div className="space-y-6">
              {recentCases.map(caseItem => (
                <div 
                  key={caseItem._id}
                  onClick={() => navigate(`/cases/${caseItem._id}`)}
                  className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md bg-white group cursor-pointer"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center text-sm text-gray-600 mb-1.5">
                          <span className="font-medium text-gray-800">Case ID - {caseItem.caseId}</span>
                          <span className="mx-2 text-gray-300">•</span>
                          <span>{caseItem.userName}</span>
                        </div>
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {caseItem.title}
                        </h3>
                      </div>
                      
                      {/* Progress indicator */}
                      <div className="flex flex-col items-end">
                        <div className="text-xs text-gray-500 mb-1">
                          Documents: {caseItem.uploadedDocs}/{caseItem.totalDocCount}
                        </div>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full" 
                            style={{ width: `${caseItem.docCompletionPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Processing Steps */}
                    <ProcessingIndicator caseItem={caseItem} />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Customers List */}
          {activeTab === 'Customers' && !loadingRecent && recentCustomers.length > 0 && (
            <div className="space-y-6">
              {recentCustomers.map(customer => (
                <div 
                  key={customer._id}
                  className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer bg-white"
                  onClick={() => navigate(`/clients/${customer._id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900">{customer.name}</h3>
                        <span className="text-sm text-gray-500 capitalize">{customer.role}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div className="text-gray-600">
                          <span className="text-gray-400 mr-1">Email:</span>
                          {customer.email}
                        </div>
                        <div className="text-gray-600">
                          <span className="text-gray-400 mr-1">Phone:</span>
                          {customer.phone}
                        </div>
                        {customer.role === 'employee' && (
                          <>
                            <div className="text-gray-600">
                              <span className="text-gray-400 mr-1">Company:</span>
                              {customer.company}
                            </div>
                            <div className="text-gray-600">
                              <span className="text-gray-400 mr-1">Title:</span>
                              {customer.jobTitle}
                            </div>
                          </>
                        )}
                        <div className="text-gray-600">
                          <span className="text-gray-400 mr-1">Location:</span>
                          {customer.location}
                        </div>
                        <div className="text-gray-600">
                          <span className="text-gray-400 mr-1">Added:</span>
                          {format(customer.createdAt, 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comment out Notification Details Modal */}
      {/* {showNotificationDetails && selectedNotification && (
        // ... existing notification details modal code ...
      )} */}
    </div>
  </>
);
};

export default Dashboard; 