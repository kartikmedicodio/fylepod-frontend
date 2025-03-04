import { useParams } from 'react-router-dom';
import { Card, Alert, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { Edit, Bot, SendHorizontal, Loader2 } from 'lucide-react';
import ReactDOM from 'react-dom';
import api from '../utils/api';

const ProfileContainer = styled('div')({
  padding: '20px',
  '& .profile-header': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    '& h1': {
      margin: 0,
      fontSize: '24px',
      fontWeight: '500'
    }
  },
  '& .profile-grid': {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  }
});

const LoadingContainer = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '200px'
});

const ProfileCard = styled(Card)({
  padding: '24px',
  height: '100%',
  backgroundColor: '#f8f9fe',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  borderRadius: '12px',
  '& .section-title': {
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '20px',
    color: '#1a1f36'
  },
  '& .field-group': {
    marginBottom: '16px'
  },
  '& .field-label': {
    color: '#697386',
    fontSize: '13px',
    marginBottom: '4px'
  },
  '& .field-value': {
    fontSize: '14px',
    color: '#1a1f36',
    fontWeight: '500'
  }
});

const InitialsAvatar = styled('div')({
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  backgroundColor: '#6366f1',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  fontWeight: '500',
  marginBottom: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
});

const EditButton = styled('button')({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '8px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6366f1',
  '&:hover': {
    backgroundColor: 'rgba(99, 102, 241, 0.1)'
  }
});

const formatDate = (dateString) => {
  if (!dateString) return 'Present';
  return format(new Date(dateString), 'MMM dd, yyyy');
};

const getInitials = (name) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Add new chat-related styled components
const ChatButton = styled('button')({
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  background: 'linear-gradient(to right, #6366f1, #8b5cf6, #ec4899)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  '&:hover': {
    opacity: 0.9
  },
  zIndex: 9999
});

const ChatPopup = styled('div')({
  position: 'fixed',
  bottom: '96px',
  right: '32px',
  width: '384px',
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  border: '1px solid #e5e7eb',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '80vh'
});

