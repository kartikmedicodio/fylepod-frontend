import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Eye,
  ChevronDown
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

  // Add a function at the top of the component to load data from localStorage
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
      
      if (processedInfo) {
        // Use the processedInformation exactly as it comes from the API
        console.log('Setting form data from questionnaire response:', processedInfo);
        setFormData(processedInfo);
      }
    }
  }, [questionnaireData]);

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
        console.log('Document processing started:', data);
        if (data.caseId === caseId) {
          setProcessingDocIds(prev => [...prev, data.documentId]);
          setProcessingStep(1); // Analyzing document
          // Removed toast notification for processing started - we'll show only one at the end
          console.log(`Processing started for document: ${data.documentName || data.documentId}`);
        }
      });
      
      socket.on('document-processing-progress', (data) => {
        console.log('Document processing progress:', data);
        if (data.caseId === caseId) {
          // Update processing step based on the status message
          if (data.status.toLowerCase().includes('extract')) {
            setProcessingStep(2); // Extracting information
          } else if (data.status.toLowerCase().includes('validat')) {
            setProcessingStep(3); // Validating content
          } else if (data.status.toLowerCase().includes('verify')) {
            setProcessingStep(4); // Verifying document
          }
          
          // Don't show a toast for every progress update to avoid flooding the UI
          // Instead, just update the processing step silently
          console.log(`Processing ${data.documentName || data.documentId}: ${data.status}`);
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
              // Check if we have validation results but no cross-verification
              const hasValidations = data.validationResults && 
                data.validationResults.validations && 
                data.validationResults.validations.length > 0;
              
              const hasCrossVerification = data.crossVerificationData && 
                Object.keys(data.crossVerificationData).length > 0;
              
              // Switch to validation tab only if we have validations but no cross-verification
              if (hasValidations && !hasCrossVerification) {
                setSelectedSubTab('validation');
              }
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
        
        // Check if all documents are approved
        const allApproved = updatedCaseData.documentTypes.every(
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
        const updatedCaseData = response.data.data.entry;
        setCaseData(updatedCaseData);
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
            setProcessingDocIds(prev => [...prev, uploadedDoc._id]);
            
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
  const fetchValidationData = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingValidation) return;
    
    try {
      setIsLoadingValidation(true);
      const response = await api.get(`/documents/management/${caseId}/validations`);
      if (response.data.status === 'success') {
        const newValidationData = response.data.data;
        
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
        const { verificationDataFound } = loadDataFromLocalStorage();
        console.log(`Initial localStorage load complete. Cross-verification data found: ${verificationDataFound}`);
        
        // Now fetch the case data from API
        setIsLoading(true);
        const response = await api.get(`/management/${caseId}`);
        if (response.data.status === 'success') {
          const caseData = response.data.data.entry;
          console.log('Case data:', caseData);
          setCaseData(caseData);
          
          // Check if there are any uploaded documents
          const hasUploadedDocs = caseData.documentTypes.some(doc => 
            doc.status === DOCUMENT_STATUS.UPLOADED || doc.status === DOCUMENT_STATUS.APPROVED
          );

          // If there are uploaded documents, fetch validation data
          if (hasUploadedDocs) {
            await fetchValidationData();
            
            // DO NOT fetch cross-verification data on mount - it will be fetched
            // only when the user explicitly clicks on the cross-verification tab
            // (if it's not already in localStorage)
          }
          
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
          const templates = response.data.data.templates;
          
          // Only process if there are templates
          if (templates && templates.length > 0) {
            // Create a combined questionnaire by merging all field mappings
            const combinedQuestionnaire = {
              _id: "combined-questionnaire-id", // Create a unique ID for the combined questionnaire
              questionnaire_name: "Combined Questionnaire", // Set a name for the combined questionnaire
              description: "Combination of all available questionnaires",
              field_mappings: [],
              createdBy: templates[0].createdBy, // Use the first template's createdBy info
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              __v: 0,
              categoryId: templates[0].categoryId
            };
            
            // Merge all field mappings from all templates
            templates.forEach(template => {
              if (template.field_mappings && template.field_mappings.length > 0) {
                // Check for duplicate fieldNames before adding
                template.field_mappings.forEach(field => {
                  const isDuplicate = combinedQuestionnaire.field_mappings.some(
                    existingField => existingField.fieldName === field.fieldName
                  );
                  
                  if (!isDuplicate) {
                    combinedQuestionnaire.field_mappings.push({
                      ...field,
                      _id: field._id // Preserve the original field ID
                    });
                  }
                });
              }
            });
            
            // Set the combined questionnaire as the only one available
            setQuestionnaires([combinedQuestionnaire]);
            
            // Log the total number of fields in the combined questionnaire
            console.log(`Combined questionnaire created with ${combinedQuestionnaire.field_mappings.length} fields`);
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
                    status: doc.status === 'approved' ? 'Approved' : 'Verification pending',
                    documentTypeId: doc.documentTypeId,
                    updatedAt: doc.updatedAt,
                    managementId: caseId,
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
                        name: 'Verification',
                        status: getValidationStatus()
                      },
                      {
                        name: 'Cross Verification',
                        status: !hasVerificationData ? 'pending' :
                               (verificationDataRef.current || verificationData)?.[doc.name]?.isVerified ? 'success' : 
                               (verificationDataRef.current || verificationData)?.[doc.name]?.partiallyVerified ? 'partial' : 'error'
                      }
                    ]
                  };
                })
              }
              validationData={validationDataRef.current || validationData}
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

      // Count total failed validations across all documents
      const totalFailedValidations = currentValidationData.mergedValidations.reduce((total, doc) => 
        total + doc.validations.filter(v => !v.passed).length, 0
      );

      // Count document types with validations
      const documentCount = currentValidationData.mergedValidations.length;
      
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
            {currentValidationData.mergedValidations.map((docValidation, index) => (
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

    // Update local form data when parent form data changes
    useEffect(() => {
      setLocalFormData(formData);
    }, [formData]);

    // Updated function to check if a field is empty - works with new response format
    const isFieldEmpty = (fieldKey) => {
      const field = localFormData?.[fieldKey];
      return !field || field.value === undefined || field.value === null || field.value === '';
    };

    // Updated input change handler to work with the new format
    const handleLocalInputChange = (fieldKey, value) => {
      setLocalFormData(prev => ({
        ...prev,
        [fieldKey]: {
          ...prev[fieldKey],
          value: value
        }
      }));
    };

    // Updated save handler to maintain the correct structure
    const handleLocalSave = async () => {
      try {
        setIsSaving(true);
        
        // Update parent state
        setFormData(localFormData);
        
        // Create request payload - keep the same structure as received
        const payload = {
          templateId: selectedQuestionnaire?._id,
          processedInformation: localFormData
        };
        
        console.log('Saving questionnaire with data:', payload);
        
        const response = await api.put(`/questionnaire-responses/management/${caseId}`, payload);

        if (response.data.status === 'success') {
          toast.success('Changes saved successfully');
          setIsQuestionnaireCompleted(true);
          
          // Optionally navigate to the next tab
          // setActiveTab('forms');
        }
      } catch (error) {
        console.error('Error saving questionnaire:', error);
        toast.error('Failed to save changes');
      } finally {
        setIsSaving(false);
      }
    };

    // Updated function to count filled fields
    const getFilledFieldsCount = () => {
      const allFields = Object.keys(localFormData || {});
      const totalFields = allFields.length;
      const filledFields = allFields.filter(fieldKey => !isFieldEmpty(fieldKey)).length;
      return { filledFields, totalFields };
    };

    // Update function to check if field should be visible
    const shouldShowField = (fieldKey) => {
      if (!showOnlyEmpty) return true;
      return isFieldEmpty(fieldKey);
    };

    const { filledFields, totalFields } = getFilledFieldsCount();

    // Updated function to get fields from the new data structure
    const getFields = () => {
      // If we have form data, get fields from it
      if (localFormData && Object.keys(localFormData).length > 0) {
        return Object.keys(localFormData);
      }
      
      // Otherwise return empty array
      return [];
    };

    const allFields = getFields();

    // Sort fields for a better UI experience
    const sortedFields = useMemo(() => {
      // Define a custom order for important fields to show first
      const priorityFields = [
        'First Name', 'Date of Birth', 'City of Birth', 'Country of Birth', 'Gender', 
        'Nationality', 'Passport Number', 'Date of Issue', 'Date of Expiry', 'Place of Issue',
        'Cell Number', 'Email ID', 'Educational Qualification',
        'Current Company Name', 'Current Position'
      ];
      
      // Sort the fields by priority first, then alphabetically
      return [...allFields].sort((a, b) => {
        const aIndex = priorityFields.indexOf(a);
        const bIndex = priorityFields.indexOf(b);
        
        // If both fields are in priority list, sort by their order in that list
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // If only 'a' is in priority list, it comes first
        if (aIndex !== -1) return -1;
        
        // If only 'b' is in priority list, it comes first
        if (bIndex !== -1) return 1;
        
        // Special case: Put all company_* fields after other fields
        if (a.toLowerCase().includes('company') && !b.toLowerCase().includes('company')) return 1;
        if (!a.toLowerCase().includes('company') && b.toLowerCase().includes('company')) return -1;
        
        // Otherwise sort alphabetically
        return a.localeCompare(b);
      });
    }, [allFields]);

    const renderField = (fieldKey) => {
      // Get the field object
      const field = localFormData[fieldKey];
      
      // Use the fieldLabel from the response
      const fieldLabel = fieldKey;
      
      // Get the fieldName for reference
      const fieldName = field?.fieldName || '';
      
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

      // Determine field type based on fieldName or label
      const getFieldType = () => {
        const lowerFieldName = fieldName.toLowerCase();
        const lowerFieldLabel = fieldKey.toLowerCase();
        
        if (lowerFieldName.includes('date') || lowerFieldLabel.includes('date')) return 'date';
        if (lowerFieldName.includes('email') || lowerFieldLabel.includes('email')) return 'email';
        if (
          lowerFieldName.includes('count') || 
          lowerFieldName.includes('percent') || 
          lowerFieldLabel.includes('count') || 
          lowerFieldLabel.includes('percent')
        ) return 'number';
        
        return 'text';
      };

      const fieldType = getFieldType();

      // Format date value for input field
      const formatDateValue = (value) => {
        if (!value || fieldType !== 'date') return value || '';
        
        // Try to parse the date string
        try {
          // Handle different date formats
          // If it's already in YYYY-MM-DD format, return as is
          if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
          
          // Handle DD/MMM/YYYY format (like 05/FEB/1965)
          const dateMatch = value.match(/(\d{1,2})\/([A-Za-z]{3})\/(\d{4})/);
          if (dateMatch) {
            const [_, day, monthStr, year] = dateMatch;
            const months = {
              'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
              'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
            };
            const month = months[monthStr.toUpperCase()];
            if (month) {
              return `${year}-${month}-${day.padStart(2, '0')}`;
            }
          }
          
          // Try parsing with Date object as fallback
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (error) {
          console.warn('Error formatting date value:', error);
        }
        
        // Return original value if parsing fails
        return value;
      };

      return (
        <div key={fieldKey} className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">
            {fieldLabel}
          </label>
          {isTextareaField ? (
            <textarea
              value={field?.value || ''}
              onChange={(e) => handleLocalInputChange(fieldKey, e.target.value)}
              className={`w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[80px]
                ${isFieldEmpty(fieldKey)
                  ? 'border-red-300 bg-red-50/50 focus:border-red-400'
                  : 'border-gray-200 focus:border-blue-400'
                }`}
            />
          ) : (
            <input
              type={fieldType}
              value={fieldType === 'date' 
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

        {/* Form Content - All fields in a single section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sortedFields.filter(shouldShowField).map(renderField)}
          </div>

          {/* Show message when no fields found */}
          {sortedFields.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No questionnaire fields found. Please check the API response.
                              </div>
                            )}
                        </div>

        {/* Show message when no empty fields match the filter */}
        {showOnlyEmpty && sortedFields.length > 0 && !sortedFields.some(shouldShowField) && (
          <div className="text-center py-8 text-gray-500">
            No empty fields found!
          </div>
        )}

        {/* Render debug information in development mode */}
       
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
              // Use the processedInformation exactly as it comes from the API
              console.log('Loaded questionnaire data:', processedInfo);
              
              // The new response format has fieldName, fieldLabel, and value properties
              // Save the full response structure to ensure we have all necessary data
              setFormData(processedInfo);
              setIsQuestionnaireCompleted(true);
            } else {
              console.log('No processedInformation found in response, initializing empty form');
              setFormData({});
            }
          } else {
            console.log('No responses found in API data, initializing empty form');
            setFormData({});
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
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">
                    {questionnaire.field_mappings.length} Fields
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500">{questionnaire.description}</p>
              
              
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Add FormPreviewModal component before FormsTab
  const FormPreviewModal = ({ isOpen, onClose, pdfBytes, formName }) => {
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
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
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
      else{
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
        // Update case status to completed
        await api.patch(`/management/${caseId}/status`, {
          status: 'completed'
        });
        
        // Show success message
        toast.success('Form downloaded and case marked as completed');
        
        // Refresh case data to update UI
        const response = await api.get(`/management/${caseId}`);
        if (response.data.status === 'success') {
          const updatedCaseData = response.data.data.entry;
          setCaseData(updatedCaseData);
        }

        // Close the preview modal
        setShowPreview(false);
      } catch (error) {
        console.error('Error updating case status:', error);
        toast.error('Form downloaded but failed to update case status');
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

        <FormPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          pdfBytes={previewPdfBytes}
          formName={selectedForm?.form_name}
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

  const handleGenerateDraftMail = async () => {
    try {
      // First get the validation data
      const validationResponse = await api.get(`/documents/management/${caseId}/validations`);
      const validationData = validationResponse.data;

      // Then get the cross-verification data
      const crossVerifyResponse = await api.get(`/management/${caseId}/cross-verify`);
      const crossVerifyData = crossVerifyResponse.data;

      // Get recipient name from profile data or use a default
      const recipientName = profileData?.name || 'Sir/Madam';

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


