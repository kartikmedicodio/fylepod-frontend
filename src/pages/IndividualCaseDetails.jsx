import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {  
  Loader2,
  Bot,
  SendHorizontal,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

const getInitials = (name) => {
  return name
    ? name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';
};

const processingSteps = [
  { id: 1, text: "Analyzing document" },
  { id: 2, text: "Extracting information" },
  { id: 3, text: "Validating content" },
  { id: 4, text: "Verifying document" }
];

const ProcessingIndicator = ({ currentStep }) => {
  const [localStep, setLocalStep] = useState(currentStep);

  useEffect(() => {
    const interval = setInterval(() => {
      setLocalStep((prev) => (prev + 1) % processingSteps.length);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center rounded-lg z-50">
      <div className="bg-white rounded-2xl p-4 shadow-2xl w-72 mx-auto border border-gray-100">
        {/* Diana's Avatar Section */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            {/* Animated Background Rings */}
            <div className="absolute inset-0 -m-4">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl"></div>
            </div>
            {/* Avatar Container */}
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg relative">
              {/* Animated Processing Indicator */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl animate-spin" style={{ animationDuration: '3s' }}></div>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl"></div>
              <span className="relative text-sm font-semibold text-white">Diana</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Step Text Animation */}
          <div className="h-5 relative overflow-hidden text-center">
            {processingSteps.map((step, index) => (
              <div
                key={step.id}
                className={`absolute w-full transition-all duration-300 ${
                  index === localStep 
                    ? 'opacity-100 transform-none' 
                    : 'opacity-0 -translate-y-2'
                }`}
              >
                <span className="text-xs font-medium bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent inline-block">
                  {step.text}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-center gap-1">
            <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
};

ProcessingIndicator.propTypes = {
  currentStep: PropTypes.number.isRequired
};

const DocumentProgressBar = ({ status }) => {
  // Updated stages with cyan for all stages and blue for the final stage
  const stages = [
    { id: 1, name: 'Document Scanned', color: 'bg-cyan-100', textColor: 'text-cyan-600', iconColor: 'text-cyan-600' },
    { id: 2, name: 'Data Extracted', color: 'bg-cyan-100', textColor: 'text-cyan-600', iconColor: 'text-cyan-600' },
    { id: 3, name: 'Document Type Detected', color: 'bg-cyan-100', textColor: 'text-cyan-600', iconColor: 'text-cyan-600' },
    { id: 4, name: 'Content Validated', color: 'bg-cyan-100', textColor: 'text-cyan-600', iconColor: 'text-cyan-600' },
    { id: 5, name: 'Verification Complete', color: 'bg-blue-100', textColor: 'text-blue-700', iconColor: 'text-blue-700' }
  ];

  // Convert status to lowercase for more reliable comparison
  const normalizedStatus = (status || '').toLowerCase().trim();
  
  // Calculate current stage based on normalized status
  let currentStage = 1; // Default to first stage
  
  // Ensure both 'uploaded' and 'approved' show the green complete stage
  if (normalizedStatus === 'uploaded' || normalizedStatus === 'approved') {
    currentStage = 5;
  } else if (normalizedStatus === 'validating') {
    currentStage = 4;
  } else if (normalizedStatus === 'detecting') {
    currentStage = 3;
  } else if (normalizedStatus === 'processing') {
    currentStage = 2;
  } else if (normalizedStatus === 'pending') {
    currentStage = 1;
  }

  // Log for debugging
  // console.log('Document status:', status, 'Normalized:', normalizedStatus, 'Stage:', currentStage);

  return (
    <div className="mt-3">
      <div className="flex justify-between">
        {stages.map((stage) => (
          <div key={stage.id} className="flex items-center gap-1.5 px-1">
            {/* Status tick/check icon */}
            <div 
              className={`w-5 h-5 rounded-full flex items-center justify-center relative
                ${stage.id <= currentStage ? stage.color : 'bg-gray-100'}
                ${stage.id <= currentStage ? 'shadow-sm' : ''}`}
            >
              {stage.id <= currentStage ? (
                <svg className={`w-3 h-3 ${stage.iconColor}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
              )}
              
              {/* Active indicator */}
              {stage.id === currentStage && (
                <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stage.iconColor.replace('text-', 'bg-')}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${stage.iconColor.replace('text-', 'bg-')}`}></span>
                </span>
              )}
            </div>
            
            {/* Stage label */}
            <span 
              className={`text-xs ${stage.id <= currentStage ? stage.textColor : 'text-gray-400'} 
                ${stage.id <= currentStage ? 'font-medium' : ''}`}
            >
              {stage.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

DocumentProgressBar.propTypes = {
  status: PropTypes.string.isRequired
};

const IndividualCaseDetails = () => {
  const { caseId } = useParams();
  const [activeTab, setActiveTab] = useState('case-details');
  const [caseData, setCaseData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('pending');
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hello! I'm your AI assistant. I can help you analyze your uploaded documents and answer any questions you might have."
  }]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [isLoadingQuestionnaires, setIsLoadingQuestionnaires] = useState(true);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null);
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [formData, setFormData] = useState({
    Passport: {},
    Resume: {}
  });
  const [processingStep, setProcessingStep] = useState(0);

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
        const response = await api.get(`/documents/${documentId}`);
        const document = response.data.data.document;

        if (document.processingError || document.status === 'failed') {
          console.log(`Document ${documentId} processing failed`);
          return null;
        }

        if (document.extractedData?.document_type) {
          console.log('Document processed successfully');
          return document;
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, baseInterval * Math.min(Math.pow(1.5, attempts), 8)));
      } catch (err) {
        console.error('Error checking document status:', err);
        return null;
      }
    }

    return null;
  };

  const refreshCaseData = async () => {
    try {
      const [caseResponse, documentsResponse] = await Promise.all([
        api.get(`/management/${caseId}`),
        api.get('/documents', { params: { managementId: caseId } })
      ]);

      if (caseResponse.data.status === 'success') {
        setCaseData(caseResponse.data.data.entry);
      }

      // Reset chat if documents have changed
      if (documentsResponse.data.status === 'success') {
        setCurrentChat(null);
        setMessages([{
          role: 'assistant',
          content: "Hello! I'm your AI assistant. I can help you analyze your uploaded documents and answer any questions you might have."
        }]);
      }

      // Get valid document types from case
      const validDocuments = caseResponse.data.data.entry.documentTypes
        .filter(docType => docType.status === 'uploaded' || docType.status === 'approved')
        .map(docType => ({
          id: docType._id,
          name: docType.name
        }));

      // Debug log for document mapping
      console.log('Document mapping:', validDocuments.map(validDoc => {
        const matchingDoc = documentsResponse.data.data.documents
          .find(doc => doc.managementDocumentId === validDoc.id && doc.status === 'processed');
        return {
          documentName: validDoc.name,
          managementDocumentId: validDoc.id,
          matchingDocId: matchingDoc?._id || null
        };
      }));

    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files.length) return;
    
    setIsProcessing(true);
    const uploadedDocIds = [];

    try {
      // Upload all files
      const uploadPromises = files.map(async (file) => {
        if (!validateFileType(file)) {
          toast.error(`Invalid file type: ${file.name}`);
          return null;
        }

        // Find a pending document type
        const pendingDoc = caseData.documentTypes.find(dt => dt.status === 'pending');
        if (!pendingDoc) {
          toast.error('No pending documents available');
          return null;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('originalName', file.name);
        formData.append('name', `${Date.now()}-${file.name}`);
        formData.append('type', pendingDoc.name);
        formData.append('managementId', caseId);
        formData.append('documentTypeId', pendingDoc.documentTypeId);
        formData.append('managementDocumentId', pendingDoc._id);
        formData.append('form_category', 'document_verification');
        formData.append('mimeType', file.type);

        try {
          setProcessingStep(0); // Start with analyzing
          const response = await api.post('/documents', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
          });

          if (response.data?.status === 'success') {
            const uploadedDoc = response.data.data.document;
            uploadedDocIds.push(uploadedDoc._id);
            return uploadedDoc;
          }
          return null;
        } catch (err) {
          console.error(`Error uploading ${file.name}:`, err);
          toast.error(`Failed to upload ${file.name}`);
          return null;
        }
      });

      const uploadedDocs = (await Promise.all(uploadPromises)).filter(Boolean);
      if (!uploadedDocs.length) {
        toast.error('No files were uploaded successfully');
        return;
      }

      // Process and verify documents
      const processResults = await Promise.all(
        uploadedDocs.map(async (doc) => {
          try {
            setProcessingStep(1); // Extracting information
            const processedDoc = await checkDocumentProcessing(doc._id);
            if (!processedDoc) {
              // Delete document if processing failed
              await api.delete(`/documents/${doc._id}`);
              throw new Error('Document processing failed');
            }

            setProcessingStep(2); // Validating content

            // Check if document type matches any pending document type
            if (processedDoc.extractedData?.document_type) {
              setProcessingStep(3); // Verifying document type
              const extractedType = processedDoc.extractedData.document_type.toLowerCase().trim();
              
              // Find matching document type that's not already uploaded
              const matchingDocType = caseData.documentTypes.find(type => {
                return type.name.toLowerCase().trim() === extractedType && 
                       type.status !== 'uploaded' &&
                       type.status !== 'approved';
              });

              if (matchingDocType) {
                // Update document with correct management document ID
                await api.patch(`/documents/${doc._id}`, {
                  documentTypeId: matchingDocType.documentTypeId,
                  managementDocumentId: matchingDocType._id
                });

                // Update document status to 'uploaded'
                await api.patch(`/management/${caseId}/documents/${matchingDocType.documentTypeId}/status`, {
                  status: 'uploaded'
                });

                return { success: true, docId: doc._id };
              } else {
                // No matching pending document type found - delete the document
                console.log(`No matching pending document type found for ${extractedType}. Deleting document ${doc._id}`);
                await api.delete(`/documents/${doc._id}`);
                return { success: false, docId: doc._id, error: 'Document type mismatch' };
              }
            } else {
              // No document type extracted - delete the document
              await api.delete(`/documents/${doc._id}`);
              return { success: false, docId: doc._id, error: 'Could not extract document type' };
            }
          } catch (err) {
            console.error(`Error processing document ${doc._id}:`, err);
            // Attempt to delete the document on error
            try {
              await api.delete(`/documents/${doc._id}`);
            } catch (deleteErr) {
              console.error(`Error deleting failed document ${doc._id}:`, deleteErr);
            }
            return { success: false, docId: doc._id, error: err.message };
          }
        })
      );

      // Count successful uploads
      const successfulUploads = processResults.filter(result => result.success).length;
      const failedUploads = processResults.filter(result => !result.success).length;

      // Refresh data after processing
      await refreshCaseData();
      
      setFiles([]);

      // Show appropriate toast message
      if (successfulUploads > 0) {
        toast.success(`Successfully processed ${successfulUploads} document${successfulUploads !== 1 ? 's' : ''}`);
      }
      if (failedUploads > 0) {
        toast.error(`${failedUploads} document${failedUploads !== 1 ? 's' : ''} failed verification`);
      }

    } catch (err) {
      console.error('Error in file upload process:', err);
      toast.error('Error processing documents');
      
      // Clean up any remaining uploaded documents on error
      await Promise.all(
        uploadedDocIds.map(docId =>
          api.delete(`/documents/${docId}`).catch(err => {
            console.error(`Error deleting document ${docId}:`, err);
          })
        )
      );
    } finally {
      setIsProcessing(false);
      setProcessingStep(0);
    }
  };

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        const response = await api.get(`/management/${caseId}`);
        if (response.data.status === 'success') {
          setCaseData(response.data.data.entry);
          
          // Use the user data included in the case as a basic profile
          if (response.data.data.entry?.userId) {
            // Set basic profile from case data
            setProfileData({
              _id: response.data.data.entry.userId._id,
              name: response.data.data.entry.userName || response.data.data.entry.userId.name,
              email: response.data.data.entry.userId.email,
            });
            
            // Then try to fetch complete profile
            if (response.data.data.entry.userId._id) {
              fetchUserProfile(response.data.data.entry.userId._id);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching case details:', error);
        toast.error('Failed to load case details');
      }
    };

    const fetchUserProfile = async (userId) => {
      try {
        // Use the working endpoint
        const response = await api.get(`/auth/users/${userId}`);
        
        // The API response format is what we verified in the logs
        if (response.data.success) {
          setProfileData(response.data.data.user || response.data.data);
        } else {
          console.error('API returned success:false for user profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Don't show error toast since we already have basic profile data
      }
    };

    const fetchQuestionnaires = async () => {
      try {
        const response = await api.get('/questionnaires');
        if (response.data.status === 'success') {
          setQuestionnaires(response.data.data.templates);
        }
      } catch (error) {
        console.error('Error fetching questionnaires:', error);
        toast.error('Failed to load questionnaires');
      } finally {
        setIsLoadingQuestionnaires(false);
      }
    };

    fetchCaseDetails();
    fetchQuestionnaires();
  }, [caseId]);

  useEffect(() => {
    if (questionnaireData?.responses?.[0]?.processedInformation) {
      setFormData(questionnaireData.responses[0].processedInformation);
    }
  }, [questionnaireData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;

    const userMessage = { role: 'user', content: chatInput };
    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsSending(true);

    try {
      console.log('Current case ID:', caseId);
      
      // First get the case details to get document types
      const caseResponse = await api.get(`/management/${caseId}`);
      console.log('Case response:', caseResponse.data);

      if (!caseResponse.data?.status === 'success') {
        throw new Error('Failed to fetch case details');
      }

      // Get uploaded and approved document types from the case
      const validDocuments = caseResponse.data.data.entry.documentTypes
        .filter(docType => docType.status === 'uploaded' || docType.status === 'approved')
        .map(docType => ({
          id: docType._id,
          name: docType.name
        }));

      console.log('Valid documents:', validDocuments);
      
      // Extract just the document type IDs
      const validDocTypeIds = validDocuments.map(doc => doc.id);
      console.log('Valid document type IDs:', validDocTypeIds);
      
      // Use the new API endpoint with POST instead of GET
      const documentsResponse = await api.post('/documents/management-docs', {
        managementId: caseId,
        docTypeIds: validDocTypeIds // Send the array directly in the request body
      });
      
      const validDocs = documentsResponse.data.data.documents;
      console.log(`Found ${validDocs.length} valid documents for chat:`, validDocs);
      
      if (validDocs.length === 0) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I don't see any processed documents yet. Please ensure documents are uploaded and processed."
        }]);
        setIsSending(false);
        return;
      }
      
      // Extract document IDs for chat creation
      const docIds = validDocs.map(doc => doc._id);
      console.log('Using these document IDs for chat:', docIds);
      
      // Now that we fixed the backend, we can simply create the chat with all documents
      console.log('Creating chat with all documents:', docIds);
      const chatResponse = await api.post('/chat', {
        documentIds: docIds,
        managementId: caseId
      });
      
      console.log('Chat response:', chatResponse);
      
      if (!chatResponse.data?.status === 'success' || !chatResponse.data?.data?.chat) {
        throw new Error(chatResponse.data?.message || 'Failed to create chat');
      }

      const newChat = chatResponse.data.data.chat;
      setCurrentChat(newChat);
      const chatId = newChat._id;
      
      // Send initial message to chat
      console.log('Sending message to chat:', chatId);
      const messageResponse = await api.post(`/chat/${chatId}/messages`, {
        message: chatInput
      });

      if (messageResponse.data?.status === 'success' && messageResponse.data.data.message) {
        console.log('Message response:', messageResponse.data);
        setMessages(prev => [...prev, messageResponse.data.data.message]);
      } else {
        throw new Error('Invalid message response');
      }

    } catch (error) {
      console.error('Chat creation error:', error);
      
      // Get more details about the error
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: error.response?.data?.message || error.message || "I'm sorry, I encountered an error creating the chat session."
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      const response = await api.put(`/questionnaire-responses/management/${caseId}`, {
        templateId: selectedQuestionnaire._id,
        processedInformation: formData
      });

      if (response.data.status === 'success') {
        toast.success('Changes saved successfully');
      }
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      toast.error('Failed to save changes');
    }
  };

  if (!caseData || !profileData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const CaseDetailsTab = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex gap-8">
        {/* Left Section - Case Information */}
        <div className="flex-1 space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Case Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500">Case Applicant</div>
                <div className="font-medium">{caseData.userName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Case Manager</div>
                <div className="font-medium">{caseData.createdBy?.name || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Case Name</div>
                <div className="font-medium">{caseData.categoryName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Case Created Date</div>
                <div className="font-medium">{new Date(caseData.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Case Status</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500">Current Status</div>
                <div className="font-medium">{caseData.categoryStatus}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Last Updated</div>
                <div className="font-medium">{new Date(caseData.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - AI Agents */}
        <div className="w-[400px] border-l pl-8">
          <div className="sticky top-5">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-semibold">AI Agents</h3>
              <div className="flex h-6 items-center">
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">2 Active</span>
              </div>
            </div>
            
            <div className="space-y-5">
              {/* Fiona - Case Creation Agent */}
              <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50/50 via-emerald-50/30 to-teal-50/50 rounded-2xl p-5 border border-emerald-100/50 shadow-sm">
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                      <span className="text-lg font-semibold text-white">F</span>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        Fiona
                      </h4>
                      <p className="text-sm text-gray-600">Case Creation Agent</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        Processing Case
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full transform translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full transform translate-x-8 translate-y-8"></div>
              </div>

              {/* Diana - Document Collection Agent */}
              <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-pink-50/50 rounded-2xl p-5 border border-indigo-100/50 shadow-sm">
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                      <span className="text-lg font-semibold text-white">D</span>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Diana
                      </h4>
                      <p className="text-sm text-gray-600">Document Collection Agent</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                      <span className="text-sm font-medium bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Collecting Documents
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-pink-500/5 rounded-full transform translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/5 to-pink-500/5 rounded-full transform translate-x-8 translate-y-8"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const QueriesTab = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 opacity-70">
      <h3 className="text-lg font-semibold mb-6">
        Queries <span className="text-sm font-normal text-gray-500 ml-2">Coming Soon</span>
      </h3>
      <div>Queries Content</div>
    </div>
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prevFiles => [...prevFiles, ...droppedFiles]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  };

  const DocumentsChecklistTab = () => {
    const pendingDocuments = caseData.documentTypes.filter(doc => 
      doc.status === 'pending'
    );
    
    const uploadedDocuments = caseData.documentTypes.filter(doc => 
      doc.status === 'uploaded' || doc.status === 'approved'
    );

    const renderDocumentsList = () => (
      <div className="flex-1 border border-gray-200 rounded-lg p-4">
        <div className="space-y-3">
          {uploadStatus === 'pending' ? (
            pendingDocuments.length > 0 ? (
              pendingDocuments.map((doc) => (
                <div key={doc._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border border-dashed border-gray-200">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {doc.name}
                            {doc.required && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                                Required
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Please upload your {doc.name.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm text-center py-8">
                All documents have been uploaded.
              </div>
            )
          ) : (
            uploadedDocuments.length > 0 ? (
              uploadedDocuments.map((doc) => (
                <div key={doc._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-start">
                      {/* Document icon and name */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h4 className="font-medium text-gray-800">{doc.name}</h4>
                      </div>
                      
                      {/* Status tag - with dynamic status from backend */}
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${doc.status === 'approved' || doc.status === 'uploaded'
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-gray-50 text-gray-700'
                          }`}
                      >
                        {doc.status === 'approved' 
                          ? 'Approved' 
                          : doc.status === 'uploaded' 
                            ? 'Uploaded' 
                            : doc.status || 'Processing'}
                      </span>
                    </div>
                    
                    {/* Keep the progress bar as is */}
                    <DocumentProgressBar status={doc.status || 'uploaded'} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm text-center py-8">
                No documents have been uploaded yet.
              </div>
            )
          )}
        </div>
      </div>
    );

    const renderSmartUpload = () => (
      uploadStatus === 'pending' && (
        <div className="flex-1 border border-gray-200 rounded-lg p-4 relative">
          {/* Processing overlay */}
          {isProcessing && <ProcessingIndicator currentStep={processingStep} />}
          
          <div className="mb-4">
            <h4 className="font-medium text-sm">Smart Upload Files</h4>
          </div>
          
          <div className={`transition-all ${isProcessing ? 'blur-sm' : ''}`}>
            <div 
              className={`flex flex-col items-center justify-center py-10 px-6 rounded-lg transition-all duration-300 ${
                isDragging 
                  ? 'bg-blue-50 border-2 border-dashed border-blue-400 shadow-inner' 
                  : 'bg-gray-50 border-2 border-dashed border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Upload Icon */}
              <div className={`mb-4 p-5 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <svg 
                  className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-500'}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              {/* Upload Instructions */}
              <div className="text-center space-y-4">
                <h3 className={`font-medium ${isDragging ? 'text-blue-700' : 'text-gray-700'}`}>
                  {isDragging ? 'Drop files here' : 'Upload your documents'}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  Drag & drop files here or use the button below
                </p>
                
                <label 
                  htmlFor="smart-file-upload" 
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l-3-3m0 0l-3 3m3-3v12M3 17.25V21h18v-3.75M3 10.5V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v3" />
                  </svg>
                  Browse Files
                </label>
                
                <p className="text-xs text-gray-400 mt-2">
                  Supports JPG, PNG and PDF (max 10MB)
                </p>
              </div>
              
              {/* Hidden file input */}
              <input 
                type="file" 
                multiple 
                accept="image/jpeg,image/png,image/jpg,application/pdf" 
                className="hidden" 
                onChange={handleFileSelect}
                id="smart-file-upload"
              />
              
              {/* Selected files preview */}
              {files.length > 0 && (
                <div className="w-full mt-6 space-y-2">
                  <div className="text-sm font-medium text-gray-700 mb-2">Selected files:</div>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800 truncate max-w-xs">{file.name}</div>
                          <div className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                      </div>
                      <button 
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => setFiles(files.filter((_, i) => i !== index))}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => handleFileUpload(files)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Upload Files'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    );

    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Documents Checklist</h3>
        
        {/* Status Buttons */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setUploadStatus('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              uploadStatus === 'pending'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Upload Pending
          </button>
          <button 
            onClick={() => setUploadStatus('uploaded')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              uploadStatus === 'uploaded'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Uploaded
          </button>
        </div>

        <div className="flex gap-6">
          {renderDocumentsList()}
          {renderSmartUpload()}
        </div>
      </div>
    );
  };

  const QuestionnaireTab = () => {
    const handleQuestionnaireClick = async (questionnaire) => {
      setSelectedQuestionnaire(questionnaire);
      
      try {
        const response = await api.get(`/questionnaire-responses/management/${caseId}`, {
          templateId: questionnaire._id
        });
        
        if (response.data.status === 'success') {
          setQuestionnaireData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching questionnaire details:', error);
        toast.error('Failed to load questionnaire details');
      }
    };

    if (isLoadingQuestionnaires) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      );
    }

    if (selectedQuestionnaire) {
      return (
        <div className="bg-white rounded-lg border border-gray-200">
          <QuestionnaireDetailView 
            questionnaire={selectedQuestionnaire}
            onBack={() => setSelectedQuestionnaire(null)}
          />
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Questionnaire List</h2>
          </div>

          <div className="space-y-3">
            {questionnaires.map((questionnaire) => (
              <div 
                key={questionnaire._id} 
                className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-gray-100 transition-all cursor-pointer"
                onClick={() => handleQuestionnaireClick(questionnaire)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">{questionnaire.questionnaire_name}</h3>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600">
                      {questionnaire.field_mappings.length} Fields
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const QuestionnaireDetailView = ({ questionnaire, onBack }) => {
    return (
      <div className="p-6">
        {/* Header with Back Button */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <button 
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-medium text-gray-900">Questionnaire</h2>
          </div>
          <p className="text-sm text-gray-600 ml-8">{questionnaire.questionnaire_name}</p>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {/* Passport Information Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Passport Information</h3>
            <div className="grid grid-cols-3 gap-4">
              {questionnaire.field_mappings
                .filter(field => field.sourceDocument === 'Passport')
                .map(field => (
                  <div key={field._id}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {field.fieldName}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.Passport?.[field.fieldName] || ''}
                      onChange={(e) => handleInputChange('Passport', field.fieldName, e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Professional Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {questionnaire.field_mappings
                .filter(field => field.sourceDocument === 'Resume')
                .map(field => (
                  <div key={field._id}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {field.fieldName}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type={field.fieldName.toLowerCase().includes('email') ? 'email' : 'text'}
                      value={formData.Resume?.[field.fieldName] || ''}
                      onChange={(e) => handleInputChange('Resume', field.fieldName, e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    );
  };

  QuestionnaireDetailView.propTypes = {
    questionnaire: PropTypes.shape({
      questionnaire_name: PropTypes.string,
      field_mappings: PropTypes.arrayOf(
        PropTypes.shape({
          _id: PropTypes.string,
          sourceDocument: PropTypes.string,
          sourceField: PropTypes.string,
          targetForm: PropTypes.string,
          targetField: PropTypes.string
        })
      )
    }).isRequired,
    onBack: PropTypes.func.isRequired
  };

  // Create a portal for the chat button and popup
  const renderChatPortal = () => {
    return ReactDOM.createPortal(
      <>
        {/* Chat Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowChatPopup(prev => !prev);
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors z-[9999]"
          aria-label="Toggle AI Chat"
        >
          <Bot className="w-7 h-7 text-white" />
        </button>
        
        {/* Chat Popup */}
        {showChatPopup && (
          <div className="fixed bottom-24 right-8 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-blue-600">AI</span>
                </div>
                <h4 className="font-medium">AI Assistant</h4>
              </div>
              <button onClick={() => setShowChatPopup(false)} className="text-gray-400 hover:text-gray-600">
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
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-blue-600">AI</span>
                    </div>
                  )}
                  
                  <div className={`rounded-lg p-3 max-w-[85%] ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700'
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
                  placeholder="Type your message..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg pr-12 focus:outline-none focus:border-blue-500"
                  disabled={isSending}
                />
                <button 
                  type="submit"
                  disabled={isSending || !chatInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
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

  // Main component return
  return (
    <>
      {/* Profile Section */}
      <div className="p-6 flex justify-start">
        <div className="w-1/2">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start gap-6">
              {/* Profile header with label */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center">
                  <span className="text-2xl font-medium text-blue-600">
                    {profileData ? getInitials(profileData.name) : '...'}
                  </span>
                </div>
              </div>

              {/* Profile Info Grid */}
              <div className="flex-grow grid grid-cols-2 gap-x-12 gap-y-2">
                {/* Left Column - Basic Info */}
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-gray-500">Name</div>
                    <div className="font-medium">{profileData?.name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Phone Number</div>
                    <div className="font-medium">
                      {profileData?.contact?.mobileNumber || profileData?.contact?.residencePhone || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email Address</div>
                    <div className="font-medium">{profileData?.email || '-'}</div>
                  </div>
                </div>

                {/* Right Column - Location Info */}
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-gray-500">Nationality</div>
                    <div className="font-medium">{profileData?.address?.country || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Address</div>
                    <div className="font-medium">
                      {profileData?.address ? 
                        [
                          profileData.address.city,
                          profileData.address.country,
                          profileData.address.zipCode
                        ]
                          .filter(Boolean)
                          .join(', ') 
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Passport Number</div>
                    <div className="font-medium">{profileData?.passport?.number || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-6 py-4">
        <div className="flex gap-2">
          {['Case Details', 'Documents Checklist'].map((tab) => (
            <button
              key={tab}
              className={`px-6 py-3 text-base font-medium rounded-lg transition-colors ${
                activeTab === tab.toLowerCase().replace(' ', '-')
                  ? 'bg-white border border-gray-200 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
            >
              {tab}
            </button>
          ))}
          <button
            key="Queries"
            className="px-6 py-3 text-base font-medium rounded-lg transition-colors text-gray-400 cursor-not-allowed opacity-70"
            disabled
          >
            Queries 
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'case-details' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <CaseDetailsTab />
          </div>
        )}
        {activeTab === 'documents-checklist' && (
          <div className="flex gap-6">
            <div className="w-[66%]">
              <div className="bg-white rounded-lg border border-gray-200">
                <DocumentsChecklistTab />
              </div>
            </div>
            <div className="w-[33%]">
              <QuestionnaireTab />
            </div>
          </div>
        )}
        {activeTab === 'queries' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <QueriesTab />
          </div>
        )}
      </div>

      {/* Render chat portal to document.body */}
      {renderChatPortal()}
    </>
  );
};

export default IndividualCaseDetails;
