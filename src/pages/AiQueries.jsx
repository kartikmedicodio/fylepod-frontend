import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  User, 
  Folder, 
  ChevronDown, 
  ChevronUp, 
  Send,
  Clock,
  Loader2,
  Bot,
  History
} from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { usePage } from '../contexts/PageContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { useAuth } from '../contexts/AuthContext';

const AiQueries = () => {
  const { setPageTitle } = usePage();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // State management
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [expandedClient, setExpandedClient] = useState(null);
  const [allUsersCases, setAllUsersCases] = useState({}); // Store all users' cases
  const [loading, setLoading] = useState({
    clients: false,
    cases: false,
    chats: false,
    sending: false
  });
  const [allChatsWithMessages, setAllChatsWithMessages] = useState([]);

  // Set page title and breadcrumb
  useEffect(() => {
    setPageTitle('AI Conversations');
    setCurrentBreadcrumb([
      { name: 'Home', path: '/dashboard' },
      { name: 'Sophia Chat History', path: '/ai-queries' }
    ]);
  }, [setPageTitle, setCurrentBreadcrumb]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  // Focus input when selecting a case
  useEffect(() => {
    if (selectedCase) {
      inputRef.current?.focus();
    }
  }, [selectedCase]);

  // Fetch initial data
  useEffect(() => {
    fetchClients();
  }, []);

  // Data fetching functions
  const fetchClients = async () => {
    setLoading(prev => ({ ...prev, clients: true }));
    try {
      // Use the same API endpoint for both FN and attorney
      const response = await api.get('/chat/users/all-with-cases');
      const usersWithData = response.data.data.users;

      if (user?.role === 'individual' || user?.role === 'employee') {
        // For FN portal - filter current user's data
        const currentUserData = usersWithData.find(userData => userData._id === user.id);
        
        if (currentUserData) {
          const userCases = currentUserData.cases || [];
          
          // Extract unique cases from the response
          const uniqueCases = userCases.map(caseItem => ({
            _id: caseItem._id,
            categoryName: caseItem.categoryName,
            categoryStatus: caseItem.categoryStatus,
            deadline: caseItem.deadline,
            updatedAt: caseItem.updatedAt
          }));

          setCases(uniqueCases);
          setClients([]); // Clear clients list for FN portal
          
          // Store all cases with their chats for later use
          setAllChatsWithMessages(userCases);
          
          // If there are cases, select the first one
          if (uniqueCases.length > 0) {
            setSelectedCase(uniqueCases[0]);
            const firstCase = userCases.find(c => c._id === uniqueCases[0]._id);
            if (firstCase?.chats?.length > 0) {
              setChats(firstCase.chats);
              setSelectedChat(firstCase.chats[0]);
            }
          }
        }
      } else {
        // For attorneys - keep existing code unchanged
        setClients(usersWithData);

        // Store all users' cases and chats in state
        const userCasesMap = {};
        usersWithData.forEach(user => {
          userCasesMap[user._id] = user.cases || [];
        });
        setAllUsersCases(userCasesMap);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(prev => ({ ...prev, clients: false }));
    }
  };

  // Handle sending message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedCase) return;
    
    setLoading(prev => ({ ...prev, sending: true }));
    try {
      let chatId;
      
      // Check if we have an existing chat
      if (selectedChat) {
        chatId = selectedChat._id;
      } else {
        // Create new chat if none exists
        const createResponse = await api.post('/chat', {
          managementId: selectedCase._id,
          documentIds: []
        });
        chatId = createResponse.data.data.chat._id;
      }

      // Send message
      const messageResponse = await api.post(`/chat/${chatId}/messages`, {
        message: newMessage.trim()
      });

      if (!messageResponse.data.status === "success") {
        throw new Error("Failed to send message");
      }

      // Refresh all data to get updated chats
      const response = await api.get('/chat/users/all-with-cases');
      const usersWithData = response.data.data.users;

      if (user?.role === 'individual' || user?.role === 'employee') {
        // For FN portal - update current user's data
        const currentUserData = usersWithData.find(userData => userData._id === user.id);
        if (currentUserData) {
          const userCases = currentUserData.cases || [];
          setAllChatsWithMessages(userCases);
          
          // Update current case's chats
          const updatedCase = userCases.find(c => c._id === selectedCase._id);
          if (updatedCase?.chats) {
            setChats(updatedCase.chats);
            setSelectedChat(updatedCase.chats[0]);
          }
        }
      } else {
        // For attorneys - update all users' data
        const userCasesMap = {};
        usersWithData.forEach(user => {
          userCasesMap[user._id] = user.cases || [];
        });
        setAllUsersCases(userCasesMap);

        // Update current case's chats
        const selectedUserCases = userCasesMap[selectedClient._id] || [];
        const updatedCase = selectedUserCases.find(c => c._id === selectedCase._id);
        if (updatedCase?.chats) {
          setChats(updatedCase.chats);
          setSelectedChat(updatedCase.chats[0]);
        }
      }

      setNewMessage('');
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle client click - Use stored data directly
  const handleClientClick = (client) => {
    if (expandedClient === client._id) {
      setExpandedClient(null);
      setSelectedClient(null);
      setSelectedCase(null);
      setChats([]);
      setCases([]);
    } else {
      setExpandedClient(client._id);
      setSelectedClient(client);
      
      if (user?.role === 'attorney') {
        // Use stored cases for this client from allUsersCases
        const clientCases = allUsersCases[client._id] || [];
        setCases(clientCases);
      }
    }
  };

  // Handle case click - Use stored data directly for both FN and attorney
  const handleCaseClick = (caseItem) => {
    setSelectedCase(caseItem);
    if (user?.role === 'individual' || user?.role === 'employee') {
      // For FN portal users - use stored cases with chats
      const selectedCaseWithChat = allChatsWithMessages.find(c => c._id === caseItem._id);
      if (selectedCaseWithChat?.chats?.length > 0) {
        setChats(selectedCaseWithChat.chats);
        setSelectedChat(selectedCaseWithChat.chats[0]);
      } else {
        setChats([]);
        setSelectedChat(null);
      }
    } else {
      // For attorneys - keep existing code unchanged
      const selectedUserCases = allUsersCases[selectedClient._id] || [];
      const selectedCaseWithChat = selectedUserCases.find(c => c._id === caseItem._id);
      if (selectedCaseWithChat?.chats?.length > 0) {
        setChats(selectedCaseWithChat.chats);
        setSelectedChat(selectedCaseWithChat.chats[0]);
      } else {
        setChats([]);
        setSelectedChat(null);
      }
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'text-green-500 bg-green-50';
      case 'pending':
        return 'text-yellow-500 bg-yellow-50';
      default:
        return 'text-blue-500 bg-blue-50';
    }
  };

  // Helper function to safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] p-4 gap-4">
      {/* Clients Column with Cases Dropdown */}
      <div className="w-[30%] bg-white rounded-lg shadow-sm overflow-hidden flex flex-col border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-500" />
          <h2 className="font-medium">Conversations</h2>
        </div>
        
        <div className="overflow-auto flex-grow scrollbar-hide">
          {loading.clients ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : user?.role === 'individual' || user?.role === 'employee' ? (
            // For FN portal users, show cases directly
            <div className="divide-y divide-gray-200">
              {cases.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <History className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No chat history</p>
                </div>
              ) : (
                cases.map((caseItem) => (
                  <button
                    key={caseItem._id}
                    onClick={() => handleCaseClick(caseItem)}
                    className={`w-full px-6 py-3 flex items-start gap-3 hover:bg-gray-100 transition-colors ${
                      selectedCase?._id === caseItem._id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Folder className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-grow text-left">
                      <div className="font-medium text-gray-900 text-sm">
                        {caseItem.categoryName}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(caseItem.categoryStatus)}`}>
                          {caseItem.categoryStatus}
                        </span>
                        {caseItem.deadline && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(caseItem.deadline)}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            // For attorneys, show existing clients view
            <div className="divide-y divide-gray-200">
              {clients.map((client) => (
                <div key={client._id}>
                  <button
                    onClick={() => handleClientClick(client)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                      expandedClient === client._id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-grow text-left">
                      <div className="font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.email}</div>
                    </div>
                    {expandedClient === client._id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedClient === client._id && (
                    <div className="bg-gray-50 border-t border-gray-200">
                      {loading.cases ? (
                        <div className="flex justify-center p-4">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                      ) : (
                        <div className="py-2">
                          {cases.map((caseItem) => (
                            <button
                              key={caseItem._id}
                              onClick={() => handleCaseClick(caseItem)}
                              className={`w-full px-6 py-3 flex items-start gap-3 hover:bg-gray-100 transition-colors ${
                                selectedCase?._id === caseItem._id ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <Folder className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div className="flex-grow text-left">
                                <div className="font-medium text-gray-900 text-sm">
                                  {caseItem.categoryName}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(caseItem.categoryStatus)}`}>
                                    {caseItem.categoryStatus}
                                  </span>
                                  {caseItem.deadline && (
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {formatDate(caseItem.deadline)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Column */}
      <div className="w-[70%] bg-white rounded-lg shadow-sm overflow-hidden flex flex-col border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-medium text-gray-900">
            {selectedCase ? selectedCase.categoryName : 'Select a conversation'}
          </h2>
          {selectedCase && (
            <div className="text-sm text-gray-500 mt-1">
              {selectedCase.categoryStatus} • Last updated {formatDate(selectedCase.updatedAt)}
            </div>
          )}
        </div>
        
        {/* Chat Messages */}
        <div className="flex-grow overflow-auto p-4 space-y-4 scrollbar-hide">
          {loading.chats ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : selectedCase ? (
            <>
              {chats.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((chat) => {
                // Sort messages by timestamp for each chat, oldest first
                const sortedMessages = [...(chat.messages || [])].sort(
                  (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
                );
                
                return (
                  <div key={chat._id} className="space-y-4">
                    {/* Date Separator */}
                    <div className="flex items-center justify-center">
                      <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                        {formatDate(chat.createdAt)}
                      </div>
                    </div>
                    
                    {/* Messages for this chat */}
                    <div className="space-y-4">
                      {sortedMessages.map((message, index) => (
                        <div 
                          key={index}
                          className={`flex ${
                            message.role === 'user' 
                              ? 'ml-auto justify-end' 
                              : 'mr-auto'
                          } max-w-[85%] gap-3`}
                        >
                          {message.role !== 'user' && (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Bot className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              message.role === 'user'
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-gray-100 text-gray-900 rounded-bl-none'
                            }`}
                          >
                            <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
                            <div 
                              className={`text-[11px] mt-1 ${
                                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                              }`}
                            >
                              {formatDate(message.timestamp)}
                            </div>
                          </div>
                          {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Select a case to view the chat</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        {selectedCase && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-end gap-2">
              <div className="flex-grow">
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || loading.sending}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  !newMessage.trim() || loading.sending
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {loading.sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiQueries;
