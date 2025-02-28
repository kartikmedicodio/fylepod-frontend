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
  Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import CaseDetailsSidebar from '../components/cases/CaseDetailsSidebar';
import { PDFDocument } from 'pdf-lib';


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

  const [activeTab, setActiveTab] = useState('document-checklist');
  const [caseData, setCaseData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocumentTab, setSelectedDocumentTab] = useState('pending');
  const [uploadStatus, setUploadStatus] = useState(DOCUMENT_STATUS.PENDING);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
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
    Resume: {}
  });
  const [forms, setForms] = useState([]);
  const [isSavingQuestionnaire, setIsSavingQuestionnaire] = useState(false);
  const [loadingFormId, setLoadingFormId] = useState(null);
  const [error, setError] = useState(null);
  const [isQuestionnaireCompleted, setIsQuestionnaireCompleted] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
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

  const handleDocumentApprove = async (documentTypeId, managementDocumentId) => {
    try {
      setIsProcessing(true);
      
      await api.patch(`/management/${caseId}/documents/${documentTypeId}/status`, {
        status: DOCUMENT_STATUS.APPROVED,
        documentTypeId: documentTypeId,
        managementDocumentId: managementDocumentId
      });

      // Refresh case data
      const response = await api.get(`/management/${caseId}`);
      if (response.data.status === 'success') {
        setCaseData(response.data.data.entry);
        toast.success('Document approved successfully');
      }
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Failed to approve document');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestReupload = async (documentTypeId, managementDocumentId) => {
    try {
      setIsProcessing(true);
      
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
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files.length) return;
    
    setIsProcessing(true);
    setIsUploading(true);
    setUploadProgress(0);
    const uploadedDocIds = [];

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
        formData.append('type', pendingDoc.name);
        formData.append('managementId', caseId);
        formData.append('documentTypeId', pendingDoc.documentTypeId);
        formData.append('managementDocumentId', pendingDoc._id);
        formData.append('form_category', 'document_verification');
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
      if (!uploadedDocs.length) {
        toast.error('No files were uploaded successfully');
        return;
      }

      // Process and verify documents
      const processedDocs = await Promise.all(
        uploadedDocs.map(async (doc) => {
          try {
            const processedDoc = await checkDocumentProcessing(doc._id);
            if (!processedDoc) {
              throw new Error('Document processing failed');
            }
            if (processedDoc.extractedData?.document_type) {
            
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
            return null;
          }
        })
      );

      // Match documents with required types
      const docTypeMatches = new Map();
      const docsToDelete = new Set();

      processedDocs.forEach(doc => {
        if (!doc || !doc.extractedData?.document_type) {
          if (doc?._id) docsToDelete.add(doc._id);
          return;
        }

        const extractedType = doc.extractedData.document_type.toLowerCase().trim();
        const matchingDocType = caseData.documentTypes.find(type => {
          return type.name.toLowerCase().trim() === extractedType && 
                 type.status !== 'completed' && 
                 !docTypeMatches.has(type.documentTypeId);
        });

        if (matchingDocType) {
          docTypeMatches.set(matchingDocType.documentTypeId, doc._id);
        } else {
          docsToDelete.add(doc._id);
        }
      });

      // Update document statuses
      if (docTypeMatches.size > 0) {
        await Promise.all(
          Array.from(docTypeMatches.entries()).map(([typeId]) => 
            api.patch(`/management/${caseId}/documents/${typeId}/status`, {
              status: DOCUMENT_STATUS.UPLOADED
            })
          )
        );

        toast.success(`${docTypeMatches.size} document(s) uploaded successfully`);
      }

      // Clean up unmatched documents
      if (docsToDelete.size > 0) {
        await Promise.all(
          Array.from(docsToDelete).map(docId =>
            api.delete(`/documents/${docId}`).catch(err => 
              console.error(`Error deleting document ${docId}:`, err)
            )
          )
        );
      }

      // Refresh case data
      const response = await api.get(`/management/${caseId}`);
      if (response.data.status === 'success') {
        setCaseData(response.data.data.entry);
      }

      setFiles([]);
    } catch (err) {
      console.error('Error in file upload process:', err);
      toast.error('Error processing documents');
      
      // Clean up any uploaded documents on error
      if (uploadedDocIds.length) {
        await Promise.all(
          uploadedDocIds.map(docId =>
            api.delete(`/documents/${docId}`).catch(err => {
              console.error(`Error deleting document ${docId}:`, err);
            })
          )
        );
      }
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
      setUploadProgress(0);
      setProcessingStep(0);
    }
  };

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        const response = await api.get(`/management/${caseId}`);
        if (response.data.status === 'success') {
          setCaseData(response.data.data.entry);
        }
      } catch (error) {
        console.error('Error fetching case details:', error);
      }
    };

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
        console.log("response.data",response.data.data.templates);
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

    fetchCaseDetails();
    fetchProfileData();
    fetchQuestionnaires();
    fetchForms();
  }, [caseId]);

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

  if (!caseData || !profileData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Update the ProgressSteps component
  const ProgressSteps = () => {
    // Check if all documents are approved
    const allDocumentsApproved = checkAllDocumentsApproved(caseData.documentTypes);
    
    // Check if preparation is complete (questionnaire completed and in forms tab)
    const isPreparationComplete = activeTab === 'forms' && isQuestionnaireCompleted;

    // Define steps with dynamic completion status
    const steps = [
      { name: 'Case Started', completed: true },
      { name: 'Data Collection', completed: true },
      { name: 'In Review', completed: allDocumentsApproved },
      { name: 'Preparation', completed: allDocumentsApproved && isPreparationComplete },
      { name: 'Filing', completed: false }
    ];

    return (
      <div className="flex items-center justify-center w-full py-8 bg-white">
        <div className="flex items-center justify-between max-w-4xl w-full px-6">
          {steps.map((step, index) => (
            <div key={step.name} className="flex items-center">
              {/* Step circle with label */}
              <div className="flex flex-col items-center relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div 
                    className={`absolute left-[50px] top-[20px] h-[2px] w-[100px] ${
                      steps[index].completed ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
                
                {/* Circle */}
                <div 
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center 
                    transition-all duration-300 relative z-10
                    ${step.completed 
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                      : index === steps.findIndex(s => !s.completed)
                        ? 'bg-white border-2 border-blue-600 text-blue-600'
                        : 'bg-gray-100 text-gray-400'
                    }
                  `}
                >
                  {step.completed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span 
                  className={`mt-3 text-sm font-medium whitespace-nowrap ${
                    step.completed 
                      ? 'text-blue-600' 
                      : index === steps.findIndex(s => !s.completed)
                        ? 'text-blue-600'
                        : 'text-gray-400'
                  }`}
                >
                  {step.name}
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
          { name: 'Queries', icon: AlertCircle }
        ].map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === name.toLowerCase().replace(' ', '-')
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab(name.toLowerCase().replace(' ', '-'))}
          >
            <Icon className="w-4 h-4 mr-2" />
            {name}
          </button>
        ))}
      </div>
    </div>
  );

  // Update the SaveQuestionnairesButton component
  const SaveQuestionnairesButton = ({ documentTypes, questionnaires, caseId }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const allDocumentsApproved = checkAllDocumentsApproved(documentTypes);

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
        setIsSaving(true);
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
        setIsSaving(false);
        setLoadingStep(0);
      }
    };

    if (!allDocumentsApproved) return null;

    return (
      <button
        onClick={handleSaveQuestionnaires}
        disabled={isSaving}
        className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 flex items-center gap-2 relative overflow-hidden
          ${isSaving 
            ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_100%] animate-gradient text-white disabled:animate-gradient disabled:opacity-90' 
            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
          }`}
      >
        <div className={`absolute inset-0 ${isSaving ? 'bg-blue-600/10 animate-pulse' : ''}`} />
        <div className="relative flex items-center justify-center gap-2">
          {isSaving ? (
            <>
              <div className="relative">
                <Loader2 className="w-4 h-4 animate-spin" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
              </div>
              <span className="animate-fadeIn min-w-[140px] text-white">
                {getLoadingMessage()}
              </span>
            </>
          ) : (
            'Process Questionnaires'
          )}
        </div>
      </button>
    );
  };

  // Enhanced document checklist
  const DocumentsChecklistTab = () => {
    const pendingDocuments = caseData.documentTypes.filter(doc => doc.status === DOCUMENT_STATUS.PENDING);
    const uploadedDocuments = caseData.documentTypes.filter(
      doc => doc.status === DOCUMENT_STATUS.UPLOADED || doc.status === DOCUMENT_STATUS.APPROVED
    );

    const renderDocumentsList = () => (
      <div className="col-span-8 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex gap-2 mb-6 border-b border-gray-100 pb-4">
          <button 
            onClick={() => setUploadStatus(DOCUMENT_STATUS.PENDING)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              uploadStatus === DOCUMENT_STATUS.PENDING
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Upload Pending ({pendingDocuments.length})
          </button>
          <button 
            onClick={() => setUploadStatus(DOCUMENT_STATUS.UPLOADED)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              uploadStatus === DOCUMENT_STATUS.UPLOADED
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Uploaded ({uploadedDocuments.length})
          </button>
        </div>

        <div className="space-y-3">
          {uploadStatus === DOCUMENT_STATUS.PENDING ? (
            pendingDocuments.length > 0 ? (
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
            )
          ) : (
            uploadedDocuments.length > 0 ? (
              uploadedDocuments.map((doc) => (
                <div key={doc._id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm mb-1">{doc.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center text-sm ${
                          doc.status === DOCUMENT_STATUS.APPROVED 
                            ? 'text-green-600' 
                            : 'text-blue-600'
                        }`}>
                          <Check className="w-4 h-4 mr-1" />
                          {doc.status === DOCUMENT_STATUS.APPROVED ? 'Approved' : 'Uploaded'}
                        </span>
                        
                        {doc.status === DOCUMENT_STATUS.UPLOADED && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleDocumentApprove(doc.documentTypeId, doc._id)}
                              disabled={isProcessing}
                              className={`px-3 py-1 text-xs font-medium rounded-full
                                ${isProcessing 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-green-50 text-green-600 hover:bg-green-100'
                                }`}
                            >
                              {isProcessing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Approve'
                              )}
                            </button>
                            <button 
                              onClick={() => handleRequestReupload(doc.documentTypeId, doc._id)}
                              disabled={isProcessing}
                              className={`px-3 py-1 text-xs font-medium rounded-full
                                ${isProcessing 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                            >
                              {isProcessing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Request Reupload'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                No documents have been uploaded yet.
              </div>
            )
          )}
        </div>
      </div>
    );

    const renderSmartUpload = () => (
      uploadStatus === DOCUMENT_STATUS.PENDING && (
        <div className="col-span-4 bg-white rounded-lg border border-gray-200 p-6 relative">
          {isProcessing && <ProcessingIndicator currentStep={processingStep} />}
          
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
                    disabled={isProcessing}
                    className={`bg-blue-600 text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2
                      ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing ? (
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

    const renderQuestionnaire = () => (
      <div className="w-1/3">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Questionnaire</h4>
              <div className="text-blue-600 text-sm">53/70</div>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Salutation</div>
              <div className="font-medium">Mr</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">First Name</div>
              <div className="font-medium">John</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Middle Name</div>
              <div className="font-medium">Michael</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Last Name</div>
              <div className="font-medium">Doe</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Nationality</div>
              <div className="font-medium">American</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Email Address</div>
              <div className="font-medium">John@mail.com</div>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-80">
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          </div>
          <div className="flex items-center gap-3">
            <SaveQuestionnairesButton 
              documentTypes={caseData?.documentTypes || []}
              questionnaires={questionnaires}
              caseId={caseId}
            />
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              All Filters
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              Sort
            </button>
          </div>
        </div>

        {/* Document list and upload sections with enhanced styling */}
        <div className="grid grid-cols-12 gap-6">
          {renderDocumentsList()}
          {renderSmartUpload()}
        </div>
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
              <p className="text-sm text-gray-600">{questionnaire.questionnaire_name}</p>
            </div>
          </div>
          <div>
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
      </div>
    );
  };

  // Update the QuestionnaireTab component to handle questionnaire selection
  const QuestionnaireTab = () => {
    const handleQuestionnaireClick = async (questionnaire) => {
      setIsLoadingQuestionnaire(true);
      setSelectedQuestionnaire(questionnaire);
      
      try {
        // Start loading sequence
        const response = await api.get(`/questionnaire-responses/management/${caseId}`, {
          templateId: questionnaire._id
        });
        
        if (response.data.status === 'success') {
          // Wait for minimum 3 seconds of loading animation
          // This ensures all loading steps are visible
          await new Promise(resolve => setTimeout(resolve, 3000));
          setQuestionnaireData(response.data.data);
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

          // Handle educational qualification array - take the highest education
          const highestEducation = processedInfo?.Resume?.educationalQualification
          form.getTextField('Educational Qualification').setText(
            highestEducation || 'N/A'
          );

          form.getTextField('Specific details of Skills Experience').setText(
            `${processedInfo?.Resume?.currentPosition || 'N/A'}, ${processedInfo?.Resume?.previousPosition || 'N/A'}`
          );

        } catch (fieldError) {
          console.error('Error filling specific field:', fieldError);
          toast.error('Error filling some fields in the form');
        }

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

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex flex-col min-w-[320px] bg-white border-r border-gray-200 shadow-sm relative">
          {onBack && (
            <button
              onClick={onBack}
              className="sticky top-4 left-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all duration-200 group flex items-center gap-2 z-10"
            >
              <ChevronLeft className="w-5 h-8 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-m font-medium ">
                Back
              </span>
            </button>
          )}
          
          <div className="overflow-y-auto flex-1">
            <CaseDetailsSidebar 
              caseData={caseData} 
              loading={!caseData && !error} 
              error={error}
            />
          </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <ProgressSteps />
        </div>

        <div className="flex-1 overflow-auto">
          <TabNavigation />
          
          <div className="max-w-7xl mx-auto">
            {activeTab === 'document-checklist' && <DocumentsChecklistTab />}
            {activeTab === 'questionnaire' && <QuestionnaireTab />}
            {activeTab === 'forms' && <FormsTab />}
            {/* Add other tab contents as needed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;


