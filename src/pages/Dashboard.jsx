import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../utils/api';
import { getStoredUser } from '../utils/auth';
import { format, isToday, isYesterday, isPast, formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { usePage } from '../contexts/PageContext';

// Helper component for status indicators
const StatusIndicator = ({ title, completed, icon }) => (
  <div className="flex flex-col items-center py-3 text-xs group">
    <div className={`mb-1.5 ${completed ? 'text-blue-600' : 'text-gray-400'}`}>
      {icon}
    </div>
    <span className={`text-center ${completed ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
      {title}
    </span>
    <div className="h-1 w-5 mt-1.5 rounded-full bg-gray-100 relative">
      <div className={`absolute inset-0 rounded-full ${completed ? 'bg-blue-600' : 'bg-transparent'}`}></div>
    </div>
  </div>
);

// Add PropTypes validation
StatusIndicator.propTypes = {
  title: PropTypes.string.isRequired,
  completed: PropTypes.bool.isRequired,
  icon: PropTypes.node.isRequired
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
  const navigate = useNavigate();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const { setPageTitle } = usePage();

  useEffect(() => {
    setCurrentBreadcrumb([{ name: 'Dashboard', path: '/dashboard' }]);
    setPageTitle('Dashboard');
  }, [setCurrentBreadcrumb, setPageTitle]);

  // Save read notifications to localStorage
  useEffect(() => {
    localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
  }, [readNotifications]);
  
  // Save deleted notifications to localStorage
  useEffect(() => {
    localStorage.setItem('deletedNotifications', JSON.stringify(deletedNotifications));
  }, [deletedNotifications]);

  // Function to fetch and process notifications
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/documents/all-documents', {
        params: {
          limit: 10,
          page: 1,
          sortBy: 'createdAt',
          order: 'desc'
        }
      });

      if (response.data.status === 'success') {
        // Process documents into notifications
        const notificationsList = response.data.data.documents
          .filter(doc => !deletedNotifications.includes(doc._id))
          .map(doc => ({
            id: doc._id,
            title: `Document ${doc.status === 'processing' ? 'Uploaded' : doc.status}`,
            message: `${doc.type || 'Document'} has been ${doc.status === 'processing' ? 'uploaded' : doc.status}`,
            timestamp: new Date(doc.createdAt),
            status: doc.status,
            managementId: doc.managementId?._id,
            userName: doc.managementId?.userName || 'Unknown User',
            categoryName: doc.managementId?.categoryName || 'Uncategorized',
            documentType: doc.type || 'Document',
            isRead: readNotifications.includes(doc._id)
          }))
          .filter(notification => 
            notification.status === 'processing' || 
            notification.status === 'processed' || 
            notification.status === 'failed'
          );

        setNotifications(notificationsList);
      } else {
        throw new Error(response.data.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
        navigate('/login');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Please try again later';
        setError(`Failed to load notifications: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to mark notification as read
  const markNotificationAsRead = (notificationId) => {
    if (!readNotifications.includes(notificationId)) {
      setReadNotifications(prev => [...prev, notificationId]);
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = () => {
    const unreadIds = notifications
      .filter(notification => !notification.isRead)
      .map(notification => notification.id);
    
    if (unreadIds.length > 0) {
      setReadNotifications(prev => [...new Set([...prev, ...unreadIds])]);
      setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
    }
  };

  // Function to delete a notification
  const deleteNotification = (event, notificationId) => {
    event.stopPropagation();
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    setDeletedNotifications(prev => [...prev, notificationId]);
  };

  // Function to delete all read notifications
  const deleteAllRead = () => {
    const readNotificationIds = notifications
      .filter(notification => notification.isRead)
      .map(notification => notification.id);
      
    setNotifications(prev => prev.filter(notification => !notification.isRead));
    setDeletedNotifications(prev => [...new Set([...prev, ...readNotificationIds])]);
  };

  // Function to clear deleted notifications history
  const clearDeletedHistory = () => {
    if (window.confirm('This will restore all previously deleted notifications. Continue?')) {
      setDeletedNotifications([]);
      fetchNotifications();
    }
  };

  // Fetch notifications when component mounts
  useEffect(() => {
    fetchNotifications();
    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(fetchNotifications, 5 * 60 * 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleRefresh = () => {
    fetchNotifications();
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };

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
    setSelectedNotification(notification);
    setShowNotificationDetails(true);
    markNotificationAsRead(notification.id);
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
        `}
      </style>
    <div className="space-y-8">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Notifications Section */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs flex items-center justify-center rounded-full">
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
              </div>
              {notifications.length > 0 && (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleRefresh}
                    className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                    title="Refresh notifications"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button 
                    onClick={markAllAsRead}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark all as read
                  </button>
                  <button 
                    onClick={deleteAllRead}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete read
                  </button>
                </div>
              )}
            </div>
            <div className={`${loading ? 'opacity-60' : ''} h-[400px] overflow-y-auto hide-scrollbar`}>
              {loading && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="animate-spin h-5 w-5 mb-3">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <p className="text-sm">Loading notifications...</p>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="bg-red-50 rounded-full p-3 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-500 text-sm font-medium mb-2">{error}</p>
                  <button 
                    className="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-full transition-colors"
                    onClick={handleRefresh}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="bg-gray-50 rounded-full p-4 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-base font-medium mb-1">All caught up!</p>
                  <p className="text-sm text-gray-400">No new notifications</p>
                </div>
              )}

              {notifications.length > 0 && (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`group relative p-2 transition-all duration-200 rounded-lg
                        ${notification.isRead 
                          ? 'bg-white hover:bg-gray-50 border border-gray-100' 
                          : 'bg-blue-50 hover:bg-blue-50/90 border border-blue-100'}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0">
                          {!notification.isRead ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full border-2 border-gray-200" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">Case ID - {notification.managementId}</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-sm text-gray-600">{notification.userName}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-gray-500">{safeFormatDistanceToNow(notification.timestamp)}</span>
                              <span className={`mt-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                                <span className={`w-1 h-1 rounded-full mr-1 ${
                                  notification.status === 'processing' ? 'bg-yellow-500' :
                                  notification.status === 'processed' ? 'bg-green-500' :
                                  notification.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                                }`}></span>
                                {notification.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-base text-gray-900 font-medium">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-end">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationAsRead(notification.id);
                                  }}
                                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Mark as read"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={(e) => deleteNotification(e, notification.id)}
                                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete notification"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
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
        </div>

        {/* Inbox Section */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h2 className="text-lg font-medium text-gray-900">Inbox</h2>
            </div>
            <div className="divide-y divide-gray-100 h-[400px] overflow-y-auto hide-scrollbar">
              {[
                {
                  id: 1,
                  sender: "Helena Chavez",
                  title: "Paystub enquiry",
                  message: "Which paystub has to be documented......",
                  time: "11:52AM",
                  avatar: "HC"
                },
                {
                  id: 2,
                  sender: "Sallie Wade",
                  title: "Paystub enquiry",
                  message: "Which paystub has to be documented......",
                  time: "10:04AM",
                  avatar: "SW"
                },
                {
                  id: 3,
                  sender: "Blake Howard",
                  title: "Paystub enquiry",
                  message: "Which paystub has to be documented......",
                  time: "08:31AM",
                  avatar: "BH"
                },
                {
                  id: 4,
                  sender: "Devin Williams",
                  title: "Paystub enquiry",
                  message: "Which paystub has to be documented......",
                  time: "08:01PM",
                  avatar: "DW"
                }
              ].map((message) => (
                <div key={message.id} className="py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        {message.avatar}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{message.sender}</span>
                            <span className="text-xs text-gray-500">{message.time}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {message.title}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {message.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
                  className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md bg-white group"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center text-sm text-gray-600 mb-1.5">
                          <span className="font-medium text-gray-800">Case ID - {caseItem.caseId}</span>
                          <span className="mx-2 text-gray-300">•</span>
                          <span>{caseItem.userName}</span>
                        </div>
                        <h3 className="font-medium text-gray-900">
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
                    
                    {/* Status indicators */}
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <StatusIndicator 
                        title="Document Collection" 
                        completed={caseItem.status.documentCollection}
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        }
                      />
                      <StatusIndicator 
                        title="AI Verification" 
                        completed={caseItem.status.aiVerification}
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        }
                      />
                      <StatusIndicator 
                        title="Attorney Approval" 
                        completed={caseItem.status.attorneyApproval}
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        }
                      />
                      <StatusIndicator 
                        title="Cross Verification" 
                        completed={caseItem.status.crossVerification}
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                      />
                    </div>
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

      {/* Notification Details Modal */}
      {showNotificationDetails && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto animate-slideInRight">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
              <h2 className="text-lg font-medium">Case Details</h2>
              <button 
                onClick={() => setShowNotificationDetails(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{selectedNotification.categoryName}</h3>
                    <p className="text-gray-500">Case ID: {selectedNotification._id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedNotification.status)}`}>
                    {selectedNotification.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Client</p>
                    <p className="text-sm font-medium">{selectedNotification.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Deadline</p>
                    <p className="text-sm font-medium">{selectedNotification.deadline ? format(new Date(selectedNotification.deadline), 'dd MMM yyyy') : 'No deadline'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created By</p>
                    <p className="text-sm font-medium">{selectedNotification.createdBy?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created On</p>
                    <p className="text-sm font-medium">{format(new Date(selectedNotification.createdAt), 'dd MMM yyyy')}</p>
                  </div>
                </div>
              </div>

              {/* Document List */}
              <div className="mb-6">
                <h4 className="text-md font-medium mb-3">Required Documents</h4>
                <div className="space-y-3">
                  {selectedNotification.documentTypes.map((doc) => (
                    <div key={doc._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        {doc.status === 'uploaded' ? (
                          <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 text-green-600">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 text-yellow-600">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        )}
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.required ? 'Required' : 'Optional'}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        doc.status === 'uploaded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Results */}
              {selectedNotification.verificationResults && (
                <div className="mb-6">
                  <h4 className="text-md font-medium mb-3">Verification Results</h4>
                  <div className="space-y-4">
                    {/* Mismatch Errors */}
                    {selectedNotification.verificationResults.mismatchErrors?.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h5 className="text-sm font-medium mb-2 text-red-600">Mismatch Errors</h5>
                        <div className="space-y-2">
                          {selectedNotification.verificationResults.mismatchErrors.map((error, idx) => (
                            <div key={idx} className="text-sm">
                              <p className="font-medium">{error.type}</p>
                              <p className="text-gray-600 text-xs mt-1">
                                {typeof error.details === 'string' 
                                  ? error.details 
                                  : Object.entries(error.details).map(([key, value]) => `${key}: ${value}`).join(', ')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Missing Errors */}
                    {selectedNotification.verificationResults.missingErrors?.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h5 className="text-sm font-medium mb-2 text-orange-600">Missing Information</h5>
                        <div className="space-y-2">
                          {selectedNotification.verificationResults.missingErrors.map((error, idx) => (
                            <div key={idx} className="text-sm">
                              <p className="font-medium">{error.type}</p>
                              <p className="text-gray-600 text-xs mt-1">{error.details}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Summarization Errors */}
                    {selectedNotification.verificationResults.summarizationErrors?.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h5 className="text-sm font-medium mb-2 text-blue-600">Summary</h5>
                        <div className="space-y-2">
                          {selectedNotification.verificationResults.summarizationErrors.map((error, idx) => (
                            <div key={idx} className="text-sm">
                              <p className="font-medium">{error.type}</p>
                              <p className="text-gray-600 text-xs mt-1">{error.details}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* No errors found */}
                    {(!selectedNotification.verificationResults.mismatchErrors?.length && 
                      !selectedNotification.verificationResults.missingErrors?.length && 
                      !selectedNotification.verificationResults.summarizationErrors?.length) && (
                      <div className="border rounded-lg p-4 bg-green-50">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-green-600 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-sm font-medium text-green-600">All documents verified successfully</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-1">
                      Last verified: {selectedNotification.lastVerifiedAt 
                        ? format(new Date(selectedNotification.lastVerifiedAt), 'dd MMM yyyy, HH:mm') 
                        : 'Not verified yet'}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action Button */}
              <div className="mt-8">
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
                  onClick={() => navigate(`/management/${selectedNotification._id}`)}
                >
                  View Full Case Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </>
);
};

export default Dashboard; 