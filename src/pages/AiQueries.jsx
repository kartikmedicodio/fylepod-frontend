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
  const [isMessageSending, setIsMessageSending] = useState(false);
  const messageDebounceRef = useRef(null);

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
      if (user?.role === 'individual' || user?.role === 'employee') {
        // For FN portal - get cases with chats
        const response = await api.get(`/chat/chats-with-messages/${user.id}`);
        
        // Group chats by managementId and find latest message timestamp
        const chatsByCase = response.data.data.chats.reduce((acc, chat) => {
          if (chat.managementId && chat.managementId.userId?._id === user.id) {
            const caseId = chat.managementId._id;
            if (!acc[caseId]) {
              acc[caseId] = {
                case: chat.managementId,
                chats: [],
                latestMessageTimestamp: 0
              };
            }
            
            // Find latest message timestamp in this chat
            const chatLatestTimestamp = chat.messages?.reduce((latest, msg) => {
              const msgTime = new Date(msg.timestamp || msg.createdAt).getTime();
              return msgTime > latest ? msgTime : latest;
            }, 0);
            
            // Update case's latest message timestamp if needed
            if (chatLatestTimestamp > acc[caseId].latestMessageTimestamp) {
              acc[caseId].latestMessageTimestamp = chatLatestTimestamp;
            }
            
            acc[caseId].chats.push(chat);
          }
          return acc;
        }, {});

        // Create cases array and sort by latest message timestamp
        const uniqueCases = Object.values(chatsByCase)
          .map(({ case: caseItem, latestMessageTimestamp }) => ({
            ...caseItem,
            latestMessageTimestamp
          }))
          .sort((a, b) => b.latestMessageTimestamp - a.latestMessageTimestamp);

        setCases(uniqueCases);
        setClients([]); // Clear clients list for FN portal
        
        // Store all chats grouped by case
        const allChats = Object.values(chatsByCase).flatMap(item => item.chats);
        setAllChatsWithMessages(allChats);
        
        // If there are cases with messages, select the first one (now will be the latest by message)
        if (uniqueCases.length > 0) {
          setSelectedCase(uniqueCases[0]);
          const firstCaseChats = chatsByCase[uniqueCases[0]._id].chats;
          if (firstCaseChats.length > 0) {
            setChats(firstCaseChats);
            setSelectedChat(firstCaseChats[0]);
          }
        }
      } else {
        // For attorneys - get users with their cases in a single call
        const response = await api.get('/chat/users');
        const usersWithCases = response.data.data.users;
        
        // Set clients
        setClients(usersWithCases);
        
        // Store cases in the map, cases are already sorted by latest message timestamp from backend
        const casesMap = {};
        usersWithCases.forEach(user => {
          casesMap[user._id] = user.cases || [];
        });
        setAllUsersCases(casesMap);
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
    if (!newMessage.trim() || !selectedCase || !(user?.role === 'individual' || user?.role === 'employee') || isMessageSending) return;
    
    // Clear any pending debounce
    if (messageDebounceRef.current) {
      clearTimeout(messageDebounceRef.current);
    }

    setIsMessageSending(true);
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

      // Store message to prevent modifications during send
      const messageToSend = newMessage.trim();
      
      // Clear input immediately for better UX
      setNewMessage('');

      // Send message
      const messageResponse = await api.post(`/chat/${chatId}/messages`, {
        message: messageToSend
      });

      if (!messageResponse.data.status === "success") {
        throw new Error("Failed to send message");
      }

      // For FN portal - get updated chats with messages
      const response = await api.get(`/chat/chats-with-messages/${user.id}`);
      
      // Update current case's chats
      const updatedChats = response.data.data.chats.filter(
        chat => chat.managementId?._id === selectedCase._id
      );
      
      if (updatedChats.length > 0) {
        setChats(updatedChats);
        setSelectedChat(updatedChats[0]);
      }
      
      // Update all chats with messages for proper sorting
      const allChats = response.data.data.chats.filter(
        chat => chat.managementId?.userId?._id === user.id
      );
      
      // Create cases array and sort by latest message timestamp
      const uniqueCases = Object.values(
        allChats.reduce((acc, chat) => {
          if (chat.managementId) {
            const caseId = chat.managementId._id;
            if (!acc[caseId]) {
              acc[caseId] = {
                ...chat.managementId,
                latestMessageTimestamp: 0
              };
            }
            
            // Update latest message timestamp
            const chatLatestTimestamp = chat.messages?.reduce((latest, msg) => {
              const msgTime = new Date(msg.timestamp || msg.createdAt).getTime();
              return msgTime > latest ? msgTime : latest;
            }, 0);
            
            if (chatLatestTimestamp > acc[caseId].latestMessageTimestamp) {
              acc[caseId].latestMessageTimestamp = chatLatestTimestamp;
            }
          }
          return acc;
        }, {})
      ).sort((a, b) => b.latestMessageTimestamp - a.latestMessageTimestamp);

      setCases(uniqueCases);
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Restore message if send failed
      setNewMessage(newMessage);
    } finally {
      // Add a small delay before allowing new messages
      messageDebounceRef.current = setTimeout(() => {
        setIsMessageSending(false);
        setLoading(prev => ({ ...prev, sending: false }));
      }, 500);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isMessageSending) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle client click - Load cases for the selected client
  const handleClientClick = async (client) => {
    if (expandedClient === client._id) {
      setExpandedClient(null);
      setSelectedClient(null);
      setSelectedCase(null);
      setChats([]);
      setCases([]);
    } else {
      setExpandedClient(client._id);
      setSelectedClient(client);
      setLoading(prev => ({ ...prev, cases: true }));
      
      try {
        // Cases are already sorted by latest message timestamp from the backend
        const clientCases = allUsersCases[client._id] || [];
        setCases(clientCases); // Use cases as is since they're already sorted
      } catch (error) {
        console.error('Error setting cases:', error);
        toast.error('Failed to load cases');
      } finally {
        setLoading(prev => ({ ...prev, cases: false }));
      }
    }
  };

  // Handle case click - Load chats for the selected case
  const handleCaseClick = async (caseItem) => {
    setSelectedCase(caseItem);
    setLoading(prev => ({ ...prev, chats: true }));
    
    try {
      if (user?.role === 'individual' || user?.role === 'employee') {
        // For FN portal users - get chats with messages
        const response = await api.get(`/chat/chats-with-messages/${user.id}`);
        const selectedCaseChats = response.data.data.chats.filter(
          chat => chat.managementId?._id === caseItem._id && chat.messages?.length > 0
        );
        
        if (selectedCaseChats.length > 0) {
          setChats(selectedCaseChats);
          setSelectedChat(selectedCaseChats[0]);
        } else {
          setChats([]);
          setSelectedChat(null);
          toast.error('No messages found for this case');
        }
        
        // Update all chats with messages
        setAllChatsWithMessages(response.data.data.chats.filter(
          chat => chat.managementId?.userId?._id === user.id
        ));
      } else {
        // For attorneys - get chats by management ID
        const response = await api.get(`/chat/management/${caseItem._id}`);
        
        if (response.data.data.chats?.length > 0) {
          // Sort chats by creation date, newest first
          const sortedChats = response.data.data.chats.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setChats(sortedChats);
          setSelectedChat(sortedChats[0]);
        } else {
          setChats([]);
          setSelectedChat(null);
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chat history');
    } finally {
      setLoading(prev => ({ ...prev, chats: false }));
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

  // Add this formatter function near the top with other utility functions
  const formatSophiaMessage = (content) => {
    if (!content) return '';
    
    let formattedContent = content
      // Convert ### headers to styled headers
      .replace(/###\s+(.*?)(?:\n|$)/g, '<h3 class="text-gray-800 font-semibold text-base mt-4 mb-2">$1</h3>')
      
      // Convert **key**: value pattern (common in Sophia's responses)
      .replace(/\*\*(.*?)\*\*:\s*/g, '<strong class="text-gray-700">$1</strong>: ')
      
      // Convert remaining **text** to bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      // Convert bullet points
      .replace(/^\s*-\s+/gm, '• ')
      
      // Convert numbered lists
      .replace(/^\s*(\d+)\.\s+/gm, '<span class="inline-block w-4 mr-2">$1.</span>')
      
      // Preserve line breaks
      .replace(/\n/g, '<br />');
    
    return formattedContent;
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
                          {cases.length === 0 ? (
                            <div className="text-center text-gray-500 py-6">
                              <History className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p>No cases yet</p>
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
            <div className="space-y-6">
              {(() => {
                // Merge all messages from all chats
                const allMessages = chats.reduce((acc, chat) => {
                  return acc.concat(
                    (chat.messages || []).map(msg => ({
                      ...msg,
                      timestamp: new Date(msg.timestamp || msg.createdAt).getTime(),
                      chatId: chat._id
                    }))
                  );
                }, []);

                // Sort all messages by timestamp
                const sortedMessages = allMessages.sort((a, b) => a.timestamp - b.timestamp);

                // Group messages by date
                const messagesByDate = {};
                const dates = [];
                
                sortedMessages.forEach(message => {
                  const date = format(new Date(message.timestamp), 'yyyy-MM-dd');
                  if (!messagesByDate[date]) {
                    messagesByDate[date] = [];
                    dates.push(date);
                  }
                  messagesByDate[date].push(message);
                });

                // Sort dates chronologically
                const sortedDates = dates.sort((a, b) => new Date(a) - new Date(b));

                return sortedDates.map(date => (
                  <div key={date}>
                    {/* Date Separator */}
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                        {formatDate(date)}
                      </div>
                    </div>
                    
                    {/* Messages for this date */}
                    <div className="space-y-4">
                      {messagesByDate[date].map((message, index) => (
                        <div 
                          key={message._id}
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
                            {message.role === 'assistant' ? (
                              <div className="text-sm whitespace-pre-wrap break-words prose prose-sm max-w-none">
                                <div 
                                  className="[&>h3]:text-gray-800 [&>h3]:font-semibold [&>h3]:text-base [&>h3]:mt-4 [&>h3]:mb-2 [&>strong]:text-inherit [&>br]:my-1"
                                  dangerouslySetInnerHTML={{ __html: formatSophiaMessage(message.content) }}
                                />
                              </div>
                            ) : (
                              <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
                            )}
                            <div 
                              className={`text-[11px] mt-1 ${
                                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                              }`}
                            >
                              {format(new Date(message.timestamp), 'h:mm a')}
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
                ));
              })()}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Select a case to view the chat</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input - Only show for FN portal users */}
        {selectedCase && (user?.role === 'individual' || user?.role === 'employee') && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-4">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-grow p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                disabled={isMessageSending}
              />
              <button
                onClick={sendMessage}
                disabled={isMessageSending || loading.sending || !newMessage.trim()}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isMessageSending || loading.sending || !newMessage.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {loading.sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isMessageSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiQueries;