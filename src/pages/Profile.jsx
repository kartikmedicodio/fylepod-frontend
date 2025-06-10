import { useParams, useNavigate } from 'react-router-dom';
import { Card, Alert, CircularProgress, Tabs, Tab, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { Edit, Bot, SendHorizontal, Loader2, MapPin, Phone, Mail, Briefcase, GraduationCap, Clock, CreditCard, User, FileText, CheckCircle } from 'lucide-react';
import ReactDOM from 'react-dom';
import api from '../utils/api';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { toast } from 'react-hot-toast';

const ProfileContainer = styled('div')({
  padding: '24px',
  minHeight: '100vh',
  '& .profile-header': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    '& h1': {
      margin: 0,
      fontSize: '28px',
      fontWeight: '600',
      background: 'linear-gradient(to right, #1e293b, #334155)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    }
  },
  '& .profile-grid': {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  }
});

const LoadingContainer = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '400px'
});

const ProfileCard = styled(Card)({
  padding: '32px',
  height: '100%',
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
  borderRadius: '16px',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 10px 15px rgba(0,0,0,0.1)'
  },
  '& .section-title': {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '24px',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    '& svg': {
      color: '#6366f1'
    }
  },
  '& .field-group': {
    marginBottom: '24px',
    position: 'relative',
    paddingLeft: '28px',
    '&:last-child': {
      marginBottom: 0
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      left: '0',
      top: '0',
      bottom: '0',
      width: '2px',
      background: 'linear-gradient(to bottom, #e2e8f0 50%, transparent 50%)',
      backgroundSize: '2px 8px'
    }
  },
  '& .field-label': {
    color: '#64748b',
    fontSize: '13px',
    marginBottom: '6px',
    fontWeight: '500'
  },
  '& .field-value': {
    fontSize: '15px',
    color: '#1e293b',
    fontWeight: '500',
    lineHeight: '1.5'
  },
  '& .field-empty': {
    color: '#94a3b8',
    fontStyle: 'italic'
  }
});

const InitialsAvatar = styled('div')({
  width: '96px',
  height: '96px',
  borderRadius: '24px',
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '32px',
  fontWeight: '600',
  marginBottom: '24px',
  boxShadow: '0 8px 16px rgba(99, 102, 241, 0.12)',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: '-3px',
    borderRadius: '27px',
    border: '3px solid transparent',
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.5), rgba(139, 92, 246, 0.5)) border-box',
    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'destination-out',
    maskComposite: 'exclude'
  }
});

const EditButton = styled('button')({
  background: '#fff',
  border: '1px solid #e2e8f0',
  cursor: 'pointer',
  padding: '8px 16px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: '#6366f1',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  '&:hover': {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  }
});

const WorkHistoryItem = styled('div')({
  position: 'relative',
  paddingBottom: '24px',
  '&:last-child': {
    paddingBottom: 0,
    '&::before': {
      display: 'none'
    }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '-28px',
    top: '28px',
    bottom: '0',
    width: '2px',
    background: '#e2e8f0'
  },
  '& .company-name': {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px'
  },
  '& .job-title': {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '8px'
  },
  '& .duration': {
    fontSize: '13px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }
});

const EducationItem = styled('div')({
  position: 'relative',
  paddingBottom: '24px',
  '&:last-child': {
    paddingBottom: 0,
    '&::before': {
      display: 'none'
    }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '-28px',
    top: '28px',
    bottom: '0',
    width: '2px',
    background: '#e2e8f0'
  },
  '& .degree': {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px'
  },
  '& .field': {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '8px'
  },
  '& .institution': {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '4px'
  },
  '& .graduation-year': {
    fontSize: '13px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
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

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>{children}</Box>
      )}
    </div>
  );
};

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

const StyledTabs = styled(Tabs)({
  marginBottom: '32px',
  '& .MuiTabs-flexContainer': {
    gap: '8px'
  },
  '& .MuiTabs-indicator': {
    display: 'none'
  }
});

