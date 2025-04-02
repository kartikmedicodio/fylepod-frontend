import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {  
  Loader2,
  Bot,
  SendHorizontal,
  ChevronLeft,
  Eye,
  AlertCircle,
  ChevronRight,
  Check,
  ChevronUp,
  ChevronDown,
  X // Add these imports for the new icons
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import ProgressSteps from '../components/ProgressSteps';
import CrossVerificationTab from '../components/cases/CrossVerificationTab';

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
  { id: 4, text: "Verifying document" },
  { id: 5, text: "Document processed" }
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
  const normalizedStatus = (status || '').toLowerCase().trim();
  let currentStage = 1;
  
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

  return (
    <div className="mt-3">
      <div className="flex justify-between">
        {processingSteps.map((stage) => (
          <div key={stage.id} className="flex items-center gap-1.5 px-1">
            {/* Status indicator */}
            <div 
              className={`w-5 h-5 rounded-full flex items-center justify-center relative
                ${stage.id <= currentStage ? 'bg-purple-500' : 'bg-gray-100'}
                ${stage.id <= currentStage ? 'shadow-sm' : ''}`}
            >
              {stage.id <= currentStage ? (
                <div className="relative w-full h-full">
                  {/* Animated ring for active stage - only show for current non-completed stage */}
                  {stage.id === currentStage && stage.id !== 5 && (
                    <div className="absolute -inset-1 bg-purple-500 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
                  )}
                  <div className="absolute inset-0 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
              )}
              
              {/* Active indicator pulse - only show for current non-completed stage */}
              {stage.id === currentStage && stage.id !== 5 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-purple-500"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
              )}
            </div>
            
            {/* Stage label */}
            <span 
              className={`text-xs ${
                stage.id <= currentStage 
                  ? 'font-medium text-purple-600' 
                  : 'text-gray-400'
              }`}
            >
              {stage.text}
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

const FNCaseDetails = () => {
  const { caseId } = useParams();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  
  // Set initial states
  const [activeTab, setActiveTab] = useState('documents-checklist');
  const [uploadStatus, setUploadStatus] = useState('pending'); // Ensure this is 'pending'
  const [caseData, setCaseData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Single loading state for all data
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hello! I'm Sophia from support. I'm here to assist you with your case and answer any questions you might have. How can I help you today?"
  }]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
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
  const [isSavingQuestionnaire, setIsSavingQuestionnaire] = useState(false);
  const [isQuestionnaireCompleted, setIsQuestionnaireCompleted] = useState(false);
  // Add this state to track saved fields
  const [savedFields, setSavedFields] = useState({
    Passport: {},
    Resume: {}
  });
  // Add new state for questionnaire status
  const [questionnaireStatus, setQuestionnaireStatus] = useState('pending'); // possible values: 'pending', 'saved'
  const [verificationData, setVerificationData] = useState(null);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  // Add new states for validation data
  const [validationData, setValidationData] = useState(null);
  const [isValidationLoading, setIsValidationLoading] = useState(false);

  // Group all useRef hooks
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Group all useEffect hooks
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
          return null;
        }

        if (document.extractedData?.document_type) {
          return document;
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, baseInterval * Math.min(Math.pow(1.5, attempts), 8)));
      } catch (err) {
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
          content: "Hello! I'm Sophia from support. I'm here to assist you with your case and answer any questions you might have. How can I help you today?"
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
    try {
      setIsProcessing(true);
      setProcessingStep(1);

      if (!files.length) return;
      
      const uploadedDocIds = [];

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
        formData.append('managementId', caseId);
        formData.append('documentTypeId', pendingDoc.documentTypeId);
        formData.append('managementDocumentId', pendingDoc._id);
        formData.append('form_category_id', caseData.categoryId?._id);
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
              
              // Enhanced document type matching logic
              const matchingDocType = caseData.documentTypes.find(type => {
                const typeName = type.name.toLowerCase().trim();
                const isPending = type.status !== 'uploaded' && type.status !== 'approved';
                
                // Check for exact match
                if (typeName === extractedType) return isPending;
                
                // Check for partial matches (e.g., "passport" matches "passport copy")
                if (typeName.includes(extractedType) || extractedType.includes(typeName)) return isPending;
                
                // Check for common variations
                const variations = {
                  'passport': ['passport copy', 'passport scan', 'passport photo'],
                  'resume': ['cv', 'curriculum vitae', 'resume copy'],
                  'photo': ['photograph', 'photo id', 'id photo'],
                  'id': ['identity document', 'id proof', 'identity proof']
                };
                
                return Object.entries(variations).some(([key, values]) => {
                  if (key === extractedType) return values.includes(typeName) && isPending;
                  if (values.includes(extractedType)) return key === typeName && isPending;
                  return false;
                });
              });

              if (matchingDocType) {
                // Additional validation of extracted data
                const validationResults = processedDoc.validationResults || {};
                const hasRequiredFields = Object.entries(validationResults).every(([_, result]) => {
                  if (!matchingDocType.required) return true;
                  return result.isValid;
                });

                if (!hasRequiredFields) {
                  await api.delete(`/documents/${doc._id}`);
                  return { 
                    success: false, 
                    docId: doc._id, 
                    error: 'Missing required fields' 
                  };
                }

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
                await api.delete(`/documents/${doc._id}`);
                return { 
                  success: false, 
                  docId: doc._id, 
                  error: 'Document type mismatch' 
                };
              }
            } else {
              // No document type extracted - delete the document
              await api.delete(`/documents/${doc._id}`);
              return { 
                success: false, 
                docId: doc._id, 
                error: 'Could not extract document type' 
              };
            }
          } catch (err) {
            console.error(`Error processing document ${doc._id}:`, err);
            // Attempt to delete the document on error
            try {
              await api.delete(`/documents/${doc._id}`);
            } catch (deleteErr) {
              console.error(`Error deleting failed document ${doc._id}:`, deleteErr);
            }
            return { 
              success: false, 
              docId: doc._id, 
              error: err.message 
            };
          }
        })
      );

      // Count successful uploads
      const successfulUploads = processResults.filter(result => result.success).length;
      const failedUploads = processResults.filter(result => !result.success).length;

      // If there are successful uploads, perform cross-verification
      if (successfulUploads > 0) {
        try {
          setProcessingStep(4); // Cross-verifying documents
          
          // Get case data and check if all documents are uploaded
          const caseResponse = await api.get(`/management/${caseId}`);
          if (caseResponse.data.status === 'success') {
            setCaseData(caseResponse.data.data.entry);
            
            // Check if all documents are uploaded
            const allDocsUploaded = caseResponse.data.data.entry.documentTypes.every(doc => 
              doc.status === 'uploaded' || doc.status === 'approved'
            );

            if (allDocsUploaded) {
              // Perform cross-verification only once
              const crossVerifyResponse = await api.get(`/management/${caseId}/cross-verify`);
              
              if (crossVerifyResponse.data.status === 'success') {
                // Fetch validation data
                const validationResponse = await api.get(`/documents/management/${caseId}/validations`);
                if (validationResponse.data.status === 'success') {
                  const validationData = validationResponse.data.data;
                  const verificationData = crossVerifyResponse.data.data;

                  // Generate email draft
                  const recipientEmail = profileData?.contact?.email || profileData?.email;
                  const recipientName = profileData?.name || 'Applicant';

                  if (!recipientEmail) {
                    toast.error('Cannot send email: Missing recipient email');
                    return;
                  }

                  const draftResponse = await api.post('/mail/draft', {
                    errorType: 'document_validation',
                    errorDetails: {
                      validationResults: validationData.mergedValidations.flatMap(doc => 
                        doc.validations.map(v => ({
                          documentType: doc.documentType,
                          rule: v.rule,
                          passed: v.passed,
                          message: v.message
                        }))
                      ),
                      mismatchErrors: verificationData.verificationResults?.mismatchErrors || [],
                      missingErrors: verificationData.verificationResults?.missingErrors || [],
                      summarizationErrors: verificationData.verificationResults?.summarizationErrors || []
                    },
                    recipientEmail,
                    recipientName
                  });

                  if (draftResponse.data && draftResponse.data.status === 'success' && draftResponse.data.data) {
                    const { subject, body } = draftResponse.data.data;
                    
                    // Send the email
                    const sendResponse = await api.post('/mail/send', {
                      subject,
                      body,
                      recipientEmail,
                      recipientName,
                      ccEmail: [] // Optional CC field
                    });

                    if (sendResponse.data.status === 'success') {
                      toast.success('Documents uploaded and email sent successfully');
                    } else {
                      toast.error('Failed to send email notification');
                    }
                  } else {
                    toast.error('Failed to generate email notification');
                  }
                }
              }
            }

            // After cross-verification, organize documents
            setProcessingStep(5); // Organizing documents
            try {
              // Make API calls for each questionnaire
              const questionnaireResponses = await Promise.all(
                questionnaires.map(async (questionnaire) => {
                  try {
                    const response = await api.post(`/documents/management/${caseId}/organized`, {
                      templateId: questionnaire._id
                    });
                    return {
                      questionnaire,
                      data: response.data
                    };
                  } catch (error) {
                    console.error(`Error processing questionnaire ${questionnaire._id}:`, error);
                    return {
                      questionnaire,
                      error: true
                    };
                  }
                })
              );

              // Check if all API calls were successful
              const hasErrors = questionnaireResponses.some(response => response.error);
              if (hasErrors) {
                toast.error('Some questionnaires could not be processed');
              } else {
                // Update case data with organized documents from the first successful response
                const firstSuccessResponse = questionnaireResponses.find(response => !response.error);
                if (firstSuccessResponse?.data?.status === 'success') {
                  setCaseData(prevData => ({
                    ...prevData,
                    organizedDocuments: firstSuccessResponse.data.data.rawDocuments,
                    processedInformation: firstSuccessResponse.data.data.processedInformation
                  }));
                }
              }
            } catch (error) {
              console.error('Error organizing documents:', error);
              toast.error('Failed to organize documents');
            }

            // Refresh case data
            await refreshCaseData();
          }
        } catch (error) {
          console.error('Error during cross-verification or questionnaire filling:', error);
          // Don't show error to user, just log it
        }
      }

      setFiles([]);

      // Reset chat after successful upload
      if (successfulUploads > 0) {
        // Reset chat states
        setCurrentChat(null);
        setMessages([{
          role: 'assistant',
          content: "Hello! I'm Sophia from support. I'm here to assist you with your case and answer any questions you might have. How can I help you today?"
        }]);
        
        // If there are successful uploads, initialize chat automatically
        try {
          // Get case details
          const caseResponse = await api.get(`/management/${caseId}`);
          
          if (caseResponse.data?.status === 'success' && caseResponse.data?.data?.entry) {
            const managementData = caseResponse.data.data.entry;
            
            // Prepare management context
            const managementContext = {
              caseId: managementData._id,
              categoryName: managementData.categoryName,
              categoryStatus: managementData.categoryStatus,
              deadline: managementData.deadline,
              documentTypes: managementData.documentTypes.map(doc => ({
                name: doc.name,
                status: doc.status,
                required: doc.required
              }))
            };
            
            // Get uploaded documents
            const validDocuments = managementData.documentTypes
              .filter(docType => docType && (docType.status === 'uploaded' || docType.status === 'approved'))
              .map(docType => ({
                id: docType._id,
                name: docType.name
              }))
              .filter(doc => doc.id);
              
            if (validDocuments.length > 0) {
              // Get document IDs
              const validDocTypeIds = validDocuments.map(doc => doc.id);
              
              const documentsResponse = await api.post('/documents/management-docs', {
                managementId: caseId,
                docTypeIds: validDocTypeIds
              });
              
              if (documentsResponse.data?.data?.documents) {
                const validDocs = documentsResponse.data.data.documents
                  .filter(doc => doc && doc._id);
                
                if (validDocs.length > 0) {
                  // Extract document IDs for chat creation
                  const docIds = validDocs.map(doc => doc._id);
                  
                  // Create new chat with the documents and management data
                  const chatResponse = await api.post('/chat', {
                    documentIds: docIds,
                    managementId: caseId,
                    managementContext: managementContext
                  });
                  
                  if (chatResponse.data?.status === 'success' && chatResponse.data?.data?.chat) {
                    setCurrentChat(chatResponse.data.data.chat);
                    
                    // Add a message indicating the chat has been updated with new documents
                    setMessages(prev => [
                      prev[0], // Keep welcome message
                      {
                        role: 'assistant',
                        content: `I've analyzed your newly uploaded documents. You can now ask me questions about them!`
                      }
                    ]);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error initializing chat after upload:', error);
          // Don't show error to user, just log it - chat will initialize on first message
        }
      }

      // Show success/failure toasts
      if (successfulUploads > 0) {
        toast.custom((t) => (
          <div className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="relative">
                    {/* Animated Background Rings */}
                    <div className="absolute inset-0 -m-2">
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-lg"></div>
                    </div>
                    {/* Avatar Container */}
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg animate-spin" style={{ animationDuration: '3s' }}></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg"></div>
                      <span className="relative text-xs font-semibold text-white">Diana</span>
                    </div>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Diana successfully processed your documents
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {successfulUploads} document{successfulUploads !== 1 ? 's' : ''} verified and uploaded
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        ), { duration: 5000 });
      }

      if (failedUploads > 0) {
        toast.custom((t) => (
          <div className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="relative">
                    {/* Animated Background Rings */}
                    <div className="absolute inset-0 -m-2">
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-red-500/20 via-pink-500/20 to-rose-500/20 rounded-full blur-lg"></div>
                    </div>
                    {/* Avatar Container */}
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 flex items-center justify-center shadow-md relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 rounded-lg animate-spin" style={{ animationDuration: '3s' }}></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 rounded-lg"></div>
                      <span className="relative text-xs font-semibold text-white">Diana</span>
                    </div>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Diana encountered some issues
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {failedUploads} document{failedUploads !== 1 ? 's' : ''} failed verification. Please try again.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Close
              </button>
            </div>
          </div>
        ), { duration: 5000 });
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      toast.error('Failed to upload files');
    } finally {
      setIsProcessing(false);
      setProcessingStep(0);
    }
  };

  // Update the initial setup useEffect
  useEffect(() => {
    // Always start with documents-checklist tab and upload pending status
    setActiveTab('documents-checklist');
    setUploadStatus('pending');

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch case details
        const caseResponse = await api.get(`/management/${caseId}`);

        if (caseResponse.data.status === 'success') {
          const caseData = caseResponse.data.data.entry;
          setCaseData(caseData);
          
          // Set breadcrumb
          setCurrentBreadcrumb([
            { name: 'All Cases', path: '/individual-cases' },
            { name: caseData.categoryName || 'Case Details', path: `/individuals/case/${caseId}` }
          ]);

          // Remove this section to ensure we always start with 'pending'
          /* 
          // Update uploadStatus based on document status
          const hasPendingDocs = caseData.documentTypes.some(doc => doc.status === 'pending');
          setUploadStatus(hasPendingDocs ? 'pending' : 'uploaded');
          */

          // If we have a userId, fetch the complete profile
          if (caseData.userId?._id) {
            const profileResponse = await api.get(`/auth/users/${caseData.userId._id}`);
            if (profileResponse.data.success && profileResponse.data.data) {
              setProfileData(profileResponse.data.data);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load case details');
      } finally {
        setIsLoading(false);
      }
    };

    if (caseId) {
      fetchData();
    }

    // Cleanup breadcrumb on unmount
    return () => {
      setCurrentBreadcrumb([]);
    };
  }, [caseId, setCurrentBreadcrumb]);

  // Add separate useEffect for questionnaires
  useEffect(() => {
    const fetchQuestionnaires = async () => {
      try {
        setIsLoadingQuestionnaires(true);
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

    // Fetch questionnaires when component mounts
    fetchQuestionnaires();
  }, []); // Empty dependency array means this runs once when component mounts

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
      // Initialize chat if it doesn't exist
      let messageResponse;
      if (!currentChat) {
        try {
          // First get the case details to get document types
          const caseResponse = await api.get(`/management/${caseId}`);

          if (!(caseResponse.data?.status === 'success') || !caseResponse.data?.data?.entry) {
            throw new Error('Failed to fetch case details');
          }
          
          // Get the management data that we want to send to the AI
          const managementData = caseResponse.data.data.entry;
          
          // Prepare management model data to include in chat context
          const managementContext = {
            caseId: managementData._id,
            categoryName: managementData.categoryName,
            categoryStatus: managementData.categoryStatus,
            deadline: managementData.deadline,
            documentTypes: managementData.documentTypes.map(doc => ({
              name: doc.name,
              status: doc.status,
              required: doc.required
            }))
          };

          let chatResponse;
          
          // Get uploaded and approved document types from the case
          const validDocuments = (caseResponse.data.data.entry.documentTypes || [])
            .filter(docType => docType && (docType.status === 'uploaded' || docType.status === 'approved'))
            .map(docType => ({
              id: docType._id,
              name: docType.name
            }))
            .filter(doc => doc.id);

          // Check if there are valid documents
          if (validDocuments.length === 0) {
            // Create chat with just management data (no documents)
            chatResponse = await api.post('/chat', {
              documentIds: [],
              managementId: caseId,
              managementContext: managementContext
            });
          } else {
            // Extract just the document type IDs
            const validDocTypeIds = validDocuments.map(doc => doc.id);
            
            // Use the new API endpoint with POST instead of GET
            const documentsResponse = await api.post('/documents/management-docs', {
              managementId: caseId,
              docTypeIds: validDocTypeIds
            });

            if (!documentsResponse.data?.data?.documents) {
              throw new Error('No valid documents found');
            }

            const validDocs = documentsResponse.data.data.documents
              .filter(doc => doc && doc._id);
            
            if (validDocs.length === 0) {
              // Create chat with just management data (no documents)
              chatResponse = await api.post('/chat', {
                documentIds: [],
                managementId: caseId,
                managementContext: managementContext
              });
            } else {
              // Extract document IDs for chat creation
              const docIds = validDocs.map(doc => doc._id);
              
              // Create the chat with documents and management data
              chatResponse = await api.post('/chat', {
                documentIds: docIds,
                managementId: caseId,
                managementContext: managementContext
              });
            }
          }
          
          if (!(chatResponse.data?.status === 'success') || !chatResponse.data?.data?.chat) {
            throw new Error(chatResponse.data?.message || 'Failed to create chat');
          }

          const newChat = chatResponse.data.data.chat;
          setCurrentChat(newChat);

          // Send first message using the new chat directly
          messageResponse = await api.post(`/chat/${newChat._id}/messages`, {
            message: chatInput
          });
        } catch (error) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: error.message || "I'm sorry, I encountered an error while setting up the chat. Please ensure you have uploaded and processed documents first."
          }]);
          return; // Exit early on error
        }
      } else {
        // For subsequent messages, use the existing chat from state
        messageResponse = await api.post(`/chat/${currentChat._id}/messages`, {
          message: chatInput
        });
      }

      // Handle the message response
      if (messageResponse?.data?.status === 'success' && messageResponse.data.data.message) {
        setMessages(prev => [...prev, messageResponse.data.data.message]);
      } else {
        throw new Error('Invalid message response');
      }

    } catch (error) {
      console.error('Chat error:', error);
      
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
    setFormData(prevData => {
      // Create a deep copy of the section if it doesn't exist
      const updatedSection = {
        ...(prevData[section] || {})
      };
      
      // Update the specific field
      updatedSection[field] = value;
      
      // Return the new state with the updated section
      return {
        ...prevData,
        [section]: updatedSection
      };
    });
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

  // Add ProfileSkeleton component
  const ProfileSkeleton = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start gap-6">
        {/* Profile header skeleton */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse"></div>
        </div>

        {/* Profile Info Grid skeleton */}
        <div className="flex-grow grid grid-cols-2 gap-x-12 gap-y-2">
          {/* Left Column - Basic Info skeleton */}
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Right Column - Location Info skeleton */}
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Add CaseDetailsSkeleton component
  const CaseDetailsSkeleton = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
      <div className="flex items-start gap-6">
        <div className="flex-grow grid grid-cols-2 gap-x-12 gap-y-2">
          {/* Left Column - Basic Info skeleton */}
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Right Column - Status Info skeleton */}
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

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
                <div className="font-medium">{caseData.caseManagerName || caseData.createdBy?.name || '-'}</div>
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
                <div className="text-sm text-gray-500">Deadline</div>
                <div className="font-medium">
                  {caseData.deadline ? new Date(caseData.deadline).toLocaleDateString() : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - AI Agents */}
        <div className="w-[400px] border-l pl-8">
          <div className="sticky top-5">
            <div className="flex items-center gap-2 mb-4"> {/* Reduced margin bottom */}
              <h3 className="text-lg font-semibold">AI Agents</h3>
              <div className="flex h-6 items-center">
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">3 Active</span>
              </div>
            </div>
            
            {/* Added max height and scroll for agents */}
            <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4 -mr-4"> {/* Added padding and negative margin for scroll */}
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

              {/* Sophia - Support Agent - Updated styling */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-slate-50/80 to-zinc-50/90 rounded-2xl p-5 border border-slate-200/50 shadow-sm">
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-3">
                    {/* Updated avatar container */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-slate-700 to-zinc-800 flex items-center justify-center shadow-md">
                        <span className="text-lg font-semibold text-white">S</span>
                      </div>
                      {/* Online indicator */}
                      <span className="absolute -right-0.5 -bottom-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-700">
                        Sophia
                      </h4>
                      <p className="text-sm text-slate-500">Support Agent</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-sm font-medium text-slate-600">
                        Available for Support
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Updated decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-500/5 to-zinc-500/5 rounded-full transform translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-br from-slate-500/5 to-zinc-500/5 rounded-full transform translate-x-8 translate-y-8"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // const QueriesTab = () => (
  //   <div className="bg-white border border-gray-200 rounded-lg p-6 opacity-70">
  //     <h3 className="text-lg font-semibold mb-6">
  //       Queries <span className="text-sm font-normal text-gray-500 ml-2">Coming Soon</span>
  //     </h3>
  //     <div>Queries Content</div>
  //   </div>
  // );

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
        <div className="space-y-6">
          {uploadStatus === 'pending' ? (
            pendingDocuments.length > 0 ? (
              pendingDocuments.map((doc) => (
                <div key={doc._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border border-dashed border-gray-200">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                          <svg className="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {doc.name}
                          </h4>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Please upload your {doc.name.toLowerCase()}
                          </p>
                        </div>
                      </div>
                      {doc.required && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                          Required
                        </span>
                      )}
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
                <div key={doc._id} className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      {/* Document icon and name */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                          <svg className="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900">
                            {doc.name}
                          </h4>
                        </div>
                      </div>

                      {/* Status tag moved to right corner */}
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
                    
                    {/* Progress bar below the document name */}
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

    const renderSmartUpload = () => {
      // Add this check at the start of renderSmartUpload
      const allDocsUploaded = caseData.documentTypes.every(doc => 
        doc.status === 'uploaded' || doc.status === 'approved'
      );

      return (
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
                    ? 'bg-blue-100 border-2 border-dashed border-blue-300 shadow-inner' 
                    : allDocsUploaded
                      ? 'bg-gray-50 border-2 border-dashed border-gray-200 cursor-not-allowed'
                      : 'bg-blue-50 border-2 border-dashed border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                }`}
                onDragOver={!allDocsUploaded ? handleDragOver : undefined}
                onDragLeave={!allDocsUploaded ? handleDragLeave : undefined}
                onDrop={!allDocsUploaded ? handleDrop : undefined}
              >
                {/* Upload Icon */}
                <div className={`mb-4 p-5 rounded-full ${
                  isDragging ? 'bg-blue-100' : allDocsUploaded ? 'bg-gray-100' : 'bg-blue-50'
                }`}>
                  <svg 
                    className={`w-8 h-8 ${
                      isDragging ? 'text-blue-700' : allDocsUploaded ? 'text-gray-400' : 'text-blue-600'
                    }`} 
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
                  <h3 className={`font-medium ${
                    isDragging ? 'text-blue-900' : allDocsUploaded ? 'text-gray-400' : 'text-blue-800'
                  }`}>
                    {allDocsUploaded 
                      ? 'All documents uploaded' 
                      : isDragging 
                        ? 'Drop files here' 
                        : 'Upload your documents'
                    }
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {allDocsUploaded 
                      ? 'No more documents needed' 
                      : 'Drag & drop files here or use the button below'
                    }
                  </p>
                  
                  <label 
                    htmlFor="smart-file-upload" 
                    className={`inline-flex items-center justify-center px-5 py-2.5 font-medium rounded-lg transition-all duration-200 ${
                      allDocsUploaded
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-sm hover:shadow-md group'
                    }`}
                  >
                    <svg className={`w-4 h-4 mr-2 ${
                      allDocsUploaded ? 'text-gray-400' : 'text-white transition-transform group-hover:scale-110'
                    }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  disabled={allDocsUploaded}
                />
                
                {/* Selected files preview - only show if not all docs uploaded */}
                {!allDocsUploaded && files.length > 0 && (
                  <div className="w-full mt-6 space-y-2">
                    <div className="text-sm font-medium text-gray-700 mb-2">Selected files:</div>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-200">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-md bg-sky-50 flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    };

    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Documents Checklist</h3>
        
        {/* Status Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-1">
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

            {/* Add arrow indicator */}
            <div className="flex items-center px-2 text-gray-400">
              <div className="relative group">
                <ChevronRight className="w-5 h-5" />
                {uploadStatus === 'pending' && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Next Step
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={async () => {
                setUploadStatus('validation');
                setIsValidationLoading(true);
                setIsVerificationLoading(true);

                try {
                  // First fetch documents to ensure we have the latest URLs
                  const documentsResponse = await api.post('/documents/management-docs', {
                    managementId: caseId,
                    docTypeIds: caseData.documentTypes
                      .filter(doc => doc.status === 'uploaded' || doc.status === 'approved')
                      .map(doc => doc._id)
                  });

                  // Create URL mapping first
                  const urlMapping = documentsResponse.data.status === 'success' 
                    ? documentsResponse.data.data.documents.reduce((acc, doc) => {
                        acc[doc.type] = doc.fileUrl;
                        return acc;
                      }, {})
                    : {};

                  // Then fetch validation and cross-verification data
                  const [validationResponse, crossVerifyResponse] = await Promise.all([
                    api.get(`/documents/management/${caseId}/validations`),
                    api.get(`/management/${caseId}/cross-verify`)
                  ]);

                  // Handle cross-verification response
                  if (crossVerifyResponse.data.status === 'success') {
                    setVerificationData({
                      ...crossVerifyResponse.data.data,
                      documentUrls: urlMapping
                    });
                  }

                  // Handle validation response
                  if (validationResponse.data.status === 'success') {
                    setValidationData({
                      ...validationResponse.data.data,
                      documentUrls: urlMapping
                    });
                  }

                  // Update case data to reflect any status changes
                  const caseResponse = await api.get(`/management/${caseId}`);
                  if (caseResponse.data.status === 'success') {
                    setCaseData(caseResponse.data.data.entry);
                  }
                } catch (error) {
                  console.error('Error fetching validation data:', error);
                  toast.error('Failed to load validation data');
                } finally {
                  setIsValidationLoading(false);
                  setIsVerificationLoading(false);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                uploadStatus === 'validation'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Verification Check
            </button>
          </div>
        </div>

        {uploadStatus === 'pending' && (
          <div className="flex gap-6">
            {renderDocumentsList()}
            {renderSmartUpload()}
                </div>
        )}

        {uploadStatus === 'validation' && (
          <div className="w-full"> {/* Change from max-w-5xl mx-auto to w-full */}
            {/* Header with Next Button */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Verification Results</h3>
              <button
                onClick={() => {
                  handleTabClick('Questionnaire');
                  setUploadStatus('uploaded');
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium 
                  hover:bg-blue-700 transition-colors shadow-sm"
              >
                <span>Next: Questionnaire</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Accordions */}
            <div className="space-y-4">
              {/* Cross Verification Accordion */}
              <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
                <CrossVerificationTab
                  isLoading={isVerificationLoading}
                  verificationData={verificationData}
                  managementId={caseId}
                />
              </div>

              {/* Document Verification Accordion */}
              <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
                <ValidationAccordion
                  isLoading={isValidationLoading}
                  validationData={validationData}
                  caseData={caseData}
                />
              </div>
            </div>
          </div>
        )}
            </div>
    );
  };

  // Add this AccordionSkeleton component at the top of the file
  const AccordionSkeleton = ({ title }) => (
    <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Update the ValidationAccordion component's loading state
  const ValidationAccordion = ({ isLoading, validationData, caseData }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (isLoading) {
      return <AccordionSkeleton title="Document Verification Results" />;
    }

    if (!validationData?.mergedValidations?.length) {
      return (
        <div className="flex flex-col items-center justify-center h-32">
          <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-gray-600">No verification data available</p>
        </div>
      );
    }

    return (
      <>
        {/* Accordion Header */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Document Verification Results</h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium
              ${validationData.mergedValidations.every(doc => doc.passed) 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'}`}
            >
              {validationData.mergedValidations.every(doc => doc.passed) 
                ? 'All Valid' 
                : `${validationData.mergedValidations.filter(doc => !doc.passed).length} Issues Found`}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>

        {/* Accordion Content */}
        {isExpanded && (
          <div className="border-t border-gray-100">
            <div className="p-4 space-y-4">
              {validationData.mergedValidations.map((documentValidation, index) => (
                <div key={index} className="bg-gray-50 rounded-lg overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          documentValidation.passed 
                            ? 'bg-green-50 text-green-600' 
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {documentValidation.passed ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <X className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {documentValidation.documentType}
                          </h4>
                          <p className={`text-sm ${
                            documentValidation.passed 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {documentValidation.passed ? 'Passed' : 'Failed'} • {documentValidation.validations.length} Verification{documentValidation.validations.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Use URLs from validationData */}
                      {validationData.documentUrls?.[documentValidation.documentType] && (
                        <a 
                          href={validationData.documentUrls[documentValidation.documentType]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Document
                        </a>
                      )}
                    </div>

                    {/* Keep existing validation details... */}
                    <div className="divide-y divide-gray-100">
                      {documentValidation.validations.map((validation, vIndex) => (
                        <div 
                          key={vIndex}
                          className="flex items-start gap-4 py-4"
                        >
                          <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            validation.passed 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {validation.passed ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-gray-900 mb-1">
                              {validation.rule}
                            </h5>
                            <p className="text-sm text-gray-600">
                              {validation.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  const QuestionnaireTab = () => {
    const [loadingStep, setLoadingStep] = useState(0);
    const [isLoadingQuestionnaire, setIsLoadingQuestionnaire] = useState(false);

    const handleQuestionnaireClick = async (questionnaire) => {
      setIsLoadingQuestionnaire(true);
      setSelectedQuestionnaire(questionnaire);
      setLoadingStep(0);
      
      try {
        // Get the questionnaire response
        const response = await api.get(`/questionnaire-responses/management/${caseId}`, {
          params: {
            templateId: questionnaire._id
          }
        });
        
        if (response.data.status === 'success') {
          setLoadingStep(2);
          // Get the first response
          const questionnaireResponse = response.data.data.responses[0];
          
          // Set questionnaire data
          setQuestionnaireData(response.data.data);
          
          // Map the processed information to form data
          const mappedData = {};
          
          // Process each field mapping
          questionnaire.field_mappings.forEach(field => {
            const sourceDoc = field.sourceDocument;
            const fieldName = field.fieldName;
            
            // Get the processed data for this document type
            const docData = caseData.processedInformation?.[sourceDoc];
            
            if (docData) {
              // Initialize the section if it doesn't exist
              if (!mappedData[sourceDoc]) {
                mappedData[sourceDoc] = {};
              }
              
              // Special handling for educationalQualification object
              if (fieldName === 'educationalQualification' && typeof docData[fieldName] === 'object') {
                // Format educational qualification as a string
                const edu = docData[fieldName];
                mappedData[sourceDoc][fieldName] = `${edu.courseLevel} in ${edu.specialization} from ${edu.institution} (GPA: ${edu.gpa})`;
              } else {
                // Map the field value
                mappedData[sourceDoc][fieldName] = docData[fieldName] || '';
              }
            }
          });
          
          // Set form data with mapped data
          setFormData(mappedData);
          
          // Set saved fields if status is 'saved'
          if (questionnaireResponse.status === 'saved') {
            setSavedFields(questionnaireResponse.processedInformation);
            setQuestionnaireStatus('saved');
          } else {
            setQuestionnaireStatus('pending');
            setSavedFields({ Passport: {}, Resume: {} });
          }
        }
      } catch (error) {
        console.error('Error fetching questionnaire details:', error);
        toast.error('Failed to load questionnaire details');
      } finally {
        setIsLoadingQuestionnaire(false);
        setLoadingStep(0);
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
      if (isLoadingQuestionnaire) {
        return (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <div className="text-gray-600 text-sm">
              <div className="flex items-center space-x-2 transition-all duration-300">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>
                  {loadingStep === 0 && "Loading questionnaire data..."}
                  {loadingStep === 1 && "Mapping form fields..."}
                  {loadingStep === 2 && "Processing responses..."}
                </span>
              </div>
            </div>
          </div>
        );
      }

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
    const [showOnlyEmpty, setShowOnlyEmpty] = useState(false);
    const [localFormData, setLocalFormData] = useState(formData);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
      setLocalFormData(formData);
    }, [formData]);

    const shouldShowField = (section, field) => {
      // If not showing only empty fields, show all fields
      if (!showOnlyEmpty) {
        return true;
      }
      
      // Get the field name from the field object
      const fieldName = field.fieldName;
      
      // Get the value from savedFields instead of localFormData
      const value = savedFields?.[section]?.[fieldName];
      
      // Check if value is empty
      const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
      
      return isEmpty;
    };

    const handleLocalInputChange = (section, field, value) => {
      setLocalFormData(prev => {
        const newData = {
          ...prev,
          [section]: {
            ...(prev[section] || {}),
            [field]: value
          }
        };
        return newData;
      });
    };

    const handleLocalSave = async () => {
      try {
        setIsSaving(true);
        const response = await api.put(`/questionnaire-responses/management/${caseId}`, {
          templateId: questionnaire._id,
          processedInformation: localFormData
        });

        if (response.data.status === 'success') {
          setFormData(localFormData);
          setSavedFields(localFormData);
          setQuestionnaireStatus('saved');
          toast.success('Questionnaire saved successfully');
        }
      } catch (error) {
        console.error('Error saving questionnaire:', error);
        toast.error('Failed to save questionnaire');
      } finally {
        setIsSaving(false);
      }
    };

    const getFilledFieldsCount = () => {
      let totalFields = 0;
      let filledFields = 0;

      // Count Passport fields
      const passportFields = questionnaire.field_mappings.filter(field => field.sourceDocument === 'Passport');
      totalFields += passportFields.length;
      passportFields.forEach(field => {
        if (localFormData?.Passport?.[field.fieldName]) {
          filledFields++;
        }
      });

      // Count Resume fields
      const resumeFields = questionnaire.field_mappings.filter(field => field.sourceDocument === 'Resume');
      resumeFields.forEach(field => {
        if (field.fieldName === 'educationalQualification') {
          totalFields += 1;
          if (localFormData?.Resume?.educationalQualification) {
            filledFields++;
          }
        } else {
          totalFields += 1;
          if (localFormData?.Resume?.[field.fieldName]) {
            filledFields++;
          }
        }
      });

      return { total: totalFields, filled: filledFields };
    };

    const isFieldSaved = (section, field) => {
      return savedFields?.[section]?.[field] === localFormData?.[section]?.[field];
    };

    const { total, filled } = getFilledFieldsCount();
    const progress = total > 0 ? Math.round((filled / total) * 100) : 0;

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Questionnaire</h2>
              <p className="text-sm text-gray-600">{questionnaire.questionnaire_name}</p>
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showEmpty"
                checked={showOnlyEmpty}
                onChange={(e) => setShowOnlyEmpty(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showEmpty" className="text-sm text-gray-600">
                Show only empty fields
              </label>
            </div>
            <div className="text-sm text-gray-600">
              {filled} of {total} fields filled
            </div>
            <button
              onClick={handleLocalSave}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isSaving
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Passport Information</h3>
            <div className="grid grid-cols-3 gap-4">
              {questionnaire.field_mappings
                .filter(field => field.sourceDocument === 'Passport')
                .map(field => (
                  shouldShowField('Passport', field) && (
                    <div key={field._id}>
                      <label className="block text-sm text-gray-600 mb-1 font-semibold">
                        {field.fieldName}
                      </label>
                      <input
                        type="text"
                        value={localFormData?.Passport?.[field.fieldName] || ''}
                        onChange={(e) => handleLocalInputChange('Passport', field.fieldName, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${
                          isFieldSaved('Passport', field.fieldName)
                            ? 'border-gray-200 bg-gray-50'
                            : 'border-blue-200 bg-blue-50'
                        }`}
                      />
                    </div>
                  )
                ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Professional Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {questionnaire.field_mappings
                .filter(field => field.sourceDocument === 'Resume')
                .map(field => {
                  if (field.fieldName === 'educationalQualification') {
                    return shouldShowField('Resume', field) && (
                      <div key={field._id} className="col-span-2">
                        <label className="block text-sm text-gray-600 mb-1 font-semibold">
                          {field.fieldName}
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Institution</label>
                            <input
                              type="text"
                              value={localFormData?.Resume?.educationalQualification?.institution || ''}
                              onChange={(e) => handleLocalInputChange('Resume', 'educationalQualification', {
                                ...localFormData?.Resume?.educationalQualification,
                                institution: e.target.value
                              })}
                              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                                isFieldSaved('Resume', 'educationalQualification')
                                  ? 'border-gray-200 bg-gray-50'
                                  : 'border-blue-200 bg-blue-50'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Course Level</label>
                            <input
                              type="text"
                              value={localFormData?.Resume?.educationalQualification?.courseLevel || ''}
                              onChange={(e) => handleLocalInputChange('Resume', 'educationalQualification', {
                                ...localFormData?.Resume?.educationalQualification,
                                courseLevel: e.target.value
                              })}
                              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                                isFieldSaved('Resume', 'educationalQualification')
                                  ? 'border-gray-200 bg-gray-50'
                                  : 'border-blue-200 bg-blue-50'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Specialization</label>
                            <input
                              type="text"
                              value={localFormData?.Resume?.educationalQualification?.specialization || ''}
                              onChange={(e) => handleLocalInputChange('Resume', 'educationalQualification', {
                                ...localFormData?.Resume?.educationalQualification,
                                specialization: e.target.value
                              })}
                              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                                isFieldSaved('Resume', 'educationalQualification')
                                  ? 'border-gray-200 bg-gray-50'
                                  : 'border-blue-200 bg-blue-50'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">GPA</label>
                            <input
                              type="text"
                              value={localFormData?.Resume?.educationalQualification?.gpa || ''}
                              onChange={(e) => handleLocalInputChange('Resume', 'educationalQualification', {
                                ...localFormData?.Resume?.educationalQualification,
                                gpa: e.target.value
                              })}
                              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                                isFieldSaved('Resume', 'educationalQualification')
                                  ? 'border-gray-200 bg-gray-50'
                                  : 'border-blue-200 bg-blue-50'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return shouldShowField('Resume', field) && (
                    <div key={field._id}>
                      <label className="block text-sm text-gray-600 mb-1 font-semibold">
                        {field.fieldName}
                      </label>
                      <input
                        type="text"
                        value={localFormData?.Resume?.[field.fieldName] || ''}
                        onChange={(e) => handleLocalInputChange('Resume', field.fieldName, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${
                          isFieldSaved('Resume', field.fieldName)
                            ? 'border-gray-200 bg-gray-50'
                            : 'border-blue-200 bg-blue-50'
                        }`}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Show message when no empty fields are found */}
        {showOnlyEmpty && 
         !questionnaire.field_mappings.some(field => 
           shouldShowField(field.sourceDocument, field)
         ) && (
           <div className="text-center py-8 text-gray-500">
             No empty fields found
           </div>
         )}
      </div>
    );
  };

  // Add PropTypes validation
  QuestionnaireDetailView.propTypes = {
    questionnaire: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      questionnaire_name: PropTypes.string.isRequired,
      field_mappings: PropTypes.arrayOf(PropTypes.shape({
        _id: PropTypes.string.isRequired,
        sourceDocument: PropTypes.string.isRequired,
        fieldName: PropTypes.string.isRequired,
        displayName: PropTypes.string.isRequired
      })).isRequired
    }).isRequired,
    onBack: PropTypes.func.isRequired
  };

  // Create a portal for the chat button and popup
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
            {/* Header - Add subtle hover effect on close button */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 via-slate-50/80 to-zinc-50/90 border-b border-slate-200/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-slate-700 to-zinc-800 flex items-center justify-center shadow-sm transition-transform hover:scale-105">
                    <span className="text-sm font-semibold text-white">S</span>
                  </div>
                  {/* Enhanced online indicator */}
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

            {/* Add smooth transition for new messages */}
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
            </div>

            {/* Enhanced input area */}
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

  // Add useEffect to fetch initial questionnaire status
  useEffect(() => {
    const fetchQuestionnaireStatus = async () => {
      try {
        const response = await api.get(`/management/questionnaire-response/${caseId}/status`);
        if (response.data.status === 'success') {
          setQuestionnaireStatus(response.data.data.status);
        }
      } catch (error) {
        console.error('Error fetching questionnaire status:', error);
      }
    };

    if (caseId) {
      fetchQuestionnaireStatus();
    }
  }, [caseId]);

  // Add function to handle cross verification
  const handleCrossVerification = async () => {
    try {
      setIsVerificationLoading(true);
      console.log('Starting cross-verification for case:', caseId);
      
      const response = await api.get(`/management/${caseId}/cross-verify`);
      
      if (response.data.status === 'success') {
        console.log('Cross-verification response:', {
          status: response.data.status,
          data: response.data.data,
          verificationResults: response.data.data.verificationResults,
          mismatchErrors: response.data.data.verificationResults?.mismatchErrors,
          missingErrors: response.data.data.verificationResults?.missingErrors
        });
        
        setVerificationData(response.data.data);
        
        // Update case data to reflect any status changes
        const caseResponse = await api.get(`/management/${caseId}`);
        if (caseResponse.data.status === 'success') {
          console.log('Updated case data:', caseResponse.data.data.entry);
          setCaseData(caseResponse.data.data.entry);
        }
      }
    } catch (error) {
      console.error('Error during cross-verification:', error);
      toast.error('Failed to perform cross-verification');
    } finally {
      setIsVerificationLoading(false);
    }
  };

  // Add function to fetch validation data
  const fetchValidationData = async () => {
    if (isValidationLoading) return;
    
    try {
      setIsValidationLoading(true);
      
      // Fetch both validation data and document URLs in parallel
      const [validationResponse, documentsResponse] = await Promise.all([
        api.get(`/documents/management/${caseId}/validations`),
        api.post('/documents/management-docs', {
          managementId: caseId,
          docTypeIds: caseData.documentTypes
            .filter(doc => doc.status === 'uploaded' || doc.status === 'approved')
            .map(doc => doc._id)
        })
      ]);

      if (validationResponse.data.status === 'success') {
        // Create document URL mapping
        const urlMapping = documentsResponse.data.status === 'success' 
          ? documentsResponse.data.data.documents.reduce((acc, doc) => {
              acc[doc.type] = doc.fileUrl;
              return acc;
            }, {})
          : {};

        // Add URLs to validation data
        const validationDataWithUrls = {
          ...validationResponse.data.data,
          documentUrls: urlMapping
        };

        setValidationData(validationDataWithUrls);
      } else {
        throw new Error('Failed to fetch validation data');
      }
    } catch (error) {
      console.error('Error fetching validation data:', error);
      toast.error('Failed to load validation data');
    } finally {
      setIsValidationLoading(false);
    }
  };

  // Update the tab click handler
  const handleTabClick = (tab) => {
    const newTab = tab.toLowerCase().replace(' ', '-');
    setActiveTab(newTab);
    if (newTab === 'documents-checklist') {
      setUploadStatus('pending');
    }
  };

  // Main component return
  return (
    <>
      {/* Profile and Case Details Section */}
      <div className="p-6 flex gap-6">
        {/* Profile Section */}
        <div className="w-1/2">
          {isLoading ? (
            <ProfileSkeleton />
          ) : (
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
                      <div className="text-sm text-gray-500">Email</div>
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
          )}
        </div>

        {/* Case Details Section */}
        <div className="w-1/2">
          {isLoading ? (
            <CaseDetailsSkeleton />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
              <div className="flex items-start gap-6">
                {/* Case Info Grid */}
                <div className="flex-grow grid grid-cols-2 gap-x-12 gap-y-2">
                  {/* Left Column - Basic Info */}
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm text-gray-500">Case Applicant</div>
                      <div className="font-medium">{caseData.userName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Case Manager</div>
                      <div className="font-medium">{caseData.caseManagerName || caseData.createdBy?.name || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Case Name</div>
                      <div className="font-medium">{caseData.categoryName}</div>
                    </div>
                  </div>

                  {/* Right Column - Status Info */}
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm text-gray-500">Current Status</div>
                      <div className="font-medium">{caseData.categoryStatus}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Created Date</div>
                      <div className="font-medium">{new Date(caseData.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Deadline</div>
                      <div className="font-medium">
                        {caseData.deadline ? new Date(caseData.deadline).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
       {/* Add ProgressSteps at the top */}
       <ProgressSteps 
        caseData={caseData}
        activeTab={activeTab}
        isQuestionnaireCompleted={isQuestionnaireCompleted}
      />


      {/* Tabs Navigation */}
      <div className="px-6 py-4">
        <div className="flex gap-2">
          {['Documents Checklist', 'Questionnaire'].map((tab) => (
            <button
              key={tab}
              className={`px-6 py-3 text-base font-medium rounded-lg transition-colors ${
                activeTab === tab.toLowerCase().replace(' ', '-')
                  ? 'bg-white border border-gray-200 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'documents-checklist' && (
              <div className="bg-white rounded-lg border border-gray-200">
                <DocumentsChecklistTab />
              </div>
            )}
            {activeTab === 'questionnaire' && (
              <div className="bg-white rounded-lg border border-gray-200">
                <QuestionnaireTab />
              </div>
            )}
          </>
        )}
      </div>

      {/* Render chat portal to document.body */}
      {renderChatPortal()}
    </>
  );
};

export default FNCaseDetails;
