import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Check, 
  Search, 
  SlidersHorizontal, 
  MoreVertical, 
  Loader2,
  ChevronRight, 
  Building2,
  Users,
  User,
  FileText,
  ClipboardList,
  Phone,
  Mail,
  Globe,
  MapPin,
  Upload,
  File,
  X,
  AlertCircle,
  Filter,
  ChevronLeft,
  Download,
  Bot,
  SendHorizontal,
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import CaseDetailsSidebar from '../components/cases/CaseDetailsSidebar';
import { PDFDocument } from 'pdf-lib';
import ReactDOM from 'react-dom';
import CrossVerificationTab from '../components/cases/CrossVerificationTab';
import ValidationTab from '../components/cases/ValidationTab';
import ExtractedDataTab from '../components/cases/ExtractedDataTab';
import FinalizeTab from '../components/cases/FinalizeTab';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';


// Add a new status type to track document states
const DOCUMENT_STATUS = {
  PENDING: 'pending',
  UPLOADED: 'uploaded',
  APPROVED: 'approved'
};

const processingSteps = [
  { id: 1, text: "Analyzing document" },
  { id: 2, text: "Extracting information" },
  { id: 3, text: "Validating content" },
  { id: 4, text: "Verifying document" }
];

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

const checkAllDocumentsApproved = (documentTypes) => {
  return documentTypes.every(doc => doc.status === DOCUMENT_STATUS.APPROVED);
};

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

