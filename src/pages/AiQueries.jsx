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
  Bot
} from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { usePage } from '../contexts/PageContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

const AiQueries = () => {
  const { setPageTitle } = usePage();
  const { setCurrentBreadcrumb } = useBreadcrumb();
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
  const [loading, setLoading] = useState({
    clients: false,
    cases: false,
    chats: false,
    sending: false
  });

  // Set page title and breadcrumb
  useEffect(() => {
    setPageTitle('AI Conversations');
    setCurrentBreadcrumb([
      { name: 'Home', path: '/dashboard' },
      { name: 'AI Queries', path: '/ai-queries' }
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

  // Fetch cases when client is selected
  useEffect(() => {
    if (selectedClient) {
      fetchCases(selectedClient._id);
    } else {
      setCases([]);
      setSelectedCase(null);
      setChats([]);
      setSelectedChat(null);
    }
  }, [selectedClient]);

  // Fetch chats when case is selected
  useEffect(() => {
    if (selectedCase) {
      fetchChats(selectedCase._id);
    } else {
      setChats([]);
      setSelectedChat(null);
    }
  }, [selectedCase]);

  // Data fetching functions
  const fetchClients = async () => {
    setLoading(prev => ({ ...prev, clients: true }));
    try {
      const response = await api.get('/chat/users');
      setClients(response.data.data.users);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(prev => ({ ...prev, clients: false }));
    }
  };

  const fetchCases = async (userId) => {
    setLoading(prev => ({ ...prev, cases: true }));
    try {
      const response = await api.get(`/chat/user/${userId}/cases`);
      setCases(response.data.data.entries);
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setLoading(prev => ({ ...prev, cases: false }));
    }
  };

  const fetchChats = async (managementId) => {
    setLoading(prev => ({ ...prev, chats: true }));
    try {
      const response = await api.get(`/chat/management/${managementId}`);
      setChats(response.data.data.chats || []);
      // Select the most recent chat by default
      if (response.data.data.chats?.length > 0) {
        setSelectedChat(response.data.data.chats[0]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setLoading(prev => ({ ...prev, chats: false }));
    }
  };

  // Handle sending message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedCase) return;
    
    setLoading(prev => ({ ...prev, sending: true }));
    try {
      await api.post(`/chat/${selectedCase._id}/messages`, {
        message: newMessage
      });
      // Refresh chats after sending message
      fetchChats(selectedCase._id);
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

  // Handle client click
  const handleClientClick = (client) => {
    if (expandedClient === client._id) {
      setExpandedClient(null);
      setSelectedClient(null);
      setSelectedCase(null);
    } else {
      setExpandedClient(client._id);
      setSelectedClient(client);
    }
  };

  // Handle case click
  const handleCaseClick = (caseItem) => {
    setSelectedCase(caseItem);
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
          ) : (
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
                                      {format(new Date(caseItem.deadline), 'MMM dd')}
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
              {selectedCase.categoryStatus} • Last updated {format(new Date(selectedCase.updatedAt), 'MMM dd, yyyy')}
            </div>
          )}
        </div>
        
        {/* Chat Selection Tabs */}
        {selectedCase && chats.length > 0 && (
          <div className="border-b border-gray-200 px-4">
            <div className="flex gap-4 -mb-px">
              {chats.map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                    selectedChat?._id === chat._id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {format(new Date(chat.createdAt), 'MMM dd, HH:mm')}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Chat Messages */}
        <div className="flex-grow overflow-auto p-4 space-y-4 scrollbar-hide">
          {loading.chats ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : selectedCase ? (
            selectedChat?.messages?.length > 0 ? (
              selectedChat.messages.map((message, index) => (
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
                      {format(new Date(message.timestamp), 'HH:mm')}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No messages yet. Start a conversation!</p>
              </div>
            )
          ) : (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Select a case to view the chat</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
       
      </div>
    </div>
  );
};

export default AiQueries;