const StyledTab = styled(Tab)({
  textTransform: 'none',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '500',
  color: '#64748b',
  minHeight: 'unset',
  backgroundColor: 'transparent',
  border: 'none',
  '&:hover': {
    backgroundColor: '#f1f5f9'
  },
  '&.Mui-selected': {
    color: '#2563eb',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  }
});

const CasesContainer = styled('div')({
  '& .cases-header': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    '& h2': {
      margin: 0,
      fontSize: '24px',
      fontWeight: '600',
      color: '#1e293b',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      '& svg': {
        color: '#6366f1'
      }
    }
  },
  '& .cases-grid': {
    display: 'grid',
    gap: '24px',
    gridTemplateColumns: '1fr'
  },
  '& .case-status': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '9999px',
    fontSize: '13px',
    fontWeight: '500',
    '&.completed': {
      backgroundColor: '#f0fdf4',
      color: '#15803d',
      border: '1px solid #bbf7d0'
    },
    '&.in-progress': {
      backgroundColor: '#fefce8',
      color: '#854d0e',
      border: '1px solid #fef08a'
    },
    '&.pending': {
      backgroundColor: '#f1f5f9',
      color: '#475569',
      border: '1px solid #e2e8f0'
    }
  }
});

const CaseCard = styled(Card)({
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
  borderRadius: '12px',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  overflow: 'hidden',
  border: '1px solid #e2e8f0',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)',
    borderColor: '#cbd5e1'
  },
  '& .case-header': {
    padding: '16px 24px',
    borderBottom: '1px solid #f1f5f9',
    background: 'linear-gradient(to right, #f8fafc, #fff)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px'
  },
  '& .case-content': {
    padding: '16px 24px'
  },
  '& .case-title': {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  '& .case-id': {
    fontSize: '13px',
    color: '#64748b',
    fontFamily: 'monospace',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  '& .case-info': {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '16px'
  },
  '& .info-item': {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    color: '#475569',
    fontSize: '13px',
    padding: '12px',
    background: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #f1f5f9',
    '& svg': {
      color: '#6366f1',
      flexShrink: 0,
      width: '16px',
      height: '16px'
    },
    '& .info-label': {
      color: '#64748b',
      fontSize: '12px',
      marginBottom: '2px'
    },
    '& .info-value': {
      color: '#1e293b',
      fontWeight: '500',
      fontSize: '13px'
    }
  },
  '& .documents-section': {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    '& .documents-header': {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1e293b',
      padding: '12px 16px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    '& .documents-grid': {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '8px',
      padding: '12px'
    },
    '& .document-item': {
      padding: '8px 12px',
      backgroundColor: '#fff',
      borderRadius: '6px',
      border: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      '& .document-name': {
        fontSize: '13px',
        fontWeight: '500',
        color: '#1e293b',
        textTransform: 'capitalize'
      },
      '& .document-status': {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        '&.uploaded': {
          color: '#15803d'
        },
        '&.pending': {
          color: '#854d0e'
        },
        '& svg': {
          width: '14px',
          height: '14px'
        }
      }
    }
  }
});

const TopCardsWrapper = styled('div')({
  display: 'flex',
  gap: '24px',
  marginBottom: '24px'
});

const ProfileSummaryCard = styled(Card)({
  flex: '1',
  padding: '24px',
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  '& .profile-grid': {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '24px'
  },
  '& .profile-section': {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '16px',
    alignItems: 'center'
  },
  '& .profile-image': {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '600',
    color: '#64748b'
  },
  '& .profile-info': {
    '& .name': {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '4px'
    },
    '& .details': {
      display: 'grid',
      gap: '4px',
      '& .detail-item': {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#64748b',
        fontSize: '14px',
        '& svg': {
          width: '16px',
          height: '16px',
          color: '#6366f1'
        }
      }
    }
  }
});