const CaseDetails = ({ caseId: propsCaseId, onBack }) => {
  // Get caseId from either props or URL params
  const { caseId: paramsCaseId } = useParams();
  const caseId = propsCaseId || paramsCaseId;
  const { setCurrentBreadcrumb } = useBreadcrumb();

  const [activeTab, setActiveTab] = useState('document-checklist');
  const [caseData, setCaseData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocumentTab, setSelectedDocumentTab] = useState('pending');
  const [uploadStatus, setUploadStatus] = useState(DOCUMENT_STATUS.PENDING);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null);
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [isLoadingQuestionnaire, setIsLoadingQuestionnaire] = useState(false);
  const [formData, setFormData] = useState({
    Passport: {},
    Resume: {
      educationalQualification: [] // Initialize as empty array
    }
  });
  const [forms, setForms] = useState([]);
  const [isSavingQuestionnaire, setIsSavingQuestionnaire] = useState(false);
  const [loadingFormId, setLoadingFormId] = useState(null);
  const [error, setError] = useState(null);
  const [isQuestionnaireCompleted, setIsQuestionnaireCompleted] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);

  // Add a new state to track processing state for each document
  const [processingDocuments, setProcessingDocuments] = useState({});

  // Add new state variables for chat functionality
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hello! I'm Sophia from support. I'm here to assist you with your case and answer any questions you might have. How can I help you today?"
  }]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [showChatPopup, setShowChatPopup] = useState(false);

  const [verificationData, setVerificationData] = useState(null);
  const [isLoadingVerification, setIsLoadingVerification] = useState(false);
  const [selectedSubTab, setSelectedSubTab] = useState('all');

  // Add these to the existing state declarations in CaseDetails component
  const [validationData, setValidationData] = useState(null);
  const [isLoadingValidation, setIsLoadingValidation] = useState(false);

  // Add inputRef with other refs near the top of the component
  const inputRef = useRef(null);

  // Add these state variables in CaseDetails component near other state declarations
  const [extractedData, setExtractedData] = useState(null);
  const [isLoadingExtractedData, setIsLoadingExtractedData] = useState(false);
  const [extractedDataError, setExtractedDataError] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');

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

  const handleDocumentApprove = async (documentTypeId, managementDocumentId) => {
    try {
      // Update processing state for this specific document
      setProcessingDocuments(prev => ({
        ...prev,
        [managementDocumentId]: true
      }));
      
      await api.patch(`/management/${caseId}/documents/${documentTypeId}/status`, {
        status: DOCUMENT_STATUS.APPROVED,
        documentTypeId: documentTypeId,
        managementDocumentId: managementDocumentId
      });

      // Refresh case data
      const response = await api.get(`/management/${caseId}`);
      if (response.data.status === 'success') {
        setCaseData(response.data.data.entry);
        
        // Check if all documents are approved
        const allApproved = response.data.data.entry.documentTypes.every(
          doc => doc.status === DOCUMENT_STATUS.APPROVED
        );

        if (allApproved) {
          // Show success message
          toast.success('All documents have been approved');
          // Navigate to questionnaire tab
          setActiveTab('questionnaire');
        }
      }
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Failed to approve document');
    } finally {
      // Clear processing state for this document
      setProcessingDocuments(prev => ({
        ...prev,
        [managementDocumentId]: false
      }));
    }
  };

  const handleRequestReupload = async (documentTypeId, managementDocumentId) => {
    try {
      setProcessingDocuments(prev => ({
        ...prev,
        [managementDocumentId]: true
      }));
      
      await api.patch(`/management/${caseId}/documents/${documentTypeId}/status`, {
        status: DOCUMENT_STATUS.PENDING,
        documentTypeId: documentTypeId,
        managementDocumentId: managementDocumentId
      });

      // Refresh case data
      const response = await api.get(`/management/${caseId}`);
      if (response.data.status === 'success') {
        setCaseData(response.data.data.entry);
        toast.success('Document sent for reupload');
      }
    } catch (error) {
      console.error('Error requesting reupload:', error);
      toast.error('Failed to request reupload');
    } finally {
      setProcessingDocuments(prev => ({
        ...prev,
        [managementDocumentId]: false
      }));
    }
  };

  const handleFileUpload = async (files) => {
    if (!files.length) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    const uploadedDocIds = [];
    let successfulUploads = 0;
    let failedUploads = 0;

    try {
      setProcessingStep(0); // Start with analyzing
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
          const response = await api.post('/documents', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              setUploadProgress(Math.round(progress));
            }
          });

          if (response.data?.status === 'success') {
            const uploadedDoc = response.data.data.document;
            uploadedDocIds.push(uploadedDoc._id);
            return uploadedDoc;
          }
          return null;
        } catch (err) {
          console.error(`Error uploading ${file.name}:`, err);
          console.error('Error response:', err.response?.data);
          toast.error(`Failed to upload ${file.name}`);
          return null;
        }
      });

      const uploadedDocs = (await Promise.all(uploadPromises)).filter(Boolean);
      
      // Process and verify documents
      const processResults = await Promise.all(
        uploadedDocs.map(async (doc) => {
          try {
            setProcessingStep(1); // Extracting information
            const processedDoc = await checkDocumentProcessing(doc._id);
            if (!processedDoc) {
              failedUploads++;
              await api.delete(`/documents/${doc._id}`);
              return { success: false };
            }

            setProcessingStep(2); // Validating content
            if (processedDoc.extractedData?.document_type) {
              setProcessingStep(3); // Verifying document type
              const extractedType = processedDoc.extractedData.document_type.toLowerCase().trim();
              
              const matchingDocType = caseData.documentTypes.find(type => {
                return type.name.toLowerCase().trim() === extractedType && 
                       type.status !== 'uploaded' &&
                       type.status !== 'approved';
              });

              if (matchingDocType) {
                await api.patch(`/documents/${doc._id}`, {
                  documentTypeId: matchingDocType.documentTypeId,
                  managementDocumentId: matchingDocType._id
                });

                await api.patch(`/management/${caseId}/documents/${matchingDocType.documentTypeId}/status`, {
                  status: 'uploaded'
                });

                successfulUploads++;
                return { success: true };
              }
            }
            
            failedUploads++;
            await api.delete(`/documents/${doc._id}`);
            return { success: false };
            
          } catch (err) {
            console.error(`Error processing document ${doc._id}:`, err);
            failedUploads++;
            return { success: false };
          }
        })
      );

      // If any documents were uploaded successfully, process questionnaires
      if (successfulUploads > 0) {
        try {
          // Create a promise that resolves after showing all loading steps
          const showLoadingSteps = new Promise((resolve) => {
            let currentStep = 0;
            const stepInterval = 2000; // 2 seconds per step

            const interval = setInterval(() => {
              if (currentStep >= 5) {
                clearInterval(interval);
                resolve();
              } else {
                currentStep++;
                setLoadingStep(currentStep);
              }
            }, stepInterval);
          });

          // Wait for loading steps to complete and make API calls
          await showLoadingSteps;

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
            // Show the final "Almost done..." message for 1 second
            setLoadingStep(5);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            toast.success('All questionnaires processed successfully');
            // Change this line to set the finalize tab instead of questionnaire
            setSelectedSubTab('validation');
          }
        } catch (error) {
          console.error('Error processing questionnaires:', error);
          toast.error('Failed to process questionnaires');
        }
      }

      // Show error toast if any documents failed
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

      // Refresh case data
      const response = await api.get(`/management/${caseId}`);
      if (response.data.status === 'success') {
        setCaseData(response.data.data.entry);
      }

      // Reset chat after successful upload
      if (successfulUploads > 0) {
        // Reset chat states
        setCurrentChat(null);
        setMessages([{
          role: 'assistant',
          content: "Hello! I'm Sophia from support. I'm here to assist you with your case and answer any questions you might have. How can I help you today?"
        }]);
        
        // Initialize chat automatically
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

      setFiles([]);

      // If any documents were uploaded successfully, refresh validation data
      if (successfulUploads > 0) {
        await fetchValidationData();
        await fetchExtractedData();
      }
    } catch (err) {
      console.error('Error in file upload process:', err);
      toast.error('Error processing documents');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setProcessingStep(0);
    }
  };

  // Add this function near the top of the component
  const fetchValidationData = async () => {
    try {
      setIsLoadingValidation(true);
      const response = await api.get(`/documents/management/${caseId}/validations`);
      if (response.data.status === 'success') {
        setValidationData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching validation data:', error);
      toast.error('Failed to load validation data');
    } finally {
      setIsLoadingValidation(false);
    }
  };

  // Add this function with other data fetching functions in useEffect
  const fetchExtractedData = async () => {
    try {
      setIsLoadingExtractedData(true);
      const response = await api.get(`/documents/management/${caseId}/extracted-data`);
      if (response.data.status === 'success') {
        setExtractedData(response.data.data.extractedData);
      }
    } catch (error) {
      console.error('Error fetching extracted data:', error);
      setExtractedDataError('Failed to load extracted data');
      toast.error('Failed to load extracted data');
    } finally {
      setIsLoadingExtractedData(false);
    }
  };

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/management/${caseId}`);
        if (response.data.status === 'success') {
          const caseData = response.data.data.entry;
          console.log('Case data:', caseData);
          setCaseData(caseData);
          
          // Set breadcrumb with process name
          setCurrentBreadcrumb([
            { name: 'Home', path: '/dashboard' },
            { name: 'Cases', path: '/cases' },
            { name: caseData.categoryName || `Case ${caseId.substring(0, 6)}`, path: `/cases/${caseId}` }
          ]);
        }
      } catch (error) {
        console.error('Error fetching case details:', error);
        setError('Failed to load case details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseDetails();

    // Cleanup
    return () => {
      setCurrentBreadcrumb([]);
    };
  }, [caseId, setCurrentBreadcrumb]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.status === 'success') {
          setProfileData(response.data.data.user);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
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
        setIsLoading(false);
      }
    };

    const fetchForms = async () => {
      try {
        const response = await api.get('/forms');
        if (response.data.status === 'success') {
          setForms(response.data.data.forms);
        }
      } catch (error) {
        console.error('Error fetching forms:', error);
        toast.error('Failed to load forms');
      }
    };

    fetchProfileData();
    fetchQuestionnaires();
    fetchForms();
  }, [caseId]); // Note: fetchValidationData is stable since it uses caseId from closure

  useEffect(() => {
    if (questionnaireData?.responses?.[0]?.processedInformation) {
      setFormData(questionnaireData.responses[0].processedInformation);
    }
  }, [questionnaireData]);

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
      setIsSavingQuestionnaire(true);
      const response = await api.put(`/questionnaire-responses/management/${caseId}`, {
        templateId: selectedQuestionnaire._id,
        processedInformation: formData
      });

      if (response.data.status === 'success') {
        toast.success('Changes saved successfully');
        setIsQuestionnaireCompleted(true);
        setActiveTab('forms');
      }
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSavingQuestionnaire(false);
    }
  };

  const getLoadingMessage = () => {
    const messages = [
      "Analyzing docs...",
      "Setting up fields...",
      "Collecting data...",
      "Mapping data...",
      "Filling questionnaire...",
      "Almost done..."
    ];
    return messages[loadingStep];
  };

  const handleSaveQuestionnaires = async () => {
    try {
      setIsSavingQuestionnaire(true);
      setLoadingStep(0);

      // Create a promise that resolves after showing all loading steps
      const showLoadingSteps = new Promise((resolve) => {
        let currentStep = 0;
        const stepInterval = 2000; // 2 seconds per step

        const interval = setInterval(() => {
          if (currentStep >= 5) {
            clearInterval(interval);
            resolve();
          } else {
            currentStep++;
            setLoadingStep(currentStep);
          }
        }, stepInterval);
      });

      // Wait for loading steps to complete and make API calls
      await showLoadingSteps;

      // Make API calls for each questionnaire
      const responses = await Promise.all(
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
      const hasErrors = responses.some(response => response.error);
      if (hasErrors) {
        toast.error('Some questionnaires could not be processed');
      } else {
        // Show the final "Almost done..." message for 1 second
        setLoadingStep(5);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success('All questionnaires processed successfully');
        setActiveTab('questionnaire');
      }
    } catch (error) {
      console.error('Error saving questionnaires:', error);
      toast.error('Failed to process questionnaires');
    } finally {
      setIsSavingQuestionnaire(false);
      setLoadingStep(0);
    }
  };

  useEffect(() => {
    let timeouts = [];
    
    if (isLoadingQuestionnaire) {
      // Reset loading step when loading starts
      setLoadingStep(0);
      
      // Schedule the loading states with 1 second intervals
      timeouts.push(setTimeout(() => setLoadingStep(1), 1000));
      timeouts.push(setTimeout(() => setLoadingStep(2), 2000));
      
      // After 3 seconds, restart the sequence if still loading
      timeouts.push(setTimeout(() => {
        const startNewSequence = () => {
          setLoadingStep(0);
          timeouts.push(setTimeout(() => setLoadingStep(1), 1000));
          timeouts.push(setTimeout(() => setLoadingStep(2), 2000));
          timeouts.push(setTimeout(startNewSequence, 3000));
        };
        startNewSequence();
      }, 3000));
    } else {
      // Reset loading step when loading is complete
      setLoadingStep(0);
    }

    // Cleanup timeouts on unmount or when loading state changes
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isLoadingQuestionnaire]);

  // Update the handleSendMessage function
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
        console.log('Current case ID:', caseId);
        
        try {
          // First get the case details to get document types
          const caseResponse = await api.get(`/management/${caseId}`);
          console.log('Case response:', caseResponse.data);

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

          console.log('Valid documents:', validDocuments);
          
          // Check if there are valid documents
          if (validDocuments.length === 0) {
            console.log('No valid documents found. Creating chat with management data only.');
            
            // Create chat with just management data (no documents)
            chatResponse = await api.post('/chat', {
              documentIds: [],
              managementId: caseId,
              managementContext: managementContext
            });
          } else {
            // Extract just the document type IDs
            const validDocTypeIds = validDocuments.map(doc => doc.id);
            console.log('Valid document type IDs:', validDocTypeIds);
            
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

            console.log(`Found ${validDocs.length} valid documents for chat:`, validDocs);
            
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
              console.log('Using these document IDs for chat:', docIds);
              
              // Create the chat with documents and management data
              chatResponse = await api.post('/chat', {
                documentIds: docIds,
                managementId: caseId,
                managementContext: managementContext
              });
            }
          }
          
          console.log('Chat response:', chatResponse);
          
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
          console.error('Error initializing chat:', error);
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
        console.log('Message response:', messageResponse.data);
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

  // Add useEffect for scrolling chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // First, add a function to check if all documents are uploaded
  const areAllDocumentsUploaded = () => {
    if (!caseData?.documentTypes) return false;
    return caseData.documentTypes.every(doc => 
      doc.status === DOCUMENT_STATUS.UPLOADED || doc.status === DOCUMENT_STATUS.APPROVED
    );
  };

  // Add useEffect to monitor document upload status and trigger cross verification
  useEffect(() => {
    const loadCrossVerificationData = async () => {
      if (areAllDocumentsUploaded() && !verificationData && !isLoadingVerification) {
        try {
          setIsLoadingVerification(true);
          const response = await api.get(`/management/${caseId}/cross-verify`);
          if (response.data.status === 'success') {
            setVerificationData(response.data.data);
          }
        } catch (error) {
          console.error('Error fetching verification data:', error);
          toast.error('Failed to load verification data');
        } finally {
          setIsLoadingVerification(false);
        }
      }
    };

    loadCrossVerificationData();
  }, [caseData]); // Add caseData as dependency to monitor document status changes

  // Update the ProgressSteps component
  const ProgressSteps = () => {
    // Add null checks when accessing documentTypes
    const allDocumentsApproved = caseData?.documentTypes ? 
      checkAllDocumentsApproved(caseData.documentTypes) : 
      false;
    
    // Check if preparation is complete (questionnaire completed and in forms tab)
    const isPreparationComplete = activeTab === 'forms' && isQuestionnaireCompleted;

    // Get case status from caseData
    const caseStatus = caseData?.categoryStatus?.toLowerCase() || 'pending';

    // Define steps with dynamic completion status based on case status
    const steps = [
      { 
        name: 'Case Started', 
        completed: true 
      },
      { 
        name: 'Data Collection', 
        completed: ['reviewed', 'completed'].includes(caseStatus) || allDocumentsApproved 
      },
      { 
        name: 'Review', 
        completed: ['reviewed', 'completed'].includes(caseStatus) // Changed to include 'completed' status
      },
      { 
        name: 'Preparation', 
        completed: caseStatus === 'completed'
      }
    ];

    return (
      <div className="flex items-center justify-center w-full py-8 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between max-w-5xl w-full px-8 relative">
          {/* Rest of the component remains the same */}
          <div className="absolute top-[20px] left-0 h-[3px] bg-gradient-to-r from-blue-600/20 to-blue-600/20 w-full">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700"
              style={{
                width: `${Math.min((steps.filter(step => step.completed).length / steps.length) * 100, 100)}%`,
                transition: 'width 1s ease-in-out'
              }}
            />
          </div>

          {steps.map((step, index) => (
            <div key={step.name} className="flex items-center">
              <div className="flex flex-col items-center relative">
                {/* Pulse Animation for Current Step */}
                {index === steps.findIndex(s => !s.completed) && (
                  <div className="absolute z-0 w-[44px] h-[44px] top-5 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    {/* Multiple layers of pulse for enhanced effect */}
                    <div className="absolute inset-0 rounded-full opacity-20 animate-step-ping-slow bg-blue-400/50" />
                    <div className="absolute inset-0 rounded-full opacity-30 animate-step-ping bg-blue-500/50" />
                    <div className="absolute inset-0 rounded-full opacity-40 animate-step-pulse-fast bg-blue-600/50" />
                    <div className="absolute inset-0 rounded-full animate-step-pulse bg-blue-700/30 blur-[1px]" />
                  </div>
                )}

                {/* Circle */}
                <div 
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center 
                    transition-all duration-500 relative z-10
                    transform hover:scale-110
                    ${step.completed 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100' 
                      : index === steps.findIndex(s => !s.completed)
                        ? 'bg-white border-2 border-blue-600 text-blue-600 shadow-md'
                        : 'bg-gray-100 text-gray-400'
                    }
                  `}
                >
                  {step.completed ? (
                    <Check className="w-5 h-5 animate-fadeIn" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span 
                  className={`
                    mt-4 text-sm font-medium whitespace-nowrap
                    transition-all duration-300
                    ${step.completed 
                      ? 'text-blue-700' 
                      : index === steps.findIndex(s => !s.completed)
                        ? 'text-blue-600 font-semibold scale-105'
                        : 'text-gray-400'
                    }
                  `}
                >
                  {step.name}
                </span>

                {/* Status Indicator */}
                <span 
                  className={`
                    mt-1 text-xs
                    transition-all duration-300
                    ${step.completed 
                      ? 'text-green-600' 
                      : index === steps.findIndex(s => !s.completed)
                        ? 'text-blue-500'
                        : 'text-gray-400'
                    }
                  `}
                >
                  {step.completed 
                    ? 'Completed' 
                    : index === steps.findIndex(s => !s.completed)
                      ? 'In Progress'
                      : 'Pending'
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Enhanced tab navigation
  const TabNavigation = () => (
    <div className="border-b border-gray-200 px-6">
      <div className="flex -mb-px">
        {[
          { name: 'Profile', icon: User },
          { name: 'Document Checklist', icon: ClipboardList },
          { name: 'Questionnaire', icon: FileText },
          { name: 'Forms', icon: File },
          { name: 'Queries', icon: AlertCircle, disabled: true }
        ].map(({ name, icon: Icon, disabled }) => (
          <button
            key={name}
            disabled={disabled}
            className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === name.toLowerCase().replace(' ', '-')
                ? 'border-blue-600 text-blue-600'
                : disabled
                ? 'border-transparent text-gray-400 cursor-not-allowed'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
            }`}
            onClick={() => !disabled && setActiveTab(name.toLowerCase().replace(' ', '-'))}
          >
            <Icon className={`w-4 h-4 mr-2 ${disabled ? 'opacity-50' : ''}`} />
            {name}
          </button>
        ))}
      </div>
    </div>
  );

  // Enhanced document checklist
  const DocumentsChecklistTab = () => {
    const pendingDocuments = caseData.documentTypes.filter(doc => doc.status === DOCUMENT_STATUS.PENDING);
    const uploadedDocuments = caseData.documentTypes.filter(
      doc => doc.status === DOCUMENT_STATUS.UPLOADED || doc.status === DOCUMENT_STATUS.APPROVED
    );

    const formatDate = (dateString) => {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return ''; // Return empty string for invalid dates
        
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch (error) {
        return '';
      }
    };

    const renderDocumentsList = () => (
      <div className={`${
        // Take 8 columns (about 66%) of the width
        'col-span-8'
      } bg-white rounded-lg border border-gray-200 p-6`}>
        <div className="flex gap-2 mb-6 border-b border-gray-100 pb-4">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700`}
          >
            Documents ({pendingDocuments.length})
          </button>
        </div>

        <div className="space-y-3">
          {pendingDocuments.length > 0 ? (
            pendingDocuments.map((doc) => (
              <div key={doc._id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="flex justify-between items-start group">
                  <div>
                    <h4 className="font-medium text-sm mb-1">
                      {doc.name}
                      {doc.required && (
                        <span className="ml-2 text-xs text-red-500">*Required</span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-500 leading-snug">
                      Please upload your {doc.name.toLowerCase()} document
                    </p>
                  </div>
                  <button className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              All documents have been uploaded.
            </div>
          )}
        </div>
      </div>
    );

    const renderSmartUpload = () => (
      uploadStatus === DOCUMENT_STATUS.PENDING && (
        <div className="col-span-4 bg-white rounded-lg border border-gray-200 p-6 relative">
          {isUploading && <ProcessingIndicator currentStep={processingStep} />}
          
          <div className="mb-4 pb-4 border-b border-gray-100">
            <h4 className="font-medium text-sm">Smart Upload Files</h4>
          </div>
          
          <div 
            className={`flex flex-col items-center justify-center py-8 rounded-lg transition-colors
              ${isDragging 
                ? 'bg-blue-50 border-2 border-dashed border-blue-300' 
                : 'bg-gray-50 border border-gray-200'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              className="hidden"
              id="file-upload"
              onChange={handleFileSelect}
            />
            
            {files.length > 0 ? (
              <div className="w-full px-6">
                <div className="mb-4 text-center">
                  <span className="text-sm text-gray-500">{files.length} file(s) selected</span>
                </div>
                <div className="space-y-2 mb-6 max-h-40 overflow-y-auto">
                  {files.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between bg-white border border-gray-200 p-2 rounded-lg"
                    >
                      <div className="flex items-center">
                        <File className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm truncate max-w-xs">{file.name}</span>
                      </div>
                      <button 
                        onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <label 
                    htmlFor="file-upload"
                    className="bg-white border border-gray-200 text-gray-700 py-2.5 px-6 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors text-center"
                  >
                    Browse More Files
                  </label>
                  <button 
                    onClick={() => handleFileUpload(files)}
                    disabled={isUploading}
                    className={`bg-blue-600 text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2
                      ${isUploading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  {isDragging ? 'Drop files here' : 'Drag and drop files here'}
                </p>
                <p className="text-sm text-gray-400 mb-6">or</p>
                <label 
                  htmlFor="file-upload"
                  className="bg-blue-600 text-white py-2.5 px-6 rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  Browse Files
                </label>
              </>
            )}
          </div>
        </div>
      )
    );


    // Sub-tabs navigation component
    const SubTabNavigation = () => {
      // Keep both checks
      const hasUploadedDocuments = caseData.documentTypes.some(doc => 
        doc.status === DOCUMENT_STATUS.UPLOADED || doc.status === DOCUMENT_STATUS.APPROVED
      );
      
      const allDocsUploaded = caseData.documentTypes.every(doc => 
        doc.status === DOCUMENT_STATUS.UPLOADED || doc.status === DOCUMENT_STATUS.APPROVED
      );

      return (
        <div className="mb-6 flex items-center gap-2">
          {[
            { id: 'all', label: 'Upload Pending' },  
            // { id: 'extracted-data', label: 'Extracted data' },
            { id: 'validation', label: 'Validation' },
            { 
              id: 'cross-verification', 
              label: 'Cross Verification',
              disabled: !allDocsUploaded, // Use allDocsUploaded for cross-verification
              tooltip: 'All documents must be uploaded to enable cross verification'
            },
            { 
              id: 'finalize', 
              label: 'Finalize',
              disabled: !hasUploadedDocuments, // Keep finalize enabled with at least one doc
              tooltip: 'Upload at least one document to enable this feature'
            }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (!tab.disabled) {
                  setSelectedSubTab(tab.id);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSubTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : tab.disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              disabled={tab.disabled}
              title={tab.disabled ? tab.tooltip : ''}
            >
              {tab.label}
            </button>
          ))}
        </div>
      );
    };

    // Render content based on selected sub-tab
    const renderSubTabContent = () => {
      const hasUploadedDocuments = caseData.documentTypes.some(doc => 
        doc.status === DOCUMENT_STATUS.UPLOADED || doc.status === DOCUMENT_STATUS.APPROVED
      );
      
      const allDocsUploaded = caseData.documentTypes.every(doc => 
        doc.status === DOCUMENT_STATUS.UPLOADED || doc.status === DOCUMENT_STATUS.APPROVED
      );

      switch (selectedSubTab) {
        case 'all':
          return (
            <div className="grid grid-cols-12 gap-6">
              {renderDocumentsList()}
              {renderSmartUpload()}
            </div>
          );
        case 'extracted-data':
          return <ExtractedDataTab 
            extractedData={extractedData}
            isLoading={isLoadingExtractedData}
            error={extractedDataError}
          />;
        case 'validation':
          return (
            <ValidationTab 
              validationData={validationData} 
              isLoading={isLoading}
              onTabChange={(tab) => setSelectedSubTab(tab)}
            />
          );
        case 'cross-verification':
          return (
            <CrossVerificationTab 
              verificationData={verificationData}
              isLoading={isLoadingVerification}
              managementId={caseId}
              recipientEmail={recipientEmail}
              onNextClick={handleNextClick}
            />
          );
        case 'finalize':
          return (
            <FinalizeTab 
              documents={caseData.documentTypes
                .filter(doc => doc.status === DOCUMENT_STATUS.UPLOADED || doc.status === DOCUMENT_STATUS.APPROVED)
                .map(doc => {
                  const hasVerificationData = verificationData && Object.keys(verificationData).length > 0;
                  
                  const getValidationStatus = () => {
                    if (!validationData?.mergedValidations) return 'pending';
                    
                    // Find validation for current document
                    const docValidation = validationData.mergedValidations.find(
                      v => v.documentType === doc.name
                    );
                    
                    if (!docValidation) return 'pending';

                    // Check individual validations for this document
                    if (docValidation.validations && docValidation.validations.length > 0) {
                      const totalValidations = docValidation.validations.length;
                      const passedValidations = docValidation.validations.filter(v => v.passed).length;

                      if (passedValidations === totalValidations) {
                        // All validations passed
                        return 'success';
                      } else if (passedValidations > 0) {
                        // Some validations passed
                        return 'partial';
                      } else {
                        // No validations passed
                        return 'error';
                      }
                    }

                    return 'pending';
                  };

                  return {
                    id: doc._id,
                    name: doc.name,
                    status: doc.status === 'approved' ? 'Approved' : 'Verification pending',
                    documentTypeId: doc.documentTypeId,
                    updatedAt: doc.updatedAt,
                    states: [
                      {
                        name: 'Document collection',
                        status: doc.status !== 'pending' ? 'success' : 'error'
                      },
                      {
                        name: 'Read',
                        status: doc.status !== 'pending' ? 'success' : 'pending'
                      },
                      {
                        name: 'Extract',
                        status: extractedData?.[doc.name] ? 'success' : 'pending'
                      },
                      {
                        name: 'Validation',
                        status: getValidationStatus()
                      },
                      {
                        name: 'Cross Verification',
                        status: !hasVerificationData ? 'pending' :
                               verificationData?.[doc.name]?.isVerified ? 'success' : 
                               verificationData?.[doc.name]?.partiallyVerified ? 'partial' : 'error'
                      }
                    ]
                  };
                })
              }
              validationData={validationData}
              onStateClick={(state, document) => {
                // Handle state clicks to navigate to appropriate tabs
                switch(state) {
                  case 'validation':
                    setSelectedSubTab('validation');
                    break;
                  case 'cross-verification':
                    setSelectedSubTab('cross-verification');
                    break;
                  case 'extracted-data':
                    setSelectedSubTab('extracted-data');
                    break;
                  default:
                    break;
                }
              }}
              onApprove={handleDocumentApprove}
              onRequestReupload={handleRequestReupload}
              processingDocuments={processingDocuments}
            />
          );
        default:
          return null;
      }
    };

    return (
      <div className="p-6">
        {/* Search and Filter Section */}
        {/* <div className="mb-6 flex items-center justify-between">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              All Filters
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              Sort
            </button>
          </div>
        </div> */}

        {/* Sub-tabs Navigation */}
        <SubTabNavigation />

        {/* Sub-tab Content */}
        {renderSubTabContent()}
      </div>
    );
  };

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

  // Update the QuestionnaireDetailView component
  const QuestionnaireDetailView = ({ questionnaire, onBack }) => {
    // Add function to count filled fields
    const getFilledFieldsCount = () => {
      let totalFields = 0;
      let filledFields = 0;

      // Count Passport fields
      const passportFields = questionnaire.field_mappings.filter(field => field.sourceDocument === 'Passport');
      totalFields += passportFields.length;
      passportFields.forEach(field => {
        if (formData?.Passport?.[field.fieldName]) {
          filledFields++;
        }
      });

      // Count Resume fields
      const resumeFields = questionnaire.field_mappings.filter(field => field.sourceDocument === 'Resume');
      resumeFields.forEach(field => {
        if (field.fieldName === 'educationalQualification') {
          // Count educational qualification as one field
          totalFields += 1;
          if (formData?.Resume?.educationalQualification?.length > 0) {
            filledFields++;
          }
        } else {
          totalFields += 1;
          if (formData?.Resume?.[field.fieldName]) {
            filledFields++;
          }
        }
      });

      return { filledFields, totalFields };
    };

    const { filledFields, totalFields } = getFilledFieldsCount();

    return (
      <div className="p-6">
        {/* Header with Back Button */}
        <div className="mb-6 flex justify-between">
          <div className="flex items-center gap-8">
            <button 
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-8">
                <h2 className="text-lg font-medium text-gray-900">Questionnaire</h2>
                {/* Add field count indicator */}
               
              </div>
              <p className="text-sm text-gray-600">{questionnaire.questionnaire_name}</p>
            </div>
          </div>
          <div className='flex items-center gap-14'>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                {filledFields} out of {totalFields} fields completed
              </div>
              {/* Progress bar with animated dots */}
              <div className="relative w-32">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${(filledFields / totalFields) * 100}%` }}
                  />
                </div>
                {/* Animated dots for remaining fields */}
                {filledFields < totalFields && (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-end pr-2">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-gray-400/50 animate-pulse" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 rounded-full bg-gray-400/50 animate-pulse" style={{ animationDelay: '200ms' }} />
                      <div className="w-1 h-1 rounded-full bg-gray-400/50 animate-pulse" style={{ animationDelay: '400ms' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSavingQuestionnaire}
              className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSavingQuestionnaire ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
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
                      value={formData?.Passport?.[field.fieldName] || ''}
                      onChange={(e) => handleInputChange('Passport', field.fieldName, e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Resume Information Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Professional Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {questionnaire.field_mappings
                .filter(field => field.sourceDocument === 'Resume')
                .map(field => {
                  // Special handling for educational qualifications
                  if (field.fieldName === 'educationalQualification') {
                    // Convert to array if it's an object or string
                    const educationData = Array.isArray(formData?.Resume?.educationalQualification)
                      ? formData.Resume.educationalQualification
                      : typeof formData?.Resume?.educationalQualification === 'string'
                        ? [{ degree: formData.Resume.educationalQualification }]
                        : formData?.Resume?.educationalQualification
                          ? [formData.Resume.educationalQualification]
                          : [];

                    return (
                      <div key={field._id} className="col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">
                          {field.fieldName}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="space-y-2">
                          {educationData.map((edu, index) => (
                            <div key={index} className="grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={typeof edu === 'string' ? edu : edu.degree || ''}
                                placeholder="Degree"
                                onChange={(e) => {
                                  const newEdu = [...educationData];
                                  newEdu[index] = typeof edu === 'string' 
                                    ? e.target.value
                                    : { ...newEdu[index], degree: e.target.value };
                                  handleInputChange('Resume', 'educationalQualification', newEdu);
                                }}
                                className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm"
                              />
                              <input
                                type="text"
                                value={typeof edu === 'string' ? '' : edu.institution || ''}
                                placeholder="Institution"
                                onChange={(e) => {
                                  const newEdu = [...educationData];
                                  newEdu[index] = { 
                                    ...(typeof edu === 'string' ? { degree: edu } : newEdu[index]), 
                                    institution: e.target.value 
                                  };
                                  handleInputChange('Resume', 'educationalQualification', newEdu);
                                }}
                                className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm"
                              />
                              <input
                                type="text"
                                value={typeof edu === 'string' ? '' : (edu.years || edu.duration || '')}
                                placeholder="Years"
                                onChange={(e) => {
                                  const newEdu = [...educationData];
                                  newEdu[index] = { 
                                    ...(typeof edu === 'string' ? { degree: edu } : newEdu[index]), 
                                    years: e.target.value 
                                  };
                                  handleInputChange('Resume', 'educationalQualification', newEdu);
                                }}
                                className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={field._id}>
                      <label className="block text-xs text-gray-500 mb-1">
                        {field.fieldName}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type={field.fieldName.toLowerCase().includes('email') ? 'email' : 'text'}
                        value={formData?.Resume?.[field.fieldName] || ''}
                        onChange={(e) => handleInputChange('Resume', field.fieldName, e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update the QuestionnaireTab component to handle questionnaire selection
  const QuestionnaireTab = () => {
    const handleQuestionnaireClick = async (questionnaire) => {
      setIsLoadingQuestionnaire(true);
      setSelectedQuestionnaire(questionnaire);
      
      try {
        const response = await api.get(`/questionnaire-responses/management/${caseId}`, {
          params: {
            templateId: questionnaire._id
          }
        });
        
        if (response.data.status === 'success') {
          await new Promise(resolve => setTimeout(resolve, 3000));
          setQuestionnaireData(response.data.data);
          setFormData(response.data.data.responses[0].processedInformation);
        }
      } catch (error) {
        console.error('Error fetching questionnaire details:', error);
        toast.error('Failed to load questionnaire details');
      } finally {
        setIsLoadingQuestionnaire(false);
      }
    };

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
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
              {/* Only show current loading state */}
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
        <QuestionnaireDetailView 
          questionnaire={selectedQuestionnaire}
          onBack={() => setSelectedQuestionnaire(null)}
        />
      );
    }

    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Questionnaire List</h2>
        </div>

        <div className="space-y-3">
          {questionnaires.map((questionnaire) => (
            <div 
              key={questionnaire._id} 
              className="bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-all cursor-pointer"
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
    );
  };

  // Update the FormsTab component to accept selectedQuestionnaire as a prop
  const FormsTab = () => {
    const [loadingFormId, setLoadingFormId] = useState(null);
    const [error, setError] = useState(null);

    // Function to load the template PDF and fill it with data
    const fillPDFTemplate = async (formId, data) => {
      try {
        const templateUrl = `/templates/testing.pdf`;
        const templateBytes = await fetch(templateUrl).then(res => res.arrayBuffer());
        
        const pdfDoc = await PDFDocument.load(templateBytes);
        const form = pdfDoc.getForm();

        try {
          const processedInfo = data?.responses?.processedInformation;

          // Fill the form fields with exact field names from the PDF
          form.getTextField('Name of the Applicant').setText(
            processedInfo?.Passport?.firstName || 'N/A'
          );
          
          // Details of Applicant section
          form.getTextField('Passport No').setText(processedInfo?.Passport?.passportNumber || 'N/A');
          form.getTextField('Place of Issue').setText(processedInfo?.Passport?.placeOfIssue || 'N/A');
          form.getTextField('Date of Issue').setText(processedInfo?.Passport?.dateOfIssue || 'N/A');
          form.getTextField('Date of Expiry').setText(processedInfo?.Passport?.dateOfExpiry || 'N/A');
          form.getTextField('Mobile Phone').setText(processedInfo?.Resume?.cellNumber || 'N/A');
          form.getTextField('EMail Address').setText(processedInfo?.Resume?.emailId || 'N/A');
          
          // Employment and Education section
          form.getTextField('Name of the Current Employer').setText(
            processedInfo?.Resume?.currentCompanyName || 'N/A'
          );
          form.getTextField('Applicants current Designation role  position').setText(
            processedInfo?.Resume?.currentPosition || 'N/A'
          );

          form.getTextField('Educational Qualification').setText(
            (() => {
              const eduQual = processedInfo?.Resume?.educationalQualification;
              if (!eduQual) return 'N/A';
              
              if (Array.isArray(eduQual)) {
                return eduQual.map(edu => 
                  typeof edu === 'string' 
                    ? edu 
                    : `${edu.degree || ''} - ${edu.institution || ''}`
                ).join('; ');
              }
              
              // Handle single object case
              if (typeof eduQual === 'object') {
                return `${eduQual.degree || ''} - ${eduQual.institution || ''}`;
              }
              
              // Handle string case
              return eduQual;
            })() || 'N/A'
          );

          form.getTextField('Specific details of Skills Experience').setText(
            `${processedInfo?.Resume?.currentPosition || 'N/A'}, ${processedInfo?.resume?.previousPosition || 'N/A'}`
          );

          // Save and download the filled PDF
          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `form-${formId}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);

          // After successful download, update case status to completed
          try {
            await api.patch(`/management/${caseId}/status`, {
              status: 'completed'
            });
            
            // Show success message
            toast.success('Form downloaded and case marked as completed');
            
            // Refresh case data to update UI
            const response = await api.get(`/management/${caseId}`);
            if (response.data.status === 'success') {
              setCaseData(response.data.data.entry);
            }
          } catch (statusError) {
            console.error('Error updating case status:', statusError);
            toast.error('Form downloaded but failed to update case status');
          }

        } catch (fieldError) {
          console.error('Error filling specific field:', fieldError);
          toast.error('Error filling some fields in the form');
          throw fieldError;
        }

      } catch (err) {
        console.error('Error filling PDF:', err);
        toast.error('Failed to generate PDF');
        throw err;
      }
    };

    const handleFormClick = async (form) => {
      try {
        setLoadingFormId(form._id);
        setError(null);

        // Fetch organized documents data with questionnaire ID
        const response = await api.get(`/questionnaire-responses/management/${caseId}`, {
          params: {
            templateId: selectedQuestionnaire?._id
          }
        });
        
        if (!response.data.status === 'success' || !response.data.data.responses?.[0]) {
          throw new Error('Failed to fetch questionnaire data');
        }

        // Get the first response from the array
        const documentData = {
          responses: response.data.data.responses[0]
        };

        // Fill and download the PDF
        await fillPDFTemplate(form._id, documentData);
      } catch (err) {
        console.error('Error processing form:', err);
        setError(err.message);
        toast.error('Failed to process form');
      } finally {
        setLoadingFormId(null);
      }
    };

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      );
    }

    if (!selectedQuestionnaire) {
      return (
        <div className="p-6">
          <div className="text-center text-gray-500">
            Please select a questionnaire first
          </div>
        </div>
      );
    }

    if (!isQuestionnaireCompleted) {
      return (
        <div className="p-6">
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-gray-500 mb-2">
              Please complete the questionnaire first
            </div>
            <button
              onClick={() => setActiveTab('questionnaire')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Go to Questionnaire
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Forms</h2>
          {forms.map((form) => (
            <div 
              key={form._id}
              onClick={() => handleFormClick(form)}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{form.form_name}</h3>
                </div>
                <div>
                  {loadingFormId === form._id ? (
                    <div className="flex items-center text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </div>
                  ) : (
                    <Download className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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

  // Also add useEffect for input focus
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

  // First add back the loading check that was accidentally removed
  if (!caseData || !profileData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Add this new component within CaseDetails.jsx
  const ProfileTab = ({ profileData }) => {
    if (!profileData) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* First column - Employee Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Employee Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileData.name || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Gender</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileData.sex || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Date of Birth</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileData.birthInfo?.dateOfBirth 
                    ? new Date(profileData.birthInfo.dateOfBirth).toLocaleDateString() 
                    : 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Place of Birth</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileData.birthInfo?.cityOfBirth && profileData.birthInfo?.countryOfBirth
                    ? `${profileData.birthInfo.cityOfBirth}, ${profileData.birthInfo.countryOfBirth}`
                    : 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileData.contact?.email || profileData.email || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Mobile Phone</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileData.contact?.mobileNumber || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Residence Phone</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileData.contact?.residencePhone || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Current Job</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileData.currentJob ? (
                    <>
                      {profileData.currentJob.jobTitle} at {profileData.currentJob.companyName}
                      {profileData.currentJob.companyAddress && ` - ${profileData.currentJob.companyAddress}`}
                    </>
                  ) : 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Address</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileData.address ? (
                    <>
                      {profileData.address.floorAptSuite && `${profileData.address.floorAptSuite}, `}
                      {profileData.address.streetNumber && `${profileData.address.streetNumber} `}
                      {profileData.address.streetName && `${profileData.address.streetName}, `}
                      {profileData.address.district && `${profileData.address.district}, `}
                      {profileData.address.city && `${profileData.address.city}, `}
                      {profileData.address.stateProvince && `${profileData.address.stateProvince}, `}
                      {profileData.address.country && `${profileData.address.country} `}
                      {profileData.address.zipCode && profileData.address.zipCode}
                    </>
                  ) : 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Company</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileData.company_name || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Law Firm</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileData.lawfirm_name || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Role</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileData.role || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Second column - Passport, Education, and Work History */}
          <div className="space-y-6">
            {/* Passport Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Passport Details</h2>
              {profileData.passport ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Passport Number</label>
                    <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                      {profileData.passport.number || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Passport Type</label>
                    <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                      {profileData.passport.passportType || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Date of Issue</label>
                    <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                      {profileData.passport.dateOfIssue ? new Date(profileData.passport.dateOfIssue).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Date of Expiry</label>
                    <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                      {profileData.passport.dateOfExpiry ? new Date(profileData.passport.dateOfExpiry).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Place of Issue</label>
                    <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                      {profileData.passport.placeOfIssue || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Issued By</label>
                    <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                      {profileData.passport.issuedBy || 'N/A'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No passport information available
                </div>
              )}
            </div>

            {/* Education History */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-6">Education History</h2>
              <div className="space-y-4">
                {profileData.educationHistory && profileData.educationHistory.length > 0 ? (
                  profileData.educationHistory.map((edu, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="font-medium">
                        {edu.courseLevel} in {edu.specialization}
                      </div>
                      <div className="text-sm text-gray-600">{edu.institution}</div>
                      <div className="text-sm text-gray-500">GPA: {edu.gpa || 'N/A'}</div>
                      <div className="text-sm text-gray-500">
                        Graduated: {edu.passoutYear ? new Date(edu.passoutYear).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No education history available
                  </div>
                )}
              </div>
            </div>

            {/* Work History */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-6">Work History</h2>
              <div className="space-y-4">
                {profileData.workHistory && profileData.workHistory.length > 0 ? (
                  profileData.workHistory.map((exp, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="font-medium">{exp.jobTitle}</div>
                      <div className="text-sm text-gray-600">{exp.companyName}</div>
                      <div className="text-sm text-gray-500">
                        {exp.fromDate ? new Date(exp.fromDate).toLocaleDateString() : 'N/A'} - 
                        {exp.toDate ? new Date(exp.toDate).toLocaleDateString() : 'Present'}
                      </div>
                      {exp.description && (
                        <div className="text-sm text-gray-600 mt-2">{exp.description}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No work history available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handler for email changes from sidebar
  const handleEmailChange = (email) => {
    console.log('Email received from sidebar:', email);
    setRecipientEmail(email);
  };

  const handleNextClick = () => {
    // Switch to finalize tab
    setSelectedSubTab('finalize'); // Add this line to set the sub-navigation
    setActiveTab('document-checklist'); // Keep the main tab as document-checklist
  };

  // Update the main container and its children to properly handle height
  return (
    <div className="flex h-full bg-gray-50 rounded-xl"> {/* Changed from h-screen to h-full */}
      {/* Sidebar */}
      <div className="flex flex-col w-80 bg-white border-r border-gray-200 shadow-sm relative rounded-xl">
        {onBack && (
          <button
            onClick={onBack}
            className="p-4 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 group flex items-center gap-2"
          > 
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-sm font-medium">Back</span>
          </button>
        )}
        
        <div className="flex-1 overflow-hidden"> {/* Added overflow-hidden */}
          <CaseDetailsSidebar 
            caseData={caseData} 
            loading={!caseData && !error} 
            error={error}
            onEmailChange={handleEmailChange}
          />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-xl">
        <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0"> {/* Added flex-shrink-0 */}
          <ProgressSteps />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden"> {/* Changed to flex and overflow-hidden */}
          <div className="border-b border-gray-200 flex-shrink-0"> {/* Added flex-shrink-0 */}
            <TabNavigation />
          </div>
          
          <div className="flex-1 overflow-auto"> {/* This will scroll independently */}
            <div className="max-w-7xl mx-auto">
              {activeTab === 'profile' && <ProfileTab profileData={caseData.userId} />}
              {activeTab === 'document-checklist' && <DocumentsChecklistTab />}
              {activeTab === 'questionnaire' && <QuestionnaireTab />}
              {activeTab === 'forms' && <FormsTab />}
            </div>
          </div>
        </div>
      </div>
      {renderChatPortal()}
    </div>
  );
};

export default CaseDetails;


