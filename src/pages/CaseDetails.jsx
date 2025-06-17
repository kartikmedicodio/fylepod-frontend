import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Check, 
  Loader2,
  ChevronRight, 
  User,
  FileText,
  ClipboardList,
  Mail,
  Upload,
  File,
  X,
  AlertCircle,
  ChevronLeft,
  Download,
  Bot,
  SendHorizontal,
  Eye,
  ChevronDown,
  LucideReceiptText,
  Package,
  CreditCard,
  Clock,
  Search,
  Filter,
  History,
  MessageSquare
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
import { initializeSocket, joinDocumentRoom, handleReconnect, getSocket } from '../utils/socket';
import { getStoredToken } from '../utils/auth';
import LetterTab from '../components/letters/LetterTab';
import ReceiptsTab from '../components/receipts/ReceiptsTab';
import DocumentsArchiveTab from '../components/documents/DocumentsArchiveTab';
import CommunicationsTab from '../components/CommunicationsTab';
import RetainerTab from '../components/RetainerTab';
import PaymentTab from '../components/payments/PaymentTab';
import AuditLogTab from '../components/AuditLogTab';
import AuditLogTimeline from '../components/AuditLogTimeline';

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

// Helper function to count failed validations in validation results
const countFailedValidations = (validationResults) => {
  if (!validationResults || !validationResults.validations) return 0;
  return validationResults.validations.filter(v => !v.passed).length;
};

// Helper function to format validation data from webhook to match UI expectations
const formatValidationData = (validationResults, documentType) => {
  if (!validationResults) return null;
  
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
  
  return formattedData;
};

