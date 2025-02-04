import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { Upload, Loader2, CheckCircle, Wand2, Camera, Files } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Transition } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const processingSteps = [
  { id: 1, text: "Analyzing document..." },
  { id: 2, text: "Validating content..." },
  { id: 3, text: "Checking document type..." },
  { id: 4, text: "Verifying authenticity..." }
];

const PendingProcesses = () => {
  const { user } = useAuth();
  const { userId, applicationId } = useParams();
  const [pendingProcesses, setPendingProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState({});
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [autoFilling, setAutoFilling] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadedDocumentIds, setUploadedDocumentIds] = useState({});
  const [processingDocuments, setProcessingDocuments] = useState({});
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({
    unit: '%',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    aspect: undefined
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageRef, setImageRef] = useState(null);
  const [currentUploadContext, setCurrentUploadContext] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingProcessId, setProcessingProcessId] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [processingQueue, setProcessingQueue] = useState(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (user?._id) {
      const loadInitialData = async () => {
        setIsInitialLoad(true);
        try {
          const [processesResponse, documentsResponse] = await Promise.all([
            fetchPendingProcesses(),
            fetchExistingDocuments()
          ]);
          
          if (processesResponse?.data?.data?.entries) {
            let processes = processesResponse.data.data.entries;
            if (applicationId) {
              processes = processes.filter(process => process._id === applicationId);
            }
            setPendingProcesses(processes);
          }

          if (documentsResponse?.data?.data?.documents) {
            setExistingDocuments(documentsResponse.data.data.documents);
          }
        } catch (err) {
          console.error('Error loading initial data:', err);
          setError(err.response?.data?.message || 'Failed to load data');
        } finally {
          setIsInitialLoad(false);
          setLoading(false);
        }
      };

      loadInitialData();
    }
  }, [user?._id, userId, applicationId]);

  const fetchExistingDocuments = async () => {
    try {
      const response = await api.get('/documents', {
        params: {
          checkProcessing: false
        }
      });
      
      console.log('Existing documents:', response.data);
      setExistingDocuments(response.data.data.documents);
    } catch (err) {
      console.error('Error fetching existing documents:', err);
    }
  };

  const handleAutoFill = async (documents) => {
    try {
      setAutoFilling(true);
      let autoFilledCount = 0;

      for (const process of pendingProcesses) {
        for (const docType of process.documentTypes) {
          if (docType.status === 'completed') continue;

          const matchingDoc = documents.find(doc => 
            doc.type.toLowerCase().trim() === docType.name.toLowerCase().trim()
          );

          if (matchingDoc) {
            console.log(`Found matching document for ${docType.name}`);
            try {
              const formData = new FormData();
              formData.append('file', matchingDoc.file);
              formData.append('name', matchingDoc.name);
              formData.append('type', matchingDoc.type);
              formData.append('managementId', process._id);
              formData.append('documentTypeId', docType.documentTypeId);
              formData.append('managementDocumentId', docType._id);
              formData.append('form_category', 'document_verification');

              // Upload the document with management reference
              await api.post('/documents', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                }
              });

              await updateDocumentStatus(process._id, docType.documentTypeId);
              autoFilledCount++;
            } catch (err) {
              console.error(`Error auto-filling document ${docType.name}:`, err);
            }
          }
        }
      }

      if (autoFilledCount > 0) {
        await fetchPendingProcesses();
      }
      
      alert(`Auto-filled ${autoFilledCount} document${autoFilledCount !== 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Error in auto-fill process:', err);
      setError('Failed to auto-fill documents');
    } finally {
      setAutoFilling(false);
    }
  };

  const fetchPendingProcesses = async () => {
    try {
      const targetUserId = userId || user._id;
      const response = await api.get(`/management/user/${targetUserId}`, {
        params: { status: 'pending' }
      });

      // Filter out completed processes before setting state
      if (response?.data?.data?.entries) {
        let processes = response.data.data.entries;
        
        // If applicationId is provided, filter for that specific application
        if (applicationId) {
          processes = processes.filter(process => process._id === applicationId);
        }

        // Filter out processes where all documents are completed
        processes = processes.filter(process => {
          const hasIncompleteDocuments = process.documentTypes.some(doc => doc.status !== 'completed');
          return hasIncompleteDocuments;
        });

        setPendingProcesses(processes);
      }

      return response;
    } catch (err) {
      throw err;
    }
  };

  const updateDocumentStatus = async (managementId, documentTypeId) => {
    try {
      console.log('Updating status for:', { managementId, documentTypeId });
      
      const response = await api({
        method: 'PATCH',
        url: `/management/${managementId}/documents/${documentTypeId}/status`,
        data: { status: 'completed' },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Status update response:', response.data);

      if (response.data.status === 'success') {
        await fetchPendingProcesses();
      } else {
        throw new Error(response.data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating document status:', err);
      setError(err.response?.data?.message || 'Failed to update document status');
      throw err;
    }
  };

  const validateFileType = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    return allowedTypes.includes(file.type);
  };

  const handleFileUpload = async (managementId, documentTypeId, file) => {
    if (processingQueue.has(documentTypeId)) {
      return false;
    }

    let uploadedDocumentId = null;

    try {
      if (!validateFileType(file)) return false;
      setUploading(prev => ({ ...prev, [documentTypeId]: true }));
      
      const process = pendingProcesses.find(p => p._id === managementId);
      const documentType = process?.documentTypes.find(d => d.documentTypeId === documentTypeId);
      
      if (!process || !documentType) return false;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', `${Date.now()}-${documentType.name.replace(/\s+/g, '_')}.${file.name.split('.').pop()}`);
      formData.append('type', documentType.name);
      formData.append('managementId', managementId);
      formData.append('documentTypeId', documentTypeId);
      formData.append('managementDocumentId', documentType._id);
      formData.append('form_category', process.categoryName || 'other');

      const uploadResponse = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (!uploadResponse.data?.status === 'success' || !uploadResponse.data.data.document) {
        throw new Error('Upload failed');
      }

      uploadedDocumentId = uploadResponse.data.data.document._id;

      const processedDoc = await checkDocumentProcessing(
        uploadedDocumentId,
        documentTypeId
      );

      if (!processedDoc) {
        throw new Error('Document processing failed');
      }

      const extractedType = processedDoc.extractedData?.document_type?.toLowerCase();
      const expectedType = documentType.name.toLowerCase();

      if (extractedType === expectedType) {
        await updateDocumentStatus(managementId, documentTypeId);
        return true;
      } else {
        console.log(`Document type mismatch. Expected: ${expectedType}, Got: ${extractedType}`);
        throw new Error('Document type mismatch');
      }

    } catch (err) {
      console.error('Error in file upload:', err);
      // Delete the uploaded document if it exists and there was an error
      if (uploadedDocumentId) {
        try {
          console.log('Deleting invalid document:', uploadedDocumentId);
          await api.delete(`/documents/${uploadedDocumentId}`);
        } catch (deleteErr) {
          console.error('Error deleting invalid document:', deleteErr);
        }
      }
      return false;
    } finally {
      setUploading(prev => ({ ...prev, [documentTypeId]: false }));
    }
  };

  const checkDocumentProcessing = async (documentId) => {
    const maxAttempts = 20;
    const baseInterval = 2000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        console.log(`Checking document ${documentId} - Attempt ${attempts + 1}/${maxAttempts}`);
        
        const response = await api.get(`/documents/${documentId}`);
        const document = response.data.data.document;

        if (document.processingError || document.status === 'failed') {
          console.log(`Document ${documentId} processing failed after ${attempts + 1} attempts`);
          return null;
        }

        if (document.extractedData?.document_type) {
          console.log(`Document ${documentId} processed successfully after ${attempts + 1} attempts`);
          console.log('Extracted type:', document.extractedData.document_type);
          return document;
        }

        attempts++;
        const delay = baseInterval * Math.min(Math.pow(1.5, attempts), 8);
        console.log(`Waiting ${delay}ms before next attempt...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (err) {
        console.error(`Error checking document status (Attempt ${attempts + 1}):`, err);
        return null;
      }
    }

    console.log(`Document ${documentId} processing timed out after ${maxAttempts} attempts`);
    return null;
  };

  const getCroppedImg = async (image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 1);
    });
  };

  const handleCameraCapture = async (managementId) => {
    try {
      const process = pendingProcesses.find(p => p._id === managementId);
      if (!process) {
        throw new Error('Process not found');
      }

      const pendingDocs = process.documentTypes.filter(doc => doc.status === 'pending');
      if (pendingDocs.length === 0) {
        alert('All documents are already completed for this process.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoModal = document.createElement('div');
      videoModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      
      const modalContent = `
        <div class="bg-white p-4 rounded-lg max-w-2xl w-full">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium">Capture Multiple Photos</h3>
            <button class="text-gray-500 hover:text-gray-700" id="closeCamera">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <video class="w-full rounded-lg mb-4" autoplay playsinline></video>
          <div class="captured-images-preview flex gap-2 overflow-x-auto mb-4 min-h-[96px] p-2 border rounded"></div>
          <div class="flex flex-col space-y-4">
            <div class="flex justify-end space-x-2">
              <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300" id="cancelCapture">
                Cancel
              </button>
              <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" id="capturePhoto">
                Take Photo
              </button>
              <button class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 opacity-50 cursor-not-allowed" 
                id="processPhotos" disabled>
                Process Photos (0)
              </button>
            </div>
          </div>
        </div>
      `;
      
      videoModal.innerHTML = modalContent;
      document.body.appendChild(videoModal);
      
      const video = videoModal.querySelector('video');
      video.srcObject = stream;
      
      let capturedPhotos = [];
      
      const updateProcessButton = () => {
        const processButton = videoModal.querySelector('#processPhotos');
        const count = capturedPhotos.length;
        processButton.textContent = `Process Photos (${count})`;
        if (count > 0) {
          processButton.disabled = false;
          processButton.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
          processButton.disabled = true;
          processButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
      };

      const cleanup = () => {
        stream.getTracks().forEach(track => track.stop());
        videoModal.remove();
        capturedPhotos = [];
      };
      
      videoModal.querySelector('#closeCamera').onclick = cleanup;
      videoModal.querySelector('#cancelCapture').onclick = cleanup;
      
      // Handle individual photo capture
      videoModal.querySelector('#capturePhoto').onclick = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          const imageUrl = URL.createObjectURL(blob);
          const photoIndex = capturedPhotos.length;
          capturedPhotos.push({ blob, url: imageUrl });
          
          // Update preview
          const previewContainer = videoModal.querySelector('.captured-images-preview');
          const preview = document.createElement('div');
          preview.className = 'relative';
          preview.innerHTML = `
            <img src="${imageUrl}" alt="Captured" class="w-24 h-24 object-cover rounded" />
            <button class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
              data-index="${photoIndex}">×</button>
          `;
          previewContainer.appendChild(preview);
          
          updateProcessButton();
        }, 'image/jpeg');
      };
      
      // Handle processing all captured photos
      videoModal.querySelector('#processPhotos').onclick = async () => {
        if (capturedPhotos.length === 0) return;
        
        try {
          const files = capturedPhotos.map((photo, index) => 
            new File([photo.blob], `camera-capture-${index}.jpg`, { type: 'image/jpeg' })
          );
          cleanup();
          await handleMultipleFileUpload(files, managementId);
        } catch (err) {
          console.error('Error processing captured images:', err);
          alert('Failed to process captured images. Please try again.');
        }
      };
      
      // Handle removing individual captures
      videoModal.addEventListener('click', (e) => {
        if (e.target.matches('button[data-index]')) {
          const index = parseInt(e.target.dataset.index);
          capturedPhotos = capturedPhotos.filter((_, i) => i !== index);
          e.target.closest('.relative').remove();
          updateProcessButton();
        }
      });
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please make sure you have granted camera permissions.');
    }
  };

  const handleMultipleFileUpload = async (files, processId) => {
    try {
      setProcessingProcessId(processId);
      const process = pendingProcesses.find(p => p._id === processId);
      if (!process) return;

      // Step 1: Upload all files first with minimal metadata
      const uploadPromises = files.map(async (file) => {
        try {
          if (!validateFileType(file)) return null;
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('name', `${Date.now()}-${file.name}`);
          formData.append('managementId', processId);
          formData.append('form_category', process.categoryName || 'other');
          formData.append('type', 'pending_extraction'); // Temporary type
          
          // Use first pending doc type for initial upload
          const tempDocType = process.documentTypes.find(dt => dt.status !== 'completed');
          if (tempDocType) {
            formData.append('documentTypeId', tempDocType.documentTypeId);
            formData.append('managementDocumentId', tempDocType._id);
          }

          const response = await api.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (response.data?.status === 'success' && response.data.data.document) {
            return response.data.data.document;
          }
          return null;
        } catch (err) {
          console.error(`Error uploading file ${file.name}:`, err);
          return null;
        }
      });

      // Wait for all uploads to complete
      const uploadedDocs = (await Promise.all(uploadPromises)).filter(Boolean);
      if (uploadedDocs.length === 0) {
        toast.error('No files were uploaded successfully');
        return;
      }

      // Step 2: Wait for all documents to be processed by OpenAI
      const processedDocs = await Promise.all(
        uploadedDocs.map(doc => checkDocumentProcessing(doc._id))
      );

      // Step 3: Match documents with required types and update statuses
      const docTypeMatches = new Map();
      const docsToDelete = new Set();

      processedDocs.forEach(doc => {
        if (!doc || !doc.extractedData?.document_type) {
          if (doc?._id) docsToDelete.add(doc._id);
          return;
        }

        const extractedType = doc.extractedData.document_type.toLowerCase().trim();
        const matchingDocType = process.documentTypes.find(type => {
          const typeName = type.name.toLowerCase().trim();
          const typeMatches = typeName === extractedType || extractedType.includes(typeName);
          return typeMatches && 
                 type.status !== 'completed' && 
                 !docTypeMatches.has(type.documentTypeId);
        });

        if (matchingDocType) {
          docTypeMatches.set(matchingDocType.documentTypeId, {
            docId: doc._id,
            extractedType,
            expectedType: matchingDocType.name
          });
        } else {
          docsToDelete.add(doc._id);
        }
      });

      // Step 4: Update statuses for matched documents
      if (docTypeMatches.size > 0) {
        await Promise.all(
          Array.from(docTypeMatches.entries()).map(([typeId, { docId, extractedType, expectedType }]) => {
            console.log(`Matched document: Expected "${expectedType}", Got "${extractedType}"`);
            return updateDocumentStatus(processId, typeId);
          })
        );

        toast.success(
          <div className="flex flex-col">
            <span className="font-medium">Documents processed successfully!</span>
            <span className="text-sm">
              {docTypeMatches.size} document{docTypeMatches.size !== 1 ? 's' : ''} matched
            </span>
          </div>
        );
      }

      // Step 5: Clean up unmatched documents
      if (docsToDelete.size > 0) {
        console.log(`Deleting ${docsToDelete.size} unmatched documents`);
        await Promise.all(
          Array.from(docsToDelete).map(docId =>
            api.delete(`/documents/${docId}`).catch(err => 
              console.error(`Error deleting document ${docId}:`, err)
            )
          )
        );
      }

      // Step 6: Refresh the process list
      await fetchPendingProcesses();

    } catch (err) {
      console.error('Error in multiple file upload:', err);
      toast.error('Error processing documents');
    } finally {
      setProcessingProcessId(null);
    }
  };

  const renderDocumentSection = (process, doc) => (
    <motion.div
      key={doc._id}
      variants={fadeIn}
      layout
      className={`
        flex items-center justify-between p-6 rounded-xl
        transition-all duration-200 ease-in-out
        ${doc.status === 'completed' 
          ? 'bg-green-50 border border-green-100 shadow-sm' 
          : 'bg-white border border-gray-100 hover:border-primary-100 shadow-sm hover:shadow-md'
        }
      `}
    >
      <div className="flex-1">
        <h3 className="text-lg font-medium text-gray-900">{doc.name}</h3>
        <div className="mt-1 flex items-center gap-3">
          <span className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${doc.status === 'completed' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
            }
          `}>
            {doc.status}
          </span>
          {doc.required && (
            <span className="text-sm text-red-500 flex items-center">
              <span className="mr-1">•</span> Required
            </span>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {doc.status === 'completed' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center space-x-2 text-green-600"
          >
            <CheckCircle className="w-6 h-6" />
            <span className="font-medium">Verified</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const ProcessingIndicator = () => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % processingSteps.length);
      }, 2000); // Change step every 2 seconds

      return () => clearInterval(interval);
    }, []);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 bg-blue-50 px-6 py-3 rounded-lg border border-blue-100"
      >
        <div className="relative">
          <div className="w-6 h-6">
            <motion.div
              className="absolute inset-0 border-2 border-blue-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-1 border-2 border-blue-300 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
        
        <div className="flex flex-col">
          <motion.span 
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm font-medium text-blue-700"
          >
            {processingSteps[currentStep].text}
          </motion.span>
          <div className="flex gap-1 mt-1">
            {processingSteps.map((step, index) => (
              <motion.div
                key={step.id}
                className={`h-1 rounded-full ${
                  index === currentStep ? 'w-8 bg-blue-500' : 'w-2 bg-blue-200'
                }`}
                animate={{
                  width: index === currentStep ? 32 : 8,
                  backgroundColor: index === currentStep ? '#3B82F6' : '#BFDBFE'
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderProcess = (process) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      key={process._id}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">
              {process.categoryName}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-gray-500">Assigned to:</span>
              <span className="px-3 py-1.5 bg-gray-50 rounded-lg text-gray-700 font-medium">
                {process.userId?.name || 'Unknown User'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="block text-sm text-gray-500">
                Assigned
              </span>
              <span className="block mt-1 font-medium">
                {new Date(process.createdAt).toLocaleDateString()}
              </span>
            </div>
            {processingProcessId === process._id && (
              <div className="min-w-[300px]">
                <ProcessingIndicator />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <label
            htmlFor={`multiple-files-upload-${process._id}`}
            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium
              bg-primary-600 hover:bg-primary-700 text-white cursor-pointer
              transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Smart Upload
          </label>
          <input
            type="file"
            id={`multiple-files-upload-${process._id}`}
            className="hidden"
            multiple
            onChange={async (e) => {
              if (e.target.files?.length) {
                const pendingDocs = process.documentTypes.filter(doc => doc.status === 'pending');
                if (pendingDocs.length > 0) {
                  await handleMultipleFileUpload(Array.from(e.target.files), process._id);
                }
              }
            }}
            accept="image/*,application/pdf"
          />

          <button
            onClick={() => handleCameraCapture(process._id)}
            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium
              bg-white border border-gray-200 hover:bg-gray-50 text-gray-700
              transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <Camera className="w-4 h-4 mr-2" />
            Camera
          </button>
        </div>
      </div>

      <motion.div 
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="p-6 space-y-4 bg-gray-50"
      >
        {process.documentTypes.map((doc) => renderDocumentSection(process, doc))}
      </motion.div>
    </motion.div>
  );

  const renderContent = () => {
    if (!user) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500"
        >
          <div className="text-xl">Please log in to view pending processes.</div>
        </motion.div>
      );
    }

    if (loading) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[60vh]"
        >
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
          <p className="mt-4 text-gray-600">Loading your documents...</p>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {applicationId 
              ? 'Pending Application Details'
              : userId 
                ? `${pendingProcesses[0]?.userId?.name || 'User'}'s Active Processes`
                : 'My Active Processes'
            }
          </h1>
        </div>

        <AnimatePresence>
          {pendingProcesses.length === 0 ? (
            <motion.div
              {...fadeIn}
              className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No pending processes found
                </h3>
                <p className="text-gray-500">
                  {applicationId 
                    ? 'The requested application was not found or is not pending.'
                    : userId 
                      ? 'This user has no pending processes.'
                      : "You don't have any processes waiting for document uploads."
                  }
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              variants={staggerChildren}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {!applicationId && existingDocuments.length > 0 && (
                <motion.div
                  {...fadeIn}
                  className="bg-blue-50 p-6 rounded-xl border border-blue-100"
                >
                  <p className="text-blue-700">
                    You have {existingDocuments.length} existing document
                    {existingDocuments.length !== 1 ? 's' : ''}.
                  </p>
                </motion.div>
              )}

              {pendingProcesses.map(renderProcess)}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
      <div>
        <Toaster />
      </div>
      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Crop Image</h3>
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setCropImage(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-auto">
              <ReactCrop
                crop={crop}
                onChange={(percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={undefined}
              >
                <img
                  ref={(img) => setImageRef(img)}
                  src={cropImage}
                  alt="Crop preview"
                  style={{ maxWidth: '100%' }}
                />
              </ReactCrop>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setCropImage(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCropComplete}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingProcesses; 