import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getQueries, addResponse, updateQueryStatus, createQuery } from '../services/queryService';
import { getUserManagementCases } from '../services/managementService';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { usePage } from '../contexts/PageContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { 
  Send, 
  Loader2, 
  Search,
  Filter,
  Clock,
  CheckCheck,
  AlertCircle,
  Hourglass,
  ChevronRight,
  MessageSquare,
  Calendar,
  User,
  Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Add CSS to hide scrollbar
const scrollbarHideStyles = `
  /* Hide scrollbar for Chrome, Safari and Opera */
  ::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for IE, Edge and Firefox */
  * {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`;

const Queries = () => {
  const { user } = useAuth();
  const { setPageTitle } = usePage();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [newResponse, setNewResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [showNewQueryModal, setShowNewQueryModal] = useState(false);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const filterRef = useRef(null);

  // Set page title and breadcrumb
  useEffect(() => {
    setPageTitle('Queries');
    setCurrentBreadcrumb([
      { name: 'Home', path: '/dashboard' },
      { name: 'Queries', path: '/queries' }
    ]);
  }, [setPageTitle, setCurrentBreadcrumb]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedQuery?.responses]);

  // Focus input when selecting a query
  useEffect(() => {
    if (selectedQuery) {
      inputRef.current?.focus();
    }
  }, [selectedQuery]);

  // Debug log current user with full details
  useEffect(() => {
    console.log('Current user details:', {
      user,
      id: user?.id || user?._id,
      name: user?.name,
      role: user?.role
    });
  }, [user]);

  // Fetch queries from API
  const fetchQueries = async () => {
    try {
      setLoading(true);
      // Only apply status filter if it's not 'all'
      const filters = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      // Use the getQueries function which already filters by user role on the backend
      const response = await getQueries(filters);
      console.log('Fetched queries response:', response);
      if (response.status === 'success') {
        setQueries(response.data.queries);
        // Select the first query by default if available
        if (response.data.queries.length > 0 && !selectedQuery) {
          setSelectedQuery(response.data.queries[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching queries:', error);
      toast.error('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  // Fetch queries when component mounts or status filter changes
  useEffect(() => {
    fetchQueries();
  }, [statusFilter]);

  // Add dependency on user to refetch when user changes
  useEffect(() => {
    if (user) {
      fetchQueries();
    }
  }, [user]);

  // Check if a message is from the current user
  const isCurrentUser = (authorId) => {
    if (!user || !authorId) {
      console.log('Missing user or authorId:', { user, authorId });
      return false;
    }

    // Get the current user ID (handle both id and _id cases)
    const currentUserId = (user.id || user._id)?.toString();
    const messageAuthorId = authorId?.toString();

    console.log('Comparing IDs:', {
      user,
      currentUserId,
      messageAuthorId,
      isMatch: currentUserId === messageAuthorId
    });

    return currentUserId === messageAuthorId;
  };

  // Handle sending a new response
  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!newResponse.trim() || !selectedQuery || !user) return;

    try {
      setSubmitting(true);
      const response = await addResponse(selectedQuery._id, newResponse);

      if (response.status === 'success') {
        // Create an optimistic update with the new response
        const updatedQuery = {
          ...selectedQuery,
          responses: [
            ...selectedQuery.responses,
            {
              _id: Date.now().toString(),
              content: newResponse,
              author: {
                _id: user.id || user._id, // Handle both id formats
                id: user.id || user._id,  // Include both for compatibility
                name: user.name,
                email: user.email,
                role: user.role
              },
              authorRole: user.role,
              createdAt: new Date().toISOString()
            }
          ],
          status: 'in_progress'
        };

        // Update the selected query immediately
        setSelectedQuery(updatedQuery);

        // Update the query in the queries list
        setQueries(prevQueries => 
          prevQueries.map(q => 
            q._id === selectedQuery._id ? updatedQuery : q
          )
        );

        // Clear the input field
        setNewResponse('');
        
        // Refresh the queries list in the background
        fetchQueries();
        
        toast.success('Response sent successfully');
      }
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Get first character of name safely
  const getInitial = (name) => {
    if (!name || typeof name !== 'string') return '?';
    return name.charAt(0).toUpperCase();
  };

  // Get user display name
  const getUserName = (userObj) => {
    if (!userObj) return 'Unknown User';
    return userObj.name || 'Unknown User';
  };

  // Filter queries based on search term and status
  const filteredQueries = queries.filter(query => {
    const matchesSearch = searchTerm === '' || 
      query.foreignNationalId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.query?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || query.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  })
  // Sort queries by updatedAt in descending order (newest first)
  .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Hourglass className="h-4 w-4" />;
      case 'resolved':
        return <CheckCheck className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Handle resolving a query
  const handleResolveQuery = async () => {
    if (!selectedQuery || resolving) return;
    
    try {
      setResolving(true);
      
      // Call the API to update the query status
      const response = await updateQueryStatus(selectedQuery._id, 'resolved');
      
      if (response.status === 'success') {
        // Update the selected query
        const updatedQuery = {
          ...selectedQuery,
          status: 'resolved'
        };
        
        setSelectedQuery(updatedQuery);
        
        // Update the query in the queries list
        setQueries(prevQueries => 
          prevQueries.map(q => 
            q._id === selectedQuery._id ? updatedQuery : q
          )
        );
        
        toast.success('Query marked as resolved');
      } else {
        toast.error('Failed to resolve query');
      }
    } catch (error) {
      console.error('Error resolving query:', error);
      toast.error('Failed to resolve query');
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    // Add the styles to the document head when component mounts
    const styleElement = document.createElement('style');
    styleElement.innerHTML = scrollbarHideStyles;
    document.head.appendChild(styleElement);

    // Clean up when component unmounts
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div className="flex h-[calc(100vh-6.5rem)] bg-gradient-to-br from-gray-50 to-gray-100 mt-4 rounded-xl">
      {/* Sidebar */}
      <div className="w-[400px] flex flex-col border-r border-gray-200 bg-white/80 backdrop-blur-sm shadow-md rounded-l-xl">
        <div className="p-3 pb-3 border-b border-gray-200 relative z-50">
          {/* Search and filter with inline New Query button */}
          <div className="relative w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all duration-200 bg-white/70 backdrop-blur-sm"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2" ref={filterRef}>
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  <Filter className="h-4 w-4 text-gray-400" />
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 rounded-lg shadow-lg border border-gray-200 py-1 z-[1000]" 
                       style={{
                         position: 'absolute',
                         boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                       }}>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500">Filter by Status</div>
                    <div className="border-t border-gray-100">
                      {['all', 'pending', 'resolved'].map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setStatusFilter(status);
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-sm text-left flex items-center space-x-2 hover:bg-gray-50 ${
                            statusFilter === status ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                          }`}
                        >
                          {getStatusIcon(status)}
                          <span>{status === 'all' ? 'All Status' : status.replace('_', ' ')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {(user.role === 'individual' || user.role === 'employee') && (
              <button
                onClick={() => setShowNewQueryModal(true)}
                className="flex items-center px-2.5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150 shadow-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="text-sm">New</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto relative z-10">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : filteredQueries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium mb-1">No queries found</p>
              <p className="text-xs text-gray-400 mb-3">Try adjusting your search or filter</p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredQueries.map((query, index) => (
                <div 
                  key={query._id}
                  className={`p-4 cursor-pointer transition-colors duration-150 relative ${
                    selectedQuery?._id === query._id 
                      ? 'bg-blue-50/80 hover:bg-blue-50/80' 
                      : 'hover:bg-blue-50/30'
                  } ${index !== 0 ? 'border-t border-t-gray-100' : ''}`}
                  onClick={() => setSelectedQuery(query)}
                >
                  {/* Blue left border only for selected chat */}
                  {selectedQuery?._id === query._id && (
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                  )}
                  
                  <div className="pl-2 flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-blue-600 font-medium">
                          {getInitial(query.foreignNationalId?.name)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {getUserName(query.foreignNationalId)}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-1 leading-relaxed text-justify">
                          {query.query?.split(' ').slice(0, 4).join(' ')}
                          {query.query?.split(' ').length > 4 ? '...' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(query.status)
                      }`}>
                        {getStatusIcon(query.status)}
                      </span>
                      <span className="text-xs text-gray-400 mt-1 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(query.updatedAt), 'MMM d, h:mm a')}
                      </span>
                      {query.aiChatContext && (
                        <span className="text-xs text-purple-600 mt-1 flex items-center">
                          <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          AI Chat
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="pl-2 flex justify-between items-center">
                    <div className="text-xs text-gray-500 flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      Case: {query.managementId?.categoryName || 'Unknown Case'} 
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">
                        {query.managementId?._id?.substring(0, 6) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat section */}
      <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-sm shadow-md rounded-r-xl overflow-hidden">
        {selectedQuery ? (
          <>
            {/* Chat header */}
            <div className="h-[67px] p-4 pb-3 border-b border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm flex items-center">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
                    <span className="text-blue-600 font-medium">
                      {getInitial(selectedQuery.foreignNationalId?.name)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {getUserName(selectedQuery.foreignNationalId)}
                    </h2>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500 flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        Case: {selectedQuery.managementId?.categoryName || 'Unknown Case'}
                      </p>
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-xs ml-2">
                        {selectedQuery.managementId?._id?.substring(0, 6) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {selectedQuery.aiChatContext && (
                    <button
                      onClick={() => setShowConversationModal(true)}
                      className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-150 flex items-center space-x-1 shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>View Conversation</span>
                    </button>
                  )}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(selectedQuery.status)
                  }`}>
                    {getStatusIcon(selectedQuery.status)}
                    <span className="ml-1">{selectedQuery.status.replace('_', ' ')}</span>
                  </span>
                  {selectedQuery.status !== 'resolved' && (user.role === 'attorney' || user.role === 'admin' || user.role === 'manager' || user.role === 'individual' || user.role === 'employee') && (
                    <button 
                      onClick={handleResolveQuery}
                      disabled={resolving}
                      className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:from-green-500 disabled:hover:to-green-600 transition-colors duration-150 flex items-center space-x-1 shadow-sm"
                    >
                      {resolving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCheck className="h-4 w-4" />
                      )}
                      <span>Resolve</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 backdrop-blur-sm scrollbar-hide">
              {/* Original query */}
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
                    <span className="text-blue-600 font-medium">
                      {getInitial(selectedQuery.foreignNationalId?.name)}
                    </span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 shadow-sm max-w-3/4 border-l-4 border-indigo-400">
                  <div className="text-sm font-medium text-gray-900 mb-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <span>{getUserName(selectedQuery.foreignNationalId)}</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(selectedQuery.createdAt)}
                      </span>
                    </div>
                    <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">Query</span>
                  </div>
                  <div className="prose prose-sm text-gray-800 max-w-none">
                    <p className="whitespace-pre-line leading-relaxed text-justify">
                      {selectedQuery.query}
                    </p>
                  </div>
                </div>
              </div>

              {/* Responses */}
              {selectedQuery.responses && selectedQuery.responses.map((response) => {
                const fromCurrentUser = isCurrentUser(response.author?.id || response.author?._id);

                return (
                  <div 
                    key={response._id} 
                    className={`flex items-start ${fromCurrentUser ? 'justify-end' : ''}`}
                  >
                    {!fromCurrentUser && (
                      <div className="flex-shrink-0 mr-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
                          <span className="text-blue-600 font-medium">
                            {getInitial(response.author?.name)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div 
                      className={`rounded-lg p-4 shadow-sm max-w-3/4 ${
                        fromCurrentUser 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-3' 
                          : 'bg-white/90 backdrop-blur-sm border border-gray-100'
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        fromCurrentUser ? 'text-blue-50' : 'text-gray-900'
                      }`}>
                        {getUserName(response.author)}
                      </div>
                      <div className={
                        fromCurrentUser ? 'text-white' : 'text-gray-800'
                      }>
                        {response.content}
                      </div>
                      <div className={`mt-2 text-xs flex items-center ${
                        fromCurrentUser ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(response.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Response input */}
            <div className="p-4 bg-white/90 backdrop-blur-sm border-t border-gray-200 shadow-sm">
              <form onSubmit={handleSendResponse} className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder="Type your response..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-blue-500 transition-colors duration-150 shadow-sm"
                    disabled={!newResponse.trim() || submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
            <div className="text-center p-8 max-w-md">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Select a query to view details
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Choose from the list on the left to view and respond to queries
              </p>
              <div className="flex items-center justify-center text-gray-400">
                <ChevronRight className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Query Modal */}
      <NewQueryModal 
        isOpen={showNewQueryModal}
        onClose={() => setShowNewQueryModal(false)}
      />

      {/* View Conversation Modal */}
      <ViewConversationModal
        isOpen={showConversationModal}
        onClose={() => setShowConversationModal(false)}
        aiContext={selectedQuery?.aiChatContext}
        selectedQuery={selectedQuery}
      />
    </div>
  );
};

// Modal component for creating new queries
const NewQueryModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [selectedCase, setSelectedCase] = useState(null);
  const [queryContent, setQueryContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Reset selected case when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCases();
      setSelectedCase(null);
      setQueryContent('');
      setSearchTerm('');
      setShowDropdown(false);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      // Use the getUserManagementCases function to get only the user's cases
      const userId = user.id || user._id;
      const response = await getUserManagementCases(userId);
      
      if (response.status === 'success') {
        setCases(response.data.entries || []);
      } else {
        toast.error('Failed to load cases');
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const handleCaseSelect = (caseItem) => {
    setSelectedCase(caseItem);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCase || !queryContent.trim()) return;

    try {
      setSubmitting(true);
      const response = await createQuery({
        managementId: selectedCase._id,
        query: queryContent
      });
      
      if (response.status === 'success') {
        toast.success('Query created successfully');
        // Reset form state
        setSelectedCase(null);
        setQueryContent('');
        onClose();
      } else {
        toast.error('Failed to create query');
      }
    } catch (error) {
      console.error('Error creating query:', error);
      toast.error('Failed to create query');
    } finally {
      setSubmitting(false);
    }
  };

  // Custom close handler to reset state
  const handleClose = () => {
    setSelectedCase(null);
    setQueryContent('');
    onClose();
  };

  if (!isOpen) return null;

  // Filter cases based on search term including case ID
  const filteredCases = cases.filter(caseItem => 
    !searchTerm || 
    (caseItem._id && caseItem._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (caseItem.caseNumber && caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (caseItem.userName && caseItem.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (caseItem.categoryName && caseItem.categoryName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Query</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Case selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Case
            </label>
            
            <div className="relative" ref={dropdownRef}>
              {/* Select Case Button */}
              {!showDropdown && (
                <button
                  type="button"
                  onClick={() => setShowDropdown(true)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-lg text-left hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                    !selectedCase ? 'text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {selectedCase ? (
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-medium">
                          {selectedCase.userName?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedCase.categoryName || 'Unnamed Case'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedCase.userName || 'Unknown User'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span>Select a case</span>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              
              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {/* Search field inside dropdown */}
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search by case ID, name, or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  {/* Cases list */}
                  <div className="max-h-48 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      </div>
                    ) : filteredCases.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No matching cases found
                      </div>
                    ) : (
                      filteredCases.map(caseItem => (
                        <button
                          key={caseItem._id}
                          type="button"
                          onClick={() => handleCaseSelect(caseItem)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mr-3">
                                <span className="text-blue-600 font-medium">
                                  {caseItem.userName?.charAt(0) || '?'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {caseItem.categoryName || 'Unnamed Case'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {caseItem.userName || 'Unknown User'}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {caseItem.categoryStatus || 'Pending'}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Query content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Query Description
            </label>
            <textarea
              value={queryContent}
              onChange={(e) => setQueryContent(e.target.value)}
              placeholder="Please provide a detailed description of your legal query. Include relevant background information, specific issues or questions that need addressing, and any time-sensitive matters. Write in clear paragraphs to help the attorney fully understand your situation."
              rows={8}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed resize-none"
            />
            <p className="mt-2 text-xs text-gray-500">
              Write your query as a clear, detailed paragraph explaining the situation and the specific legal assistance needed.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedCase || !queryContent.trim() || submitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-blue-500 transition-colors duration-150 flex items-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Query'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

NewQueryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

// Add ViewConversationModal component
const ViewConversationModal = ({ isOpen, onClose, aiContext, selectedQuery }) => {
  if (!isOpen) return null;

  // Format the conversation to replace 'user' with username and 'assistant' with 'Sophia'
  const formatConversation = (conversationText) => {
    if (!conversationText || !selectedQuery) return conversationText;
    
    const userName = selectedQuery.foreignNationalId?.name || 'Client';
    
    // Replace "user:" with the actual username
    // Replace "assistant:" with "Sophia:"
    return conversationText
      .replace(/user:/gi, `${userName}:`)
      .replace(/assistant:/gi, 'Sophia:');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">AI Conversation</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                {formatConversation(aiContext)}
              </pre>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

ViewConversationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  aiContext: PropTypes.string,
  selectedQuery: PropTypes.object
};

export default Queries; 