const Profile = ({ setCurrentBreadcrumb }) => {
  const { profileId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add new chat-related state
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hi! I'm Diana, your AI assistant. I can help you analyze your documents and answer any questions you might have."
  }]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const messagesEndRef = useRef(null);

  // Add function to handle chat messages
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;

    const userMessage = { role: 'user', content: chatInput };
    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsSending(true);

    try {
      // First get all management IDs for the user
      const managementResponse = await api.get(`/management/user/${profileId}`);
      const managementEntries = managementResponse.data.data.entries;
      
      if (managementEntries.length === 0) {
        throw new Error('No management entries found for this user');
      }

      // Extract management IDs for validation
      const userManagementIds = managementEntries.map(entry => entry._id);
      console.log('User management IDs:', userManagementIds);

      // Fetch documents for each management ID
      const processedDocs = [];
      
      for (const managementId of userManagementIds) {
        console.log('Fetching documents for management ID:', managementId);
        try {
          const response = await api.get(`/documents/management/${managementId}/documents`, {
            params: { status: 'processed' }
          });
          
          console.log('API Response for management ID', managementId + ':', response.data);
          
          if (response.data.status === 'success' && response.data.data.documents) {
            const docs = response.data.data.documents;
            
            // Add processed documents
            docs.forEach(doc => {
              if (doc.status === 'processed' || doc.status === 'approved') {
                // Check for duplicates before adding
                const isDuplicate = processedDocs.some(existingDoc => existingDoc._id === doc._id);
                if (!isDuplicate) {
                  processedDocs.push(doc);
                  console.log(`Added processed document: ${doc._id} (${doc.type}) for management ID ${managementId}`);
                }
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching documents for management ID ${managementId}:`, error);
          throw new Error(`Failed to fetch documents: ${error.message}`);
        }
      }

      // Log final results
      console.log('Final processed documents:', processedDocs.map(doc => ({
        id: doc._id,
        type: doc.type,
        managementId: doc.managementId,
        status: doc.status
      })));

      // Check if we have any documents at all
      if (processedDocs.length === 0) {
        throw new Error('No processed documents found. Please wait for your documents to be processed.');
      }

      // Create or use existing chat
      let chatId;
      if (!currentChat) {
        try {
          // Log the management entries for debugging
          console.log('Management entries:', managementEntries);
          
          // Get all management IDs
          const managementIds = managementEntries.map(entry => entry._id);
          console.log('Available management IDs:', managementIds);

          // Create new chat with all processed documents and user info
          const chatRequest = {
            documentIds: processedDocs.map(doc => doc._id),
            managementId: managementEntries[0]._id, // Use first management ID as primary
            userInfo: {
              name: profileData.name,
              email: profileData.email,
              contact: profileData.contact || {},
              address: profileData.address || {}
            }
          };

          console.log('Creating chat with request:', {
            documentCount: processedDocs.length,
            documents: processedDocs.map(doc => ({
              id: doc._id,
              type: doc.type,
              managementId: doc.managementId,
              name: doc.name
            })),
            primaryManagementId: managementEntries[0]._id,
            userName: profileData.name
          });

          const chatResponse = await api.post('/chat', chatRequest);
          
          if (!chatResponse.data?.status === 'success' || !chatResponse.data?.data?.chat) {
            console.error('Chat creation response:', chatResponse.data);
            throw new Error('Failed to create chat session');
          }
          
          const newChat = chatResponse.data.data.chat;
          setCurrentChat(newChat);
          chatId = newChat._id;
          console.log('Successfully created chat:', newChat);
        } catch (error) {
          console.error('Error creating chat:', error);
          throw new Error(`Failed to create chat session: ${error.response?.data?.message || error.message}`);
        }
      } else {
        chatId = currentChat._id;
      }

      // Send message to chat
      try {
        const messageResponse = await api.post(`/chat/${chatId}/messages`, {
          message: chatInput
        });

        if (messageResponse.data?.status === 'success' && messageResponse.data.data.message) {
          setMessages(prev => [...prev, messageResponse.data.data.message]);
        } else {
          throw new Error('Failed to get response from AI assistant');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        throw new Error(`Failed to send message: ${error.response?.data?.message || error.message}`);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: error.message || "I'm sorry, I encountered an error processing your request."
      }]);
    } finally {
      setIsSending(false);
    }
  };

  // Add scroll effect for chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await api.get(`/auth/users/${profileId}`);
        
        console.log('Profile API Response:', response);

        // Check if we have data in the response
        if (!response.data) {
          throw new Error('No data received from server');
        }

        let userData;
        // If the data is directly in response.data (without status wrapper)
        if (response.data.user || response.data._id) {
          userData = response.data;
        }
        // If the data is wrapped in a data property or status/data structure
        else if (response.data.data) {
          userData = response.data.data;
        } else {
          throw new Error('Unexpected response format from server');
        }

        setProfileData(userData);
        setError(null);
        
        // Update breadcrumb with user data
        setCurrentBreadcrumb([
          { name: 'Profile', path: '/profile' },
          { name: userData.name || 'User Profile', path: `/profile/${profileId}` }
        ]);
      } catch (error) {
        console.error('Error fetching profile:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response,
          status: error.response?.status
        });
        
        if (error.response?.status === 401) {
          setError('Please login to view this profile');
        } else if (error.response?.status === 404) {
          setError('Profile not found');
        } else {
          setError(error.message || 'Failed to fetch profile data');
        }
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [profileId, setCurrentBreadcrumb]);

  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ margin: '20px' }}>
        {error}
      </Alert>
    );
  }

  if (!profileData) {
    return (
      <Alert severity="info" sx={{ margin: '20px' }}>
        Profile not found
      </Alert>
    );
  }

  // Add chat portal render function
  const renderChatPortal = () => {
    return ReactDOM.createPortal(
      <>
        <ChatButton 
          onClick={() => setShowChatPopup(prev => !prev)}
          aria-label="Chat with Diana"
        >
          <Bot className="w-7 h-7 text-white" />
        </ChatButton>
        
        {showChatPopup && (
          <ChatPopup>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-white">D</span>
                </div>
                <div>
                  <h4 className="font-medium">Diana</h4>
                  <p className="text-xs text-gray-500">AI Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setShowChatPopup(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
              {messages.map((message, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-white">D</span>
                    </div>
                  )}
                  
                  <div className={`rounded-lg p-3 max-w-[85%] ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 text-gray-700'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-600">
                        {getInitials(profileData?.name || 'User')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Diana anything..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                  disabled={isSending}
                />
                <button 
                  type="submit"
                  disabled={isSending || !chatInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:text-indigo-700 disabled:text-gray-400"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <SendHorizontal className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </ChatPopup>
        )}
      </>,
      document.body
    );
  };

  return (
    <ProfileContainer>
      <div className="profile-header">
        <h1>Profile</h1>
        <EditButton>
          <Edit size={20} />
        </EditButton>
      </div>
      
      <div className="profile-grid">
        {/* Applicant Details Card */}
        <ProfileCard>
          <h2 className="section-title">Applicant Details</h2>
          <InitialsAvatar>
            {getInitials(profileData.name)}
          </InitialsAvatar>
          
          <div className="field-group">
            <div className="field-label">Employee Name</div>
            <div className="field-value">{profileData.name}</div>
          </div>

          <div className="field-group">
            <div className="field-label">Phone Number</div>
            <div className="field-value">{profileData.contact?.residencePhone}</div>
          </div>

          <div className="field-group">
            <div className="field-label">Mobile Number</div>
            <div className="field-value">{profileData.contact?.mobileNumber}</div>
          </div>

          <div className="field-group">
            <div className="field-label">Email Address</div>
            <div className="field-value">{profileData.email}</div>
          </div>

          <div className="field-group">
            <div className="field-label">Current Address</div>
            <div className="field-value">
              {`${profileData.address?.streetNumber} ${profileData.address?.streetName}, ${profileData.address?.city}, ${profileData.address?.stateProvince}`}
            </div>
          </div>

          <div className="field-group">
            <div className="field-label">Office Address</div>
            <div className="field-value">
              {profileData.currentJob?.companyAddress}
            </div>
          </div>
        </ProfileCard>

        {/* Passport Details Card */}
        <ProfileCard>
          <h2 className="section-title">Passport Details</h2>
          
          <div className="field-group">
            <div className="field-label">Passport Number</div>
            <div className="field-value">{profileData.passport?.number}</div>
          </div>

          <div className="field-group">
            <div className="field-label">Date of Issue</div>
            <div className="field-value">{formatDate(profileData.passport?.dateOfIssue)}</div>
          </div>

          <div className="field-group">
            <div className="field-label">Date of Expiry</div>
            <div className="field-value">{formatDate(profileData.passport?.dateOfExpiry)}</div>
          </div>

          <div className="field-group">
            <div className="field-label">Place of Issue</div>
            <div className="field-value">{profileData.passport?.placeOfIssue}</div>
          </div>

          <div className="field-group">
            <div className="field-label">Passport Issuing Country</div>
            <div className="field-value">{profileData.passport?.issuedBy}</div>
          </div>
        </ProfileCard>

        {/* Work History Card */}
        <ProfileCard>
          <h2 className="section-title">Work History</h2>
          {profileData.workHistory?.map((work, index) => (
            <div key={work._id || index} className="field-group">
              <div className="field-label">Job Title</div>
              <div className="field-value">{work.jobTitle}</div>

              <div className="field-label">Company Name</div>
              <div className="field-value">{work.companyName}</div>

              <div className="field-label">Location</div>
              <div className="field-value">{work.location}</div>

              <div className="field-label">Duration</div>
              <div className="field-value">
                {formatDate(work.fromDate)} - {formatDate(work.toDate)}
              </div>
            </div>
          ))}
        </ProfileCard>

        {/* Education History Card */}
        <ProfileCard>
          <h2 className="section-title">Education History</h2>
          {profileData.educationHistory?.map((education, index) => (
            <div key={education._id || index} className="field-group">
              <div className="field-label">Degree</div>
              <div className="field-value">{education.courseLevel}</div>

              <div className="field-label">Field of Study</div>
              <div className="field-value">{education.specialization}</div>

              <div className="field-label">Graduation Year</div>
              <div className="field-value">{formatDate(education.passoutYear)}</div>

              <div className="field-label">Institution Name</div>
              <div className="field-value">{education.institution}</div>

              <div className="field-label">Location</div>
              <div className="field-value">{education.location}</div>
            </div>
          ))}
        </ProfileCard>
      </div>
      
      {/* Add chat portal */}
      {renderChatPortal()}
    </ProfileContainer>
  );
};

Profile.propTypes = {
  setCurrentBreadcrumb: PropTypes.func.isRequired
};

export default Profile;