const ProcessingIndicator = ({ currentStep, isComplete }) => {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-10 rounded-lg">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-6">
            {processingSteps.map((step, index) => (
              <div
                key={step.id}
              className={`relative flex flex-col items-center ${
                index < processingSteps.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step.id || isComplete ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-xs font-medium">{step.id}</span>
                )}
              </div>
              
              {index < processingSteps.length - 1 && (
                <div 
                  className={`absolute top-4 left-8 right-0 h-0.5 transition-colors ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
              
              <span className="text-xs mt-2 text-center max-w-[80px]">{step.text}</span>
              </div>
            ))}
          </div>
        
        {/* Display webhook notification message */}
        <div className="text-center mb-3">
          <div className="text-sm text-gray-600 mb-2">
            {isComplete 
              ? "Processing complete!" 
              : `${processingSteps[Math.min(currentStep - 1, processingSteps.length - 1)]?.text}...`}
          </div>
          
          {!isComplete && (
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Waiting for server processing updates...</span>
            </div>
          )}
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
  const [filteredForms, setFilteredForms] = useState([]);
  const [isSavingQuestionnaire, setIsSavingQuestionnaire] = useState(false);
  const [loadingFormId, setLoadingFormId] = useState(null);
  const [error, setError] = useState(null);
  const [isQuestionnaireCompleted, setIsQuestionnaireCompleted] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);

  // Add a new state to track processing state for each document
  const [processingDocuments, setProcessingDocuments] = useState({});

  // Add new state variables for chat functionality
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [showChatPopup, setShowChatPopup] = useState(false);

  // Add useEffect for initial chat message
  useEffect(() => {
    if (caseData?.userName && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm Sophia from support. I'm here to assist you with <strong>${caseData.userName}</strong>'s case. How can I help you today?`
      }]);
    }
  }, [caseData, messages.length]);

  const [verificationData, setVerificationData] = useState(null);
  const [isLoadingVerification, setIsLoadingVerification] = useState(false);
  const [selectedSubTab, setSelectedSubTab] = useState('all');

  // Add these to the existing state declarations in CaseDetails component
  const [validationData, setValidationData] = useState(null);
  const [isLoadingValidation, setIsLoadingValidation] = useState(false);
  
  // Add a ref to persistently store validation data
  const validationDataRef = useRef(null);
  
  // Add a ref to persistently store cross-verification data
  const verificationDataRef = useRef(null);
  
  // Add a state to track validation data updates
  const [validationUpdated, setValidationUpdated] = useState(false);
  
  // Add a state to track cross-verification data updates
  const [verificationUpdated, setVerificationUpdated] = useState(false);

  // Add inputRef with other refs near the top of the component
  const inputRef = useRef(null);

  // Add these state variables in CaseDetails component near other state declarations
  const [extractedData, setExtractedData] = useState(null);
  const [isLoadingExtractedData, setIsLoadingExtractedData] = useState(false);
  const [extractedDataError, setExtractedDataError] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');

  // Add this state at the top with other state declarations
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);

  // Create a state to track active document processing
  const [processingDocIds, setProcessingDocIds] = useState([]);
  
  // Modified part - add state for drag over
  const [isDragOver, setDragOver] = useState(false);

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

  // Add this to the existing state declarations at the top of the component
  const [caseSteps, setCaseSteps] = useState([]);
  const [loadingCaseSteps, setLoadingCaseSteps] = useState(true);

  // Add function to refresh case steps
  const refreshCaseSteps = async () => {
    try {
      console.log('Refreshing case steps...');
      const stepsResponse = await api.get(`/case-steps/${caseId}`);
      if (stepsResponse.data.status === 'success') {
        console.log('Case steps refreshed:', stepsResponse.data.data);
        console.log('Previous case steps:', caseSteps);
        setCaseSteps(stepsResponse.data.data.steps);
        console.log('New case steps set:', stepsResponse.data.data.steps);
      }
    } catch (error) {
      console.error('Error refreshing case steps:', error);
    }
  };

  // Move processedSteps to component level
  const processedSteps = useMemo(() => {
    const stepsByKey = {};
    const steps = caseSteps.sort((a, b) => a.order - b.order).map((step) => {
      if (!stepsByKey[step.key]) {
        stepsByKey[step.key] = 1;
        return {
          ...step,
          displayKey: step.key,
          displayName: step.name // Keep original name
        };
      } else {
        stepsByKey[step.key]++;
        return {
          ...step,
          displayKey: `${step.key}-${stepsByKey[step.key]}`,
          displayName: `${step.name} ${stepsByKey[step.key]}`, // Add number to name for uniqueness
        };
      }
    });

    // Always add the Activity Log tab (merged communications and audit logs)
    const activityLogTab = {
      _id: 'activity-log',
      key: 'activity-log',
      displayKey: 'activity-log',
      displayName: 'Activity Log',
      disabled: false,
      order: steps.length + 1
    };

    return [...steps, activityLogTab];
  }, [caseSteps]);

  // Add a function at the top of the component to load data from localStorage
  const loadDataFromLocalStorage = () => {
    try {
      const validationDataString = localStorage.getItem('validationData');
      let validationDataFound = false;
      let verificationDataFound = false;

      if (validationDataString) {
        const parsedData = JSON.parse(validationDataString);
        console.log('Found validation data in localStorage:', parsedData);
        setValidationData(parsedData);
        validationDataRef.current = parsedData;
        validationDataFound = true;
      } else {
        console.log('No validation data found in localStorage');
      }
      
      const crossVerificationDataString = localStorage.getItem('crossVerificationData');
      if (crossVerificationDataString) {
        const parsedData = JSON.parse(crossVerificationDataString);
        console.log('Found cross-verification data in localStorage:', parsedData);
        setVerificationData(parsedData);
        verificationDataRef.current = parsedData;
        verificationDataFound = true;
      } else {
        console.log('No cross-verification data found in localStorage');
      }
      
      return {
        validationDataFound,
        verificationDataFound
      };
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      return {
        validationDataFound: false,
        verificationDataFound: false
      };    
    }
  };

  // Add an effect to handle validation data updates
  useEffect(() => {
    if (validationData) {
      console.log('Validation data updated, refreshing UI');
      // Update the ref whenever validationData state changes
      validationDataRef.current = validationData;
      setValidationUpdated(prev => !prev); // Toggle to force UI refresh
      
      // Store in localStorage to ensure persistence even across page reloads
      try {
        localStorage.setItem(`validation-data-${caseId}`, JSON.stringify(validationData));
        console.log('Saved validation data to localStorage');
      } catch (error) {
        console.error('Error saving validation data to localStorage:', error);
      }
      
      // If we're on the document tab, show the validation subtab
      // if (activeTab === 'document-checklist' && validationData.mergedValidations?.length > 0) {
      //   setSelectedSubTab('validation');
      // }
    }
  }, [validationData, activeTab, caseId]);
  
  // Add an effect to handle cross-verification data updates
  useEffect(() => {
    if (verificationData) {
      console.log('Cross-verification data updated, refreshing UI');
      // Update the ref whenever verificationData state changes
      verificationDataRef.current = verificationData;
      setVerificationUpdated(prev => !prev); // Toggle to force UI refresh
      
      // Store in localStorage to ensure persistence even across page reloads
      try {
        localStorage.setItem(`cross-verification-data-${caseId}`, JSON.stringify(verificationData));
        console.log('Saved cross-verification data to localStorage');
      } catch (error) {
        console.error('Error saving cross-verification data to localStorage:', error);
      }
      
      // If we're on the document tab and all documents are uploaded, show the cross-verification subtab
      if (activeTab === 'document-checklist' && areAllDocumentsUploaded()) {
        setSelectedSubTab('cross-verification');
      }
    }
  }, [verificationData, activeTab, caseId]);

  useEffect(() => {
    if (questionnaireData?.responses && questionnaireData.responses.length > 0) {
      // Get the processedInformation from the first response
      const processedInfo = questionnaireData.responses[0].processedInformation;
      
      if (processedInfo && selectedQuestionnaire) {
        // Initialize form data with all fields from the questionnaire template
        const initialFormData = {};
        selectedQuestionnaire.field_mappings.forEach(field => {
          // Copy all field properties
          initialFormData[field._id] = {
            ...field,
            value: processedInfo[field._id]?.value || null
          };
        });
        
        console.log('Setting form data from questionnaire response:', initialFormData);
        setFormData(initialFormData);
      }
    }
  }, [questionnaireData, selectedQuestionnaire]);

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
        console.log(`Processing started for document: ${data.documentName || data.documentId}`);
        if (data.caseId === caseId) {
          setProcessingDocIds(prev => [...prev, data.documentId]);
          setProcessingStep(1); // Analyzing document
        }
      });
      
      socket.on('document-processing-progress', (data) => {
        console.log(`Processing ${data.documentName || data.documentId}: ${data.status}`);
        if (data.caseId === caseId) {
          // Update processing step based on the status message
          if (data.status.toLowerCase().includes('extract')) {
            setProcessingStep(2); // Extracting information
          } else if (data.status.toLowerCase().includes('validat')) {
            setProcessingStep(3); // Validating content
          } else if (data.status.toLowerCase().includes('verify')) {
            setProcessingStep(4); // Verifying document
          }
        }
      });
      
      // Add a helper function to merge validation results
      const mergeValidationResults = (existingData, newResults, documentType) => {
        // First check if there is data in the ref that might be more up-to-date than existingData
        const latestExistingData = validationDataRef.current || existingData;
        
        console.log('Merging validation results', { 
          existingData: latestExistingData, 
          newResults, 
          documentType 
        });
        
        // If no existing data, initialize with new results
        if (!latestExistingData || !latestExistingData.mergedValidations) {
          return {
            mergedValidations: [
              {
                documentType: documentType || 'Document',
                validations: newResults.validations || []
              }
            ]
          };
        }
        
        // Make a deep copy of existing data to avoid mutation
        const mergedData = JSON.parse(JSON.stringify(latestExistingData));
        
        // Get all the existing document types
        const existingDocTypes = new Set(mergedData.mergedValidations.map(item => item.documentType));
        console.log('Existing document types:', Array.from(existingDocTypes));
        
        // If this is a new document type, simply add it to the array
        if (!existingDocTypes.has(documentType)) {
          console.log('Adding new document type:', documentType);
          mergedData.mergedValidations.push({
            documentType: documentType || 'Document',
            validations: newResults.validations || []
          });
        } else {
          // If this document type already exists, find it
          const existingIndex = mergedData.mergedValidations.findIndex(
            item => item.documentType === documentType
          );
          
          if (existingIndex >= 0) {
            console.log('Updating existing document type:', documentType);
            
            // Keep track of validation rules we've seen to avoid duplicates
            const existingValidationRules = new Set(
              mergedData.mergedValidations[existingIndex].validations.map(v => v.rule || v.name || JSON.stringify(v))
            );
            
            // Add new validation rules that don't already exist
            const newValidations = (newResults.validations || []).filter(validation => {
              const validationKey = validation.rule || validation.name || JSON.stringify(validation);
              return !existingValidationRules.has(validationKey);
            });
            
            // Combine existing and new validations
            mergedData.mergedValidations[existingIndex].validations = [
              ...mergedData.mergedValidations[existingIndex].validations,
              ...newValidations
            ];
            
            console.log(`Added ${newValidations.length} new validations for ${documentType}`);
          }
        }
        
        console.log('Merged validation data:', mergedData);
        return mergedData;
      };
      
      socket.on('document-processing-completed', (data) => {
        console.log('Document processing completed:', data);
        console.log('Current processing document IDs:', processingDocIds);
        console.log('Current case data document types:', caseData?.documentTypes?.map(dt => ({
          id: dt._id,
          name: dt.name,
          status: dt.status
        })));
        
        if (data.caseId === caseId) {
          setProcessingDocIds(prev => {
            const newProcessingIds = prev.filter(id => id !== data.documentId);
            console.log(`Removed ${data.documentId} from processing IDs. New processing IDs:`, newProcessingIds);
            
            // Only proceed with tab switching if this was the last document being processed
            if (newProcessingIds.length === 0) {
              // Fetch latest case data
              api.get(`/management/${caseId}`)
                .then(response => {
                  if (response.data.status === 'success') {
                    const updatedCaseData = response.data.data.entry;
                    setCaseData(updatedCaseData);
                    
                    // Check if all documents are uploaded and validated
                    const allUploaded = updatedCaseData.documentTypes.every(
                      doc => doc.status === 'uploaded' || doc.status === 'approved'
                    );

                    if (allUploaded) {
                      // Fetch validation data
                      return fetchValidationData()
                        .then(() => {
                          // Switch to validation tab
                          setActiveTab('document-checklist');
                          setSelectedSubTab('validation');
                          
                          // Send validation email only if it hasn't been sent yet
                          return handleSendValidationEmail();
                        });
                    }
                  }
                })
                .catch(error => {
                  console.error('Error updating data after processing:', error);
                  toast.error('Failed to load validation results');
                });
            }
            
            return newProcessingIds;
          });
          setIsProcessingComplete(true);
          
          // Get document type from multiple potential sources
          const documentType = 
            data.data?.document_type || 
            (data.documentTypeId && caseData?.documentTypes?.find(dt => dt.documentTypeId === data.documentTypeId)?.name) || 
            data.documentName?.split('.')[0] || 
            'Document';
          
          console.log(`Determined document type for completed document: ${documentType}`);
          
          // Get document type from the data field if it exists
          let docTypeName = 'document';
          try {
            if (data.data && data.data.document_type) {
              docTypeName = data.data.document_type;
            } else if (data.documentTypeId && data.caseData && data.caseData.documentTypes) {
              const documentType = data.caseData.documentTypes.find(dt => dt.documentTypeId === data.documentTypeId);
              docTypeName = documentType ? documentType.name : 'document';
            }
            // Store document name in processing status
            setProcessingStatus(prev => ({
              ...prev,
              document: docTypeName,
              processedDocuments: [...prev.processedDocuments, docTypeName] // Add to processed documents array
            }));
            // Removed toast notification here
          } catch (error) {
            console.error('Error determining document type:', error);
            // Removed toast notification here
          }
          
          // Log the complete webhook response for debugging
          console.log('Complete webhook response:', JSON.stringify(data, null, 2));
          
          // Update UI directly from webhook data without any API calls
          console.log('Updating UI directly from webhook data');
          
          // Update case data if provided
          console.log('Case data from webhook:', data.caseData);
          if (data.caseData) {
            console.log('Setting case data from webhook');
            // Preserve categoryId from existing caseData if it's not in the webhook data
            if (caseData && caseData.categoryId && !data.caseData.categoryId) {
              console.log('Preserving categoryId from existing case data');
              setCaseData({
                ...data.caseData,
                categoryId: caseData.categoryId._id
              });
            } else {
              setCaseData(data.caseData);
            }
          } else {
            console.log('Case data not provided in webhook - updating document status manually');
            // Need to update document status manually if caseData wasn't provided
            
            // Find the document by ID and update its status
            if (caseData && caseData.documentTypes && data.documentId) {
              // Create a deep copy of caseData to avoid direct state mutation
              const updatedCaseData = JSON.parse(JSON.stringify(caseData));
              
              // Look for the document that was processed in documentTypes
              let documentUpdated = false;
              
              console.log('Attempting to update document status for processed document...');
              
              // Try to find by managementDocumentId first (if available)
              if (data.managementDocumentId) {
                console.log(`Looking for document with managementDocumentId ${data.managementDocumentId}`);
                for (let i = 0; i < updatedCaseData.documentTypes.length; i++) {
                  console.log(`Checking document #${i}: ${updatedCaseData.documentTypes[i].name}, ID: ${updatedCaseData.documentTypes[i]._id}`);
                  if (updatedCaseData.documentTypes[i]._id === data.managementDocumentId) {
                    const oldStatus = updatedCaseData.documentTypes[i].status;
                    // Update status to UPLOADED
                    updatedCaseData.documentTypes[i].status = DOCUMENT_STATUS.UPLOADED;
                    console.log(`Updated document status for ${data.managementDocumentId} from ${oldStatus} to ${DOCUMENT_STATUS.UPLOADED}`);
                    documentUpdated = true;
                    break;
                  }
                }
              }
              
              // If we couldn't find by managementDocumentId, try by documentType
              if (!documentUpdated && data.data?.document_type) {
                console.log(`Looking for document by type: ${data.data.document_type}`);
                for (let i = 0; i < updatedCaseData.documentTypes.length; i++) {
                  console.log(`Checking document #${i}: ${updatedCaseData.documentTypes[i].name}, Status: ${updatedCaseData.documentTypes[i].status}`);
                  // Check if this document is the same type and is currently pending
                  if (
                    updatedCaseData.documentTypes[i].name === data.data.document_type && 
                    updatedCaseData.documentTypes[i].status === DOCUMENT_STATUS.PENDING
                  ) {
                    const oldStatus = updatedCaseData.documentTypes[i].status;
                    // Update status to UPLOADED
                    updatedCaseData.documentTypes[i].status = DOCUMENT_STATUS.UPLOADED;
                    console.log(`Updated document status for ${data.data.document_type} from ${oldStatus} to ${DOCUMENT_STATUS.UPLOADED}`);
                    documentUpdated = true;
                    break;
                  }
                }
              }
              
              // If we found and updated a document, update the case data state
              if (documentUpdated) {
                console.log('Document status updated successfully! New case data:', updatedCaseData);
                setCaseData(updatedCaseData);
                console.log('Successfully updated document status in case data');
              } else {
                console.log('Could not find matching document to update status. Documents available:', updatedCaseData.documentTypes);
                // Fall back to refreshing case data
                fetchCaseDetails();
              }
            } else {
              // If we couldn't update manually, fetch the case data
              console.log('No document details available to update status - fetching case data');
              fetchCaseDetails();
            }
          }
          
          // Update validation data if provided
          if (data.validationResults) {
            console.log('Setting validation data from webhook');
            // Log the validation results structure
            console.log('Validation results structure:', JSON.stringify(data.validationResults, null, 2));
            
            // Determine document type from multiple potential sources
            const documentType = 
              data.data?.document_type || 
              (data.documentTypeId && caseData?.documentTypes?.find(dt => dt.documentTypeId === data.documentTypeId)?.name) || 
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
            
            // Log document types in merged validation data
            if (mergedData?.mergedValidations) {
              console.log('Document types in validation data:', 
                mergedData.mergedValidations.map(item => item.documentType)
              );
              
              console.log('Total validations per document:',
                mergedData.mergedValidations.map(item => ({
                  documentType: item.documentType,
                  validationCount: item.validations.length
                }))
              );
            }
            
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
            
            // Update the selectedSubTab if validation data is available to show validation results
            // if (data.validationResults.validations && data.validationResults.validations.length > 0) {
            //   setSelectedSubTab('validation');
            // }
          }
          
          // Update cross-verification data if provided
          if (data.crossVerificationData) {
            toast.success('Cross-verification data received');
            console.log('Setting cross-verification data from webhook');
            console.log('Cross-verification data structure:', JSON.stringify(data.crossVerificationData, null, 2));
            
            // Set the cross-verification data
            setVerificationData(data.crossVerificationData);
            
            // Check if all documents are uploaded (either from webhook or by calculating)
            const allUploaded = data.allDocumentsUploaded || 
              (caseData && caseData.documentTypes && caseData.documentTypes.every(doc => 
                doc.status === DOCUMENT_STATUS.UPLOADED || doc.status === DOCUMENT_STATUS.APPROVED
              ));
            
            // Update processing status
            setProcessingStatus(prev => ({
              ...prev,
              verificationComplete: true,
              verificationResults: {
                allUploaded,
                data: data.crossVerificationData
              }
            }));
            
            // If we're on the document tab, switch to cross-verification subtab
            if (allUploaded && activeTab === 'document-checklist') {
              setSelectedSubTab('cross-verification');
            }
            
            // Store cross-verification data in localStorage for persistence
            try {
              localStorage.setItem(`cross-verification-data-${caseId}`, JSON.stringify(data.crossVerificationData));
              console.log('Saved cross-verification data to localStorage');
            } catch (error) {
              console.error('Error saving cross-verification data to localStorage:', error);
            }
          }
          
          // After all updates, check if we can show the final toast notification
          const currentProcessingStatus = {
            ...processingStatus,
            validationComplete: processingStatus.validationComplete || (data.validationResults !== undefined),
            verificationComplete: processingStatus.verificationComplete || (data.crossVerificationData !== undefined),
            document: processingStatus.document || docTypeName,
            processedDocuments: [
              ...processingStatus.processedDocuments,
              // Add current document if it's not already in the array
              ...(processingStatus.processedDocuments.includes(docTypeName) ? [] : [docTypeName])
            ],
            validationFailuresByDocument: processingStatus.validationFailuresByDocument
          };
          
          // If current document has validation failures, update tracking
          if (data.validationResults) {
            const failedCount = countFailedValidations(data.validationResults);
            if (failedCount > 0) {
              currentProcessingStatus.validationFailuresByDocument[docTypeName] = failedCount;
            }
          }
          
          // Store the updated processing status
          setProcessingStatus(currentProcessingStatus);
          
          // Only show toast if all documents have been processed AND validation and verification are complete
          // Check if there are no more documents being processed
          const newProcessingIds = processingDocIds.filter(id => id !== data.documentId);
          if (newProcessingIds.length === 0 && currentProcessingStatus.validationComplete && currentProcessingStatus.verificationComplete) {
            // Get unique document names
            const uniqueDocuments = [...new Set(currentProcessingStatus.processedDocuments)];
            const documentSummary = uniqueDocuments.length > 1 
              ? `${uniqueDocuments.slice(0, -1).join(', ')} and ${uniqueDocuments.slice(-1)}`
              : uniqueDocuments[0] || 'All documents';
            
            // Count total validation failures across all documents
            const totalFailures = Object.values(currentProcessingStatus.validationFailuresByDocument).reduce((sum, count) => sum + count, 0);
            
            // // Check if there are validation issues
            // if (totalFailures > 0) {
            //   // If we have failures in multiple documents, show a summary
            //   if (Object.keys(currentProcessingStatus.validationFailuresByDocument).length > 1) {
            //     toast.error(`${totalFailures} validation issues found across ${Object.keys(currentProcessingStatus.validationFailuresByDocument).length} documents`);
            //   } else {
            //     // If only one document has issues, show which one
            //     const documentWithFailures = Object.keys(currentProcessingStatus.validationFailuresByDocument)[0];
            //     const failureCount = currentProcessingStatus.validationFailuresByDocument[documentWithFailures];
            //     toast.error(`${failureCount} validation ${failureCount === 1 ? 'issue' : 'issues'} found in ${documentWithFailures}`);
            //   }
            // } else {
            //   toast.success(`${documentSummary} processed successfully with all validations passed`);
            // }
            
            // Check cross-verification status
            if (currentProcessingStatus.verificationResults && currentProcessingStatus.verificationResults.allUploaded) {
              toast.success('All documents uploaded! Cross-verification available.');
            }
            
            // Reset processing status
            setProcessingStatus({
              document: null,
              validationComplete: false,
              verificationComplete: false,
              validationResults: {
                failedCount: 0,
                documentType: null
              },
              verificationResults: null,
              processedDocuments: [],
              validationFailuresByDocument: {}
            });
          }
        }
      });
      
      socket.on('document-processing-failed', (data) => {
        console.log('Document processing failed:', data);
        if (data.caseId === caseId) {
          setProcessingDocIds(prev => prev.filter(id => id !== data.documentId));
          setIsProcessingComplete(true);
          // Always show error toast for processing failures
          toast.error(`Processing failed for document ${data.documentName || data.documentId}: ${data.error || 'Unknown error'}`);
          
          // Reset processing status for this document
          setProcessingStatus(prev => {
            const updatedProcessedDocs = prev.processedDocuments.filter(doc => 
              doc !== data.documentName && doc !== data.data?.document_type
            );
            
            return {
              ...prev,
              processedDocuments: updatedProcessedDocs
            };
          });
          
          // Log the complete webhook response for debugging
          console.log('Complete webhook failure response:', JSON.stringify(data, null, 2));
          
          // Update UI directly from webhook data without any API calls
          console.log('Updating UI directly from webhook data for failed document');
          
          // Update case data if provided
          if (data.caseData) {
            console.log('Setting case data from webhook for failed document');
            // Preserve categoryId from existing caseData if it's not in the webhook data
            if (caseData && caseData.categoryId && !data.caseData.categoryId) {
              console.log('Preserving categoryId from existing case data for failed document');
              setCaseData({
                ...data.caseData,
                categoryId: caseData.categoryId
              });
            } else {
              setCaseData(data.caseData);
            }
          } else {
            console.log('Case data not provided in webhook - fetching case data after failure');
            // Need to fetch case data since it wasn't provided
            fetchCaseDetails();
          }
        }
      });
      
      // Add detailed error handling
      socket.on('connect_error', (error) => {
        console.error('Socket connection error in CaseDetails:', error);
        toast.error(`Socket connection error: ${error.message}. Retrying...`);
      });
    } catch (error) {
      console.error('Error initializing socket:', error);
      toast.error(`Failed to initialize socket: ${error.message}`);
    }
    
    // Cleanup listeners when component unmounts
    return () => {
      if (socket) {
        console.log('Cleaning up socket event listeners but keeping connection alive');
        socket.off('document-processing-started');
        socket.off('document-processing-progress');
        socket.off('document-processing-completed');
        socket.off('document-processing-failed');
        socket.off('connect_error');
      }
    };
  }, [caseId]);

  const validateFileType = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    return allowedTypes.includes(file.type);
  };

  const handleDocumentApprove = async (documentTypeId, managementDocumentId) => {
    try {
      // Update processing state for this specific document
      setProcessingDocuments(prev => ({
        ...prev,
        [managementDocumentId]: true
      }));
      
      // Make the API call to approve the document
      await api.patch(`/management/${caseId}/documents/${documentTypeId}/status`, {
        status: DOCUMENT_STATUS.APPROVED,
        documentTypeId: documentTypeId,
        managementDocumentId: managementDocumentId
      });

      // Refresh case data
      const response = await api.get(`/management/${caseId}`);
      if (response.data.status === 'success') {
        const updatedCaseData = response.data.data.entry;
        setCaseData(updatedCaseData);
        
        // Check if all documents are now approved
        const allApproved = updatedCaseData.documentTypes.every(doc => doc.status === DOCUMENT_STATUS.APPROVED);
        console.log('[Debug] All documents approved check:', allApproved);
        
        if (allApproved) {
          console.log('[Debug] All documents approved, updating step status');
          const stepToUpdate = processedSteps.find(step => step.key === 'document-checklist');
          if (stepToUpdate) {
            try {
              // Make API call to update step status using the correct endpoint
              await api.put(`/case-steps/case/${caseId}/step/document-checklist/status`, {
                status: 'completed'
              });
              console.log('[Debug] Successfully updated case step status');
              await refreshCaseSteps();
            } catch (error) {
              console.error('[Debug] Error updating case step status:', error);
              toast.error('Failed to update step status');
            }
          }
        }
      }

      // Clear processing state
      setProcessingDocuments(prev => ({
        ...prev,
        [managementDocumentId]: false
      }));

    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Failed to approve document');
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
      
      // Use the reupload-specific endpoint
      await api.patch(`/management/${caseId}/documents/${documentTypeId}/reupload`, {
        documentTypeId: documentTypeId,
        managementDocumentId: managementDocumentId
      });

      // Refresh case data
      const response = await api.get(`/management/${caseId}`);
      if (response.data.status === 'success') {
        const updatedCaseData = response.data.data.entry;
        setCaseData(updatedCaseData);

        // Clear validation data for this document from the current validation state
        if (validationDataRef.current?.mergedValidations) {
          const updatedValidations = validationDataRef.current.mergedValidations.filter(
            validation => validation.documentType !== updatedCaseData.documentTypes.find(
              dt => dt._id === managementDocumentId
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

  const [emailSent, setEmailSent] = useState(false);
  const processingDocsRef = useRef(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.off('document-processing-completed');
        socketRef.current.off('document-processing-failed');
        socketRef.current.off('connect_error');
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleSendValidationEmail = async () => {
    if (emailSent) return; // Prevent duplicate emails
    try {
      // First get the validation data
      const validationResponse = await api.get(`/documents/management/${caseId}/validations`);
      const validationData = validationResponse.data;

      // Then get the cross-verification data
      const crossVerifyResponse = await api.get(`/management/${caseId}/cross-verify`);
      const crossVerifyData = crossVerifyResponse.data;

      // Get recipient name from profile data or use a default
      const recipientName = profileData?.name || 'Sir/Madam';

      // Get the case owner's userId from caseData
      const userId = caseData?.userId;
      const caseName = caseData?.caseName || caseData?.categoryName || '';
      const applicantName = caseData?.applicantName || profileData?.name || '';

      // Structure the request body according to the backend's expected format
      const requestBody = {
        errorType: 'validation',
        errorDetails: {
          validationResults: validationData.data.mergedValidations.flatMap(doc => 
            doc.validations.map(v => ({
              documentType: doc.documentType,
              rule: v.rule,
              passed: v.passed,
              message: v.message
            }))
          ),
          mismatchErrors: crossVerifyData.data.verificationResults.mismatchErrors || [],
          missingErrors: crossVerifyData.data.verificationResults.missingErrors || [],
          summarizationErrors: crossVerifyData.data.verificationResults.summarizationErrors || []
        },
        recipientEmail,
        recipientName,
        managementId: caseId,
        emailType: 'document_validation', // <-- fix here
        userId: userId // Use the case owner's userId
      };

      // Log the request body for debugging
      console.log('Sending validation email request with data:', {
      recipientEmail,
      recipientName,
      managementId: caseId,
      userId: userId,
      validationCount: validationData.data.mergedValidations?.length,
      mismatchCount: crossVerifyData.data.verificationResults.mismatchErrors?.length,
      missingCount: crossVerifyData.data.verificationResults.missingErrors?.length
      });

     // Generate the draft mail content
     const draftResponse = await api.post('/mail/draft', requestBody);
      
     if (draftResponse.data.status !== 'success') {
       throw new Error('Failed to generate draft: ' + draftResponse.data.message);
     }

     const mailContent = draftResponse.data.data;

     // Send the email
     const sendResponse = await api.post('/mail/send', {
       subject: mailContent.subject,
       body: mailContent.body,
       recipientEmail: recipientEmail,
       recipientName: recipientName,
       managementId: caseId,
        caseId: caseId, // <-- add
        caseName: caseName, // <-- add
        applicantName: applicantName, // <-- add
        validationData: validationData.data, // <-- add
        crossVerifyData: crossVerifyData.data, // <-- add
        emailType: 'document_validation', // <-- fix here
       userId: userId // Use the case owner's userId
     });

     if (sendResponse.data.status === 'success') {
       setEmailSent(true);
       toast.success('Validation report email sent successfully');
       setMessages(prev => [...prev, {
         type: 'system',
         content: 'Validation email sent successfully.',
         timestamp: new Date().toISOString()
       }]);
     } else {
       throw new Error('Failed to send email: ' + sendResponse.data.message);
     }
   } catch (error) {
     console.error('Error sending validation email:', error);
     toast.error('Failed to send validation report email');
     setMessages(prev => [...prev, {
       type: 'error',
       content: 'Failed to send validation email: ' + (error.response?.data?.message || error.message),
       timestamp: new Date().toISOString()
     }]);
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
      setProcessingStep(0);
      // Upload all files
      const uploadPromises = files.map(async (file) => {
        if (!validateFileType(file)) {
          toast.error(`Invalid file type: ${file.name}`);
          return null;
        }

        // Check if caseData exists
        if (!caseData || !caseData.documentTypes) {
          toast.error('Case data not available. Please refresh the page.');
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
            successfulUploads++;
            
            // Add the document ID to processing state immediately after successful upload
            processingDocsRef.current.add(uploadedDoc._id);
            setProcessingDocIds(Array.from(processingDocsRef.current));
            
            return uploadedDoc;
          }
          return null;
        } catch (err) {
          console.error(`Error uploading ${file.name}:`, err);
          console.error('Error response:', err.response?.data);
          toast.error(`Failed to upload ${file.name}`);
          failedUploads++;
          return null;
        }
      });

      const uploadedDocs = (await Promise.all(uploadPromises)).filter(Boolean);
      
      // Connect to socket for document updates after successful uploads
      if (uploadedDocIds.length > 0) {
        try {
          console.log('Connecting socket for document updates, ids:', uploadedDocIds);
          
          // Initialize socket connection with auth token
          const token = getStoredToken();
          const socket = initializeSocket(token);
          socketRef.current = socket;
          
          // Check socket connection
          if (!socket.connected) {
            console.log('Socket not yet connected, waiting for connection...');
            socket.on('connect', () => {
              console.log('Socket connected in handleFileUpload, joining rooms...');
              // Join document rooms once connected
              uploadedDocIds.forEach(docId => {
                joinDocumentRoom(docId);
              });
            });
          } else {
            console.log('Socket already connected, joining rooms...');
            // Join document rooms for real-time updates if socket is already connected
            uploadedDocIds.forEach(docId => {
              joinDocumentRoom(docId);
            });
          }
          
          // Remove any existing listeners before adding new ones
          socket.off('document-processing-completed');
          
          // Add event listener for when all documents are processed
          socket.on('document-processing-completed', async (data) => {
            console.log('Document processing completed:', data);
            
            // Remove the processed document ID from the tracking set
            processingDocsRef.current.delete(data.documentId);
            setProcessingDocIds(Array.from(processingDocsRef.current));
            
            // Check if this was the last document to be processed
            if (processingDocsRef.current.size === 0 && !emailSent) {
              // Fetch latest case data
              api.get(`/management/${caseId}`)
                .then(response => {
                  if (response.data.status === 'success') {
                    const updatedCaseData = response.data.data.entry;
                    setCaseData(updatedCaseData);
                    
                    // Check if all documents are uploaded and validated
                    const allUploaded = updatedCaseData.documentTypes.every(
                      doc => doc.status === 'uploaded' || doc.status === 'approved'
                    );

                    if (allUploaded) {
                      // Fetch validation data
                      return fetchValidationData()
                        .then(() => {
                          // Switch to validation tab
                          setActiveTab('document-checklist');
                          setSelectedSubTab('validation');
                          
                          // Send validation email only if it hasn't been sent yet
                          return handleSendValidationEmail();
                        });
                    }
                  }
                })
                .catch(error => {
                  console.error('Error updating data after processing:', error);
                  toast.error('Failed to load validation results');
                });
            }
          });
          
          console.log(`Requested to join ${uploadedDocIds.length} document rooms`);
          toast.success(`Uploaded ${successfulUploads} document(s). Processing will begin shortly.`);
          setProcessingStep(1); // Set to "Analyzing document" step
          
          // Log what we expect to receive from webhooks
          console.log('Waiting for webhook events for documents:', uploadedDocIds);
          console.log('Documents will be updated when processing webhooks are received');
        } catch (error) {
          console.error('Error connecting to socket in handleFileUpload:', error);
        }
      }

      // Clear the files array after successful upload
      setFiles([]);

    } catch (error) {
      console.error('Error in file upload process:', error);
      toast.error('An error occurred during the upload process');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setDragOver(false);
    }
  };

  // Update fetchValidationData to be more robust
  const fetchValidationData = async (retryCount = 0, maxRetries = 3) => {
    // Prevent multiple simultaneous calls
    if (isLoadingValidation) return;
    
    try {
      setIsLoadingValidation(true);
      const response = await api.get(`/documents/management/${caseId}/validations`);
      if (response.data.status === 'success') {
        const newValidationData = response.data.data;
        
        // If we got empty validation data and haven't exceeded retries, retry after a delay
        if ((!newValidationData || Object.keys(newValidationData).length === 0) && retryCount < maxRetries) {
          console.log(`No validation data yet, retrying in 2 seconds (attempt ${retryCount + 1}/${maxRetries})`);
          setIsLoadingValidation(false);
          return new Promise(resolve => setTimeout(resolve, 2000))
            .then(() => fetchValidationData(retryCount + 1, maxRetries));
        }
        
        // Update both state and ref
        setValidationData(newValidationData);
        validationDataRef.current = newValidationData;
        
        // Save to localStorage
        try {
          localStorage.setItem(`validation-data-${caseId}`, JSON.stringify(newValidationData));
          console.log('Saved fetched validation data to localStorage');
        } catch (storageError) {
          console.error('Error saving validation data to localStorage:', storageError);
        }
        
        return newValidationData;
      } else {
        throw new Error('Failed to fetch validation data');
      }
    } catch (error) {
      console.error('Error fetching validation data:', error);
      
      // If we haven't exceeded retries, retry after a delay
      if (retryCount < maxRetries) {
        console.log(`Error fetching validation data, retrying in 2 seconds (attempt ${retryCount + 1}/${maxRetries})`);
        setIsLoadingValidation(false);
        return new Promise(resolve => setTimeout(resolve, 2000))
          .then(() => fetchValidationData(retryCount + 1, maxRetries));
      }
      
      toast.error('Failed to load validation data');
    } finally {
      setIsLoadingValidation(false);
    }
  };

  // Modify this function to ONLY make API calls, without checking localStorage
  const fetchCrossVerificationData = async () => {
    // This function should only be responsible for fetching data from the API
    if (!isLoadingVerification) {
      try {
        console.log('Making API call to fetch cross-verification data');
        setIsLoadingVerification(true);
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
        setIsLoadingVerification(false);
      }
    }
    return null;
  };

  // Simplified useEffect for tab changes - we don't make API calls here anymore
  useEffect(() => {
    // This is now just a backup to ensure state is in sync with ref
    // The main data loading logic has been moved to the tab click handler
    if (selectedSubTab === 'cross-verification' && verificationDataRef.current) {
      console.log('Cross-verification tab selected via state change, syncing state with ref data');
      
      // Make sure state is synced with ref
      if (!verificationData || JSON.stringify(verificationData) !== JSON.stringify(verificationDataRef.current)) {
        console.log('Syncing state with ref data');
        setVerificationData(verificationDataRef.current);
      }
    }
  }, [selectedSubTab]);

  // Update the useEffect for initial data loading
  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        // First, load any data we have in localStorage
        loadDataFromLocalStorage();
        console.log('Initial localStorage load complete');
        
        setIsLoading(true);
        
        // Fetch case details and case steps in parallel
        const [caseResponse, stepsResponse] = await Promise.all([
          api.get(`/management/${caseId}`),
          api.get(`/case-steps/${caseId}`)
        ]);

        // Handle case details response
        if (caseResponse.data.status === 'success') {
          const caseData = caseResponse.data.data.entry;
          console.log('Fetched Case Data:', caseData);
          
          // Handle case manager details
          if (caseData?.case_manager_id) {
            try {
              const managerId = typeof caseData.case_manager_id === 'object' 
                ? caseData.case_manager_id._id 
                : caseData.case_manager_id;
              
              const managerResponse = await api.get(`/users/${managerId}`);
              if (managerResponse.data.status === 'success') {
                console.log('Manager Response:', managerResponse.data);
                caseData.case_manager_id = managerResponse.data.data.user;
              }
            } catch (err) {
              console.error('Error fetching case manager details:', err);
              caseData.case_manager_id = managerId;
            }
          }

          console.log('Case Manager ID (after):', caseData?.case_manager_id);
          setCaseData(caseData);
          
          // Handle document validation and verification
          const hasUploadedDocs = caseData.documentTypes.some(doc => 
            doc.status === DOCUMENT_STATUS.UPLOADED || doc.status === DOCUMENT_STATUS.APPROVED
          );

          if (hasUploadedDocs) {
            await fetchValidationData();
          }
          
          // Set breadcrumb
          setCurrentBreadcrumb([
            { name: 'Home', path: '/dashboard' },
            { name: 'Cases', path: '/cases' },
            { name: caseData.categoryName || `Case ${caseId.substring(0, 6)}`, path: `/cases/${caseId}` }
          ]);
        }

        // Handle case steps response
        if (stepsResponse.data.status === 'success') {
          console.log('Fetched Case Steps:', stepsResponse.data.data);
          setCaseSteps(stepsResponse.data.data.steps);
        }

      } catch (error) {
        console.error('Error fetching case details:', error);
        setError('Failed to load case details');
      } finally {
        setIsLoading(false);
        setLoadingCaseSteps(false);
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
        setIsLoading(true);
        
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
            console.log('Dependent fields in combined questionnaire:', finalDependentFields.map(field => ({
              fieldName: field.fieldName,
              dependentFields: field.dependentFields
            })));
            
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
        setIsLoading(false);
      }
    };

    const fetchForms = async () => {
      try {
        const response = await api.get('/forms');
        console.log("response of the forms", response);
        if (response.data.status === 'success') {
          console.log("All forms:", response.data.data.forms);
          setForms(response.data.data.forms);
        }
      } catch (error) {
        console.error('Error fetching forms:', error);
        toast.error('Failed to fetch forms');
      }
    };

    fetchProfileData();
    fetchForms();
    
    // Only fetch questionnaires if caseData is available
    if (caseData && caseData.categoryId) {
      fetchQuestionnaires();
    }
  }, [caseId, caseData]); // Added caseData as dependency since fetchQuestionnaires needs it

  // Add useEffect to filter forms when caseData changes
  useEffect(() => {
    console.log("CaseData changed:", caseData);
    console.log("Current forms:", forms);
    if (caseData?.categoryId?._id) {
      console.log("Category ID from case:", caseData.categoryId._id);
      const filtered = forms.filter(form => {
        console.log("Form category_id:", form.category_id);
        return form.category_id === caseData.categoryId._id;
      });
      console.log("Filtered forms:", filtered);
      setFilteredForms(filtered);
    }
  }, [caseData, forms]);

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
      
      // Create request payload
      const payload = {
        templateId: selectedQuestionnaire?._id,
        processedInformation: formData
      };
      
      console.log('Saving questionnaire with data:', payload);
      
      const response = await api.put(`/questionnaire-responses/management/${caseId}`, payload);

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
    if (!caseData || !caseData.documentTypes) return false;
    
    // Check if all documents are either uploaded or approved
    return caseData.documentTypes.every(
      doc => doc.status === DOCUMENT_STATUS.UPLOADED || doc.status === DOCUMENT_STATUS.APPROVED
    );
  };

  // Update the ProgressSteps component
  const ProgressSteps = () => {
    // Add null checks when accessing documentTypes
    const allDocumentsApproved = caseData?.documentTypes ? 
      checkAllDocumentsApproved(caseData.documentTypes) : 
      false;
    
    // Helper function to check if a step is completed or not present (then considered completed)
    const isStepCompleted = (stepKey) => {
      // If the step is not present, consider it completed
      if (!caseSteps?.some(step => step.key === stepKey)) return true;
      
      // For payment step, check if it's marked as completed in caseSteps
      if (stepKey === 'payment') {
        return caseSteps?.some(step => step.key === 'payment' && step.status === 'completed');
      }
      
      return caseSteps?.some(step => step.key === stepKey && step.status === 'completed');
    };
    // Helper to check if a step exists
    const isStepPresent = (stepKey) => caseSteps?.some(step => step.key === stepKey);

    // Initial Configuration: payment & retainer
    const initialConfigSteps = ['payment', 'retainer'];
    const showInitialConfig = initialConfigSteps.some(isStepPresent);
    const isInitialConfigComplete = initialConfigSteps.every(isStepCompleted);

    // Document Collection
    const showDocumentCollection = isStepPresent('document-checklist');
    const isDocumentCollectionComplete = isStepCompleted('document-checklist');

    // Processing & Review: includes document approval, questionnaire, and forms
    const showProcessingReview = true; // Always show this step
    const isProcessingReviewComplete = allDocumentsApproved && 
      isStepCompleted('questionnaire') && 
      isStepCompleted('forms');

    // Letters
    const showLetters = isStepPresent('letters');
    const isLettersComplete = isStepCompleted('letters');

    // Preparation: receipts & packaging
    const preparationSteps = ['receipts'];
    const showPreparation = preparationSteps.some(isStepPresent);
    const isPreparationComplete = preparationSteps.every(isStepCompleted);

    // Build steps array dynamically with icons and descriptions
    const steps = [];
    if (showInitialConfig) {
      steps.push({
        name: 'Initial Configuration',
        completed: isInitialConfigComplete,
        description: 'Payment & Retainer Setup',
        icon: CreditCard
      });
    }
    if (showDocumentCollection) {
      steps.push({
        name: 'Document Collection',
        completed: isDocumentCollectionComplete,
        description: 'Required Documents Upload',
        icon: FileText
      });
    }
    if (showProcessingReview) {
      steps.push({
        name: 'Form Completion',
        completed: isProcessingReviewComplete,
        description: 'Questionnaire, Forms & Document Review',
        icon: ClipboardList
      });
    }
    if (showLetters) {
      steps.push({
        name: 'Letters',
        completed: isLettersComplete,
        description: 'Letter Generation',
        icon: Mail
      });
    }
    if (showPreparation) {
      steps.push({
        name: 'Preparation',
        completed: isPreparationComplete,
        description: 'Final Package & Government Notices',
        icon: Package
      });
    }

    const currentStepIndex = steps.findIndex(s => !s.completed);

    return (
      <div className="w-full py-8 bg-gradient-to-r from-slate-50 via-white to-slate-50">
        <div className="max-w-6xl mx-auto px-8 relative">
          {/* Main progress bar with gradient and shimmer */}
          <div className="absolute top-[28px] left-12 right-12 h-1">
            {/* Background line */}
            <div className="h-full w-full bg-gray-100 rounded-full" />
            
            {/* Animated progress line */}
            <div 
              className="absolute top-0 left-0 h-full rounded-full bg-indigo-600"
              style={{
                width: `${Math.min((steps.filter(step => step.completed).length / steps.length) * 100, 100)}%`,
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 10px rgba(79, 70, 229, 0.4)'
              }}
            >
              {/* Animated gradient overlay */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-progress"
                style={{
                  backgroundSize: '200% 100%'
                }}
              />
            </div>
          </div>

          {/* Steps container */}
          <div className="flex justify-between relative z-10">
            {steps.map((step, index) => (
              <div 
                key={step.name}
                className={`flex flex-col items-center ${
                  index === currentStepIndex ? 'transform scale-105 transition-transform duration-500' : ''
                }`}
              >
                {/* Step circle with animations */}
                <div className="relative mb-4">
                  {/* Animated rings for current step */}
                  {index === currentStepIndex && (
                    <>
                      <div className="absolute -inset-2 bg-indigo-500/20 rounded-full animate-ping-slow" />
                      <div className="absolute -inset-4 bg-indigo-500/10 rounded-full animate-pulse-slow" />
                    </>
                  )}

                  {/* Main circle with icon */}
                  <div 
                    className={`
                      w-14 h-14 rounded-full flex items-center justify-center
                      transform transition-all duration-500 relative
                      ${step.completed 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                        : index === currentStepIndex
                          ? 'bg-white border-2 border-indigo-600 text-indigo-600'
                          : 'bg-gray-100 text-gray-400'
                      }
                      group hover:scale-105 hover:shadow-lg
                    `}
                  >
                    {/* Icon/Check with animation */}
                    <div className="transform transition-transform group-hover:scale-110">
                      {step.completed ? (
                        <Check className="w-6 h-6 animate-check" />
                      ) : (
                        <step.icon className="w-6 h-6" />
                      )}
                    </div>

                    {/* Live ripple effect for current step */}
                    {index === currentStepIndex && (
                      <div className="absolute -inset-1 border-2 border-indigo-500 rounded-full animate-ripple" />
                    )}
                  </div>
                </div>

                {/* Step name and description */}
                <div className="text-center space-y-1 relative">
                  <h3 
                    className={`
                      font-semibold text-sm transition-all duration-300
                      ${step.completed 
                        ? 'text-indigo-600' 
                        : index === currentStepIndex
                          ? 'text-indigo-500'
                          : 'text-gray-400'
                      }
                    `}
                  >
                    {step.name}
                  </h3>
                  <p 
                    className={`
                      text-xs transition-all duration-300 max-w-[120px]
                      ${step.completed 
                        ? 'text-gray-600' 
                        : index === currentStepIndex
                          ? 'text-gray-500'
                          : 'text-gray-300'
                      }
                    `}
                  >
                    {step.description}
                  </p>
                  <div 
                    className={`
                      mt-2 text-xs font-medium px-3 py-1 rounded-full
                      transition-all duration-300
                      ${step.completed 
                        ? 'bg-green-50 text-green-600 border border-green-200' 
                        : index === currentStepIndex
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 animate-pulse'
                          : 'bg-gray-50 text-gray-400 border border-gray-200'
                      }
                    `}
                  >
                    {step.completed 
                      ? 'Completed' 
                      : index === currentStepIndex
                        ? 'In Progress'
                        : 'Pending'
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Add ActivityLogTab component
  const ActivityLogTab = ({ caseId }) => {
    const [activeSubTab, setActiveSubTab] = useState('activity');  // Changed default to 'activity'

    const subTabs = [
      { id: 'activity', label: 'Activity Log', icon: History },    // Moved Activity Log first
      { id: 'communications', label: 'Communications (Mails)', icon: Mail }
    ];

    return (
      <div className="p-6">
        {/* Sub-tab navigation */}
        <div className="mb-6 flex items-center gap-2">
          {subTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSubTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content based on active sub-tab */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {activeSubTab === 'activity' && (
            <AuditLogTimeline managementId={caseId} />
          )}
          {activeSubTab === 'communications' && (
            <CommunicationsTab caseId={caseId} />
          )}
        </div>
      </div>
    );
  };

  const TabNavigation = () => {
    const tabsContainerRef = useRef(null);
    const [showLeftScroll, setShowLeftScroll] = useState(false);
    const [showRightScroll, setShowRightScroll] = useState(false);

    useEffect(() => {
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => window.removeEventListener('resize', checkScroll);
    }, []);

    const checkScroll = () => {
      if (tabsContainerRef.current) {
        const { scrollWidth, clientWidth, scrollLeft } = tabsContainerRef.current;
        setShowLeftScroll(scrollLeft > 0);
        setShowRightScroll(scrollLeft < scrollWidth - clientWidth);
      }
    };

    const handleScroll = (direction) => {
      if (tabsContainerRef.current) {
        const scrollAmount = direction === 'left' ? -200 : 200;
        tabsContainerRef.current.scrollLeft += scrollAmount;
        checkScroll();
      }
    };

    const stepIcons = {
      'document-checklist': FileText,
      'questionnaire': ClipboardList,
      'forms': FileText,
      'letters': Mail,
      'receipts': LucideReceiptText,
      'packaging': Package,
      'payment': CreditCard,
      'retainer': FileText,
      'activity-log': History
    };

    return (
      <div className="relative">
        {/* Left scroll button */}
        {showLeftScroll && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white shadow-md rounded-full"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Right scroll button */}
        {showRightScroll && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white shadow-md rounded-full"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Tabs container */}
        <div
          ref={tabsContainerRef}
          className="overflow-x-auto scrollbar-hide"
          onScroll={checkScroll}
        >
          <div className="flex -mb-px min-w-max px-6">
            {processedSteps.map((step) => {
              const Icon = stepIcons[step.key] || FileText;
              return (
                <button
                  key={step._id}
                  disabled={step.disabled}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === step.displayKey
                      ? 'border-blue-600 text-blue-600'
                      : step.disabled
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                  onClick={() => !step.disabled && setActiveTab(step.displayKey)}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  <span>{step.displayName}</span>
                  {step.status === 'completed' && (
                    <Check className="w-4 h-4 ml-2 text-green-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const DocumentVerificationSection = ({ document, validations = [] }) => {
    const passedCount = validations.filter(v => v.passed).length;
    const failedCount = validations.filter(v => !v.passed).length;
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              failedCount > 0 ? 'bg-rose-50' : 'bg-emerald-50'
            }`}>
              {failedCount > 0 ? (
                <X className="w-5 h-5 text-rose-500" />
              ) : (
                <Check className="w-5 h-5 text-emerald-500" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">{document.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                {/* Passed count */}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-emerald-600 font-medium">
                    {passedCount} Passed
                  </span>
                </div>
                {/* Failed count */}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  <span className="text-xs text-rose-600 font-medium">
                    {failedCount} Failed
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Overall status badge */}
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              failedCount > 0 
                ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}>
              {failedCount > 0 ? `${failedCount} Issues Found` : 'All Passed'}
            </span>
            <button className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Validation Details */}
        {isExpanded && (
          <div className="border-t border-gray-100">
            <div className="divide-y divide-gray-100">
              {validations.map((validation, index) => (
                <div 
                  key={index}
                  className={`p-4 flex items-start gap-3 ${
                    validation.passed ? 'bg-white' : 'bg-rose-50/5'
                  }`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    validation.passed ? 'bg-emerald-50' : 'bg-rose-50'
                  }`}>
                    {validation.passed ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-rose-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{validation.message}</p>
                    {!validation.passed && validation.details && (
                      <p className="text-sm text-gray-500 mt-1">{validation.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Update the DocumentsChecklistTab component
  const DocumentsChecklistTab = () => {
    // Modify how documents are filtered based on their status
    const pendingDocuments = caseData.documentTypes.filter(doc => 
      doc.status === DOCUMENT_STATUS.PENDING && !processingDocIds.includes(doc._id)
    );
    
    const processingDocuments = caseData.documentTypes.filter(doc => 
      processingDocIds.includes(doc._id)
    );
    
    const uploadedDocuments = caseData.documentTypes.filter(doc => 
      doc.status === DOCUMENT_STATUS.UPLOADED || doc.status === DOCUMENT_STATUS.APPROVED
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

    // Update the renderDocumentsList function
    const renderDocumentsList = () => {
      // Filter documents based on the selected tab
      const documentsToShow = selectedDocumentTab === 'pending' 
        ? [...processingDocuments, ...pendingDocuments]
        : uploadedDocuments;
      
      // Sort documents: processing first, then pending
      const sortedDocuments = documentsToShow.sort((a, b) => {
        const aIsProcessing = processingDocIds.includes(a._id);
        const bIsProcessing = processingDocIds.includes(b._id);
        
        if (aIsProcessing && !bIsProcessing) return -1;
        if (!aIsProcessing && bIsProcessing) return 1;
        return 0;
      });
      
      return (
      <div className="col-span-8 bg-white rounded-lg border border-gray-200">
        {/* Processing Notification Band - Only show in pending tab when documents are processing */}
        {selectedDocumentTab === 'pending' && processingDocIds.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-amber-800">
                  Processing {processingDocIds.length} {processingDocIds.length === 1 ? 'Document' : 'Documents'}
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  Please wait while we analyze and validate your documents
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-6 space-y-3">
          {sortedDocuments.length > 0 ? (
            sortedDocuments.map((doc) => {
              const isProcessing = processingDocIds.includes(doc._id);
              const status = isProcessing ? 'processing' : doc.status;
              
              return (
                <div 
                  key={doc._id} 
                  className={`rounded-lg border p-4 ${
                    status === DOCUMENT_STATUS.APPROVED ? 'bg-green-50 border-green-200' :
                    status === DOCUMENT_STATUS.UPLOADED ? 'bg-blue-50 border-blue-200' :
                    status === 'processing' ? 'bg-amber-50 border-amber-200 animate-pulse' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                <div className="flex justify-between items-start group">
                    <div className="flex items-start space-x-3">
                      <div 
                        className={`p-2 rounded-lg ${
                          status === DOCUMENT_STATUS.APPROVED ? 'bg-green-100 text-green-600' :
                          status === DOCUMENT_STATUS.UPLOADED ? 'bg-blue-100 text-blue-600' :
                          status === 'processing' ? 'bg-amber-100 text-amber-600' :
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {status === DOCUMENT_STATUS.APPROVED ? (
                          <Check className="w-5 h-5" />
                        ) : status === DOCUMENT_STATUS.UPLOADED ? (
                          <FileText className="w-5 h-5" />
                        ) : status === 'processing' ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                      </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">
                      {doc.name}
                      {doc.required && (
                        <span className="ml-2 text-xs text-red-500">*Required</span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-500 leading-snug">
                          {status === DOCUMENT_STATUS.APPROVED ? 'Document approved' :
                           status === DOCUMENT_STATUS.UPLOADED ? 'Uploaded and awaiting approval' :
                           status === 'processing' ? 'Processing document...' :
                           `Please upload your ${doc.name.toLowerCase()} document`}
                    </p>
                  </div>
                </div>
                    
                    {doc.upload_date && (
                      <span className="text-xs text-gray-500">
                        {formatDate(doc.upload_date)}
                      </span>
                    )}
              </div>
                  
                  {status === DOCUMENT_STATUS.UPLOADED && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleDocumentApprove(doc.documentTypeId, doc._id)}
                        disabled={processingDocuments[doc._id]}
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300"
                      >
                        {processingDocuments[doc._id] ? (
                          <>
                            <Loader2 className="animate-spin -ml-0.5 mr-2 h-4 w-4" />
                            Processing...
                          </>
                        ) : (
                          <>Approve</>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleRequestReupload(doc.documentTypeId, doc._id)}
                        disabled={processingDocuments[doc._id]}
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        {processingDocuments[doc._id] ? (
                          <>
                            <Loader2 className="animate-spin -ml-0.5 mr-2 h-4 w-4" />
                            Processing...
                          </>
                        ) : (
                          <>Request reupload</>
                        )}
                  </button>
                </div>
                  )}
              </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {selectedDocumentTab === 'pending' 
                  ? 'No pending documents. All documents have been uploaded.' 
                  : 'No uploaded documents yet.'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
    };

    const renderSmartUpload = () => {
      // Disable upload if all documents are already uploaded, approved, or being processed
      const hasPendingDocuments = caseData.documentTypes.some(doc => 
        doc.status === DOCUMENT_STATUS.PENDING && !processingDocIds.includes(doc._id)
      );
      
      const isProcessingAnyDocument = processingDocIds.length > 0;
      
      // If in uploaded tab or no pending documents, don't show upload UI
      if (selectedDocumentTab === 'uploaded' || !hasPendingDocuments) {
        return null;
      }

      return (
        <div className="col-span-4 bg-white rounded-lg border border-gray-200 p-6 relative">
          <div className={`transition-opacity duration-200 ${isProcessingAnyDocument ? 'opacity-50' : 'opacity-100'}`}>
            <div className="mb-4 pb-4 border-b border-gray-100">
              <h4 className="font-medium text-sm">Smart Upload Files</h4>
            </div>
            
            <div 
              className={`flex flex-col items-center justify-center py-8 rounded-lg transition-colors
                ${isDragging 
                  ? 'bg-blue-50 border-2 border-dashed border-blue-300' 
                  : 'bg-gray-50 border border-gray-200'
                }`}
              onDragOver={isProcessingAnyDocument ? undefined : handleDragOver}
              onDragLeave={isProcessingAnyDocument ? undefined : handleDragLeave}
              onDrop={isProcessingAnyDocument ? undefined : handleDrop}
            >
              <input
                type="file"
                multiple
                className="hidden"
                id="file-upload"
                onChange={handleFileSelect}
                disabled={!hasPendingDocuments || isUploading || isProcessingAnyDocument}
              />
              <div className="p-5">
                <div className="mb-4 flex justify-center">
                  <Upload className={`h-8 w-8 ${isProcessingAnyDocument ? 'text-gray-300' : 'text-blue-500'}`} />
                </div>
                <div className="text-center mb-4">
                  <h5 className={`text-sm font-medium ${isProcessingAnyDocument ? 'text-gray-400' : ''}`}>
                    {isDragging ? 'Drop files here' : 'Drag files here or click to browse'}
                  </h5>
                  <p className="text-xs text-gray-500 mt-1">
                    {isProcessingAnyDocument 
                      ? 'Please wait while current documents are being processed'
                      : `${pendingDocuments.length} documents pending upload`}
                  </p>
                </div>
                <div className="flex justify-center">
                  <label
                    htmlFor="file-upload"
                    className={`px-3 py-2 text-sm rounded-md ${
                      hasPendingDocuments && !isUploading && !isProcessingAnyDocument
                        ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Browse Files
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Only show selected files when not processing */}
          {files.length > 0 && !isProcessingAnyDocument && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-sm font-medium">Selected Files ({files.length})</h5>
                <button
                  onClick={() => setFiles([])}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-xs truncate max-w-[150px]">{file.name}</span>
                    </div>
                    <button 
                      onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <button 
                  onClick={() => handleFileUpload(files)}
                  disabled={files.length === 0 || isUploading || isProcessingAnyDocument}
                  className={`w-full py-2 text-sm rounded-md ${
                    files.length > 0 && !isUploading && !isProcessingAnyDocument
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Uploading...
                    </div>
                  ) : (
                    'Upload Files'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      );
    };


    // Sub-tabs navigation component
    const SubTabNavigation = () => {
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
            { id: 'validation', label: 'Verification' },
            { 
              id: 'cross-verification', 
              label: 'Cross Verification',
              disabled: !allDocsUploaded,
              tooltip: 'All documents must be uploaded to enable cross verification'
            },
            { 
              id: 'finalize', 
              label: 'Finalize',
              disabled: !hasUploadedDocuments,
              tooltip: 'Upload at least one document to enable this feature'
            }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (!tab.disabled) {
                  setSelectedSubTab(tab.id);
                  
                  // Special handling for cross-verification tab
                  if (tab.id === 'cross-verification') {
                    console.log('Cross-verification tab clicked, checking for data');
                    
                    // First check if we already have data in memory
                    if (verificationDataRef.current) {
                      console.log('Using existing cross-verification data from memory ref');
                      // Make sure state is synced with ref
                      if (!verificationData || JSON.stringify(verificationData) !== JSON.stringify(verificationDataRef.current)) {
                        console.log('Syncing state with ref data');
                        setVerificationData(verificationDataRef.current);
                      }
                      return;
                    }
                    
                    // If not in memory, check localStorage
                    try {
                      const savedData = localStorage.getItem(`cross-verification-data-${caseId}`);
                      if (savedData) {
                        console.log('Found cross-verification data in localStorage, using it instead of API call');
                        const parsedData = JSON.parse(savedData);
                        setVerificationData(parsedData);
                        verificationDataRef.current = parsedData;
                        return;
                      }
                    } catch (e) {
                      console.error('Error reading localStorage:', e);
                    }
                    
                    // If we got here, we need to fetch from API as a last resort
                    console.log('No cross-verification data found in memory or localStorage, fetching from API');
                    fetchCrossVerificationData();
                  }
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
      switch (selectedSubTab) {
        case 'all':
          // Filter documents based on the selected tab
          const documentsToShow = selectedDocumentTab === 'pending' 
            ? [...processingDocuments, ...pendingDocuments]
            : uploadedDocuments;
          
          // Sort documents: processing first, then pending
          const sortedDocuments = documentsToShow.sort((a, b) => {
            const aIsProcessing = processingDocIds.includes(a._id);
            const bIsProcessing = processingDocIds.includes(b._id);
            
            if (aIsProcessing && !bIsProcessing) return -1;
            if (!aIsProcessing && bIsProcessing) return 1;
            return 0;
          });

          return (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8">
                <div className="bg-white rounded-lg border border-gray-200">
                  {/* Processing Notification Band - Only at the top of documents section */}
                  {processingDocIds.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-amber-50/90 to-amber-50/70 border-b border-amber-100/50">
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
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/70 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/70 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/70 animate-pulse" style={{ animationDelay: '600ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-6 space-y-3">
                    {/* Rest of the document list content remains the same */}
                    {sortedDocuments.length > 0 ? (
                      sortedDocuments.map((doc) => {
                        const isProcessing = processingDocIds.includes(doc._id);
                        const status = isProcessing ? 'processing' : doc.status;
                        
                        return (
                          <div 
                            key={doc._id} 
                            className={`rounded-lg border p-4 ${
                              status === DOCUMENT_STATUS.APPROVED ? 'bg-green-50 border-green-200' :
                              status === DOCUMENT_STATUS.UPLOADED ? 'bg-blue-50 border-blue-200' :
                              status === 'processing' ? 'bg-amber-50 border-amber-200' :
                              'bg-gray-50 border-gray-200'
                            }`}
                          >
                            {/* Rest of the document card content remains the same */}
                            <div className="flex justify-between items-start group">
                              <div className="flex items-start space-x-3">
                                <div 
                                  className={`p-2 rounded-lg ${
                                    status === DOCUMENT_STATUS.APPROVED ? 'bg-green-100 text-green-600' :
                                    status === DOCUMENT_STATUS.UPLOADED ? 'bg-blue-100 text-blue-600' :
                                    status === 'processing' ? 'bg-amber-100 text-amber-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {status === DOCUMENT_STATUS.APPROVED ? (
                                    <Check className="w-5 h-5" />
                                  ) : status === DOCUMENT_STATUS.UPLOADED ? (
                                    <FileText className="w-5 h-5" />
                                  ) : status === 'processing' ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    <Upload className="w-5 h-5" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm mb-1">
                                    {doc.name}
                                    {doc.required && (
                                      <span className="ml-2 text-xs text-red-500">*Required</span>
                                    )}
                                  </h4>
                                  <p className="text-sm text-gray-500 leading-snug">
                                    {status === DOCUMENT_STATUS.APPROVED ? 'Document approved' :
                                     status === DOCUMENT_STATUS.UPLOADED ? 'Uploaded and awaiting approval' :
                                     status === 'processing' ? 'Processing document...' :
                                     `Please upload your ${doc.name.toLowerCase()} document`}
                                  </p>
                                </div>
                              </div>
                              
                              {doc.upload_date && (
                                <span className="text-xs text-gray-500">
                                  {formatDate(doc.upload_date)}
                                </span>
                              )}
                            </div>
                            
                            {status === DOCUMENT_STATUS.UPLOADED && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleDocumentApprove(doc.documentTypeId, doc._id)}
                                  disabled={processingDocuments[doc._id]}
                                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300"
                                >
                                  {processingDocuments[doc._id] ? (
                                    <>
                                      <Loader2 className="animate-spin -ml-0.5 mr-2 h-4 w-4" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>Approve</>
                                  )}
                                </button>
                                
                                <button
                                  onClick={() => handleRequestReupload(doc.documentTypeId, doc._id)}
                                  disabled={processingDocuments[doc._id]}
                                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                  {processingDocuments[doc._id] ? (
                                    <>
                                      <Loader2 className="animate-spin -ml-0.5 mr-2 h-4 w-4" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>Request reupload</>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          {selectedDocumentTab === 'pending' 
                            ? 'No pending documents. All documents have been uploaded.' 
                            : 'No uploaded documents yet.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="col-span-4">
                <div className="bg-white rounded-lg border border-gray-200">
                  {renderSmartUpload()}
                </div>
              </div>
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
              caseData={caseData} // Add this prop
            />
          );
        case 'cross-verification':
          // Use the ref for the most up-to-date verification data
          return (
            <CrossVerificationTab 
              verificationData={verificationDataRef.current || verificationData}
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
                  const hasVerificationData = (verificationDataRef.current || verificationData) && 
                    Object.keys(verificationDataRef.current || verificationData).length > 0;
                  
                  const getValidationStatus = () => {
                    const currentValidationData = validationDataRef.current || validationData;
                    if (!currentValidationData?.mergedValidations) return 'pending';
                    
                    // Find validation for current document
                    const docValidation = currentValidationData.mergedValidations.find(
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
                    status: doc.status === DOCUMENT_STATUS.APPROVED ? 'Approved' : 'Verification pending',
                    documentTypeId: doc.documentTypeId,
                    managementId: caseId,
                    states: [
                      { name: 'Document collection', status: 'success' },
                      { name: 'Read', status: 'success' },
                      { name: 'Verification', status: getValidationStatus() },
                      { name: 'Cross Verification', status: doc.status === DOCUMENT_STATUS.APPROVED ? 'success' : 'pending' }
                    ]
                  };
                })}
              onStateClick={(tabName, document) => {
                switch (tabName) {
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
              onDocumentsUpdate={(updatedDocuments) => {
                // Update the caseData state with the new document statuses
                setCaseData(prevData => ({
                  ...prevData,
                  documentTypes: prevData.documentTypes.map(doc => {
                    const updatedDoc = updatedDocuments.find(d => d.documentTypeId === doc.documentTypeId);
                    if (updatedDoc) {
                      return {
                        ...doc,
                        status: updatedDoc.status === 'Approved' ? DOCUMENT_STATUS.APPROVED : doc.status
                      };
                    }
                    return doc;
                  })
                }));
              }}
              managementId={caseId}
              onStepCompleted={refreshCaseSteps}
            />
          );
        case 'letters':
          return <LetterTab
            key={step._id}
            managementId={caseId}
            stepId={step._id}
            onStepCompleted={refreshCaseSteps}
          />;
        case 'receipts':
          return (
            <ReceiptsTab
              key={step._id}
              managementId={caseId}
              stepId={step._id}
              onStepCompleted={refreshCaseSteps}
            />
          );
        case 'payment':
          return (
            <PaymentTab 
              key={step._id}
              caseId={caseId} 
              stepId={step._id}
              onPaymentCompleted={refreshCaseSteps}
            />
          );
        case 'retainer':
          return (() => {
            // Get the case manager ID, handling both string and object formats
            const managerId = (() => {
              const cmId = caseData?.caseManagerId; // Changed from case_manager_id to caseManagerId
              if (!cmId) return null;
              if (typeof cmId === 'string') return cmId;
              if (typeof cmId === 'object' && cmId._id) return cmId._id;
              return null;
            })();

            console.log('Retainer Tab Data:', {
              caseId,
              caseManagerId: managerId,
              rawCaseManagerId: caseData?.caseManagerId,
              userId: caseData?.userId?._id,
              fullCaseData: caseData
            });

            return (
              <RetainerTab 
                companyId={profileData.company_id._id} 
                profileData={profileData}
                caseId={caseId}
                caseManagerId={managerId}
                applicantId={caseData.userId?._id}
                caseData={caseData}
                stepId={processedSteps.find(step => step.key === 'retainer')?._id}
                onRetainerUploaded={refreshCaseSteps}
              />
            );
          })();
        case 'packaging':
          return (
            <DocumentsArchiveTab
              key={step._id}
              managementId={caseId}
              stepId={step._id}
              onStepCompleted={refreshCaseSteps}
            />
          );
        default:
          return null;
      }
    };

    const renderValidationSection = () => {
      // Get the most up-to-date validation data from the ref or state
      const currentValidationData = validationDataRef.current || validationData;
      
      console.log('Rendering validation section with data:', currentValidationData);
      console.log('Validation updated state:', validationUpdated);
      
      if (!currentValidationData || !currentValidationData.mergedValidations || currentValidationData.mergedValidations.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Validation Data Available</h3>
            <p className="text-gray-500 max-w-md">
              Validation data will appear here after your documents have been processed.
            </p>
          </div>
        );
      }

      // Filter out unknown document types
      const validDocuments = currentValidationData.mergedValidations.filter(doc => 
        !doc.isUnknownType && doc.documentType !== 'Unknown'
      );

      // If all documents are unknown, show a message
      if (validDocuments.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents to Verify</h3>
            <p className="text-gray-500 max-w-md">
              There are no documents that require verification at this time.
            </p>
          </div>
        );
      }

      // Count total failed validations across all valid documents
      const totalFailedValidations = validDocuments.reduce((total, doc) => 
        total + doc.validations.filter(v => !v.passed).length, 0
      );

      // Count document types with validations
      const documentCount = validDocuments.length;
      
      console.log(`Displaying validations for ${documentCount} documents with ${totalFailedValidations} failed validations`);

      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Document Verification</h2>
              <p className="text-sm text-gray-500 mt-1">
                Validation results for {documentCount} {documentCount === 1 ? 'document' : 'documents'}
              </p>
            </div>
            {totalFailedValidations > 0 ? (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-rose-50 text-rose-600 border border-rose-200">
                {totalFailedValidations} {totalFailedValidations === 1 ? 'Issue' : 'Issues'} Found
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                All Verifications Passed
              </span>
            )}
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            {validDocuments.map((docValidation, index) => (
              <div 
                key={`validation-section-${docValidation.documentType}-${index}-${validationUpdated}`}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">
                    {docValidation.documentType}
                    <span className="ml-2 text-sm text-gray-500">
                      ({docValidation.validations.length} {docValidation.validations.length === 1 ? 'check' : 'checks'})
                    </span>
                  </h3>
                </div>
                <div className="p-4">
                  <DocumentVerificationSection
                    key={`validation-content-${docValidation.documentType}-${index}-${validationUpdated}`}
                    document={{ name: docValidation.documentType }}
                    validations={docValidation.validations}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="p-6">
        <SubTabNavigation />
        {selectedSubTab === 'validation' ? (
          renderValidationSection()
        ) : (
          renderSubTabContent()
        )}
      </div>
    );
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragging) {
    setIsDragging(true);
    }
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prevFiles => [...prevFiles, ...droppedFiles]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  };

  // Update the QuestionnaireDetailView component
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
          // Only the first group in the ordered list is expanded
          acc[groupName] = orderedGroupNames.length > 0 && groupName === orderedGroupNames[0];
          return acc;
        }, {});
        
        setExpandedGroups(initialState);
      }
    }, [localFormData]); // Remove expandedGroups from dependency array

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
      // Special handling for radio button groups
      if (field.fieldType && field.fieldType.toLowerCase().includes('radio')) {
        // Find all fields with the same fieldLabel
        const groupFields = Object.values(localFormData || {}).filter(f => f.fieldType && f.fieldType.toLowerCase().includes('radio') && f.fieldLabel === field.fieldLabel);
        // If any radio in the group has a non-empty value, consider the group filled
        return !groupFields.some(f => f.value !== undefined && f.value !== null && f.value !== '');
      }
      if (Array.isArray(field.value)) return field.value.length === 0;
      if (typeof field.value === 'string') return field.value.trim() === '';
      return field.value === undefined || field.value === null || field.value === '';
    };

    // Input change handler for form fields
    const handleLocalInputChange = (fieldKey, value) => {
        console.log('Input change:', {
        fieldKey,
          value,
          fieldType: localFormData[fieldKey]?.fieldType
      });

      setLocalFormData(prevData => {
        const updatedData = { ...prevData };
        if (updatedData[fieldKey]) {
            const field = updatedData[fieldKey];
            
            // Handle radio button values consistently
            if (field.fieldType?.toLowerCase().includes('radio')) {
              console.log('Converting radio value:', {
            fieldName: field.fieldName,
                originalValue: value
              });
              // Do NOT convert 'Yes'/'No' to boolean; always store the string value
              // console.log('Converted radio value:', {
              //   fieldName: field.fieldName,
              //   convertedValue: value
              // });
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
          // Update the status to saved
          await api.put(`/questionnaire-responses/${caseId}/status`);
          
          // Update case step status to completed
          const stepToUpdate = processedSteps.find(step => step.key === 'questionnaire');
          if (stepToUpdate) {
            try {
              // Make API call to update step status
              await api.put(`/case-steps/case/${caseId}/step/questionnaire/status`, {
                status: 'completed'
              });
              console.log('[Debug] Successfully updated questionnaire step status');
              await refreshCaseSteps();
            } catch (error) {
              console.error('[Debug] Error updating questionnaire step status:', error);
              toast.error('Failed to update step status');
            }
          }
          
          toast.success('Changes saved successfully');
          setIsQuestionnaireCompleted(true);
          setActiveTab('forms'); // Add this line to switch to forms tab
        }
      } catch (error) {
        console.error('Error saving questionnaire:', error);
        toast.error('Failed to save changes');
      } finally {
        setIsSaving(false);
      }
    };

    // Updated function to count filled fields (only visible fields)
    const getFilledFieldsCount = () => {
      const allFieldKeys = Object.keys(localFormData || {});
      const visibleFields = allFieldKeys.filter(fieldKey => shouldShowField(fieldKey));
      const totalFields = visibleFields.length;
      const filledFields = visibleFields.filter(fieldKey => !isFieldEmpty(fieldKey)).length;
      return { filledFields, totalFields };
    };

    // Update function to check if field should be visible
    const evaluateDependencyRule = (rule, allFields) => {
      if (!rule) return true;

      const dependentField = rule.field;
      if (dependentField.dependsOn) {
        const dependencyValue = allFields[dependentField.dependsOn];
        const dependencyRule = dependentField.dependencyRule;
        return evaluateDependencyRule(dependencyRule, allFields);
      }

      const fieldValue = allFields[rule.field];
      return rule.condition === 'equals' ? fieldValue === rule.value : true;
    };

    const evaluateVisibilityCondition = (conditions, allFields) => {
      // Handle array of conditions (all must be satisfied - AND logic)
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

            // Only log the actual comparison being made
            // console.log(`Checking ${parentField.fieldName}:`, {
            //   expectedValue: rule.value,
            //   actualValue: parentValue,
            //   fieldType: parentField.fieldType
            // });

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

            // console.log('Rule evaluation:', {
            //   fieldName: field.fieldName,
            //   parentFieldName: parentField.fieldName,
            //   operator: rule.operator,
            //   expectedValue: rule.value,
            //   actualValue: parentValue,
            //   result
            // });

            return result;
          });
        });
      }

      return true;
    };

    // Helper function to convert old format to new tree structure
    const convertOldToNewFormat = (oldConditions) => {
      if (!oldConditions || oldConditions.length === 0) return null;

      // If there's only one condition, no need for logical operator
      if (oldConditions.length === 1) {
        return {
          parentField: oldConditions[0].parentField,
          showWhen: oldConditions[0].showWhen
        };
      }

      // Debug: Log old format conversion
      // console.log('Converting old format to new:', {
      //   oldConditions
      // });

      // Multiple conditions are combined with AND by default
      const newFormat = {
        operator: 'AND',
        conditions: oldConditions.map(condition => ({
          parentField: condition.parentField,
          showWhen: condition.showWhen
        }))
      };

      // Debug: Log new format
      // console.log('Converted to new format:', {
      //   newFormat
      // });

      return newFormat;
    };

    const evaluateCondition = (condition, allFields) => {
      // Support array of conditions (AND logic)
      if (Array.isArray(condition)) {
        return condition.every(cond => evaluateCondition(cond, allFields));
      }
      // Handle null/undefined conditions
      if (!condition) return true;

      // Handle logical operator nodes (AND/OR/NOT)
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

      // Handle leaf nodes (simple field conditions)
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
              // If fieldValue is empty/undefined/null, do not show the field
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
      // Invalid condition structure
      console.warn('Invalid condition structure:', condition);
      return false;
    };

    const validateVisibilityConditions = (condition) => {
      if (!condition) return true;
      // Support array of conditions (AND logic)
      if (Array.isArray(condition)) {
        return condition.every(validateVisibilityConditions);
      }
      // Case 1: Logical operator node
      if (condition.operator && condition.conditions) {
        // Validate operator
        if (!['AND', 'OR', 'NOT'].includes(condition.operator)) {
          console.error('Invalid logical operator:', condition.operator);
          return false;
        }

        // Validate conditions array
        if (!Array.isArray(condition.conditions)) {
          console.error('Conditions must be an array');
          return false;
        }

        // NOT operator must have exactly one condition
        if (condition.operator === 'NOT' && condition.conditions.length !== 1) {
          console.error('NOT operator must have exactly one condition');
          return false;
        }

        // Recursively validate all conditions
        return condition.conditions.every(c => validateVisibilityConditions(c));
      }

      // Case 2: Leaf node (field condition)
      if (condition.parentField && condition.showWhen) {
        // Validate showWhen array
        if (!Array.isArray(condition.showWhen)) {
          console.error('showWhen must be an array');
          return false;
        }

        // Validate each rule
        return condition.showWhen.every(rule => {
          const validOperators = [
            'equals', 'not_equals', 'in', 'not_in', 'exists', 'not_exists',
            'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal'
          ];

          if (!validOperators.includes(rule.operator)) {
            console.error('Invalid operator:', rule.operator);
            return false;
          }

          // Validate value for operators that require it
          if (!['exists', 'not_exists'].includes(rule.operator)) {
            if (rule.value === undefined) {
              console.error('Value required for operator:', rule.operator);
              return false;
            }

            // Validate numeric operators have numeric values
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

      // Invalid condition structure
      console.error('Invalid condition structure:', condition);
      return false;
    };

        // Updated function to get fields from the new structure
        const getFields = () => {
          // If we have form data, return the actual field data
          if (localFormData && Object.keys(localFormData).length > 0) {
            return localFormData;
          }
          
          // Otherwise return empty object
          return {};
        };
    
        const allFields = getFields();

    const shouldShowField = (fieldKey) => {
      const field = allFields[fieldKey];

      if (!field) return false;
      
      // Skip "flr" fields but allow "ste" fields (Street Number and Name)
      if (fieldKey === 'flr' || field.fieldName === 'flr') {
        return false;
      }

      // If field has no visibilityConditions, show it by default
      const isVisible = !field.visibilityConditions || (
        validateVisibilityConditions(field.visibilityConditions) &&
        evaluateCondition(field.visibilityConditions, allFields)
      );

      // If "Show Only Empty Fields" is enabled, only show empty and visible fields
      if (showOnlyEmpty) {
        return isVisible && isFieldEmpty(fieldKey);
      }
      
      return isVisible;
    };

    const { filledFields, totalFields } = getFilledFieldsCount();


    // Group fields by their groupName and then subgroup by fieldLabel
    // Store the original order of all keys as they come from MongoDB
    const allKeys = useMemo(() => Object.keys(localFormData || {}), [localFormData]);
    
    const groupedFields = useMemo(() => {
      const groups = {};
      
      // First pass: organize fields by their main group and sort by position in array
      // Create a map to store fields with their metadata for sorting
      const fieldSortingMap = new Map();
      
      // First pass to collect all field metadata for sorting
      Object.entries(localFormData || {}).forEach(([fieldKey, field], index) => {
        const groupName = field?.groupName || 'Ungrouped';
        const subGroup = field?.subGroup || null;
        
        fieldSortingMap.set(fieldKey, {
          subGroup: subGroup,
          originalIndex: index,
          groupName: groupName
        });
        
        // Initialize group if it doesn't exist
        if (!groups[groupName]) {
          groups[groupName] = {
            _subgroups: {}, // For fields that can be subgrouped by fieldLabel
            _individual: [] // For fields that don't share fieldLabel with others
          };
        }
      });
      
      // Get all field keys in their original MongoDB order
      const allFieldKeys = Array.from(fieldSortingMap.keys());
      
      // Add fields to their groups in the original order from MongoDB
      allFieldKeys.forEach(fieldKey => {
        const field = localFormData[fieldKey];
        const sortingData = fieldSortingMap.get(fieldKey);
        const groupName = sortingData.groupName;
        
        // If the field has a subGroup, add it to that subgroup
        if (field?.subGroup) {
          if (!groups[groupName]._subgroups[field.subGroup]) {
            groups[groupName]._subgroups[field.subGroup] = [];
          }
          groups[groupName]._subgroups[field.subGroup].push(fieldKey);
        } else {
          // Add the field key to the individual list if it doesn't have a subGroup
          groups[groupName]._individual.push(fieldKey);
        }
      });
      
      // Preserve the order from MongoDB by tracking the order fields appear in the response
      const groupOrderMap = new Map();
      let orderIndex = 0;
      
      // First pass: record the order in which each group first appears
      Object.entries(localFormData || {}).forEach(([fieldKey, field]) => {
        const groupName = field?.groupName || 'Ungrouped';
        if (!groupOrderMap.has(groupName)) {
          groupOrderMap.set(groupName, orderIndex++);
        }
      });
      
      // Sort groups based on their first appearance in the data
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

    const renderField = (fieldKey, hideLabel = false) => {
      // Get the field object
      let field = localFormData[fieldKey];
      
      // Use the fieldLabel from the response - prefer field.label, fallback to fieldKey
      let fieldLabel = field?.fieldLabel || field?.label || fieldKey;
      
      // Special handling for fields that should not be grouped despite having the same label
      const isSpecialField = (
        // Residential Address History date fields
        (field?.groupName === 'Residential Address History' && 
         (field?.fieldType || '').toLowerCase().includes('date') &&
         field?.fieldName && 
         (field?.fieldName.includes('residence_from') || field?.fieldName.includes('residence_to')))
        ||
        // Personal Information name fields that need to be separated
        (field?.groupName === 'Personal Information' &&
         (field?.fieldLabel === 'Family name (Last name)' || field?.fieldLabel === 'Given name (First name)') &&
         field?.fieldName && 
         (field?.fieldName.includes('other_name') || field?.fieldName.includes('current_name') || 
          field?.fieldName.includes('change_name')))
      );
      
      if (isSpecialField && !hideLabel) {
        // For Residential Address History date fields
        if (field.groupName === 'Residential Address History') {
          // Add specific address details to date fields when not in a subgroup
          if (field.fieldName.includes('residence_from_1') || field.fieldName.includes('residence_to_1')) {
            fieldLabel += ' (Address 1)';
          } else if (field.fieldName.includes('residence_from_2') || field.fieldName.includes('residence_to_2')) {
            fieldLabel += ' (Address 2)';
          } else if (field.fieldName.includes('residence_from_3') || field.fieldName.includes('residence_to_3')) {
            fieldLabel += ' (Address 3)';
          } else if (field.fieldName.includes('residence_from_date') || field.fieldName.includes('residence_to_date')) {
            fieldLabel += ' (Current Address)';
          }
        }
        
        // For Personal Information name fields
        if (field.groupName === 'Personal Information' && 
            (field.fieldLabel === 'Family name (Last name)' || field.fieldLabel === 'Given name (First name)')) {
          if (field.fieldName.includes('current_name')) {
            fieldLabel += ' (Current)';
          } else if (field.fieldName.includes('other_name')) {
            fieldLabel += ' (Previous)';
          } else if (field.fieldName.includes('change_name')) {
            fieldLabel += ' (Changed)';
          }
        }
      }
      
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
      
      // Extract the base question name for radio buttons 
      // Group radio buttons by their fieldLabel instead of field name pattern
      const getBaseQuestionName = () => {
        // If no input type or not a radio button, return fieldName
        if (!inputType || inputType !== 'radio button') return fieldName;
        
        // Use field label as the group identifier - normalize it to create a consistent key
        return (field?.fieldLabel || '').toLowerCase().replace(/\s+/g, '_');
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
        
        if (isDateField || (fieldValue && typeof fieldValue === 'string')) {
          // Check common date formats in the value
          if (fieldValue) {
            // ISO format: YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(fieldValue)) return 'date';
            
            // Common formats with slashes: MM/DD/YYYY or DD/MM/YYYY
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fieldValue)) return 'date';
            
            // Format with text month: DD/MMM/YYYY like 05/JAN/2021
            if (/^\d{1,2}\/[A-Za-z]{3}\/\d{4}$/.test(fieldValue)) return 'date';
            
            // Another common format: MM-DD-YYYY or DD-MM-YYYY
            if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(fieldValue)) return 'date';
            
            // Try parsing with Date object as last resort
            if (isDateField) {
              try {
                const date = new Date(fieldValue);
                if (!isNaN(date.getTime())) return 'date';
              } catch (error) {
                // If parsing fails, it's not a date
              }
            }
          } else if (isDateField) {
            // If it has a date-related name but no value yet, still use date input
            return 'date';
          }
        }
        
        return isTextareaField ? 'textarea' : 'text';
      };

      const inputType = getInputType();

      // Format date value for input field
      const formatDateValue = (value) => {
        if (!value || inputType !== 'date') return value || '';
        
        // Try to parse the date string
        try {
          // If it's already in YYYY-MM-DD format, return as is
          if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
          
          // Handle DD/MMM/YYYY format (like 05/FEB/1965)
          const dateMatch1 = value.match(/(\d{1,2})\/([A-Za-z]{3})\/(\d{4})/);
          if (dateMatch1) {
            const [_, day, monthStr, year] = dateMatch1;
            const months = {
              'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
              'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
            };
            const month = months[monthStr.toUpperCase()];
            if (month) {
              return `${year}-${month}-${day.padStart(2, '0')}`;
            }
          }
          
          // Handle MM/DD/YYYY or DD/MM/YYYY format
          const dateMatch2 = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (dateMatch2) {
            const [_, part1, part2, year] = dateMatch2;
            
            // Handle both formats conservatively by assuming MM/DD for US format 
            // and DD/MM for other formats - we'll use MM/DD as it's more common in the system
            // If month is > 12, swap parts
            let month = part1;
            let day = part2;
            
            if (parseInt(part1) > 12) {
              month = part2;
              day = part1;
            }
            
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          
          // Handle DD-MM-YYYY or MM-DD-YYYY format
          const dateMatch3 = value.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
          if (dateMatch3) {
            const [_, part1, part2, year] = dateMatch3;
            
            // Handle both formats conservatively by assuming MM/DD for US format
            // and DD/MM for other formats - we'll use MM/DD as it's more common in the system
            // If month is > 12, swap parts
            let month = part1;
            let day = part2;
            
            if (parseInt(part1) > 12) {
              month = part2;
              day = part1;
            }
            
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          
          // Try parsing with Date object as fallback
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            // JavaScript months are 0-indexed, so we add 1 and pad
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
        } catch (error) {
          console.warn('Error formatting date value:', error);
        }
        
        // Return original value if parsing fails
        return value;
      };
      
      // Parse options for dropdown, radio buttons, or checkboxes
      const getOptions = () => {
        if (!fieldValues) return [];
        
        // If fieldValues is a string containing "Country List" or "State List"
        if (typeof fieldValues === 'string') {
          if (fieldValues.includes('Country List')) {
            // Return a common list of countries (simplified for example)
            return [
              'United States', 'Canada', 'Mexico', 'United Kingdom', 'China', 'India', 
              'Australia', 'Germany', 'France', 'Japan', 'Brazil', 'Russia'
              // In production, use a complete country list or fetch from API
            ];
          }
          
          if (fieldValues.includes('State List')) {
            // Return a list of US states (simplified for example)
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
      
      // Generate a unique ID for the field
      const fieldId = `field-${fieldName.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Get the base question name for radio groups
      const baseQuestionName = getBaseQuestionName();
      
      // Create radio group name - this groups related radio options together
      const radioGroupName = `radio-group-${baseQuestionName}`;
      
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
      
      // Handle change for different input types
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
          // For checkboxes, toggle the value in an array
          if (options.length <= 1) {
            // For single checkboxes, toggle boolean value
            handleLocalInputChange(fieldKey, !field.value);
          } else {
            // For multiple options checkboxes, manage array of values
            let newValue = Array.isArray(field.value) ? [...field.value] : [];
            if (newValue.includes(optionValue)) {
              newValue = newValue.filter(val => val !== optionValue);
            } else {
              newValue.push(optionValue);
            }
            handleLocalInputChange(fieldKey, newValue);
          }
        } else {
          // For all other field types
          handleLocalInputChange(fieldKey, value);
        }
      };
      
      // Parse options if needed
      const options = ['dropdown', 'radio button', 'checkbox'].includes(inputType) ? getOptions() : [];

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
              {options.map((option, index) => (
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
              ))}
            </div>
          )}
        </div>
      );
    };
    
    // Render a single group of fields as an accordion
    const renderGroup = (groupName, groupData) => {
      // Check if there are visible fields in this group
      const allFields = [...groupData._individual];
      Object.values(groupData._subgroups || {}).forEach(subgroupFields => {
        allFields.push(...subgroupFields);
      });
      
      const visibleFields = allFields.filter(shouldShowField);
      if (visibleFields.length === 0) return null;
      
      // Get completion stats for this group
      const { completed, total, percentage } = getGroupCompletionStats(groupData);
      const isExpanded = expandedGroups[groupName] || false;
      
      // Track which subgroups have been rendered
      const renderedSubgroups = new Set();
      
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const elements = [];
                  const keys = allKeys.filter(key => {
                    const field = localFormData[key];
                    return field?.groupName === groupName && shouldShowField(key);
                  });
                  let i = 0;
                  while (i < keys.length) {
                    const fieldKey = keys[i];
                    const field = localFormData[fieldKey];
                    // Handle subgroups
                    if (field?.subGroup && groupData._subgroups[field.subGroup] && !renderedSubgroups.has(field.subGroup)) {
                      renderedSubgroups.add(field.subGroup);
                      const subgroupFields = groupData._subgroups[field.subGroup].filter(shouldShowField);
                      // Render radio/checkbox groups inside subgroups
                      let j = 0;
                      const subgroupElements = [];
                      while (j < subgroupFields.length) {
                        const subFieldKey = subgroupFields[j];
                        const subField = localFormData[subFieldKey];
                        // Group radio buttons
                        if (subField.fieldType === 'Radio Button') {
                          const radioLabel = subField.fieldLabel;
                          const radioFields = [];
                          let k = j;
                          while (
                            k < subgroupFields.length &&
                            localFormData[subgroupFields[k]].fieldType === 'Radio Button' &&
                            localFormData[subgroupFields[k]].fieldLabel === radioLabel
                          ) {
                            radioFields.push(subgroupFields[k]);
                            k++;
                          }
                          subgroupElements.push(
                            <div key={`radio-group-${field.subGroup}-${radioLabel}`} className="mb-2 col-span-full md:col-span-3">
                              <div className="text-sm font-medium text-gray-700 mb-1">{radioLabel}</div>
                              <div className={radioFields.length > 2 ? "grid grid-cols-1 md:grid-cols-3 gap-4" : "flex flex-row gap-6"}>
                                {radioFields.map(radioKey => renderField(radioKey, true))}
                              </div>
                            </div>
                          );
                          j = k;
                          continue;
                        }
                        // Group checkboxes
                        if (subField.fieldType === 'Checkbox') {
                          const checkboxLabel = subField.fieldLabel;
                          const checkboxFields = [];
                          let k = j;
                          while (
                            k < subgroupFields.length &&
                            localFormData[subgroupFields[k]].fieldType === 'Checkbox' &&
                            localFormData[subgroupFields[k]].fieldLabel === checkboxLabel
                          ) {
                            checkboxFields.push(subgroupFields[k]);
                            k++;
                          }
                          subgroupElements.push(
                            <div key={`checkbox-group-${field.subGroup}-${checkboxLabel}`} className="mb-2 col-span-full md:col-span-3">
                              <div className="text-sm font-medium text-gray-700 mb-1">{checkboxLabel}</div>
                              <div className={checkboxFields.length > 2 ? "grid grid-cols-1 md:grid-cols-3 gap-4" : "flex flex-row gap-6"}>
                                {checkboxFields.map(checkboxKey => renderField(checkboxKey, true))}
                              </div>
                            </div>
                          );
                          j = k;
                          continue;
                        }
                        // Render normal field
                        subgroupElements.push(
                          <div key={subFieldKey}>{renderField(subFieldKey, false)}</div>
                        );
                        j++;
                      }
                      elements.push(
                        <div key={`subgroup-${field.subGroup}`} className="mb-4 col-span-full">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-4 w-1 bg-blue-500 rounded-full"></div>
                              <div className="font-medium text-sm text-gray-700">{field.subGroup}</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {subgroupElements}
                            </div>
                          </div>
                        </div>
                      );
                      i += subgroupFields.length;
                      continue;
                    }
                    // Handle radio button groups outside subgroups
                    if (field.fieldType === 'Radio Button') {
                      const radioLabel = field.fieldLabel;
                      const radioFields = [];
                      let j = i;
                      while (
                        j < keys.length &&
                        localFormData[keys[j]].fieldType === 'Radio Button' &&
                        localFormData[keys[j]].fieldLabel === radioLabel
                      ) {
                        radioFields.push(keys[j]);
                        j++;
                      }
                      elements.push(
                        <div key={`radio-group-${groupName}-${radioLabel}-${i}`} className="mb-4 col-span-full">
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
                    // Handle checkbox groups outside subgroups
                    if (field.fieldType === 'Checkbox') {
                      const checkboxLabel = field.fieldLabel;
                      const checkboxFields = [];
                      let j = i;
                      while (
                        j < keys.length &&
                        localFormData[keys[j]].fieldType === 'Checkbox' &&
                        localFormData[keys[j]].fieldLabel === checkboxLabel
                      ) {
                        checkboxFields.push(keys[j]);
                        j++;
                      }
                      elements.push(
                        <div key={`checkbox-group-${groupName}-${checkboxLabel}-${i}`} className="mb-4 col-span-full">
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
                    i++;
                  }
                  return elements;
                })()}
              </div>
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

  // Update the QuestionnaireTab component to handle questionnaire selection
  const QuestionnaireTab = () => {
    const handleQuestionnaireClick = async (questionnaire) => {
      setIsLoadingQuestionnaire(true);
      setSelectedQuestionnaire(questionnaire);
      setLoadingStep(0);
      
      try {
        // Only fetch responses since we already have the template
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
              console.log('Initialized questionnaire data:', initialFormData);
              
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

  // Add FormPreviewModal component before FormsTab
  const FormPreviewModal = ({ isOpen, onClose, pdfBytes, formName, onDownload }) => {
    const [pdfUrl, setPdfUrl] = useState(null);

    useEffect(() => {
      if (pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
        
        return () => {
          window.URL.revokeObjectURL(url);
        };
      }
    }, [pdfBytes]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full h-[90vh] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{formName} - Preview</h2>
            <div className="flex items-center gap-4">
              <button 
                onClick={onDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden">
            {pdfUrl && (
              <iframe
                src={`${pdfUrl}#toolbar=1&zoom=page-fit`}
                className="w-full h-full"
                title="PDF Preview"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const FormsTab = () => {
    const [loadingFormId, setLoadingFormId] = useState(null);
    const [error, setError] = useState(null);
    const [previewPdfBytes, setPreviewPdfBytes] = useState(null);
    const [selectedForm, setSelectedForm] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [existingForms, setExistingForms] = useState([]);
    const [isLoadingForms, setIsLoadingForms] = useState(true);

    // Add useEffect to fetch existing forms
    useEffect(() => {
      const fetchExistingForms = async () => {
        try {
          const response = await api.get(`/management/forms-url/${caseId}/${caseData?.categoryId?._id}`);
          if (response.data.status === 'success') {
            setExistingForms(response.data.data.formsUrl);
          }
        } catch (error) {
          console.error('Error fetching existing forms:', error);
          toast.error('Failed to fetch existing forms');
        } finally {
          setIsLoadingForms(false);
        }
      };

      fetchExistingForms();
    }, []);

    // Function to generate filled PDF
    const generateFilledPDF = async (formId, data) => {
      console.log("formId", formId);
      console.log("Processing form with ID:", formId);

      // Identify which form to use based on formId
      const paticular_form = forms.find(f => f._id === formId);
      if (!paticular_form) {
        console.error("Form not found with ID:", formId);
        throw new Error("Form template not found");
      }

      console.log("Using form:", paticular_form);

      const templateUrl = `/templates/testing${formId}.pdf`;
      const templateBytes = await fetch(templateUrl).then(res => res.arrayBuffer());
      
      const pdfDoc = await PDFDocument.load(templateBytes);
      const form = pdfDoc.getForm();

      // Get processedInformation from response which has the new structure
      const processedInfo = data?.responses?.processedInformation;
      console.log("Processing info for PDF:", processedInfo);

      // Helper function to get a field value from the new structure
      const getFieldValue = (fieldName) => {
        // If processedInfo is in the old format (directly keyed by fieldName)
        if (processedInfo && processedInfo[fieldName] !== undefined && 
            typeof processedInfo[fieldName] !== 'object') {
          return processedInfo[fieldName];
        }

        // Try to find the field by fieldName in the new structure
        for (const key in processedInfo) {
          if (processedInfo[key]?.fieldName === fieldName) {
            return processedInfo[key]?.value || '';
          }
        }

        // If we don't find by fieldName, try to find by matching the key directly
        return processedInfo?.[fieldName]?.value || '';
      };

      if(formId === "67af13fc2ae22aed13702b01"){
        // Fill the form fields with exact field names from the PDF
        form.getTextField('Name of the Applicant').setText(
          getFieldValue('firstName') || 'N/A'
        );
        
        // Details of Applicant section
        form.getTextField('Passport No').setText(getFieldValue('passportNumber') || 'N/A');
        form.getTextField('Place of Issue').setText(getFieldValue('placeOfIssue') || 'N/A');
        form.getTextField('Date of Issue').setText(getFieldValue('dateOfIssue') || 'N/A');
        form.getTextField('Date of Expiry').setText(getFieldValue('dateOfExpiry') || 'N/A');
        form.getTextField('Mobile Phone').setText(getFieldValue('cellNumber') || 'N/A');
        form.getTextField('EMail Address').setText(getFieldValue('emailId') || 'N/A');
        
        // Employment and Education section
        form.getTextField('Name of the Current Employer').setText(
          getFieldValue('currentCompanyName') || 'N/A'
        );
        form.getTextField('Applicants current Designation role  position').setText(
          getFieldValue('currentPosition') || 'N/A'
        );

        form.getTextField('Educational Qualification').setText(
          (() => {
            const eduQual = getFieldValue('educationalQualification');
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
          `${getFieldValue('currentPosition') || 'N/A'}, ${getFieldValue('previousPosition') || 'N/A'}`
        );

        // Return the filled PDF bytes
        return await pdfDoc.save();
      }
      else if(formId === "67ff977b5f10e4c642d2a394"){
        form.getTextField('company_name').setText(getFieldValue('company_name') || 'N/A');
        form.getTextField('company_address').setText(getFieldValue('company_address') || 'N/A');
        form.getTextField('company_date_established').setText(getFieldValue('company_date_established') || 'N/A');
        form.getTextField('company_contact').setText(getFieldValue('company_contact') || 'N/A');
        form.getTextField('company_ownership_nature').setText(getFieldValue('company_ownership_nature') || 'N/A');
        form.getTextField('company_ownership_soe_ministry').setText(getFieldValue('company_ownership_soe_ministry') || 'N/A');
        form.getTextField('company_ownership_jv_breakup').setText(getFieldValue('company_ownership_jv_breakup') || 'N/A');
        form.getTextField('company_shareholding_pattern').setText(getFieldValue('company_shareholding_pattern') || 'N/A');
        form.getTextField('company_is_listed').setText(getFieldValue('company_is_listed') || 'N/A');
        form.getTextField('company_listed_stock_exchange').setText(getFieldValue('company_listed_stock_exchange') || 'N/A');
        form.getTextField('company_operating_sectors').setText(getFieldValue('company_operating_sectors') || 'N/A');
        form.getTextField('company_brief_note').setText(getFieldValue('company_brief_note') || 'N/A');
        form.getTextField('company_manufacturing_note_List_of_components').setText(getFieldValue('company_manufacturing_note_List_of_components') || 'N/A');
        form.getTextField('company_manufacturing_note_Equipments').setText(getFieldValue('company_manufacturing_note_Equipments') || 'N/A');
        form.getTextField('company_manufacturing_note_Machinery').setText(getFieldValue('company_manufacturing_note_Machinery') || 'N/A');
        form.getTextField('company_manufacturing_note_Manufacturing_plants').setText(getFieldValue('company_manufacturing_note_Manufacturing_plants') || 'N/A');
        form.getTextField('company_marketing_note').setText(getFieldValue('company_marketing_note') || 'N/A');
        form.getTextField('company_services_note').setText(getFieldValue('company_services_note') || 'N/A');
        form.getTextField('company_rnd_note').setText(getFieldValue('company_rnd_note') || 'N/A');
        form.getTextField('company_hr_note').setText(getFieldValue('company_hr_note') || 'N/A');
        form.getTextField('company_turnover_last_3_years').setText(getFieldValue('company_turnover_last_3_years') || 'N/A');
        form.getTextField('company_major_clients_china').setText(getFieldValue('company_major_clients_china') || 'N/A');
        form.getTextField('company_market_share_china').setText(getFieldValue('company_market_share_china') || 'N/A');
        form.getTextField('company_competitors_china').setText(getFieldValue('company_competitors_china') || 'N/A');
        form.getTextField('company_operations_south_asia').setText(getFieldValue('company_operations_south_asia') || 'N/A');
        form.getTextField('company_presence_india').setText(getFieldValue('company_presence_india') || 'N/A');
        form.getTextField('company_investment_nature_india').setText(getFieldValue('company_investment_nature_india') || 'N/A');
        form.getTextField('company_shareholding_pattern_india').setText(getFieldValue('company_shareholding_pattern_india') || 'N/A');
        form.getTextField('company_investment_value_india').setText(getFieldValue('company_investment_value_india') || 'N/A');
        form.getTextField('company_directors_india_1_DIN').setText(getFieldValue('company_directors_india_1_DIN') || 'N/A');
        form.getTextField('company_directors_india_1_name').setText(getFieldValue('company_directors_india_1_name') || 'N/A');
        form.getTextField('company_directors_india_1_designation').setText(getFieldValue('company_directors_india_1_designation') || 'N/A');
        form.getTextField('company_directors_india_2_DIN').setText(getFieldValue('company_directors_india_2_DIN') || 'N/A');
        form.getTextField('company_directors_india_2_name').setText(getFieldValue('company_directors_india_2_name') || 'N/A');
        form.getTextField('company_directors_india_2_designation').setText(getFieldValue('company_directors_india_2_designation') || 'N/A');
        form.getTextField('company_directors_india_3_DIN').setText(getFieldValue('company_directors_india_3_DIN') || 'N/A');
        form.getTextField('company_directors_india_3_name').setText(getFieldValue('company_directors_india_3_name') || 'N/A');
        form.getTextField('company_directors_india_3_designation').setText(getFieldValue('company_directors_india_3_designation') || 'N/A');
        form.getTextField('company_directors_india_4_DIN').setText(getFieldValue('company_directors_india_4_DIN') || 'N/A');
        form.getTextField('company_directors_india_4_name').setText(getFieldValue('company_directors_india_4_name') || 'N/A');
        form.getTextField('company_directors_india_4_designation').setText(getFieldValue('company_directors_india_4_designation') || 'N/A');
        form.getTextField('company_directors_india_5_DIN').setText(getFieldValue('company_directors_india_5_DIN') || 'N/A');
        form.getTextField('company_directors_india_5_name').setText(getFieldValue('company_directors_india_5_name') || 'N/A');
        form.getTextField('company_directors_india_5_designation').setText(getFieldValue('company_directors_india_5_designation') || 'N/A');
        form.getTextField('company_india_offices_details').setText(getFieldValue('company_india_offices_details') || 'N/A');
        form.getTextField('company_employees_count_india').setText(getFieldValue('company_employees_count_india') || 'N/A');
        form.getTextField('company_turnover_india_last_3_years').setText(getFieldValue('company_turnover_india_last_3_years') || 'N/A');
        form.getTextField('company_localization_percent_india').setText(getFieldValue('company_localization_percent_india') || 'N/A');
        form.getTextField('company_import_percent_china').setText(getFieldValue('company_import_percent_china') || 'N/A');
        form.getTextField('company_competitors_india').setText(getFieldValue('company_competitors_india') || 'N/A');
        form.getTextField('company_investment_expansion_plan_india').setText(getFieldValue('company_investment_expansion_plan_india') || 'N/A');
         
        return await pdfDoc.save();
      }
      else if(formId === "6807482c28e899d06acdfbc5"){
        // Helper function to handle setting form field values regardless of field type
        const setFormField = (fieldName, value) => {
          // Skip processing if fieldName is undefined or null
          if (!fieldName) {
            console.warn(`Attempted to set field with undefined or null fieldName`);
            return;
          }
          
          try {
            // First attempt to get the field - if it doesn't exist, this will throw an error
            const field = form.getField(fieldName);
            console.log("field----", field);
            
            // Use feature detection instead of constructor names
            // Try to detect field type by checking for specific methods or properties
            let fieldType = 'unknown';
            
            try {
              // Try to get it as a checkbox
              const checkbox = form.getCheckBox(fieldName);
              if (checkbox && typeof checkbox.check === 'function') {
                fieldType = 'checkbox';
                
                // Check the checkbox if there's ANY value (not empty/null/undefined)
                const isChecked = value !== undefined && value !== null && value !== '' && value !== false;
                console.log("checkbox field", fieldName, isChecked);
                
                if (isChecked) {
                  checkbox.check();
                } else {
                  checkbox.uncheck();
                }
                return; // Successfully processed as checkbox
              }
            } catch (checkboxError) {
              // Not a checkbox, continue to next type
            }
            
            try {
              // Try to get it as a text field
              const textField = form.getTextField(fieldName);
              if (textField && typeof textField.setText === 'function') {
                fieldType = 'textfield';
                console.log("text field", fieldName);
                
                // Guard against undefined values
                const textValue = value?.toString();
                textField.setText(textValue);
                return; // Successfully processed as text field
              }
            } catch (textFieldError) {
              // Not a text field, continue to next type
            }
            
            try {
              // Try to get it as a radio group
              const radioGroup = form.getRadioGroup(fieldName);
              if (radioGroup && typeof radioGroup.select === 'function') {
                fieldType = 'radiogroup';
                console.log("radio field", fieldName);
                
                if (value !== undefined && value !== null && value !== '') {
                  // Convert various value types to string safely
                  const radioValue = value.toString();
                  
                  // Only try to select if it's a non-empty string
                  if (radioValue) {
                    radioGroup.select(radioValue);
                  }
                }
                return; // Successfully processed as radio group
              }
            } catch (radioError) {
              // Not a radio group
            }
            
            // If we get here, field type couldn't be determined or processed
            console.warn(`Could not determine type for field "${fieldName}" or field type not supported`);
            
          } catch (error) {
            console.error(`Field "${fieldName}" not found in the PDF form:`, error.message);
          }
        };
        
        // Fix for the "processedInfo.forEach is not a function" error
        if (processedInfo) {
          console.log("Processing form data:", typeof processedInfo);
          
          if (Array.isArray(processedInfo)) {
            // If it's an array, use forEach as intended
            console.log(`Processing ${processedInfo.length} fields from array`);
            processedInfo.forEach((field, index) => {
              if (!field || !field.fieldName) {
                console.error(`Field at index ${index} missing required properties:`, field);
                return;
              }
              setFormField(field.fieldName, field.value);
            });
          } else if (typeof processedInfo === 'object') {
            // If it's an object, iterate through its keys
            console.log(`Processing ${Object.keys(processedInfo).length} entries from object`);
            Object.entries(processedInfo).forEach(([key, field], index) => {
              try {
                // If the field has fieldName and value properties
                if (field && typeof field === 'object' && field.fieldName && 'value' in field) {
                  console.log(`Setting field from object property [${index}]:`, field.fieldName);
                  setFormField(field.fieldName, field.value);
                } else {
                  // Otherwise use the key as fieldName and the field value directly
                  console.log(`Setting field from key [${index}]:`, key);
                  setFormField(key, field);
                }
              } catch (err) {
                console.error(`Error processing field ${key}:`, err);
              }
            });
          } else {
            console.error('Invalid processedInfo format - expected array or object but got:', 
              typeof processedInfo, 
              processedInfo ? processedInfo.toString().substring(0, 100) : 'null'
            );
          }
        } else {
          console.error('No form data available: processedInfo is null or undefined');
        }
        
        return await pdfDoc.save();
      }
    };

    const handleFormClick = async (form) => {
      try {
        setLoadingFormId(form._id);
        setError(null);
        setSelectedForm(form);

        // Fetch organized documents data with questionnaire ID
        const response = await api.get(`/questionnaire-responses/management/${caseId}`);
        
        if (!response.data.status === 'success' || !response.data.data.responses?.[0]) {
          throw new Error('Failed to fetch questionnaire data');
        }

        // Get the first response from the array
        const documentData = {
          responses: response.data.data.responses[0]
        };

        // Generate preview PDF
        const pdfBytes = await generateFilledPDF(form._id, documentData);
        setPreviewPdfBytes(pdfBytes);
        setShowPreview(true);

      } catch (err) {
        console.error('Error processing form:', err);
        setError(err.message);
        toast.error('Failed to process form');
      } finally {
        setLoadingFormId(null);
      }
    };

    const handleDownloadComplete = async () => {
      try {
        // Create a blob from the PDF bytes
        const blob = new Blob([previewPdfBytes], { type: 'application/pdf' });
        
        // Create a download link and trigger local download
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${selectedForm.form_name}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        // Create FormData to send to backend
        const formData = new FormData();
        formData.append('file', blob, `${selectedForm.form_name}.pdf`);
        formData.append('managementId', caseId);
        
        // Send the file to backend
        await api.post('/management/upload-form', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Update case step status to completed
        const stepToUpdate = processedSteps.find(step => step.key === 'forms');
        if (stepToUpdate) {
          try {
            // Make API call to update step status
            await api.put(`/case-steps/case/${caseId}/step/forms/status`, {
              status: 'completed'
            });
            console.log('[Debug] Successfully updated forms step status');
            await refreshCaseSteps();
          } catch (error) {
            console.error('[Debug] Error updating forms step status:', error);
            toast.error('Failed to update step status');
          }
        }
        
        // Show success message
        toast.success('Form downloaded and uploaded successfully');
        
        // Close the preview modal
        setShowPreview(false);
      } catch (error) {
        console.error('Error processing form:', error);
        toast.error('Error processing form. Please try again.');
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
       <div className="space-y-6">
         

         {/* New Forms Section */}
         <div>
           <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Forms</h2>
          <div className="space-y-3">
          {filteredForms.map((form) => (
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

           {/* Existing Forms Section */}
           <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Forms</h2>
            {isLoadingForms ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : existingForms.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {existingForms.map((formUrl, index) => {
                  // Extract filename from URL
                  const fileName = formUrl.split('/').pop();
                  // Decode the URL-encoded filename
                  const decodedFileName = decodeURIComponent(fileName);
                  
                  return (
                    <div 
                      key={index}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{decodedFileName}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={formUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No existing forms found
              </div>
            )}
          </div>
        </div>

        <FormPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          pdfBytes={previewPdfBytes}
          formName={selectedForm?.form_name}
          onDownload={handleDownloadComplete}
        />
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
                    {message.role === 'assistant' ? (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: message.content }} />
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
                <label className="block text-sm text-gray-600 mb-1">Nationality</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileData.nationality || 'N/A'}
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

  const handleGenerateDraftMail = async () => {
    try {
      // First get the validation data
      const validationResponse = await api.get(`/documents/management/${caseId}/validations`);
      const validationData = validationResponse.data;

      // Then get the cross-verification data
      const crossVerifyResponse = await api.get(`/management/${caseId}/cross-verify`);
      const crossVerifyData = crossVerifyResponse.data;

      // Get the case owner's userId from caseData
      const userId = caseData?.userId;

      // Structure the request body correctly
      const requestBody = {
        validationData: {
          status: "success",
          data: {
            managementId: caseId,
            mergedValidations: validationData.data.mergedValidations
          }
        },
        crossVerifyData: {
          status: "success",
          data: {
            managementId: caseId,
            verificationResults: crossVerifyData.data.verificationResults,
            lastVerifiedAt: crossVerifyData.data.lastVerifiedAt
          }
        },
        recipientEmail: recipientEmail,
        recipientName: recipientName
      };

      // Generate the draft mail
      const response = await api.post('/mail/draft', requestBody);
      
      if (response.data.status === 'success') {
        // Handle successful response
        console.log('Draft mail generated successfully:', response.data);
        // You can add a success notification here
      } else {
        // Handle error response
        console.error('Failed to generate draft mail:', response.data);
        // You can add an error notification here
      }
    } catch (error) {
      console.error('Error generating draft mail:', error);
      // Handle error appropriately
    }
  };

  // Add a handler for back button click
  const handleBackClick = () => {
    // Get the socket instance
    const socket = getSocket();
    
    // Clean up event listeners but keep the socket connected
    if (socket) {
      console.log('Navigating back, cleaning up socket event listeners');
      socket.off('document-processing-started');
      socket.off('document-processing-progress');
      socket.off('document-processing-completed');
      socket.off('document-processing-failed');
      socket.off('connect_error');
      socket.off('reconnect');
      console.log('Removed event listeners but kept socket connected');
    }
    
    // Call the original onBack function
    if (onBack) {
      onBack();
    }
  };

  // Update the main container and its children to properly handle height
  return (
    <div className="flex h-full bg-gray-50 rounded-xl">
      {/* Sidebar */}
      <div className="flex flex-col w-80 bg-white border-r border-gray-200 shadow-sm relative rounded-xl">
        {onBack && (
          <button
            onClick={handleBackClick}
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
              {processedSteps.map(step => {
                if (step.key === 'profile' && activeTab === step.displayKey) {
                  return (
                    <ProfileTab
                      key={step._id}
                      profileData={caseData.userId}
                      stepId={step._id}
                    />
                  );
                }
                if (step.key === 'payment' && activeTab === step.displayKey) {
                  return (
                    <PaymentTab 
                      key={step._id}
                      caseId={caseId} 
                      stepId={step._id}
                      onPaymentCompleted={refreshCaseSteps}
                    />
                  );
                }
                if (step.key === 'retainer' && activeTab === step.displayKey) {
                  return (
                    <RetainerTab
                      key={step._id}
                      companyId={profileData.company_id._id}
                      profileData={profileData}
                      caseId={caseId}
                      caseManagerId={caseData?.caseManagerId?._id}
                      applicantId={caseData.userId?._id}
                      caseData={caseData}
                      stepId={step._id}
                      onRetainerUploaded={refreshCaseSteps}
                    />
                  );
                }
                if (step.key === 'receipts' && activeTab === step.displayKey) {
                  return (
                    <ReceiptsTab
                      key={step._id}
                      managementId={caseId}
                      stepId={step._id}
                      onStepCompleted={refreshCaseSteps}
                    />
                  );
                }
                if (step.key === 'letters' && activeTab === step.displayKey) {
                  return (
                    <LetterTab
                      key={step._id}
                      managementId={caseId}
                      stepId={step._id}
                      onStepCompleted={refreshCaseSteps}
                    />
                  );
                }
                if (step.key === 'communications' && activeTab === step.displayKey) {
                  return (
                    <CommunicationsTab
                      key={step._id}
                      caseId={caseId}
                      stepId={step._id}
                    />
                  );
                }
                if (step.key === 'packaging' && activeTab === step.displayKey) {
                  return (
                    <DocumentsArchiveTab
                      key={step._id}
                      managementId={caseId}
                      stepId={step._id}
                      onStepCompleted={refreshCaseSteps}
                    />
                  );
                }
                if (step.key === 'finalize' && activeTab === step.displayKey) {
                  return (
                    <FinalizeTab
                      documents={caseData.documentTypes
                        .filter(doc => doc.status === DOCUMENT_STATUS.UPLOADED || doc.status === DOCUMENT_STATUS.APPROVED)
                        .map(doc => {
                          const hasVerificationData = (verificationDataRef.current || verificationData) && 
                            Object.keys(verificationDataRef.current || verificationData).length > 0;
                          
                          const getValidationStatus = () => {
                            const currentValidationData = validationDataRef.current || validationData;
                            if (!currentValidationData?.mergedValidations) return 'pending';
                            
                            // Find validation for current document
                            const docValidation = currentValidationData.mergedValidations.find(
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
                            status: doc.status === DOCUMENT_STATUS.APPROVED ? 'Approved' : 'Verification pending',
                            documentTypeId: doc.documentTypeId,
                            managementId: caseId,
                            states: [
                              { name: 'Document collection', status: 'success' },
                              { name: 'Read', status: 'success' },
                              { name: 'Verification', status: getValidationStatus() },
                              { name: 'Cross Verification', status: doc.status === DOCUMENT_STATUS.APPROVED ? 'success' : 'pending' }
                            ]
                          };
                        })
                      }
                      onStateClick={(tabName, document) => {
                        switch (tabName) {
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
                      onDocumentsUpdate={(updatedDocuments) => {
                        // Update the caseData state with the new document statuses
                        setCaseData(prevData => ({
                          ...prevData,
                          documentTypes: prevData.documentTypes.map(doc => {
                            const updatedDoc = updatedDocuments.find(d => d.documentTypeId === doc.documentTypeId);
                            if (updatedDoc) {
                              return {
                                ...doc,
                                status: updatedDoc.status === 'Approved' ? DOCUMENT_STATUS.APPROVED : doc.status
                              };
                            }
                            return doc;
                          })
                        }));
                      }}
                      managementId={caseId}
                      onStepCompleted={refreshCaseSteps}
                    />
                  );
                }
                return null;
              })}
              {activeTab === 'document-checklist' && <DocumentsChecklistTab />}
              {activeTab === 'questionnaire' && <QuestionnaireTab />}
              {activeTab === 'forms' && <FormsTab />}
              {activeTab === 'activity-log' && <ActivityLogTab caseId={caseId} />}
            </div>
          </div>
        </div>
      </div>
      {renderChatPortal()}
    </div>
  );
};

export default CaseDetails;



