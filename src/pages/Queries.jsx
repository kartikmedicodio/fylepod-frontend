import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getQueries, addResponse, updateQueryStatus } from '../services/queryService';
import { format } from 'date-fns';
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
  User
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
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [newResponse, setNewResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [resolving, setResolving] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const filterRef = useRef(null);

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

  // Fetch queries on component mount
  useEffect(() => {
    fetchQueries();
  }, []);

  // Fetch queries from API
  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await getQueries();
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
  });

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
        <div className="h-[66px] p-4 pb-3 border-b border-gray-200 flex items-center">
          {/* Search and filter */}
          <div className="relative w-full">
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
                <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 py-1 z-10 animate-fadeIn">
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
        </div>
        
        <div className="flex-1 overflow-y-auto">
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
                  className={`p-4 cursor-pointer transition-colors duration-150 border-l-4 ${
                    selectedQuery?._id === query._id 
                      ? 'bg-blue-50/80 hover:bg-blue-50/80 border-blue-500' 
                      : 'hover:bg-blue-50/30 border-blue-200 hover:border-blue-300'
                  } ${index !== 0 ? 'border-t border-t-gray-100' : ''}`}
                  onClick={() => setSelectedQuery(query)}
                >
                  <div className="flex justify-between items-start mb-2">
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
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {query.query}
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
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
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
            <div className="h-[66px] p-4 pb-3 border-b border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm flex items-center">
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
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(selectedQuery.status)
                  }`}>
                    {getStatusIcon(selectedQuery.status)}
                    <span className="ml-1">{selectedQuery.status.replace('_', ' ')}</span>
                  </span>
                  {selectedQuery.status !== 'resolved' && (
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
                  <div className="text-sm font-medium text-gray-900 mb-1 flex items-center">
                    {getUserName(selectedQuery.foreignNationalId)}
                    <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">Query</span>
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap font-medium">
                    {selectedQuery.query}
                  </div>
                  <div className="mt-2 text-xs text-gray-400 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(selectedQuery.createdAt)}
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
    </div>
  );
};

export default Queries; 