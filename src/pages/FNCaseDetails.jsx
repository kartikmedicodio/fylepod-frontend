import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
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
  X,
  Upload,
  FileText,
  CreditCard,
  CheckSquare,
  ClipboardList,
  Package,
  Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import ProgressSteps from '../components/ProgressSteps';
import CrossVerificationTab from '../components/cases/CrossVerificationTab';
import { initializeSocket, joinDocumentRoom, handleReconnect, getSocket } from '../utils/socket';
import { getStoredToken, getStoredUser } from '../utils/auth';
import { useAuth } from '../contexts/AuthContext';
import { createQuery } from '../services/queryService';
import { getCalApi } from "@calcom/embed-react";
import RetainerTab from '../components/RetainerTab';
import FNPayments from './FNPayments';

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

const processingSteps = [
  { id: 1, text: "Analyzing document" },
  { id: 2, text: "Extracting information" },
  { id: 3, text: "Validating content" },
  { id: 4, text: "Verifying document" },
  { id: 5, text: "Document processed" }
];

// Helper function to count failed validations in validation results
const countFailedValidations = (validationResults) => {
  if (!validationResults || !validationResults.validations) return 0;
  return validationResults.validations.filter(v => !v.passed).length;
};

// Helper function to format validation data from webhook to match UI expectations
const formatValidationData = (validationResults, documentType) => {
  if (!validationResults) return null;
  
  // Log validation results for debugging
  console.log("Formatting validation results:", validationResults);
  
  // Check if validation data is already in the expected format
  if (validationResults.mergedValidations) {
    return validationResults;
  }
  
  // Create a merged validation format that the UI expects
  const docType = documentType || "Document";
  
  // Create the formatted object with a single document type
  const formattedData = {
    mergedValidations: [
      {
        documentType: docType,
        validations: validationResults.validations || []
      }
    ]
  };
  
  console.log("Formatted validation data:", formattedData);
  return formattedData;
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
  } else if (normalizedStatus.startsWith('processing-')) {
    // Handle the processing-N format where N is the current processing step
    const stepMatch = normalizedStatus.match(/processing-(\d)/);
    if (stepMatch && stepMatch[1]) {
      currentStage = parseInt(stepMatch[1], 10);
    } else {
      currentStage = 2; // Default to processing stage
    }
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
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const defaultTab = searchParams.get('tab') || 'overview';
  const highlightedDocumentId = searchParams.get('documentId');
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(defaultTab);
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
  const [uploadStatusMessages, setUploadStatusMessages] = useState([]);
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [formData, setFormData] = useState({
    Passport: {},
    Resume: {
      educationalQualification: [] // Initialize as empty array
    }
  });
  const [processingStep, setProcessingStep] = useState(0);
  const [isSavingQuestionnaire, setIsSavingQuestionnaire] = useState(false);
  const [isQuestionnaireCompleted, setIsQuestionnaireCompleted] = useState(false);
  // Add upload progress state
  const [uploadProgress, setUploadProgress] = useState(0);
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
  // Add refs for validation data
  const validationDataRef = useRef(null);
  const verificationDataRef = useRef(null);
  // Add state to track processing document IDs and processing status
  const [processingDocIds, setProcessingDocIds] = useState([]);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  // Add state to track validation and verification completion
  const [processingStatus, setProcessingStatus] = useState({
    document: null,
    validationComplete: false,
    verificationComplete: false,
    validationResults: {
      failedCount: 0,
      documentType: null
    },
    verificationResults: null,
    processedDocuments: [], // Track all processed documents
    validationFailuresByDocument: {} // Track validation failures by document
  });
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [aiQuerySuggestion, setAiQuerySuggestion] = useState('');
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [escalateQuery, setEscalateQuery] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);
  // Add this new state near other state declarations
  const [showAttorneyOptions, setShowAttorneyOptions] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [caseSteps, setCaseSteps] = useState([]);
  
  // Group all useRef hooks
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Add this helper function to fix ReferenceError
  const addUploadStatusMessage = (msg) => {
    setUploadStatusMessages(prev => [msg, ...prev]);
  };

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

  useEffect(() => {
    // If there's a documentId in the URL, scroll to that document and highlight it
    if (highlightedDocumentId && activeTab === 'documents') {
      const element = document.getElementById(`document-${highlightedDocumentId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight animation
        element.classList.add('highlight-document');
        setTimeout(() => element.classList.remove('highlight-document'), 2000);
      }
    }
  }, [highlightedDocumentId, activeTab]);

  // Add a function to load data from localStorage
  const loadDataFromLocalStorage = () => {
    console.log('Checking localStorage for saved data...');
    try {
      // Load validation data
      const savedValidationData = localStorage.getItem(`validation-data-${caseId}`);
      if (savedValidationData) {
        const parsedData = JSON.parse(savedValidationData);
        console.log('Found validation data in localStorage:', parsedData);
        
        // Set the validation data in both state and ref
        setValidationData(parsedData);
        validationDataRef.current = parsedData;
      } else {
        console.log('No validation data found in localStorage');
      }
      
      // Load cross-verification data
      const savedCrossVerificationData = localStorage.getItem(`cross-verification-data-${caseId}`);
      if (savedCrossVerificationData) {
        const parsedData = JSON.parse(savedCrossVerificationData);
        console.log('Found cross-verification data in localStorage:', parsedData);
        
        // Set the cross-verification data in both state and ref
        setVerificationData(parsedData);
        verificationDataRef.current = parsedData;
      } else {
        console.log('No cross-verification data found in localStorage');
      }
      
      return {
        validationDataFound: !!savedValidationData,
        verificationDataFound: !!savedCrossVerificationData
      };
    } catch (error) {
      console.error('Error loading saved data from localStorage:', error);
      return {
        validationDataFound: false,
        verificationDataFound: false
      };
    }
  };
  
  // Effect to handle validation data updates
  useEffect(() => {
    if (validationData) {
      console.log('Validation data updated, refreshing UI');
      // Update the ref whenever validationData state changes
      validationDataRef.current = validationData;
      
      // Store in localStorage to ensure persistence even across page reloads
      try {
        localStorage.setItem(`validation-data-${caseId}`, JSON.stringify(validationData));
        console.log('Saved validation data to localStorage');
      } catch (error) {
        console.error('Error saving validation data to localStorage:', error);
      }
    }
  }, [validationData, caseId]);
  
  // Effect to handle cross-verification data updates
  useEffect(() => {
    if (verificationData) {
      console.log('Cross-verification data updated, refreshing UI');
      // Update the ref whenever verificationData state changes
      verificationDataRef.current = verificationData;
      
      // Store in localStorage to ensure persistence even across page reloads
      try {
        localStorage.setItem(`cross-verification-data-${caseId}`, JSON.stringify(verificationData));
        console.log('Saved cross-verification data to localStorage');
    } catch (error) {
        console.error('Error saving cross-verification data to localStorage:', error);
      }
    }
  }, [verificationData, caseId]);
  
  // Set up document processing socket listeners
  useEffect(() => {
    if (!caseId) return;
    
    // Initialize socket when component mounts
    const token = getStoredToken();
    let socket;
    
    try {
      // Initialize socket connection
      socket = initializeSocket(token);
      
      // Setup reconnection handling
      handleReconnect();
      
      // Check if socket is connected
      if (socket.connected) {
        console.log('Socket already connected with ID:', socket.id);
      } else {
        console.log('Socket connection in progress...');
        socket.on('connect', () => {
          console.log('Socket connected in useEffect with ID:', socket.id);
        });
      }
      
      // Listen for document processing events
      socket.on('document-processing-started', (data) => {
        // Explicitly ignore storage-only documents
        if (data.isStorageOnly || isStorageOnlyDocument(data.documentId)) return;
        
        console.log('Document processing started:', data);
        if (data.caseId === caseId) {
          setProcessingDocIds(prev => [...prev, data.documentId]);
          setProcessingStep(1);
          addUploadStatusMessage(`Diana is analyzing document: ${data.documentName || data.documentId}`);
        }
      });

      socket.on('document-processing-progress', (data) => {
        // Explicitly ignore storage-only documents
        if (data.isStorageOnly || isStorageOnlyDocument(data.documentId)) return;
        
        console.log('Document processing progress:', data);
        if (data.caseId === caseId) {
          if (data.status.toLowerCase().includes('extract')) {
            setProcessingStep(2);
          } else if (data.status.toLowerCase().includes('validat')) {
            setProcessingStep(3);
          } else if (data.status.toLowerCase().includes('verify')) {
            setProcessingStep(4);
          }
          addUploadStatusMessage(`Diana is ${data.status} (${data.documentName || data.documentId})`);
        }
      });
      
      // Add a helper function to merge validation results
      const normalizeDocType = (type) => (type || 'Document').trim().toLowerCase();
      const mergeValidationResults = (existingData, newResults, documentType) => {
        const latestExistingData = validationDataRef.current || existingData;
        const normalizedType = normalizeDocType(documentType);

        if (!latestExistingData || !latestExistingData.mergedValidations) {
          return {
            mergedValidations: [
              {
                documentType: normalizedType,
                validations: newResults.validations || []
              }
            ]
          };
        }

        const mergedData = JSON.parse(JSON.stringify(latestExistingData));
        const existingIndex = mergedData.mergedValidations.findIndex(
          item => normalizeDocType(item.documentType) === normalizedType
        );

        if (existingIndex === -1) {
          mergedData.mergedValidations.push({
            documentType: normalizedType,
            validations: newResults.validations || []
          });
        } else {
          // Merge validations, avoiding duplicates
          const existingValidationRules = new Set(
            mergedData.mergedValidations[existingIndex].validations.map(
              v => v.rule || v.name || JSON.stringify(v)
            )
          );
          const newValidations = (newResults.validations || []).filter(validation => {
            const validationKey = validation.rule || validation.name || JSON.stringify(validation);
            return !existingValidationRules.has(validationKey);
          });
          mergedData.mergedValidations[existingIndex].validations = [
            ...mergedData.mergedValidations[existingIndex].validations,
            ...newValidations
          ];
        }

        return mergedData;
      };
      
      socket.on('document-processing-completed', (data) => {
        // Explicitly ignore storage-only documents
        if (data.isStorageOnly || isStorageOnlyDocument(data.documentId)) return;
        
        console.log('Document processing completed:', data);
        console.log('Current processing document IDs:', processingDocIds);
        
        if (data.caseId === caseId) {
          setProcessingDocIds(prev => {
            const newProcessingIds = prev.filter(id => id !== data.documentId);
            console.log(`Removed ${data.documentId} from processing IDs. New processing IDs:`, newProcessingIds);
            return newProcessingIds;
          });
          setIsProcessingComplete(true);
          setProcessingStep(5); // Document processed
          
          // Get document type from multiple potential sources
          const documentType = 
            data.data?.document_type || 
            data.documentName?.split('.')[0] || 
            'Document';
          
          console.log(`Determined document type for completed document: ${documentType}`);
          
          // Get document type from the data field if it exists
          let docTypeName = 'document';
          try {
            if (data.data && data.data.document_type) {
              docTypeName = data.data.document_type;
            }
            // Store document name in processing status
            setProcessingStatus(prev => ({
              ...prev,
              document: docTypeName,
              processedDocuments: [...prev.processedDocuments, docTypeName] // Add to processed documents array
            }));
          } catch (error) {
            console.error('Error determining document type:', error);
          }
          
          // Log the complete webhook response for debugging
          console.log('Complete webhook response:', JSON.stringify(data, null, 2));
          
          // Update UI directly from webhook data without any API calls
          console.log('Updating UI directly from webhook data');
          
          // Update case data if provided
          console.log('Case data from webhook:', data.caseData);
          if (data.caseData) {
            console.log('Setting case data from webhook');
            setCaseData(data.caseData);
              } else {
            // If no case data, refresh case data
            refreshCaseData();
          }
          
          // Update validation data if provided
          if (data.validationResults) {
            console.log('Setting validation data from webhook');
            // Log the validation results structure
            console.log('Validation results structure:', JSON.stringify(data.validationResults, null, 2));
            
            // Determine document type from multiple potential sources
            const documentType = 
              data.data?.document_type || 
              data.documentName?.split('.')[0] || 
              'Document';
              
            console.log(`Determined document type: ${documentType} for validation results`);
            console.log(`Current validation data:`, validationData);
            
            // Merge new validation results with existing data
            const mergedData = mergeValidationResults(
              validationDataRef.current || validationData, 
              data.validationResults, 
              documentType
            );
            
            // Set the merged validation data
            setValidationData(mergedData);
            console.log('Updated validation data with all documents:', JSON.stringify(mergedData, null, 2));
            
            // Calculate validation status
            const failedCount = countFailedValidations(data.validationResults);
            
            // Update processing status with validation results
            setProcessingStatus(prev => {
              // Track validation results by document
              const updatedValidationFailures = { ...prev.validationFailuresByDocument };
              if (failedCount > 0) {
                updatedValidationFailures[documentType] = failedCount;
              }
              
              return {
                ...prev,
                validationComplete: true,
                validationResults: {
                  failedCount: failedCount,
                  documentType: documentType
                },
                validationFailuresByDocument: updatedValidationFailures
              };
            });
          }
          
          // Update cross-verification data if provided
          if (data.crossVerificationData) {
            toast.success('Cross-verification data received');
            console.log('Setting cross-verification data from webhook');
            console.log('Cross-verification data structure:', JSON.stringify(data.crossVerificationData, null, 2));
            
            // Set the cross-verification data
            setVerificationData(data.crossVerificationData);
            
            // Update processing status
            setProcessingStatus(prev => ({
              ...prev,
              verificationComplete: true,
              verificationResults: {
                data: data.crossVerificationData
              }
            }));
          }
          
          // Add a small delay before refreshing to ensure all data is saved
          setTimeout(() => {
            // If there are no more documents being processed, refresh data once more
            if (processingDocIds.filter(id => id !== data.documentId).length === 0) {
              // Show success toast when all processing is complete
              toast.success(`Document processing complete!`);
            }
          }, 500);
          addUploadStatusMessage(`Diana has completed processing: ${data.documentName || data.documentId}`);
        }
      });
      
      // Load saved data from localStorage first
      loadDataFromLocalStorage();
      
      // Return cleanup function
      return () => {
        socket.off('document-processing-started');
        socket.off('document-processing-progress');
        socket.off('document-processing-completed');
      };
    } catch (error) {
      console.error('Error setting up socket connection:', error);
    }
  }, [caseId, processingDocIds]);

  // Synchronize disappearance of status message with processing
  useEffect(() => {
    if (processingDocIds.length === 0 && uploadStatusMessages.length > 0) {
      const timer = setTimeout(() => setUploadStatusMessages([]), 1200);
      return () => clearTimeout(timer);
    }
  }, [processingDocIds, uploadStatusMessages]);

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
      // First, check if we have received case data through webhooks
      if (processingStatus.document) {
        console.log('Using processingStatus data to avoid API call');
        return;
      }
      
      console.log('Refreshing case data...');
          const caseResponse = await api.get(`/management/${caseId}`);
          
      if (caseResponse.data.status === 'success') {
        setCaseData(caseResponse.data.data.entry);
        console.log('Case data refreshed successfully');
        // Restore breadcrumb setup
        setCurrentBreadcrumb([
          { name: 'All Cases', path: '/individual-cases' },
          { name: caseData.categoryName || 'Case Details', path: `/individuals/case/${caseId}` }
        ]);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleFileUpload = async (files) => {
    try {
      setIsProcessing(true);
      setProcessingStep(1);
      setUploadProgress(0); // Reset upload progress at the start

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

        // Check if a document of this type already exists and is not in pending state
        const existingDoc = caseData.documents?.find(doc => 
          doc.documentTypeId === pendingDoc.documentTypeId && 
          doc.status !== 'pending'
        );

        if (existingDoc) {
          toast.error('A document of this type already exists and cannot be reuploaded');
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
              'Content-Type': undefined
            },
            onUploadProgress: (progressEvent) => {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              setUploadProgress(Math.round(progress));
            }
          });
          
          if (response.data.status === 'success') {
            const documentId = response.data.data.document._id;
            uploadedDocIds.push(documentId);
            joinDocumentRoom(documentId);
            return {
              documentId,
              managementDocumentId: pendingDoc._id,
              documentTypeId: pendingDoc.documentTypeId
            };
          }
          return null;
        } catch (error) {
          console.error('Error uploading document:', error);
          const errorMessage = error.response?.data?.message || 'Unknown error';
          toast.error(`Error uploading document: ${errorMessage}`);
          return null;
        }
      });

      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);
      const uploadedDocs = uploadResults.filter(result => result !== null);
      
      if (uploadedDocs.length > 0) {
        setProcessingDocIds(prev => [...prev, ...uploadedDocs.map(doc => doc.documentId)]);
        toast.success(`Uploaded ${uploadedDocs.length} document(s)`);
        await refreshCaseData();
      }
      
      setFiles([]);
    } catch (error) {
      console.error('Error in file upload process:', error);
      toast.error('Error uploading files: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  // Update the initial setup useEffect
  useEffect(() => {
    // Keep documents-checklist as default tab
    setActiveTab('documents-checklist');
    setUploadStatus('pending');

    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Ensure validationDataFound and verificationDataFound are defined
        const { validationDataFound, verificationDataFound } = loadDataFromLocalStorage();
        const response = await api.get(`/management/${caseId}`);
        if (response.data.status === 'success') {
          const caseData = response.data.data.entry;
          setCaseData(caseData);
          // Set breadcrumb
          setCurrentBreadcrumb([
            { name: 'All Cases', path: '/individual-cases' },
            { name: caseData.categoryName || 'Case Details', path: `/individuals/case/${caseId}` }
          ]);
          // Check if there are any uploaded documents
          const hasUploadedDocs = caseData.documentTypes.some(doc => 
            doc.status === 'uploaded' || doc.status === 'approved'
          );
          // If we have uploaded docs and no validation data yet, fetch it
          if (hasUploadedDocs && !validationDataFound) {
            // Wait for validation data to be fetched
            await fetchValidationData();
          }
          // If we have a userId, fetch the complete profile
          if (caseData.userId?._id) {
            const profileResponse = await api.get(`/auth/users/${caseData.userId._id}`);
            if (profileResponse.data.success && profileResponse.data.data) {
              setProfileData(profileResponse.data.data);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching case data:', error);
        toast.error('Failed to load case data');
      } finally {
        setIsLoading(false);
      }
    };

      fetchData();
  }, [caseId]); // Only depend on caseId

    // Cleanup breadcrumb on unmount
  useEffect(() => {
      setCurrentBreadcrumb([]);
  }, [setCurrentBreadcrumb]);

  // Add separate useEffect for questionnaires
  useEffect(() => {
    const fetchQuestionnaires = async () => {
      try {
        setIsLoadingQuestionnaires(true);
        
        // Make sure we have caseData with categoryId before proceeding
        if (!caseData || !caseData.categoryId) {
          console.log('Waiting for case data with categoryId to be available');
          return;
        }
        
        // Handle both cases where categoryId could be an object or a string
        const categoryId = typeof caseData.categoryId === 'object' 
          ? caseData.categoryId._id 
          : caseData.categoryId;
        
        console.log('Fetching questionnaires for categoryId:', categoryId);
        
        // Update the API endpoint to include categoryId as a query parameter
        const response = await api.get(`/questionnaires?categoryId=${categoryId}`);
        
        if (response.data.status === 'success') {
          const templates = response.data.data.templates;
          
          // Log only fields with isDependent: true from the API response
          const dependentFields = templates.flatMap(template => 
            template.field_mappings.filter(field => field.isDependent === true)
          );
          
          // Only process if there are templates
          if (templates && templates.length > 0) {
            // Create a combined questionnaire by merging all field mappings
            const combinedQuestionnaire = {
              _id: "combined-questionnaire-id",
              questionnaire_name: "Combined Questionnaire",
              description: "Combination of all available questionnaires",
              field_mappings: [],
              createdBy: templates[0].createdBy,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              __v: 0,
              categoryId: categoryId // Use the case's categoryId
            };
            
            // Create a map to store fields by fieldName to prevent duplicates
            const fieldMap = new Map();
            
            // Merge all field mappings from all templates
            templates.forEach(template => {
              // Extract template categoryId, handling both object and string cases
              const templateCategoryId = typeof template.categoryId === 'object'
                ? template.categoryId._id
                : template.categoryId;
              
              // Only include templates that match the case's categoryId
              if (templateCategoryId === categoryId && template.field_mappings && template.field_mappings.length > 0) {
                // Check for duplicate fieldNames before adding
                template.field_mappings.forEach(field => {
                  // Only log if field is dependent
                  if (field.isDependent === true) {
                    // Remove console.log statement
                  }
                  
                  // Use fieldName as the key to prevent duplicates
                  if (!fieldMap.has(field.fieldName)) {
                    fieldMap.set(field.fieldName, {
                      ...field,
                      isDependent: field.isDependent || false,
                      dependentFields: field.dependentFields || [],
                      sourceDocument: field.sourceDocument || null,
                      required: field.required || false,
                      value: null
                    });
                  }
                });
              }
            });
            
            // Convert the map values to array and set as field_mappings
            combinedQuestionnaire.field_mappings = Array.from(fieldMap.values());
            
            // Log only dependent fields in final combined questionnaire
            const finalDependentFields = combinedQuestionnaire.field_mappings.filter(field => field.isDependent === true);
            // console.log('Dependent fields in combined questionnaire:', finalDependentFields.map(field => ({
            //   fieldName: field.fieldName,
            //   dependentFields: field.dependentFields
            // })));
            
            // Set the combined questionnaire as the only one available
            setQuestionnaires([combinedQuestionnaire]);
            
            // Initialize formData with all field properties
            const initialFormData = {};
            combinedQuestionnaire.field_mappings.forEach(field => {
              initialFormData[field._id] = {
                ...field,
                value: null
              };
              
              // Special case for "Street Number and Name" field
              if (field.fieldName === 'ste') {
                initialFormData[field._id] = {
                  ...initialFormData[field._id],
                  fieldLabel: 'Street Number and Name',
                  groupName: 'Residential Address History',
                  fieldType: 'Text Field'
                };
              }
            });
            setFormData(initialFormData);
          } else {
            setQuestionnaires([]);
          }
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
  }, [caseData]); // Add caseData as a dependency

  useEffect(() => {
    if (questionnaireData?.responses?.[0]?.processedInformation && selectedQuestionnaire) {
      const processedInfo = questionnaireData.responses[0].processedInformation;
      
      // Initialize form data with all fields from the questionnaire template
      const initialFormData = {};
      selectedQuestionnaire.field_mappings.forEach(field => {
        // Copy all field properties
        initialFormData[field._id] = {
          ...field,
          value: processedInfo[field._id]?.value || null
        };
      });
      
      // console.log('Setting form data from questionnaire response:', initialFormData);
      setFormData(initialFormData);
    }
  }, [questionnaireData, selectedQuestionnaire]);

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
    // Reset attorney options visibility when sending a new message
    setShowAttorneyOptions(false);

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

          // Get user info from profile data
          const userInfo = {
            name: profileData?.name || 'User',
            email: profileData?.email,
            contact: profileData?.contact,
            address: profileData?.address,
            role: profileData?.role || 'individual' // Add user role
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
              managementContext: managementContext,
              userInfo: userInfo // Add user info to chat creation
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
                managementContext: managementContext,
                userInfo: userInfo // Add user info to chat creation
              });
            } else {
              // Extract document IDs for chat creation
              const docIds = validDocs.map(doc => doc._id);
              
              // Create the chat with documents and management data
              chatResponse = await api.post('/chat', {
                documentIds: docIds,
                managementId: caseId,
                managementContext: managementContext,
                userInfo: userInfo // Add user info to chat creation
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
    // Add loading and null checks
    if (!caseData) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      );
    }

    // Ensure documentTypes exists with a default empty array
    const documentTypes = caseData.documentTypes || [];
    const storageOnlyDocs = caseData.storageOnlyDocs || [];

    const pendingDocuments = documentTypes.filter(doc => 
      doc.status === 'pending'
    );
    
    const uploadedDocuments = documentTypes.filter(doc => 
      doc.status === 'uploaded' || doc.status === 'approved'
    );

    // Add documents in processing state
    const processingDocuments = documentTypes.filter(doc => 
      processingDocIds.includes(doc._id)
    );

    // Add storage-only documents filtering
    const pendingStorageOnlyDocs = storageOnlyDocs.filter(doc =>
      doc.status === 'pending'
    ) || [];

    const uploadedStorageOnlyDocs = storageOnlyDocs.filter(doc =>
      doc.status === 'uploaded' || doc.status === 'approved'
    ) || [];

    // Track storage-only documents being processed
    const processingStorageOnlyDocs = isProcessing ? 
      pendingStorageOnlyDocs.filter(doc => doc.documentTypeId === processingDocTypeId) : 
      [];
      
    // Track the document type ID being processed
    const [processingDocTypeId, setProcessingDocTypeId] = useState(null);
    
    // Add modified storage-only upload handler that tracks processing document
    const handleStorageOnlyUpload = async (documentTypeId, file) => {
      try {
        if (!validateFileType(file)) {
          toast.error(`Invalid file type: ${file.name}`);
          return;
        }

        // Show upload indicator and track which document is being processed
        setIsProcessing(true);
        setProcessingDocTypeId(documentTypeId);
        setUploadProgress(0);
        setProcessingStep(1);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('originalName', file.name);
        formData.append('name', `${Date.now()}-${file.name}`);
        formData.append('managementId', caseId);
        formData.append('documentTypeId', documentTypeId);
        formData.append('isStorageOnly', 'true');
        formData.append('skipProcessing', 'true');
        formData.append('form_category_id', caseData.categoryId?._id);
        formData.append('mimeType', file.type);

        const response = await api.post('/documents', formData, {
          headers: {
            'Content-Type': undefined
          },
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(Math.round(progress));
            
            // Update processing steps based on upload progress
            if (progress < 25) {
              setProcessingStep(1);
            } else if (progress < 50) {
              setProcessingStep(2);
            } else if (progress < 75) {
              setProcessingStep(3);
            } else if (progress < 100) {
              setProcessingStep(4);
            } else {
              setProcessingStep(5);
            }
          }
        });

        if (response.data.status === 'success') {
          // Set final processing step
          setProcessingStep(5);
          
          // Immediately update the document status without waiting for socket events
          await api.patch(`/management/${caseId}/documents/${documentTypeId}/status`, {
            status: 'uploaded',
            isStorageOnly: true
          });

          // Clear any existing validation/verification data for this document
          const docType = caseData.storageOnlyDocs.find(doc => doc.documentTypeId === documentTypeId);
          if (docType) {
            // Remove this document from any existing validation data
            if (validationDataRef.current) {
              const updatedValidationData = {
                ...validationDataRef.current,
                mergedValidations: validationDataRef.current.mergedValidations?.filter(
                  validation => validation.documentType !== docType.name
                ) || []
              };
              setValidationData(updatedValidationData);
              validationDataRef.current = updatedValidationData;
            }

            // Remove this document from any existing verification data
            if (verificationDataRef.current) {
              const updatedVerificationData = {
                ...verificationDataRef.current,
                mismatchErrors: verificationDataRef.current.mismatchErrors?.filter(
                  error => !error.details?.[docType.name]
                ) || []
              };
              setVerificationData(updatedVerificationData);
              verificationDataRef.current = updatedVerificationData;
            }
          }

          toast.success('Document uploaded successfully');
          await refreshCaseData();
        }
      } catch (error) {
        console.error('Error uploading storage-only document:', error);
        toast.error('Error uploading document: ' + (error.response?.data?.message || 'Unknown error'));
      } finally {
        // Clear processing states
        setIsProcessing(false);
        setProcessingDocTypeId(null);
        setUploadProgress(0);
      }
    };

    const renderDocumentsList = () => (
      <div className="flex-1 border border-gray-200 rounded-lg p-4 relative">
        {/* Global Processing Indicator - show when any document is being processed */}
        {processingDocIds.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-amber-50/90 to-amber-50/70 border-b border-amber-100/50 mb-4 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="relative">
                {/* Avatar container with gradient background */}
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center relative overflow-hidden">
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 opacity-90"></div>
                  {/* Text */}
                  <span className="relative text-sm font-semibold text-white tracking-wide">Diana</span>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 blur-xl -z-10"></div>
                </div>
                {/* Processing indicator */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white p-0.5">
                  <div className="w-full h-full rounded-full bg-amber-500 animate-pulse"></div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-amber-900">
                  Document Processing in Progress
                </h3>
                <p className="text-sm text-amber-700/90 mt-0.5 line-clamp-2">
                  You may close the screen and continue with your work. I will update you once the processing is completed.
                  Watch out for my detailed analysis in your email.
                </p>
              </div>
              {/* Processing indicator dots */}
              <div className="flex-shrink-0 flex items-center gap-1">
                <div 
                  className="w-1.5 h-1.5 rounded-full bg-amber-500/90 animate-[pulse_1s_ease-in-out_infinite,bounce_1s_ease-in-out_infinite]" 
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div 
                  className="w-1.5 h-1.5 rounded-full bg-amber-500/90 animate-[pulse_1s_ease-in-out_infinite,bounce_1s_ease-in-out_infinite]" 
                  style={{ animationDelay: '300ms' }}
                ></div>
                <div 
                  className="w-1.5 h-1.5 rounded-full bg-amber-500/90 animate-[pulse_1s_ease-in-out_infinite,bounce_1s_ease-in-out_infinite]" 
                  style={{ animationDelay: '600ms' }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {/* Regular Documents Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
            
            {/* Documents currently in processing state */}
            {processingDocuments.length > 0 && (
              <div className="mb-6">
                {processingDocuments.map((doc) => (
                  <div key={doc._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">
                          {doc.name}
                          {doc.required && (
                            <span className="ml-2 text-xs text-red-500">*Required</span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500 leading-snug">
                          Processing document...
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {uploadStatus === 'pending' ? (
              pendingDocuments.length > 0 ? (
                pendingDocuments.map((doc) => (
                  <div key={doc._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
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
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm text-center py-8">
                  All documents have been uploaded.
                </div>
              )
            ) : (
              uploadedDocuments.length > 0 && (
                uploadedDocuments.map((doc) => (
                  <div key={doc._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow mb-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        doc.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {doc.status === 'approved' ? (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">
                          {doc.name}
                        </h4>
                        <p className="text-sm text-gray-500 leading-snug">
                          {doc.status === 'approved' ? 'Document approved' : 'Uploaded and awaiting approval'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>

          {/* Storage-Only Documents Section */}
          {(caseData.storageOnlyDocs && caseData.storageOnlyDocs.length > 0) && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Documents</h3>
              <div className="space-y-4">
                {/* Processing storage-only documents */}
                {processingStorageOnlyDocs.length > 0 && (
                  <>
                    {processingStorageOnlyDocs.map((doc) => (
                      <div key={doc._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow mb-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-1">{doc.name}</h4>
                            <p className="text-sm text-gray-500 leading-snug">
                              Uploading - {uploadProgress}%
                            </p>
                          </div>
                        </div>
                        
                        {/* Upload progress bar */}
                        <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {pendingStorageOnlyDocs
                  .filter(doc => !processingStorageOnlyDocs.some(pDoc => pDoc._id === doc._id))
                  .map((doc) => (
                    <div key={doc._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow mb-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-1">{doc.name}</h4>
                            <p className="text-sm text-gray-500">Please upload this document</p>
                          </div>
                        </div>
                        <div>
                          <input
                            type="file"
                            id={`storage-file-${doc._id}`}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleStorageOnlyUpload(doc.documentTypeId, e.target.files[0]);
                              }
                            }}
                            accept="image/jpeg,image/png,image/jpg,application/pdf"
                          />
                          <label
                            htmlFor={`storage-file-${doc._id}`}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            Upload File
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                {uploadedStorageOnlyDocs.map((doc) => (
                  <div key={doc._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-green-100 text-green-600">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">{doc.name}</h4>
                        <p className="text-sm text-gray-500 leading-snug">
                          {doc.status === 'approved' ? 'Document approved' : 'Document uploaded'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingStorageOnlyDocs.length === 0 && uploadedStorageOnlyDocs.length === 0 && (
                  <div className="text-gray-500 text-sm text-center py-8">
                    No additional documents required
                  </div>
                )}
              </div>
            </div>
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
            {/* Status message card - like CaseDetails.jsx */}
            {uploadStatusMessages.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm text-blue-900">Document Processing Status</span>
                  <button
                    className="text-xs text-blue-500 hover:underline ml-2"
                    onClick={() => setUploadStatusMessages([])}
                    aria-label="Clear status messages"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-900 min-h-[48px] break-words">
                    <svg className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="currentColor" /></svg>
                    <span className="whitespace-pre-line">{uploadStatusMessages[0]}</span>
                  </div>
                </div>
              </div>
            )}
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
                    
                    {/* Upload progress bar */}
                    {isProcessing && uploadProgress > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
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

            <div className="relative group">
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
                      api.get(`/management/${caseId}/check-cross-verify`)
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
                disabled={uploadedDocuments.length === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  uploadStatus === 'validation'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : uploadedDocuments.length === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Verification Check
              </button>
              
              {/* Message shows only on hover when button is disabled */}
              {uploadedDocuments.length === 0 && (
                <div className="absolute -top-8 left-0 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Please upload required documents first
                </div>
              )}
            </div>
          </div>
        </div>

        {uploadStatus === 'pending' && (
          <div className="flex gap-6">
            <div className="flex-[1.5] min-w-0">{renderDocumentsList()}</div>
            <div className="flex-[1] min-w-[340px] max-w-[420px]">{renderSmartUpload()}</div>
          </div>
        )}

        {uploadStatus === 'validation' && (
          <div className="w-full">
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
                  className="bg-transparent"
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
    const [isExpanded, setIsExpanded] = useState(true); // Changed to true

    if (isLoading) {
      return <AccordionSkeleton title="Document Verification Results" />;
    }

    // Filter out validations for documents that are in pending status
    const filteredValidations = validationData?.mergedValidations?.filter(validation => {
      const docType = caseData.documentTypes.find(dt => dt.name === validation.documentType);
      return docType && docType.status !== 'pending';
    }) || [];

    if (!filteredValidations.length) {
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
              ${filteredValidations.every(doc => doc.passed) 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'}`}
            >
              {filteredValidations.every(doc => doc.passed) 
                ? 'All Valid' 
                : `${filteredValidations.filter(doc => !doc.passed).length} Issues Found`}
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
              {filteredValidations.map((documentValidation, index) => {
                // Get document status from caseData
                const docType = caseData.documentTypes.find(dt => dt.name === documentValidation.documentType);
                
                // Skip if document is pending
                if (docType?.status === 'pending') return null;

                return (
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
                          <div className="flex items-center gap-2">
                            <a 
                              href={validationData.documentUrls[documentValidation.documentType]} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Document
                            </a>
                            <button
                              onClick={() => {
                                if (docType?.documentTypeId) {
                                  handleDocumentReupload(docType.documentTypeId);
                                } else {
                                  toast.error('Document type ID not found');
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-2 border border-red-200 rounded-lg hover:bg-red-50"
                            >
                              <Upload className="w-4 h-4" />
                              Reupload
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Validation details */}
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
                );
              })}
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
        const response = await api.get(`/questionnaire-responses/management/${caseId}`);
        
        if (response.data.status === 'success') {
          setLoadingStep(2);
          
          // Set questionnaire data
          setQuestionnaireData(response.data.data);
          
          // Check if there are responses
          if (response.data.data?.responses && response.data.data.responses.length > 0) {
            // Get the first response's processedInformation
            const processedInfo = response.data.data.responses[0].processedInformation;
            
            if (processedInfo) {
              // Initialize form data with all fields from the questionnaire template
              const initialFormData = {};
              questionnaire.field_mappings.forEach(field => {
                // Copy all field properties
                initialFormData[field._id] = {
                  ...field,
                  value: processedInfo[field._id]?.value || null
                };
              });
              
              // Log the initialized form data
              // console.log('Initialized questionnaire data:', initialFormData);
              
              // Save the form data
              setFormData(initialFormData);
              setIsQuestionnaireCompleted(true);
            } else {
              console.log('No processedInformation found in response, initializing empty form');
              // Initialize with all fields but no values
              const emptyFormData = {};
              questionnaire.field_mappings.forEach(field => {
                emptyFormData[field._id] = {
                  ...field,
                  value: null
                };
              });
              setFormData(emptyFormData);
            }
          } else {
            console.log('No responses found in API data, initializing empty form');
            // Initialize with all fields but no values
            const emptyFormData = {};
            questionnaire.field_mappings.forEach(field => {
              emptyFormData[field._id] = {
                ...field,
                value: null
              };
            });
            setFormData(emptyFormData);
          }
        } else {
          console.error('API request succeeded but returned error status:', response.data);
          toast.error('Failed to load questionnaire data: API returned error status');
          setFormData({});
        }
      } catch (error) {
        console.error('Error fetching questionnaire details:', error);
        toast.error('Failed to load questionnaire details: ' + (error.message || 'Unknown error'));
        // Initialize with empty data in case of error
        setFormData({});
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
          <h2 className="text-lg font-semibold text-gray-900">Questionnaire</h2>
        </div>

        <div className="space-y-3">
          {questionnaires.map((questionnaire) => (
            <div 
              key={questionnaire._id} 
              className="bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-all cursor-pointer"
              onClick={() => handleQuestionnaireClick(questionnaire)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-medium text-gray-900">{questionnaire.questionnaire_name}</h3>
              </div>
              <p className="text-sm text-gray-500">{questionnaire.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const QuestionnaireDetailView = ({ questionnaire, onBack }) => {
    // Add state for empty fields toggle
    const [showOnlyEmpty, setShowOnlyEmpty] = useState(false);
    // Add local state for form data
    const [localFormData, setLocalFormData] = useState(formData);
    // Add loading state for save action
    const [isSaving, setIsSaving] = useState(false);
    // Add state to track expanded accordion groups
    const [expandedGroups, setExpandedGroups] = useState({});

    // Update local form data when parent form data changes
    useEffect(() => {
      setLocalFormData(formData);
    }, [formData]);

    // Initialize all groups as expanded on first load
    useEffect(() => {
      if (localFormData && Object.keys(expandedGroups).length === 0) {
        const groups = {};
        // Get unique group names
        Object.values(localFormData).forEach(field => {
          if (field?.groupName) {
            groups[field.groupName] = true;
          }
        });
        // Get ordered group names to determine which is first
        const orderedGroupNames = Object.keys(groups).sort((a, b) => {
          // Find the first field of each group to compare their order
          const aFirstField = Object.values(localFormData).find(f => f.groupName === a);
          const bFirstField = Object.values(localFormData).find(f => f.groupName === b);
          const aIndex = aFirstField ? Object.values(localFormData).indexOf(aFirstField) : Infinity;
          const bIndex = bFirstField ? Object.values(localFormData).indexOf(bFirstField) : Infinity;
          return aIndex - bIndex;
        });
        // Only expand the first group
        const initialState = Object.keys(groups).reduce((acc, groupName) => {
          acc[groupName] = orderedGroupNames.length > 0 && groupName === orderedGroupNames[0];
          return acc;
        }, {});
        setExpandedGroups(initialState);
      }
    }, [localFormData]);

    // Toggle accordion expansion
    const toggleGroup = (groupName) => {
      setExpandedGroups(prev => ({
        ...prev,
        [groupName]: !prev[groupName]
      }));
    };

    // Expand all groups
    const expandAllGroups = () => {
      const allGroups = Object.keys(expandedGroups).reduce((acc, group) => {
        acc[group] = true;
        return acc;
      }, {});
      setExpandedGroups(allGroups);
    };

    // Collapse all groups
    const collapseAllGroups = () => {
      const allGroups = Object.keys(expandedGroups).reduce((acc, group) => {
        acc[group] = false;
        return acc;
      }, {});
      setExpandedGroups(allGroups);
    };

    // Updated function to check if a field is empty - works with new response format
    const isFieldEmpty = (fieldKey) => {
      const field = localFormData?.[fieldKey];
      if (!field) return true;
      if (field.fieldType && field.fieldType.toLowerCase().includes('radio')) {
        const groupFields = Object.values(localFormData || {}).filter(f => f.fieldType && f.fieldType.toLowerCase().includes('radio') && f.fieldLabel === field.fieldLabel);
        return !groupFields.some(f => f.value !== undefined && f.value !== null && f.value !== '');
      }
      return field.value === undefined || field.value === null || field.value === '';
    };
    const handleLocalInputChange = (fieldKey, value) => {
      setLocalFormData(prevData => {
        const updatedData = { ...prevData };
        if (updatedData[fieldKey]) {
          const field = updatedData[fieldKey];
          if (field.fieldType?.toLowerCase().includes('radio')) {
            // Always store the string value
          }
          updatedData[fieldKey] = {
            ...field,
            value: value
          };
        }
        return updatedData;
      });
    };

    // Updated save handler to maintain the correct structure
    const handleLocalSave = async () => {
      try {
        setIsSaving(true);
        
        // Update parent state
        setFormData(localFormData);
        
        // Create a trimmed version of the form data with only essential fields
        const trimmedFormData = {};
        Object.entries(localFormData).forEach(([key, field]) => {
          trimmedFormData[key] = {
            value: field.value,
            fieldName: field.fieldName,
            isDependent: field.isDependent,
            dependentFields: field.dependentFields
          };
        });
        
        // Create request payload with trimmed data
        const payload = {
          templateId: selectedQuestionnaire?._id,
          processedInformation: trimmedFormData
        };
        
        // Save the questionnaire data
        const response = await api.put(`/questionnaire-responses/management/${caseId}`, payload);
        
        if (response.data.status === 'success') {
          // Update the questionnaire response status to saved
          await api.put(`/questionnaire-responses/${caseId}/status`);
          
          // Update case step status to completed
          const questionnaireStep = caseSteps.find(step => step.key === 'questionnaire');
          if (questionnaireStep) {
            try {
              // Make API call to update step status
              await api.put(`/case-steps/case/${caseId}/step/questionnaire/status`, {
                status: 'completed'
              });
              console.log('Successfully updated questionnaire step status');
              // Refresh case steps to reflect the updated status
              await fetchCaseSteps();
            } catch (error) {
              console.error('Error updating questionnaire step status:', error);
              toast.error('Failed to update step status');
            }
          }
          
          toast.success('Changes saved successfully');
          setIsQuestionnaireCompleted(true);
        }
      } catch (error) {
        console.error('Error saving questionnaire:', error);
        toast.error('Failed to save changes');
      } finally {
        setIsSaving(false);
      }
    };
    const getFilledFieldsCount = () => {
      const allFields = Object.keys(localFormData || {});
      const totalFields = allFields.length;
      const filledFields = allFields.filter(fieldKey => !isFieldEmpty(fieldKey)).length;
      return { filledFields, totalFields };
    };
    // --- Visibility/Dependency Logic ---
    const evaluateDependencyRule = (rule, allFields) => {
      if (!rule) return true;
      const targetField = Object.values(allFields).find(f => f._id === rule.targetFieldId || f.fieldName === rule.targetField);
      if (!targetField) return false;
      switch (rule.type) {
        case 'NOT_EQUALS':
          return targetField.value !== rule.targetValue;
        case 'EQUALS':
          return targetField.value === rule.targetValue;
        case 'IN':
          return Array.isArray(rule.targetValue) && rule.targetValue.includes(targetField.value);
        case 'NOT_IN':
          return Array.isArray(rule.targetValue) && !rule.targetValue.includes(targetField.value);
        default:
          return false;
      }
    };
    const evaluateVisibilityCondition = (conditions, allFields) => {
      if (Array.isArray(conditions)) {
        return conditions.every(condition => {
          if (!condition || !condition.parentField || !Array.isArray(condition.showWhen)) {
            return true;
          }
          const parentField = Object.values(allFields).find(f => f._id === condition.parentField);
          if (!parentField) {
            return false;
          }
          return condition.showWhen.every(rule => {
            const parentValue = parentField.value;
            let result;
            switch (rule.operator) {
              case 'equals':
                result = parentValue === rule.value;
                break;
              case 'not_equals':
                result = parentValue !== rule.value;
                break;
              case 'in':
                result = Array.isArray(rule.value) && rule.value.includes(parentValue);
                break;
              case 'not_in':
                result = Array.isArray(rule.value) && !rule.value.includes(parentValue);
                break;
              case 'exists':
                result = parentValue !== null && parentValue !== undefined;
                break;
              case 'not_exists':
                result = parentValue === null || parentValue === undefined;
                break;
              case 'greater_than':
                result = !isNaN(parentValue) && parentValue > rule.value;
                break;
              case 'less_than':
                result = !isNaN(parentValue) && parentValue < rule.value;
                break;
              case 'greater_than_or_equal':
                result = !isNaN(parentValue) && parentValue >= rule.value;
                break;
              case 'less_than_or_equal':
                result = !isNaN(parentValue) && parentValue <= rule.value;
                break;
              default:
                result = false;
            }
            return result;
          });
        });
      }
      return true;
    };
    const convertOldToNewFormat = (oldConditions) => {
      if (!oldConditions || oldConditions.length === 0) return null;
      if (oldConditions.length === 1) {
        return {
          parentField: oldConditions[0].parentField,
          showWhen: oldConditions[0].showWhen
        };
      }
      const newFormat = {
        operator: 'AND',
        conditions: oldConditions.map(condition => ({
          parentField: condition.parentField,
          showWhen: condition.showWhen
        }))
      };
      return newFormat;
    };
    const evaluateCondition = (condition, allFields) => {
      if (Array.isArray(condition)) {
        return condition.every(cond => evaluateCondition(cond, allFields));
      }
      if (!condition) return true;
      if (condition.operator && condition.conditions) {
        const results = condition.conditions.map(c => evaluateCondition(c, allFields));
        switch (condition.operator) {
          case 'AND':
            return results.every(Boolean);
          case 'OR':
            return results.some(Boolean);
          case 'NOT':
            return results.length === 1 ? !results[0] : false;
          default:
            return false;
        }
      }
      if (condition.parentField && condition.showWhen) {
        const parentField = allFields[condition.parentField];
        if (!parentField) return false;
        let parentValue = parentField.value;
        return condition.showWhen.every(rule => {
          let ruleValue = rule.value;
          let fieldValue = parentValue;
          if (typeof ruleValue === 'string' && typeof fieldValue === 'string') {
            ruleValue = ruleValue.toLowerCase();
            fieldValue = fieldValue.toLowerCase();
          }
          switch (rule.operator) {
            case 'equals':
              return fieldValue === ruleValue;
            case 'not_equals':
              if (fieldValue === undefined || fieldValue === null || fieldValue === '') return false;
              return fieldValue !== ruleValue;
            case 'in':
              return Array.isArray(ruleValue) && ruleValue.map(v => typeof v === 'string' ? v.toLowerCase() : v).includes(fieldValue);
            case 'not_in':
              return Array.isArray(ruleValue) && !ruleValue.map(v => typeof v === 'string' ? v.toLowerCase() : v).includes(fieldValue);
            case 'exists':
              return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
            case 'not_exists':
              return fieldValue === undefined || fieldValue === null || fieldValue === '';
            case 'greater_than':
              return Number(fieldValue) > Number(ruleValue);
            case 'less_than':
              return Number(fieldValue) < Number(ruleValue);
            case 'greater_than_or_equal':
              return Number(fieldValue) >= Number(ruleValue);
            case 'less_than_or_equal':
              return Number(fieldValue) <= Number(ruleValue);
            default:
              return false;
          }
        });
      }
      console.warn('Invalid condition structure:', condition);
      return false;
    };
    const validateVisibilityConditions = (condition) => {
      if (!condition) return true;
      if (Array.isArray(condition)) {
        return condition.every(validateVisibilityConditions);
      }
      if (condition.operator && condition.conditions) {
        if (!['AND', 'OR', 'NOT'].includes(condition.operator)) {
          console.error('Invalid logical operator:', condition.operator);
          return false;
        }
        if (!Array.isArray(condition.conditions)) {
          console.error('Conditions must be an array');
          return false;
        }
        if (condition.operator === 'NOT' && condition.conditions.length !== 1) {
          console.error('NOT operator must have exactly one condition');
          return false;
        }
        return condition.conditions.every(c => validateVisibilityConditions(c));
      }
      if (condition.parentField && condition.showWhen) {
        if (!Array.isArray(condition.showWhen)) {
          console.error('showWhen must be an array');
          return false;
        }
        return condition.showWhen.every(rule => {
          const validOperators = [
            'equals', 'not_equals', 'in', 'not_in', 'exists', 'not_exists',
            'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal'
          ];
          if (!validOperators.includes(rule.operator)) {
            console.error('Invalid operator:', rule.operator);
            return false;
          }
          if (!['exists', 'not_exists'].includes(rule.operator)) {
            if (rule.value === undefined) {
              console.error('Value required for operator:', rule.operator);
              return false;
            }
            if (['greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal'].includes(rule.operator)) {
              if (typeof rule.value !== 'number' && !Number.isFinite(Number(rule.value))) {
                console.error('Numeric value required for operator:', rule.operator);
                return false;
              }
            }
          }
          return true;
        });
      }
      console.error('Invalid condition structure:', condition);
      return false;
    };
    const shouldShowField = (fieldKey) => {
      const field = allFields[fieldKey];
      if (!field) return false;
      if (fieldKey === 'flr' || field.fieldName === 'flr') {
          return false;
        }
      const isVisible = !field.visibilityConditions || (
        validateVisibilityConditions(field.visibilityConditions) &&
        evaluateCondition(field.visibilityConditions, allFields)
      );
      if (showOnlyEmpty) {
        return isVisible && isFieldEmpty(fieldKey);
      }
      return isVisible;
    };
    const { filledFields, totalFields } = getFilledFieldsCount();
    const getFields = () => {
      // If we have form data, get fields from it
      if (localFormData && Object.keys(localFormData).length > 0) {
        return localFormData;
      }
      return {};
    };
    const allFields = getFields();
    const allKeys = useMemo(() => Object.keys(localFormData || {}), [localFormData]);
    const groupedFields = useMemo(() => {
      const groups = {};
      const fieldSortingMap = new Map();
      Object.entries(localFormData || {}).forEach(([fieldKey, field], index) => {
        const groupName = field?.groupName || 'Ungrouped';
        const subGroup = field?.subGroup || null;
        fieldSortingMap.set(fieldKey, {
          subGroup: subGroup,
          originalIndex: index,
          groupName: groupName
        });
        if (!groups[groupName]) {
          groups[groupName] = {
            _subgroups: {}, // For fields that can be subgrouped by fieldLabel
            _individual: [] // For fields that don't share fieldLabel with others
          };
        }
      });
      const allFieldKeys = Array.from(fieldSortingMap.keys());
      allFieldKeys.forEach(fieldKey => {
          const field = localFormData[fieldKey];
        const sortingData = fieldSortingMap.get(fieldKey);
        const groupName = sortingData.groupName;
        if (field?.subGroup) {
          if (!groups[groupName]._subgroups[field.subGroup]) {
            groups[groupName]._subgroups[field.subGroup] = [];
          }
          groups[groupName]._subgroups[field.subGroup].push(fieldKey);
        } else {
          groups[groupName]._individual.push(fieldKey);
        }
      });
      const groupOrderMap = new Map();
      let orderIndex = 0;
      Object.entries(localFormData || {}).forEach(([fieldKey, field]) => {
        const groupName = field?.groupName || 'Ungrouped';
        if (!groupOrderMap.has(groupName)) {
          groupOrderMap.set(groupName, orderIndex++);
        }
      });
      const sortedGroups = {};
      Array.from(groupOrderMap.keys())
        .sort((a, b) => groupOrderMap.get(a) - groupOrderMap.get(b))
        .forEach(groupName => {
        if (groups[groupName]) {
          sortedGroups[groupName] = groups[groupName];
        }
      });
      return sortedGroups;
    }, [localFormData]);

    // Get filled fields count for a specific group (by unique fieldLabel)
    const getGroupCompletionStats = (groupData) => {
      if (!groupData) return { completed: 0, total: 0, percentage: 0 };

      // Collect all fields from individual and subgroups
      let allFields = [...groupData._individual];
      Object.values(groupData._subgroups || {}).forEach(subgroupFields => {
        allFields = [...allFields, ...subgroupFields];
      });

      // Map of fieldLabel to all fieldKeys with that label
      const labelToKeys = {};
      allFields.forEach(fieldKey => {
        const field = localFormData[fieldKey];
        const label = field?.fieldLabel || field?.label || fieldKey;
        if (!labelToKeys[label]) labelToKeys[label] = [];
        labelToKeys[label].push(fieldKey);
      });

      // For each label, consider it filled if ALL its fields are filled
      const total = Object.keys(labelToKeys).length;
      let completed = 0;
      Object.values(labelToKeys).forEach(keys => {
        if (keys.every(fieldKey => !isFieldEmpty(fieldKey))) {
          completed++;
        }
      });
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { completed, total, percentage };
    };

    // Render a single group of fields as an accordion
    const renderGroup = (groupName, groupData) => {
      // Define renderSubgroup inside renderGroup so it is in scope
      const renderSubgroup = (label, fields) => {
        const visibleSubgroupFields = fields.filter(shouldShowField);
        if (visibleSubgroupFields.length === 0) return null;
        // Render all fields inside a single card for the subgroup
        const elements = [];
        let i = 0;
        while (i < visibleSubgroupFields.length) {
          const fieldKey = visibleSubgroupFields[i];
          const field = localFormData[fieldKey];
          if (field.fieldType === 'Radio Button') {
            const radioLabel = field.fieldLabel;
            const radioFields = [];
            let j = i;
            while (
              j < visibleSubgroupFields.length &&
              localFormData[visibleSubgroupFields[j]].fieldType === 'Radio Button' &&
              localFormData[visibleSubgroupFields[j]].fieldLabel === radioLabel &&
              shouldShowField(visibleSubgroupFields[j])
            ) {
              radioFields.push(visibleSubgroupFields[j]);
              j++;
            }
            elements.push(
              <div key={`radio-group-subgroup-${label}-${radioLabel}-${i}`} className="mb-4 col-span-full">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-1 bg-blue-500 rounded-full"></div>
                    <div className="text-sm font-medium text-gray-700">{radioLabel}</div>
                  </div>
                  <div className={radioFields.length > 2 ? "grid grid-cols-1 md:grid-cols-3 gap-4" : "flex flex-row gap-6"}>
                    {radioFields.map(radioKey => renderField(radioKey, true))}
                  </div>
                </div>
              </div>
            );
            i = j;
            continue;
          }
          // Render normal field
          elements.push(
            <div key={fieldKey}>{renderField(fieldKey, false)}</div>
          );
          i++;
        }
        return (
          <div key={`subgroup-${label}`} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm w-full">
            <div className="font-semibold text-base text-blue-800 mb-4">{label}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {elements}
            </div>
          </div>
        );
      };
      // Strictly preserve MongoDB order by iterating through the original order
      // and rendering subgroups/individuals in place
      const allFieldKeys = [
        ...groupData._individual,
        ...Object.values(groupData._subgroups || {}).flat()
      ];
      // But we want the order as in the original formData
      const orderedKeys = Object.keys(localFormData).filter(
        key => localFormData[key]?.groupName === groupName
      );
      const renderedSubgroups = new Set();
      const elements = [];
      let i = 0;
      while (i < orderedKeys.length) {
        const fieldKey = orderedKeys[i];
        const field = localFormData[fieldKey];
        // If this is the first field of a subgroup, render the subgroup (once)
        if (field?.subGroup && groupData._subgroups?.[field.subGroup] && !renderedSubgroups.has(field.subGroup)) {
          // Only render subgroup if at least one field in it should be shown
          const subgroupFields = groupData._subgroups[field.subGroup];
          if (subgroupFields.some(shouldShowField)) {
            renderedSubgroups.add(field.subGroup);
            elements.push(renderSubgroup(field.subGroup, subgroupFields));
          }
          // Skip the rest of the fields in this subgroup
          i += subgroupFields.length;
          continue;
        }
        // If not in a subgroup, render as individual (with radio/checkbox grouping)
        if (!field?.subGroup && shouldShowField(fieldKey)) {
          // Use the same grouping logic as renderIndividualFields, but inline
          // Group consecutive radio/checkboxes with the same label
          if (field.fieldType === 'Radio Button') {
            const radioLabel = field.fieldLabel;
            const radioFields = [];
            let j = i;
            while (
              j < orderedKeys.length &&
              localFormData[orderedKeys[j]].fieldType === 'Radio Button' &&
              localFormData[orderedKeys[j]].fieldLabel === radioLabel &&
              !localFormData[orderedKeys[j]].subGroup &&
              shouldShowField(orderedKeys[j])
            ) {
              radioFields.push(orderedKeys[j]);
              j++;
            }
            elements.push(
              <div key={`radio-group-individual-${groupName}-${radioLabel}-${i}`} className="mb-4 col-span-full">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-1 bg-blue-500 rounded-full"></div>
                    <div className="text-sm font-medium text-gray-700">{radioLabel}</div>
                  </div>
                  <div className={radioFields.length > 2 ? "grid grid-cols-1 md:grid-cols-3 gap-4" : "flex flex-row gap-6"}>
                    {radioFields.map(radioKey => renderField(radioKey, true))}
                  </div>
                </div>
              </div>
            );
            i = j;
            continue;
          }
          if (field.fieldType === 'Checkbox') {
            const checkboxLabel = field.fieldLabel;
            const checkboxFields = [];
            let j = i;
            while (
              j < orderedKeys.length &&
              localFormData[orderedKeys[j]].fieldType === 'Checkbox' &&
              localFormData[orderedKeys[j]].fieldLabel === checkboxLabel &&
              !localFormData[orderedKeys[j]].subGroup &&
              shouldShowField(orderedKeys[j])
            ) {
              checkboxFields.push(orderedKeys[j]);
              j++;
            }
            elements.push(
              <div key={`checkbox-group-individual-${groupName}-${checkboxLabel}-${i}`} className="mb-4 col-span-full">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-1 bg-blue-500 rounded-full"></div>
                    <div className="text-sm font-medium text-gray-700">{checkboxLabel}</div>
                  </div>
                  <div className={checkboxFields.length > 2 ? "grid grid-cols-1 md:grid-cols-3 gap-4" : "flex flex-row gap-6"}>
                    {checkboxFields.map(checkboxKey => renderField(checkboxKey, true))}
                  </div>
                </div>
              </div>
            );
            i = j;
            continue;
          }
          // Render normal field
          elements.push(
            <div key={fieldKey}>{renderField(fieldKey, false)}</div>
          );
        }
        i++;
      }
      const { completed, total, percentage } = getGroupCompletionStats(groupData);
      const isExpanded = expandedGroups[groupName] || false;
      const hasSubgroups = Object.keys(groupData._subgroups || {}).length > 0;
      return (
        <div key={groupName} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          {/* Accordion Header */}
          <div 
            className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors
              ${isExpanded 
                ? 'bg-blue-50 hover:bg-blue-100' 
                : 'bg-gray-50 hover:bg-gray-100'}`}
            onClick={() => toggleGroup(groupName)}
          >
            <div className="flex items-center gap-3">
              <div className={`
                p-2 rounded-full 
                ${isExpanded ? 'bg-blue-100' : 'bg-gray-200'}
              `}>
                {isExpanded 
                  ? <ChevronDown className="w-4 h-4 text-blue-600" />
                  : <ChevronRight className="w-4 h-4 text-gray-600" />
                }
              </div>
              <h3 className={`text-lg font-medium 
                ${isExpanded ? 'text-blue-800' : 'text-gray-800'}`}
              >
                {groupName}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {/* Completion status */}
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-600 whitespace-nowrap">
                  {completed} of {total} completed
                </div>
                {/* Progress bar */}
                <div className="w-20 h-1.5 bg-gray-200 rounded overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 
                      ${percentage === 100 
                        ? 'bg-green-500' 
                        : percentage > 50 
                          ? 'bg-blue-500' 
                          : 'bg-amber-500'}`
                      }
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Accordion Content */}
          {isExpanded && (
            <div className="p-4 bg-white border-t border-gray-200">
              {hasSubgroups ? (
                <div className="flex flex-col gap-6">
                  {elements}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {elements}
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

    const renderField = (fieldKey, hideLabel = false) => {
      // Get the field object
      let field = localFormData[fieldKey];
      
      // Use the fieldLabel from the response - prefer field.label, fallback to fieldKey
      let fieldLabel = field?.fieldLabel || field?.label || fieldKey;
      
      // --- Dynamic label logic using subGroup and fieldName ---
      // If the field has a subGroup, append it to the label (unless already present)
      if (field?.subGroup) {
        // Only append if not already in the label
        if (!fieldLabel.includes(field.subGroup)) {
          fieldLabel += ` (${field.subGroup})`;
        }
      }
      // If no subGroup, just use the label as is
      // (No special handling for fieldName required unless you want to customize further)
      // --------------------------------------------------------
      
      // Get the fieldName for reference
      const fieldName = field?.fieldName || '';
      
      // Get field type from the response
      const fieldType = field?.fieldType || 'Text Field';
      
      // Ensure the Street Number field is properly labeled
      if (fieldKey === 'ste' && field) {
        field.fieldLabel = 'Street Number and Name';
        field.fieldType = 'Text Field';
      }
      
      // Get field values if available (for dropdowns, radio buttons, checkboxes)
      const fieldValues = field?.values;

      // Determine input type based on fieldType
      const getInputType = () => {
        // Field type detection based on explicit fieldType property
        if (fieldType) {
          const type = fieldType.toLowerCase();
          
          if (type.includes('email')) return 'email';
          if (type.includes('date')) return 'date';
          if (type.includes('numerical') || type.includes('number')) return 'number';
          if (type === 'checkbox' || type === 'radio button') return type;
          if (type === 'dropdown') return 'dropdown';
          
          // If it's explicitly labeled as a text field
          if (type.includes('text')) return isTextareaField ? 'textarea' : 'text';
        }
        
        // Special case for "ste" field in Residential Address History
        if (fieldName === 'ste' || fieldKey === 'ste') {
          return 'text';
        }
        
        // Fallback detection based on field name and value format
        const lowerFieldName = fieldName.toLowerCase();
        const lowerFieldLabel = fieldKey.toLowerCase();
        const fieldValue = field?.value;
        
        // Check for email type - check both name pattern and value format
        if (
          lowerFieldName.includes('email') || 
          lowerFieldLabel.includes('email') ||
          (fieldValue && typeof fieldValue === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue))
        ) {
          return 'email';
        }
        
        // Enhanced date detection - check both field name patterns and actual values
        const dateRelatedTerms = ['date', 'dob', 'birth', 'expiry', 'issued'];
        const isDateField = dateRelatedTerms.some(term => 
          lowerFieldName.includes(term) || lowerFieldLabel.includes(term)
        );
        
        if (isDateField) return 'date';
        
        // Default to text
        return 'text';
      };
      
      // Determine if it's a textarea field based on fieldName or label
      const isTextareaField = 
        fieldName.includes('note') || 
        fieldName.includes('brief') || 
        fieldName.includes('details') || 
        fieldName.includes('plan') ||
        fieldKey.toLowerCase().includes('note') || 
        fieldKey.toLowerCase().includes('brief') || 
        fieldKey.toLowerCase().includes('details') || 
        fieldKey.toLowerCase().includes('plan');
      
      const inputType = getInputType();

      // Format date value for input
      const formatDateValue = (value) => {
        if (!value) return '';
        try {
          const date = new Date(value);
          if (isNaN(date.getTime())) return '';
          return date.toISOString().split('T')[0];
        } catch (error) {
          return '';
        }
      };
      
      // Get options for dropdown/radio/checkbox
      const getOptions = () => {
        if (!fieldValues) return [];
        
        // If fieldValues is a string containing "Country List" or "State List"
        if (typeof fieldValues === 'string') {
          if (fieldValues.includes('Country List')) {
            // Return a common list of countries
            return [
              'United States', 'Canada', 'Mexico', 'United Kingdom', 'China', 'India', 
              'Australia', 'Germany', 'France', 'Japan', 'Brazil', 'Russia'
              // In production, use a complete country list or fetch from API
            ];
          }
          
          if (fieldValues.includes('State List')) {
            // Return a list of US states
            return [
              'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
              'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 
              'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
              'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
              'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
              'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
              'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
              'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
              'West Virginia', 'Wisconsin', 'Wyoming'
            ];
          }
          
          // If fieldValues is a single option string
          return [fieldValues];
        }
        
        // If it's already an array, return it
        if (Array.isArray(fieldValues)) {
          return fieldValues;
        }
        
        // If it's a comma-separated string, split it
        if (typeof fieldValues === 'string' && fieldValues.includes(',')) {
          return fieldValues.split(',').map(val => val.trim());
        }
        
        // Default: return an empty array
        return [];
      };
      
      const options = getOptions();
      
      // For radio buttons, get the value from the option
      const getRadioValue = () => {
        if (inputType !== 'radio button') return null;
        
        // For radio buttons, extract the option value from the field name
        // e.g., for "sex_male", the value is "male"
        const match = fieldName.match(/^.+?_(yes|no|male|female|true|false|other|unknown|\d+|[\w-]+)$/i);
        return match ? match[1] : fieldValues;
      };
      
      // Get the current value for this radio option
      const radioValue = getRadioValue();
      
      // For radio buttons/checkboxes, determine if an option is checked
      const isOptionChecked = (optionValue) => {
        if (field?.value === undefined || field?.value === null) return false;
        
        // For checkboxes with array values
        if (inputType === 'checkbox' && Array.isArray(field.value)) {
          return field.value.includes(optionValue);
        }
        
        // For checkboxes with boolean values (single checkbox case)
        if (inputType === 'checkbox' && typeof field.value === 'boolean') {
          return field.value;
        }
        
        // For radio buttons
        if (inputType === 'radio button') {
          return field.value === optionValue;
        }
        
        // For regular fields
        return field.value === optionValue;
      };
      
      // Handle value changes
      const handleChange = (value, optionValue) => {
        if (inputType === 'radio button') {
          // For radio buttons
          // Get the fieldLabel for grouping
          const currentFieldLabel = field?.fieldLabel || '';
          // Find all related radio fields with the same fieldLabel
          const relatedFields = Object.entries(localFormData).filter(([key, val]) => {
            if (!val.fieldLabel) return false;
            // Match if they share the same fieldLabel
            return val.fieldLabel === currentFieldLabel && key !== fieldKey;
          });
          // Set all related fields to empty string
          relatedFields.forEach(([key, _]) => {
            handleLocalInputChange(key, "");
          });
          // Set this field to the actual option value
          handleLocalInputChange(fieldKey, fieldValues || radioValue || optionValue);
        } else if (inputType === 'checkbox') {
          if (Array.isArray(field.value)) {
            // For multiple checkboxes, toggle the value in the array
            const newValue = field.value.includes(optionValue)
              ? field.value.filter(v => v !== optionValue)
              : [...field.value, optionValue];
            handleLocalInputChange(fieldKey, newValue);
          } else {
            // For single checkbox, toggle boolean value
            handleLocalInputChange(fieldKey, value);
          }
        } else {
          // For other input types, just set the value
          handleLocalInputChange(fieldKey, value);
        }
      };
      
      // Generate a unique ID for the field
      const fieldId = `field-${fieldName.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Get the base question name for radio groups
      const baseQuestionName = field?.fieldLabel || fieldName;
      
      // Create radio group name - this groups related radio options together
      const radioGroupName = `radio-group-${baseQuestionName.toLowerCase().replace(/\s+/g, '-')}`;

      return (
        <div key={fieldKey} className="mb-4">
          {/* Only show label for non-radio fields */}
          {!hideLabel && inputType !== 'radio button' && (
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
              {fieldLabel}
              {field?.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          
          {inputType === 'textarea' && (
            <textarea
              id={fieldId}
              value={field?.value || ''}
              onChange={(e) => handleLocalInputChange(fieldKey, e.target.value)}
              className={`w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[80px]
                ${isFieldEmpty(fieldKey)
                  ? 'border-red-300 bg-red-50/50 focus:border-red-400'
                  : 'border-gray-200 focus:border-blue-400'
                }`}
            />
          )}
          
          {['text', 'email', 'date', 'number'].includes(inputType) && (
            <input
              id={fieldId}
              type={inputType}
              value={inputType === 'date' 
                ? formatDateValue(field?.value) 
                : (field?.value || '')}
              onChange={(e) => handleLocalInputChange(fieldKey, e.target.value)}
              className={`w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 
                ${isFieldEmpty(fieldKey)
                  ? 'border-red-300 bg-red-50/50 focus:border-red-400'
                  : 'border-gray-200 focus:border-blue-400'
                }`}
            />
          )}
          
          {inputType === 'dropdown' && (
            <select
              id={fieldId}
              value={field?.value || ''}
              onChange={(e) => handleLocalInputChange(fieldKey, e.target.value)}
              className={`w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 
                ${isFieldEmpty(fieldKey)
                  ? 'border-red-300 bg-red-50/50 focus:border-red-400'
                  : 'border-gray-200 focus:border-blue-400'
                }`}
            >
              <option value="">Select an option</option>
              {options.map((option, index) => (
                <option key={`${fieldId}-option-${index}`} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
          
          {inputType === 'radio button' && (
            <div className="mt-1 space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id={fieldId}
                  name={radioGroupName}
                  checked={!!field.value}
                  onChange={() => handleChange(true)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label 
                  htmlFor={fieldId} 
                  className="text-sm text-gray-700 cursor-pointer select-none"
                  onClick={() => handleChange(true)}
                >
                  {fieldValues || radioValue || 'Yes'}
                </label>
                {field.value && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Clear all radios in the group
                      Object.entries(localFormData).forEach(([key, val]) => {
                        if (
                          val.fieldType &&
                          val.fieldType.toLowerCase().includes('radio') &&
                          val.fieldLabel === field.fieldLabel
                        ) {
                          handleLocalInputChange(key, "");
                        }
                      });
                    }}
                    className="ml-2 text-xs text-gray-400 hover:text-red-500 focus:outline-none"
                    title="Unselect this option"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
          
          {inputType === 'checkbox' && (
            <div className="mt-1 space-y-2">
              {options.length > 0 ? (
                // Multi-option checkbox group
                options.map((option, index) => (
                  <div key={`${fieldId}-option-${index}`} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`${fieldId}-${index}`}
                      value={option}
                      checked={isOptionChecked(option)}
                      onChange={(e) => handleChange(e.target.checked, option)}
                      className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`${fieldId}-${index}`} className="text-sm text-gray-700">
                      {option}
                    </label>
                  </div>
                ))
              ) : (
                // Single checkbox (true/false)
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={fieldId}
                    checked={!!field.value}
                    onChange={(e) => handleLocalInputChange(fieldKey, e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={fieldId} className="text-sm text-gray-700">
                    {fieldLabel}
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

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
              </div>
              <p className="text-sm text-gray-600">{questionnaire?.questionnaire_name || 'Response Details'}</p>
            </div>
          </div>
          <div className='flex items-center gap-4'>
            {/* Add Empty Fields Toggle Button */}
            <button
              onClick={() => setShowOnlyEmpty(!showOnlyEmpty)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2
                ${showOnlyEmpty 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {showOnlyEmpty ? (
                <>
                  <Eye className="w-4 h-4" />
                  Show All Fields
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Show Empty Fields
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                {filledFields} out of {totalFields} fields completed
              </div>
              {/* Progress bar with animated dots */}
              <div className="relative w-32">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${totalFields ? (filledFields / totalFields) * 100 : 0}%` }}
                  />
                </div>
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
              onClick={handleLocalSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
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

        {/* Accordion controls */}
        <div className="flex items-center justify-end mb-4 gap-2">
          <button
            onClick={expandAllGroups}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <ChevronDown className="w-3 h-3" />
            <span>Expand All</span>
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={collapseAllGroups}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <ChevronRight className="w-3 h-3" />
            <span>Collapse All</span>
          </button>
        </div>

        {/* Form Content - Grouped by sections */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {Object.keys(groupedFields).length > 0 ? (
            Object.entries(groupedFields).map(([groupName, groupData]) => 
              renderGroup(groupName, groupData)
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              No questionnaire fields found. Please check the API response.
            </div>
          )}
        </div>

        {/* Show message when no empty fields match the filter */}
        {showOnlyEmpty && Object.keys(groupedFields).length > 0 && 
         !Object.entries(groupedFields).some(([_, groupData]) => {
           // Check if any individual fields should be shown
           const hasVisibleIndividualFields = groupData._individual.some(shouldShowField);
           
           // Check if any subgrouped fields should be shown
           const hasVisibleSubgroupFields = Object.values(groupData._subgroups || {})
             .some(subgroupFields => subgroupFields.some(shouldShowField));
           
           return hasVisibleIndividualFields || hasVisibleSubgroupFields;
         }) && (
          <div className="text-center py-8 text-gray-500">
            No empty fields found!
          </div>
        )}
      </div>
    );
  };

  // Function to handle escalating to attorney
  const handleEscalateToAttorney = async () => {
    if (!currentChat || !caseId || !caseData || !profileData) {
      console.error('Missing required data:', { currentChat, caseId, caseData, profileData });
      toast.error('Missing required data for escalation');
      return;
    }
    
    setIsEscalating(true);
    try {
      // Get attorney data from local storage
      const storedUser = getStoredUser();
      const attorneyEmail = storedUser?.attorney_id?.email;
      const attorneyName = storedUser?.attorney_name;
      const attorneyFirstName = attorneyName?.split(' ')[0] || 'Attorney';
      
      if (!attorneyEmail) {
        throw new Error('Attorney email not found in local storage');
      }
      
      // Generate chat history link
      const chatHistoryLink = `${window.location.origin}/cases/${caseId}?tab=overview&chatId=${currentChat._id}`;
      
      // Log the request data
      console.log('Sending escalation request with data:', {
        attorneyEmail,
        attorneyFirstName,
        fnName: profileData.name,
        caseType: caseData.categoryName,
        query: escalateQuery,
        chatHistoryLink,
        ccEmails: [profileData.email, attorneyEmail].filter(Boolean)
      });
      
      // Send escalation email
      const response = await api.post('/mail/escalate', {
        attorneyEmail,
        attorneyFirstName,
        fnName: profileData.name,
        caseType: caseData.categoryName,
        query: escalateQuery,
        chatHistoryLink,
        ccEmails: [profileData.email, caseData.caseManagerId?.email].filter(Boolean)
      });
      
      console.log('Escalation response:', response.data);
      
      if (response.data.status === 'success') {
        toast.success('Query escalated to attorney successfully');
        setShowEscalateModal(false);
        setEscalateQuery('');
      } else {
        throw new Error(response.data.message || 'Failed to escalate query');
      }
    } catch (error) {
      console.error('Error escalating query:', error.response?.data || error);
      toast.error(error.response?.data?.message || error.message || 'Failed to escalate query');
    } finally {
      setIsEscalating(false);
    }
  };

  // Function to handle closing the calendar
  const handleCloseCalendar = () => {
    const placeholder = document.getElementById('cal-booking-placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
      placeholder.classList.add('hidden');
    }
    // Also reset any Cal.com state
    const cal = window.Cal;
    if (cal) {
      cal('reset');
    }
  };

  // Function to handle opening Cal.com scheduling
  const handleScheduleMeeting = async () => {
    try {
      if (!caseData?.caseManagerId?.calendarLink) {
        toast.error('No calendar link available for the assigned attorney');
        return;
      }

      // Initialize Cal.com
      const cal = await getCalApi();
      if (!cal) {
        toast.error('Calendar API not initialized');
        return;
      }

      // Extract the calendar username and event type from the link
      let calLink = caseData.caseManagerId.calendarLink;
      // Remove any http/https prefix and domain if present
      calLink = calLink.replace(/^(https?:\/\/)?(app\.)?cal\.com\//, '');
      
      // Open Cal.com modal
      cal('ui', {
        styles: { branding: { brandColor: '#000000' } },
        hideEventTypeDetails: false,
        layout: 'month_view'
      });

      cal('modal', {
        calLink: calLink,
        config: {
          name: profileData?.name || '',
          email: profileData?.email || '',
          notes: `Case ID: ${caseId}`,
        }
      });

    } catch (error) {
      console.error('Error opening Cal.com:', error);
      toast.error('Unable to open scheduling widget. Please try again.');
    }
  };

  // Function to generate AI query suggestion
  const generateQuerySuggestion = async () => {
    if (!currentChat || !caseId) {
      toast.error('No active chat found');
      return;
    }
    
    setIsGeneratingSuggestion(true);
    try {
      // Call the OpenAI endpoint to generate a query suggestion
      const response = await api.post('/ai/generate-query', {
        chatId: currentChat._id,
        managementId: caseId
      });
      
      if (response.data.status === 'success') {
        const suggestion = response.data.data.suggestion;
        setAiQuerySuggestion(suggestion);
        setEscalateQuery(suggestion);
        
        // Show success message
        toast.success('Query suggestion generated successfully');
      } else {
        throw new Error(response.data.message || 'Failed to generate query suggestion');
      }
    } catch (error) {
      console.error('Error generating query suggestion:', error);
      toast.error(error.message || 'Failed to generate query suggestion');
    } finally {
      setIsGeneratingSuggestion(false);
    }
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

            {/* Cal.com embed placeholder */}
            <div id="cal-booking-placeholder" className="hidden fixed inset-0 z-[10000] bg-white">
              <button 
                onClick={() => {
                  const placeholder = document.getElementById('cal-booking-placeholder');
                  if (placeholder) placeholder.classList.add('hidden');
                }}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100/50 rounded-full transition-all"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat messages area */}
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
                    {message.role === 'assistant' ? (
                      <div className="text-sm whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none">
                        <div 
                          className="[&>h3]:text-gray-800 [&>h3]:font-semibold [&>h3]:text-base [&>h3]:mt-4 [&>h3]:mb-2 [&>strong]:text-inherit [&>br]:my-1"
                          dangerouslySetInnerHTML={{ __html: formatSophiaMessage(message.content) }}
                        />
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    )}
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

            {/* Attorney options section - Above the input form */}
            {messages.length >= 6 && currentChat && messages[messages.length - 1]?.role === 'assistant' && (
              <div className="border-t border-slate-100 bg-white">
                <div className="flex flex-col items-center py-3">
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showAttorneyOptions ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex justify-center gap-4 px-6 py-4">
                      <button
                        onClick={() => {
                          setShowEscalateModal(true);
                          if (currentChat) {
                            generateQuerySuggestion();
                          }
                          setShowAttorneyOptions(false);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                      >
                        <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 6V2H8"/>
                          <path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z"/>
                          <path d="M2 12h2"/>
                          <path d="M9 11v2"/>
                          <path d="M15 11v2"/>
                          <path d="M20 12h2"/>
                        </svg>
                        <span>Escalate Query</span>
                      </button>
                      <button
                        onClick={() => {
                          handleScheduleMeeting();
                          setShowAttorneyOptions(false);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Schedule Meeting</span>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAttorneyOptions(!showAttorneyOptions)}
                    className="group px-4 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-medium transition-all duration-200 flex items-center gap-2 border border-slate-200 hover:border-slate-300 hover:shadow-sm"
                  >
                    {!showAttorneyOptions && (
                      <svg 
                        className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-colors" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                        />
                      </svg>
                    )}
                    <span className="min-w-[120px] text-center">
                      {showAttorneyOptions ? "Continue chat with Sophia" : "Speak to attorney"}
                    </span>
                    <svg 
                      className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-all duration-300 transform ${showAttorneyOptions ? 'rotate-180' : ''}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

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
        
        {/* Escalate to Attorney Modal */}
        {showEscalateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
            <div className="bg-white rounded-2xl shadow-xl w-[500px] max-h-[90vh] overflow-hidden animate-fadeIn">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">Escalate to Attorney</h3>
                  <button 
                    onClick={() => setShowEscalateModal(false)}
                    className="p-1 hover:bg-slate-100 rounded-full transition-all"
                  >
                    <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-sm text-slate-600 mb-4">
                  This will create a query for your attorney based on your chat with Sophia. You can edit the query before sending.You can view the progress of this query in the message section.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Query for Attorney
                  </label>
                  <div className="relative">
                    <textarea
                      value={escalateQuery}
                      onChange={(e) => setEscalateQuery(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 transition-all min-h-[120px]"
                      placeholder="Describe your query for the attorney..."
                    />
                    {isGeneratingSuggestion && (
                      <div className="absolute top-2 right-2 p-2">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                      </div>
                    )}
                    
                  </div>
                </div>
                
                {/* Removed AI suggestion display section */}
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowEscalateModal(false)}
                  className="px-4 py-2 text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleMeeting}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule Meeting
                </button>
                <button
                  onClick={handleEscalateToAttorney}
                  disabled={isEscalating || !escalateQuery.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isEscalating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Escalating...</span>
                    </>
                  ) : (
                    <>
                      

                      <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 6V2H8"/>
                        <path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z"/>
                        <path d="M2 12h2"/>
                        <path d="M9 11v2"/>
                        <path d="M15 11v2"/>
                        <path d="M20 12h2"/>
                      </svg>
                      <span>Escalate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
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

  // Update cross verification function 
  const handleCrossVerification = async () => {
    try {
      setIsVerificationLoading(true);
      
      // First check localStorage for cached cross-verification data
      const savedVerificationData = localStorage.getItem(`cross-verification-data-${caseId}`);
      if (savedVerificationData) {
        try {
          const parsedData = JSON.parse(savedVerificationData);
          console.log('Using cross-verification data from localStorage:', parsedData);
          
          // Set cross-verification data from localStorage
          setVerificationData(parsedData);
          verificationDataRef.current = parsedData;
          
          // Return early - no need to make API call
          setIsVerificationLoading(false);
          return parsedData;
        } catch (parseError) {
          console.error('Error parsing cross-verification data from localStorage:', parseError);
          // Continue with API call if parsing fails
        }
      }
      
      // If no data in localStorage or parsing failed, fetch from API
      console.log('Starting cross-verification for case:', caseId);
      
      // First try check-cross-verify endpoint
      try {
        const response = await api.get(`/management/${caseId}/check-cross-verify`);
        if (response.data.status === 'success') {
          // Process and store verification data
          const crossVerificationData = response.data.data;
          setVerificationData(crossVerificationData);
          verificationDataRef.current = crossVerificationData;
          
          // Save to localStorage
          localStorage.setItem(`cross-verification-data-${caseId}`, JSON.stringify(crossVerificationData));
          
          // Return early
          return crossVerificationData;
        }
      } catch (checkError) {
        console.log('check-cross-verify endpoint failed, trying cross-verify endpoint');
        // Fall through to try the other endpoint
      }
      
      // Try the regular cross-verify endpoint as fallback
      const response = await api.get(`/management/${caseId}/cross-verify`);
      
      if (response.data.status === 'success') {
        console.log('Cross-verification response:', response.data.data);
        
        // Set in state and ref
        setVerificationData(response.data.data);
        verificationDataRef.current = response.data.data;
        
        // Save to localStorage
        try {
          localStorage.setItem(`cross-verification-data-${caseId}`, JSON.stringify(response.data.data));
          console.log('Saved cross-verification data to localStorage');
        } catch (storageError) {
          console.error('Error saving cross-verification data to localStorage:', storageError);
        }
        
        // Update case data to reflect any status changes
        const caseResponse = await api.get(`/management/${caseId}`);
        if (caseResponse.data.status === 'success') {
          console.log('Updated case data:', caseResponse.data.data.entry);
          setCaseData(caseResponse.data.data.entry);
        }
        
        return response.data.data;
      }
    } catch (error) {
      console.error('Error during cross-verification:', error);
      toast.error('Failed to perform cross-verification');
    } finally {
      setIsVerificationLoading(false);
    }
    return null;
  };

  // Add function to fetch validation data
  const fetchValidationData = async () => {
    if (isValidationLoading) return;
    
    try {
      setIsValidationLoading(true);
      
      // Check if caseData exists
      if (!caseData) {
        console.log('Case data not yet loaded, fetching case data first');
        const caseResponse = await api.get(`/management/${caseId}`);
        if (caseResponse.data.status === 'success') {
          setCaseData(caseResponse.data.data.entry);
        } else {
          throw new Error('Failed to fetch case data');
        }
      }
      
      // Get regular documents (not storage-only) - use optional chaining
      const regularDocTypes = caseData?.documentTypes
        ?.filter(doc => (doc.status === 'uploaded' || doc.status === 'approved'))
        ?.map(doc => doc._id) || [];

      if (regularDocTypes.length === 0) {
        console.log('No uploaded documents found for validation');
        setValidationData(null);
        return null;
      }

      const [validationResponse, documentsResponse] = await Promise.all([
        api.get(`/documents/management/${caseId}/validations`),
        api.post('/documents/management-docs', {
          managementId: caseId,
          docTypeIds: regularDocTypes
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
        validationDataRef.current = validationDataWithUrls;
        
        return validationDataWithUrls;
      }
    } catch (error) {
      console.error('Error fetching validation data:', error);
      toast.error('Failed to load validation data');
    } finally {
      setIsValidationLoading(false);
    }
    return null;
  };

  // Update the tab click handler
  const handleTabClick = (tab) => {
    const newTab = tab.toLowerCase().replace(' ', '-');
    
    // Check if any documents are uploaded
    const hasUploadedDocuments = caseData?.documentTypes?.some(doc => 
      doc.status === 'uploaded' || doc.status === 'approved'
    );

    // If trying to access questionnaire without documents, show toast and don't change tab
    if (newTab === 'questionnaire' && !hasUploadedDocuments) {
      toast.error('Please upload required documents before accessing the questionnaire', {
        position: 'top-center',
        duration: 3000,
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          padding: '16px',
          borderRadius: '8px',
        },
      });
      return;
    }

    setActiveTab(newTab);
    if (newTab === 'documents-checklist') {
      setUploadStatus('pending');
    }
  };

  // Update this function to properly handle document reupload
  const handleDocumentReupload = async (documentTypeId) => {
    try {
      setProcessingDocuments(prev => ({
        ...prev,
        [documentTypeId]: true
      }));

      // Use the dedicated reupload endpoint
      const response = await api.patch(`/management/${caseId}/documents/${documentTypeId}/reupload`);
      
      if (response.data.status === 'success') {
        // Refresh case data
        const caseResponse = await api.get(`/management/${caseId}`);
        if (caseResponse.data.status === 'success') {
          const updatedCaseData = caseResponse.data.data.entry;
          setCaseData(updatedCaseData);

          // Clear validation data for this document from the current validation state
          if (validationDataRef.current?.mergedValidations) {
            const updatedValidations = validationDataRef.current.mergedValidations.filter(
              validation => validation.documentType !== updatedCaseData.documentTypes.find(
                dt => dt.documentTypeId === documentTypeId
              )?.name
            );

            const newValidationData = {
              ...validationDataRef.current,
              mergedValidations: updatedValidations
            };

            // Update both the ref and state
            validationDataRef.current = newValidationData;
            setValidationData(newValidationData);

            // Clear from localStorage as well
            try {
              localStorage.setItem(`validation-data-${caseId}`, JSON.stringify(newValidationData));
            } catch (storageError) {
              console.error('Error updating validation data in localStorage:', storageError);
            }
          }

          toast.success('Document sent for reupload');
        }
      }
    } catch (error) {
      console.error('Error requesting document reupload:', error);
      toast.error('Failed to initiate document reupload');
    } finally {
      setProcessingDocuments(prev => ({
        ...prev,
        [documentTypeId]: false
      }));
    }
  };

  // Add function to fetch cross-verification data
  const fetchCrossVerificationData = async () => {
    // This function should only be responsible for fetching data from the API
    if (!isVerificationLoading) {
      try {
        console.log('Making API call to fetch cross-verification data');
        setIsVerificationLoading(true);
        const response = await api.get(`/management/${caseId}/check-cross-verify`);
        if (response.data.status === 'success') {
          const crossVerificationData = response.data.data;
          
          // Update both state and ref
          setVerificationData(crossVerificationData);
          verificationDataRef.current = crossVerificationData;
          
          // Save to localStorage for persistence
          try {
            localStorage.setItem(`cross-verification-data-${caseId}`, JSON.stringify(crossVerificationData));
            console.log('Saved fetched cross-verification data to localStorage');
          } catch (storageError) {
            console.error('Error saving cross-verification data to localStorage:', storageError);
          }
          
          return crossVerificationData;
        }
      } catch (error) {
        console.error('Error fetching verification data:', error);
        toast.error('Failed to load verification data');
      } finally {
        setIsVerificationLoading(false);
      }
    }
    return null;
  };

  // Initialize Cal.com
  useEffect(() => {
    (async function initCal() {
      try {
        await getCalApi();
      } catch (error) {
        console.error('Error initializing Cal.com:', error);
      }
    })();
  }, []); // Empty dependency array means this runs once on mount

  // Add this effect to hide attorney options when chat popup is closed
  useEffect(() => {
    if (!showChatPopup) {
      setShowAttorneyOptions(false);
    }
  }, [showChatPopup]);

  // Helper function to check if a document is storage-only
  const isStorageOnlyDocument = (documentId) => {
    return caseData?.storageOnlyDocs?.some(doc => doc.documentTypeId === documentId);
  };

  // Add fetchCaseSteps function
  const fetchCaseSteps = async () => {
    try {
      const response = await api.get(`/case-steps/case/${caseId}`);
      if (response.data.status === 'success') {
        // Filter only the steps we want to show for FN user
        const allowedStepKeys = ['retainer', 'payment', 'document-checklist', 'questionnaire'];
        const filteredSteps = response.data.data.steps.filter(step => 
          allowedStepKeys.includes(step.key)
        ).sort((a, b) => a.order - b.order);
        
        setCaseSteps(filteredSteps);
      }
    } catch (error) {
      console.error('Error fetching case steps:', error);
    }
  };

  // Add useEffect to fetch steps
  useEffect(() => {
    if (caseId) {
      fetchCaseSteps();
    }
  }, [caseId]);

  // Modify TabNavigation to use caseSteps
  const TabNavigation = () => {
    const [scrollPosition, setScrollPosition] = useState(0);
    const tabsContainerRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    useEffect(() => {
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => window.removeEventListener('resize', checkScroll);
    }, []);

    const checkScroll = () => {
      if (tabsContainerRef.current) {
        const { scrollWidth, clientWidth } = tabsContainerRef.current;
        setShowLeftArrow(scrollPosition > 0);
        setShowRightArrow(scrollPosition < scrollWidth - clientWidth);
      }
    };

    const handleScroll = (direction) => {
      if (tabsContainerRef.current) {
        const newPosition = direction === 'left'
          ? Math.max(0, scrollPosition - 200)
          : Math.min(
              tabsContainerRef.current.scrollWidth - tabsContainerRef.current.clientWidth,
              scrollPosition + 200
            );
        setScrollPosition(newPosition);
        tabsContainerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      }
    };

    // Map step keys to icons
    const stepIcons = {
      'retainer': FileText,
      'payment': CreditCard,
      'document-checklist': CheckSquare,
      'questionnaire': ClipboardList
    };

    return (
      <div className="relative">
        {showLeftArrow && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white shadow-md hover:bg-gray-50"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        {showRightArrow && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white shadow-md hover:bg-gray-50"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <div className="overflow-hidden" style={{ margin: '0 24px' }}>
          <div
            ref={tabsContainerRef}
            className="flex overflow-x-auto scrollbar-hide"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex -mb-px min-w-max px-6">
              {caseSteps.map((step) => {
                const Icon = stepIcons[step.key] || FileText;
                return (
                  <button
                    key={step._id}
                    disabled={step.disabled}
                    className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === step.key
                        ? 'border-blue-600 text-blue-600'
                        : step.disabled
                        ? 'border-transparent text-gray-400 cursor-not-allowed'
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                    }`}
                    onClick={() => !step.disabled && setActiveTab(step.key)}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    <span>{step.name}</span>
                    {step.status === 'completed' && (
                      <Check className="w-4 h-4 ml-2 text-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add FNProgressSteps component
  const FNProgressSteps = ({ caseData, caseSteps, activeTab, isQuestionnaireCompleted }) => {
    // Helper function to check if all documents are approved
    const checkAllDocumentsApproved = (documentTypes) => {
      return documentTypes && documentTypes.length > 0 && 
             documentTypes.every(doc => doc.status === 'approved');
    };

    // Helper function to check if a step is completed
    const isStepCompleted = (stepKey) => {
      const step = caseSteps?.find(step => step.key === stepKey);
      return step?.status === 'completed';
    };

    // Helper function to check if a step exists
    const isStepPresent = (stepKey) => {
      return caseSteps?.some(step => step.key === stepKey);
    };

    // Check document status
    const allDocumentsApproved = caseData?.documentTypes ? 
      checkAllDocumentsApproved(caseData.documentTypes) : false;

    const hasUploadedDocuments = caseData?.documentTypes?.some(doc => 
      doc.status === 'uploaded' || doc.status === 'approved'
    );

    // Define the milestone steps for FN users
    const steps = [
      {
        key: 'initial-configuration',
        name: 'Initial Configuration',
        description: 'Payment & Retainer Setup',
        icon: CreditCard,
        completed: isStepCompleted('payment') && isStepCompleted('retainer'),
        present: isStepPresent('payment') || isStepPresent('retainer')
      },
      {
        key: 'document-collection',
        name: 'Document Collection',
        description: 'Required Documents Upload',
        icon: FileText,
        completed: hasUploadedDocuments,
        present: isStepPresent('document-checklist')
      },
      {
        key: 'form-completion',
        name: 'Form Completion',
        description: 'Questionnaire, Forms & Document Review',
        icon: ClipboardList,
        completed: allDocumentsApproved && isQuestionnaireCompleted,
        present: true // Always show this step
      },
      {
        key: 'letters',
        name: 'Letters',
        description: 'Letter Generation',
        icon: Mail,
        completed: isStepCompleted('letters'),
        present: isStepPresent('letters')
      },
      {
        key: 'preparation',
        name: 'Preparation',
        description: 'Final Package & Government Notices',
        icon: Package,
        completed: isStepCompleted('receipts') || isStepCompleted('packaging'),
        present: isStepPresent('receipts') || isStepPresent('packaging')
      }
    ];

    // Filter steps to only show present ones
    const visibleSteps = steps.filter(step => step.present);
    
    // Find current step index
    const currentStepIndex = visibleSteps.findIndex(step => !step.completed);
    const completedSteps = visibleSteps.filter(step => step.completed).length;

    return (
      <div className="px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6">
            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Case Progress</h3>
              <p className="text-sm text-gray-500">
                {completedSteps} of {visibleSteps.length} milestones completed
              </p>
            </div>

            {/* Progress Steps */}
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-[30px] left-[30px] right-[30px] h-[2px] bg-gray-200">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                  style={{
                    width: visibleSteps.length > 0 ? `${(completedSteps / visibleSteps.length) * 100}%` : '0%'
                  }}
                />
              </div>

              {/* Steps Container */}
              <div className="flex justify-between items-start relative px-[30px]">
                {visibleSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStepIndex;
                  
                  return (
                    <div key={step.key} className="flex flex-col items-center relative max-w-[180px]">
                      {/* Step Circle */}
                      <div 
                        className={`
                          relative z-10 w-[60px] h-[60px] rounded-full flex items-center justify-center
                          transition-all duration-300 shadow-sm
                          ${step.completed 
                            ? 'bg-blue-500 text-white border-4 border-white shadow-lg' 
                            : isActive
                              ? 'bg-white border-2 border-blue-500 text-blue-500 shadow-md'
                              : 'bg-gray-100 border-2 border-gray-200 text-gray-400'
                          }
                        `}
                      >
                        {step.completed ? (
                          <Check className="w-6 h-6 stroke-[2.5]" />
                        ) : (
                          <Icon className="w-6 h-6 stroke-[1.5]" />
                        )}
                      </div>

                      {/* Step Info */}
                      <div className="mt-4 text-center">
                        <h4 
                          className={`
                            text-sm font-semibold mb-1 leading-tight
                            ${step.completed 
                              ? 'text-blue-600' 
                              : isActive
                                ? 'text-blue-600'
                                : 'text-gray-600'
                            }
                          `}
                        >
                          {step.name}
                        </h4>
                        <p 
                          className={`
                            text-xs leading-relaxed mb-3
                            ${step.completed 
                              ? 'text-gray-600' 
                              : isActive
                                ? 'text-gray-600'
                                : 'text-gray-400'
                            }
                          `}
                        >
                          {step.description}
                        </p>
                        
                        {/* Status Badge */}
                        <span 
                          className={`
                            inline-block px-3 py-1 rounded-full text-xs font-medium
                            ${step.completed 
                              ? 'bg-green-50 text-green-600 border border-green-100' 
                              : isActive
                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                : 'bg-gray-50 text-gray-500 border border-gray-100'
                            }
                          `}
                        >
                          {step.completed 
                            ? 'Completed' 
                            : isActive
                              ? 'In Progress'
                              : 'Pending'
                          }
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  FNProgressSteps.propTypes = {
    caseData: PropTypes.object,
    caseSteps: PropTypes.array,
    activeTab: PropTypes.string.isRequired,
    isQuestionnaireCompleted: PropTypes.bool.isRequired
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
                    <div>
                      <div className="text-sm text-gray-500">Nationality</div>
                      <div className="font-medium">{profileData?.nationality || '-'}</div>
                    </div>
                  </div>

                  {/* Right Column - Location Info */}
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm text-gray-500">Nationality</div>
                      <div className="font-medium">{profileData?.nationality || '-'}</div>
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
                      <div className="font-medium">{caseData?.userName || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Case Manager</div>
                      <div className="font-medium">{caseData?.caseManagerName || caseData?.createdBy?.name || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Case Name</div>
                      <div className="font-medium">{caseData?.categoryName || '-'}</div>
                    </div>
                  </div>

                  {/* Right Column - Status Info */}
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm text-gray-500">Current Status</div>
                      <div className="font-medium">{caseData?.categoryStatus || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Created Date</div>
                      <div className="font-medium">{caseData?.createdAt ? new Date(caseData.createdAt).toLocaleDateString() : '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Deadline</div>
                      <div className="font-medium">
                        {caseData?.deadline ? new Date(caseData.deadline).toLocaleDateString() : '-'}
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
       <FNProgressSteps 
        caseData={caseData}
        caseSteps={caseSteps}
        activeTab={activeTab}
        isQuestionnaireCompleted={isQuestionnaireCompleted}
      />


      {/* Tabs Navigation */}
      <div className="px-6 py-4">
        <div className="flex gap-2">
          {['Retainers','Payments', 'Documents Checklist', 'Questionnaire'].map((tab) => {
            const isQuestionnaire = tab === 'Questionnaire';
            const hasUploadedDocuments = caseData?.documentTypes?.some(doc => 
              doc.status === 'uploaded' || doc.status === 'approved'
            );
            const isDisabled = isQuestionnaire && !hasUploadedDocuments;

            return (
              <div key={tab} className="relative group">
                {/* Message shows only on hover */}
                {isDisabled && isQuestionnaire && (
                  <div className="absolute -top-8 left-0 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Please upload required documents first
                  </div>
                )}
                <button
                  className={`px-6 py-3 text-base font-medium rounded-lg transition-colors ${
                    activeTab === tab.toLowerCase().replace(' ', '-')
                      ? 'bg-white border border-gray-200 text-blue-600'
                      : isDisabled
                        ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => handleTabClick(tab)}
                  disabled={isDisabled}
                >
                  {tab}
                </button>
              </div>
            );
          })}
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
            {activeTab === 'retainers' && (
              <div className="bg-white rounded-lg border border-gray-200">
                <RetainerTab 
                  companyId={caseData?.userId?.company_id} 
                  profileData={caseData?.userId}
                  caseId={caseId}
                  caseManagerId={caseData?.caseManagerId?._id}
                  applicantId={caseData?.userId?._id}
                  caseData={caseData}
                  stepId={caseSteps.find(step => step.key === 'retainer')?._id}
                />
              </div>
            )}
            {activeTab === 'payments' && (
              <div className="bg-white rounded-lg border border-gray-200">
                <FNPayments stepId={caseSteps.find(step => step.key === 'payment')?._id} />
              </div>
            )}
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
      
      {/* Cal.com embed placeholder - Updated styling */}
      <div 
        id="cal-booking-placeholder" 
        className="hidden fixed inset-0 z-[10000] bg-white/95 backdrop-blur-sm"
        style={{
          height: '100vh',
          width: '100vw',
          position: 'fixed',
          top: 0,
          left: 0,
          display: 'none'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl">
            <button 
              onClick={handleCloseCalendar}
              className="absolute -top-2 -right-2 p-2 bg-white hover:bg-gray-100 rounded-full transition-all z-50 shadow-lg"
              aria-label="Close calendar"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
            <div 
              id="cal-inline-container" 
              className="w-full rounded-xl"
              style={{
                height: '600px',
                minHeight: '600px'
              }}
            >
              {/* Cal.com will inject its content here */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FNCaseDetails;