const CaseDetailsCard = styled(Card)({
  flex: '1',
  padding: '24px',
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  '& .case-grid': {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px'
  },
  '& .case-item': {
    '& .label': {
      fontSize: '14px',
      color: '#64748b',
      marginBottom: '4px'
    },
    '& .value': {
      fontSize: '14px',
      color: '#1e293b',
      fontWeight: '500'
    }
  }
});

const Profile = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const { setCurrentBreadcrumb } = useBreadcrumb();
  
  // Add new state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  
  // Add new chat-related state
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hello! I'm Sophia from support. I'm here to assist you with your profile and answer any questions you might have. How can I help you today?"
  }]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [processedDocs, setProcessedDocs] = useState([]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const fetchUserCases = async () => {
    setLoadingCases(true);
    try {
      const response = await api.get(`/management/user/${profileId}`);
      if (response.data?.data?.entries) {
        setCases(response.data.data.entries);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoadingCases(false);
    }
  };

  // Add function to fetch documents
  const fetchUserDocuments = async () => {
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
      const docs = [];
      
      for (const managementId of userManagementIds) {
        console.log('Fetching documents for management ID:', managementId);
        try {
          const response = await api.get(`/documents/management/${managementId}/documents`, {
            params: { status: 'processed' }
          });
          
          console.log('API Response for management ID', managementId + ':', response.data);
          
          if (response.data.status === 'success' && response.data.data.documents) {
            const documents = response.data.data.documents;
            
            // Add processed documents
            documents.forEach(doc => {
              if (doc.status === 'processed' || doc.status === 'approved') {
                // Check for duplicates before adding
                const isDuplicate = docs.some(existingDoc => existingDoc._id === doc._id);
                if (!isDuplicate) {
                  docs.push(doc);
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

      setProcessedDocs(docs);
      return docs;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  };

  // Add effect to reset chat and fetch documents when profile changes
  useEffect(() => {
    // Reset chat state when profile changes
    setMessages([{
      role: 'assistant',
      content: "Hello! I'm Sophia from support. I'm here to assist you with your profile and answer any questions you might have. How can I help you today?"
    }]);
    setCurrentChat(null);
    setChatInput('');
    setIsSending(false);
    setShowChatPopup(false);
    setProcessedDocs([]); // Reset processed documents
  }, [profileId]);

  // Add useEffect hooks for input focus
  useEffect(() => {
    if (showChatPopup) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [showChatPopup]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [messages]);

  // Add function to handle chat messages
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;

    const userMessage = { role: 'user', content: chatInput };
    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsSending(true);

    try {
      let chatId;
      
      // If no current chat, initialize it by fetching documents first
      if (!currentChat) {
        const docs = processedDocs.length > 0 ? processedDocs : await fetchUserDocuments();
        
        if (docs.length === 0) {
          throw new Error('No processed documents found. Please wait for your documents to be processed.');
        }

        // Create new chat with the documents
        const chatRequest = {
          documentIds: docs.map(doc => doc._id),
          managementId: docs[0].managementId, // Use first document's management ID as primary
          userInfo: {
            name: profileData.name,
            email: profileData.email,
            contact: profileData.contact || {},
            address: profileData.address || {}
          }
        };

        const chatResponse = await api.post('/chat', chatRequest);
        
        if (!chatResponse.data?.status === 'success' || !chatResponse.data?.data?.chat) {
          console.error('Chat creation response:', chatResponse.data);
          throw new Error('Failed to create chat session');
        }
        
        const newChat = chatResponse.data.data.chat;
        setCurrentChat(newChat);
        chatId = newChat._id;
      } else {
        chatId = currentChat._id;
      }

      // Send message to chat
      const messageResponse = await api.post(`/chat/${chatId}/messages`, {
        message: chatInput
      });

      if (messageResponse.data?.status === 'success' && messageResponse.data.data.message) {
        setMessages(prev => [...prev, messageResponse.data.data.message]);
      } else {
        throw new Error('Failed to get response from AI assistant');
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

        if (!response.data) {
          throw new Error('No data received from server');
        }

        let userData;
        // Handle successful response with proper data structure
        if (response.data.success && response.data.data) {
          userData = response.data.data;
        } else if (response.data.user || response.data._id) {
          userData = response.data;
        } else {
          throw new Error('Invalid response format from server');
        }

        setProfileData(userData);
        
        // Update breadcrumb with user data
        setCurrentBreadcrumb([
          { name: 'Profile', path: '/profile' },
          { name: userData.name || 'User Profile', path: `/profile/${profileId}` }
        ]);

        // Fetch cases data immediately after profile data
        fetchUserCases();
      } catch (error) {
        console.error('Error fetching profile:', error);
        
        // Handle specific error cases
        if (error.response?.status === 500) {
          toast.error('Server error occurred. Please try again later.');
        } else if (error.response?.status === 401) {
          toast.error('Please login to view this profile');
        } else if (error.response?.status === 404) {
          toast.error('Profile not found');
        } else {
          toast.error(error.message || 'Failed to fetch profile data');
        }
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [profileId, setCurrentBreadcrumb]);

  const handleCaseClick = (caseId) => {
    navigate(`/individuals/case/${caseId}`);
  };

  const renderCases = () => {
    if (loadingCases) {
      return (
        <LoadingContainer>
          <CircularProgress size={40} thickness={4} sx={{ color: '#6366f1' }} />
        </LoadingContainer>
      );
    }

    if (cases.length === 0) {
      return (
        <Alert 
          severity="info"
          sx={{ 
            borderRadius: '12px',
            backgroundColor: '#f0f9ff',
            color: '#075985',
            border: '1px solid #bae6fd'
          }}
        >
          No cases found for this user
        </Alert>
      );
    }

    return (
      <div className="cases-grid">
        {cases.map((caseItem) => (
          <CaseCard 
            key={caseItem._id}
            onClick={() => handleCaseClick(caseItem._id)}
            sx={{ '&:focus': { outline: 'none', boxShadow: '0 0 0 2px #6366f1' } }}
          >
            <div className="case-header">
              <div>
                <h3 className="case-title">
                  <Briefcase className="w-5 h-5" />
                  {caseItem.categoryName}
                </h3>
                <div className="case-id">
                  <span className="info-label">ID:</span>
                  <code>#{caseItem._id}</code>
                </div>
              </div>
              <div className={`case-status ${caseItem.categoryStatus}`}>
                {caseItem.categoryStatus}
              </div>
            </div>
            <div className="case-content">
              <div className="case-info">
                <div className="info-item">
                  <Clock />
                  <div>
                    <div className="info-label">Created</div>
                    <div className="info-value">
                      {format(new Date(caseItem.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="info-item">
                  <User />
                  <div>
                    <div className="info-label">Applicant</div>
                    <div className="info-value">
                      {caseItem.userName}
                    </div>
                  </div>
                </div>
                <div className="info-item">
                  <Clock />
                  <div>
                    <div className="info-label">Updated</div>
                    <div className="info-value">
                      {format(new Date(caseItem.updatedAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="documents-section">
                <div className="documents-header">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Required Documents
                </div>
                <div className="documents-grid">
                  {caseItem.documentTypes.map((doc) => (
                    <div key={doc._id} className="document-item">
                      <div className="document-name">
                        {doc.name}
                        {doc.required && <span className="ml-1 text-red-500">*</span>}
                      </div>
                      <div className={`document-status ${doc.status}`}>
                        {doc.status === 'uploaded' ? (
                          <>
                            <CheckCircle />
                            <span>Uploaded</span>
                          </>
                        ) : (
                          <>
                            <Clock />
                            <span>Pending</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CaseCard>
        ))}
      </div>
    );
  };

  // Add handler for edit button
  const handleEditClick = () => {
    setIsEditing(true);
    setEditedProfile({...profileData});
  };

  // Add handler for cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile(null);
  };

  // Add handler for save changes
  const handleSaveChanges = async () => {
    try {
      // Log the data being sent
      console.log('Saving profile data:', editedProfile);
      
      // Validate required fields
      if (!editedProfile.name || editedProfile.name.trim().length < 2) {
        toast.error('Name must be at least 2 characters long');
        return;
      }

      // Format phone numbers to remove non-digits
      const formatPhoneNumber = (phone) => {
        return phone ? phone.replace(/\D/g, '') : null;
      };

      // Format the data before sending
      const formattedData = {
        user_id: profileId,
        name: editedProfile.name.trim(),
        email: editedProfile.email?.trim(),
        nationality: editedProfile.nationality,
        contact: {
          residencePhone: formatPhoneNumber(editedProfile.contact?.residencePhone),
          mobileNumber: formatPhoneNumber(editedProfile.contact?.mobileNumber),
          email: editedProfile.email?.trim()
        },
        address: editedProfile.address ? {
          streetNumber: String(editedProfile.address.streetNumber || ''),
          streetName: String(editedProfile.address.streetName || ''),
          city: String(editedProfile.address.city || ''),
          stateProvince: String(editedProfile.address.stateProvince || '')
        } : {},
        passport: editedProfile.passport || {},
        currentJob: editedProfile.currentJob || {}
      };

      // Remove empty fields
      Object.keys(formattedData).forEach(key => {
        if (formattedData[key] === null || formattedData[key] === undefined || 
            (typeof formattedData[key] === 'object' && Object.keys(formattedData[key]).length === 0)) {
          delete formattedData[key];
        }
      });

      const response = await api.put(`/auth/update-user`, formattedData);
      
      // Log the response
      console.log('Update response:', response);

      if (response.data?.status === "success") {
        setProfileData(formattedData);
        setIsEditing(false);
        setEditedProfile(null);
        toast.success('Profile updated successfully');
      } else {
        throw new Error(response.data?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Log the full error response if available
      if (error.response) {
        console.error('Error response:', error.response.data);
        // If there are validation errors, show them
        if (error.response.data?.errors) {
          toast.error(error.response.data.errors.join(', '));
        } else {
          toast.error(error.response.data?.message || 'Failed to update profile. Please try again.');
        }
      } else {
        toast.error(error.message || 'Failed to update profile. Please try again.');
      }
    }
  };

  // Add handler for field changes
  const handleFieldChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add handler for nested field changes
  const handleNestedFieldChange = (parent, field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress size={40} thickness={4} sx={{ color: '#6366f1' }} />
      </LoadingContainer>
    );
  }

  if (!profileData) {
    return (
      <Alert 
        severity="info"
        sx={{ 
          margin: '32px',
          borderRadius: '12px',
          backgroundColor: '#f0f9ff',
          color: '#075985'
        }}
      >
        Profile not found
      </Alert>
    );
  }

  // Add chat portal render function
  const renderChatPortal = () => {
    return ReactDOM.createPortal(
      <>
        {/* Support Chat Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowChatPopup(prev => !prev);
          }}
          className="fixed bottom-6 right-6 flex items-center gap-3 pl-4 pr-5 py-3 bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.2)] transition-all z-[9999] group hover:-translate-y-0.5 duration-200"
          aria-label="Chat with Support"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-700 to-zinc-800 flex items-center justify-center relative">
              {/* Subtle pulse effect */}
              <span className="absolute inset-0 rounded-full bg-slate-700 animate-ping opacity-20"></span>
              <Bot className="w-5 h-5 text-white relative z-10" />
            </div>
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
              Support Chat
            </span>
          </div>
        </button>

        {/* Support Chat Popup */}
        {showChatPopup && (
          <div className="fixed bottom-24 right-8 w-[400px] bg-white rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.15)] border border-gray-100 z-[9999] max-h-[85vh] flex flex-col overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 via-slate-50/80 to-zinc-50/90 border-b border-slate-200/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-slate-700 to-zinc-800 flex items-center justify-center shadow-sm transition-transform hover:scale-105">
                    <span className="text-sm font-semibold text-white">S</span>
                  </div>
                  {/* Online indicator */}
                  <span className="absolute -right-0.5 -bottom-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 ring-2 ring-white"></span>
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-slate-700">Sophia</h4>
                  <p className="text-xs text-slate-500">Support Agent • Online</p>
                </div>
              </div>
              <button 
                onClick={() => setShowChatPopup(false)} 
                className="p-2 hover:bg-slate-100/50 rounded-full transition-all hover:rotate-90 duration-200"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] bg-gradient-to-br from-slate-50/50 via-slate-50/30 to-zinc-50/50">
              {messages.map((message, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : ''
                  } animate-fadeIn`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-slate-700 to-zinc-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-white">S</span>
                    </div>
                  )}
                  
                  <div className={`rounded-2xl p-3 max-w-[85%] ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-slate-700 to-zinc-800 text-white shadow-sm' 
                      : 'bg-white border border-slate-200/50 shadow-sm text-slate-700'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200">
                      <span className="text-sm font-medium text-slate-600">
                        {getInitials(profileData?.name || 'User')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
              <div className="relative group">
                <input
                  ref={inputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl pr-12 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 transition-all group-hover:border-slate-300"
                  disabled={isSending}
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={isSending || !chatInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-slate-800 disabled:text-slate-400 transition-all hover:scale-110 active:scale-95"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <SendHorizontal className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </>,
      document.body
    );
  };

  return (
    <ProfileContainer>
      <TopCardsWrapper>
        <ProfileSummaryCard>
          <div className="profile-grid">
            <div className="profile-section">
              <div className="profile-image">
                {getInitials(profileData.name)}
              </div>
              <div className="profile-info">
                <div className="name">{profileData.name}</div>
                <div className="details">
                  <div className="detail-item">
                    <Phone size={16} />
                    {profileData.contact?.mobileNumber || 'No phone number'}
                  </div>
                  <div className="detail-item">
                    <Mail size={16} />
                    {profileData.email || 'No email address'}
                  </div>
                  <div className="detail-item">
                    <MapPin size={16} />
                    {profileData.address && 
                     Object.values(profileData.address).some(value => value && value.trim() !== '') ? 
                      [
                        profileData.address.streetNumber,
                        profileData.address.streetName,
                        profileData.address.city,
                        profileData.address.stateProvince
                      ]
                        .filter(value => value && value.trim() !== '')
                        .join(', ') 
                      : 'No address'
                    }
                  </div>
                </div>
              </div>
            </div>
            <div className="profile-section">
              <div className="profile-info">
                <div className="name">Nationality</div>
                <div className="details">
                  <div className="detail-item">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.nationality || ''}
                        onChange={(e) => handleFieldChange('nationality', e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Enter nationality"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-indigo-500" />
                        <span>
                          {profileData.nationality || 'Will be automatically updated from your passport or national ID'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ProfileSummaryCard>

        <CaseDetailsCard>
          <div className="case-grid">
            <div className="case-item">
              <div className="label">Case Applicant</div>
              <div className="value">{cases[0]?.userName || profileData.name}</div>
            </div>
            <div className="case-item">
              <div className="label">Case Manager</div>
              <div className="value">{cases[0]?.createdBy?.name || 'Not assigned'}</div>
            </div>
            <div className="case-item">
              <div className="label">Case Created Date</div>
              <div className="value">
                {cases[0]?.createdAt ? format(new Date(cases[0].createdAt), 'MMM dd, yyyy') : '-'}
              </div>
            </div>
            <div className="case-item">
              <div className="label">Case Submitted Date</div>
              <div className="value">-</div>
            </div>
            <div className="case-item">
              <div className="label">Case</div>
              <div className="value">{cases[0]?.categoryName || '-'}</div>
            </div>
            <div className="case-item">
              <div className="label">Case Approved Date</div>
              <div className="value">-</div>
            </div>
          </div>
        </CaseDetailsCard>
      </TopCardsWrapper>

      <StyledTabs value={currentTab} onChange={handleTabChange}>
        <StyledTab label="Profile Details" />
        <StyledTab label="Cases" />
      </StyledTabs>

      <TabPanel value={currentTab} index={0}>
        <div className="profile-header">
          <h1>Profile Details</h1>
          {!isEditing ? (
            <EditButton onClick={handleEditClick}>
              <Edit size={18} />
              <span>Edit Profile</span>
            </EditButton>
          ) : (
            <div className="flex gap-2">
              <EditButton onClick={handleSaveChanges} style={{ backgroundColor: '#6366f1', color: 'white' }}>
                <CheckCircle size={18} />
                <span>Save Changes</span>
              </EditButton>
              <EditButton onClick={handleCancelEdit} style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                <span>Cancel</span>
              </EditButton>
            </div>
          )}
        </div>
        
        <div className="profile-grid">
          {/* Applicant Details Card */}
          <ProfileCard>
            <h2 className="section-title">
              <Briefcase size={24} />
              Applicant Details
            </h2>
            <InitialsAvatar>
              {getInitials(profileData.name)}
            </InitialsAvatar>
            
            <div className="field-group">
              <div className="field-label">Full Name</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="field-value w-full p-2 border rounded"
                />
              ) : (
                <div className="field-value">{profileData.name || 'Not provided'}</div>
              )}
            </div>

            <div className="field-group">
              <div className="field-label">Contact Information</div>
              <div className="field-value">
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={16} className="text-indigo-500" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.contact?.residencePhone || ''}
                      onChange={(e) => handleNestedFieldChange('contact', 'residencePhone', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Residence Phone"
                    />
                  ) : (
                    profileData.contact?.residencePhone || 'No phone number'
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={16} className="text-indigo-500" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.contact?.mobileNumber || ''}
                      onChange={(e) => handleNestedFieldChange('contact', 'mobileNumber', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Mobile Number"
                    />
                  ) : (
                    profileData.contact?.mobileNumber || 'No mobile number'
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-indigo-500" />
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedProfile.email || ''}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Email"
                    />
                  ) : (
                    profileData.email || 'No email address'
                  )}
                </div>
              </div>
            </div>

            <div className="field-group">
              <div className="field-label">Current Address</div>
              <div className="field-value">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-indigo-500 mt-1 flex-shrink-0" />
                  {isEditing ? (
                    <div className="flex flex-col gap-2 w-full">
                      <input
                        type="text"
                        value={editedProfile.address?.streetNumber || ''}
                        onChange={(e) => handleNestedFieldChange('address', 'streetNumber', e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Street Number"
                      />
                      <input
                        type="text"
                        value={editedProfile.address?.streetName || ''}
                        onChange={(e) => handleNestedFieldChange('address', 'streetName', e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Street Name"
                      />
                      <input
                        type="text"
                        value={editedProfile.address?.city || ''}
                        onChange={(e) => handleNestedFieldChange('address', 'city', e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={editedProfile.address?.stateProvince || ''}
                        onChange={(e) => handleNestedFieldChange('address', 'stateProvince', e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="State/Province"
                      />
                    </div>
                  ) : (
                    <span>
                      {profileData.address && 
                       Object.values(profileData.address).some(value => value && value.trim() !== '') ? 
                        [
                          profileData.address.streetNumber,
                          profileData.address.streetName,
                          profileData.address.city,
                          profileData.address.stateProvince
                        ]
                          .filter(value => value && value.trim() !== '')
                          .join(', ') 
                        : 'No address provided'
                      }
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="field-group">
              <div className="field-label">Office Address</div>
              <div className="field-value">
                <div className="flex items-start gap-2">
                  <Briefcase size={16} className="text-indigo-500 mt-1 flex-shrink-0" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.currentJob?.companyAddress || ''}
                      onChange={(e) => handleNestedFieldChange('currentJob', 'companyAddress', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Office Address"
                    />
                  ) : (
                    <span>{profileData.currentJob?.companyAddress || 'No office address provided'}</span>
                  )}
                </div>
              </div>
            </div>
          </ProfileCard>

          <ProfileCard>
            <h2 className="section-title">
              <CreditCard size={24} />
              Passport Details
            </h2>
            
            <div className="field-group">
              <div className="field-label">Passport Number</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.passport?.number || ''}
                  onChange={(e) => handleNestedFieldChange('passport', 'number', e.target.value)}
                  className="field-value w-full p-2 border rounded"
                  placeholder="Passport Number"
                />
              ) : (
                <div className="field-value">{profileData.passport?.number || 'Not provided'}</div>
              )}
            </div>

            <div className="field-group">
              <div className="field-label">Validity Period</div>
              <div className="field-value">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Issue Date</div>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedProfile.passport?.dateOfIssue || ''}
                        onChange={(e) => handleNestedFieldChange('passport', 'dateOfIssue', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    ) : (
                      <div>{formatDate(profileData.passport?.dateOfIssue) || 'Not provided'}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Expiry Date</div>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedProfile.passport?.dateOfExpiry || ''}
                        onChange={(e) => handleNestedFieldChange('passport', 'dateOfExpiry', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    ) : (
                      <div>{formatDate(profileData.passport?.dateOfExpiry) || 'Not provided'}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="field-group">
              <div className="field-label">Place of Issue</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.passport?.placeOfIssue || ''}
                  onChange={(e) => handleNestedFieldChange('passport', 'placeOfIssue', e.target.value)}
                  className="field-value w-full p-2 border rounded"
                  placeholder="Place of Issue"
                />
              ) : (
                <div className="field-value">{profileData.passport?.placeOfIssue || 'Not provided'}</div>
              )}
            </div>

            <div className="field-group">
              <div className="field-label">Issuing Country</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.passport?.issuedBy || ''}
                  onChange={(e) => handleNestedFieldChange('passport', 'issuedBy', e.target.value)}
                  className="field-value w-full p-2 border rounded"
                  placeholder="Issuing Country"
                />
              ) : (
                <div className="field-value">{profileData.passport?.issuedBy || 'Not provided'}</div>
              )}
            </div>
          </ProfileCard>

          <ProfileCard>
            <h2 className="section-title">
              <Briefcase size={24} />
              Work History
            </h2>
            {profileData.workHistory?.map((work, index) => (
              <WorkHistoryItem key={work._id || index}>
                <div className="company-name">{work.companyName}</div>
                <div className="job-title">{work.jobTitle}</div>
                <div className="duration">
                  <Clock size={14} />
                  {formatDate(work.fromDate)} - {formatDate(work.toDate)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  <MapPin size={14} className="inline mr-1" />
                  {work.location || 'Location not specified'}
                </div>
              </WorkHistoryItem>
            ))}
            {(!profileData.workHistory || profileData.workHistory.length === 0) && (
              <div className="text-gray-500 italic">No work history available</div>
            )}
          </ProfileCard>

          <ProfileCard>
            <h2 className="section-title">
              <GraduationCap size={24} />
              Education History
            </h2>
            {profileData.educationHistory?.map((education, index) => (
              <EducationItem key={education._id || index}>
                <div className="degree">{education.courseLevel}</div>
                <div className="field">{education.specialization}</div>
                <div className="institution">{education.institution}</div>
                <div className="graduation-year">
                  <GraduationCap size={14} />
                  Graduated {formatDate(education.passoutYear)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  <MapPin size={14} className="inline mr-1" />
                  {education.location || 'Location not specified'}
                </div>
              </EducationItem>
            ))}
            {(!profileData.educationHistory || profileData.educationHistory.length === 0) && (
              <div className="text-gray-500 italic">No education history available</div>
            )}
          </ProfileCard>
        </div>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <CasesContainer>
          <div className="cases-header">
            <h2>Case History</h2>
          </div>
          {renderCases()}
        </CasesContainer>
      </TabPanel>

      {/* Chat portal */}
      {renderChatPortal()}
    </ProfileContainer>
  );
};

Profile.propTypes = {
  setCurrentBreadcrumb: PropTypes.func.isRequired
};

export default Profile;
