import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Upload, Loader2, CheckCircle, Wand2, Camera, Files } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const PendingProcesses = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    if (user?._id) {
      Promise.all([fetchPendingProcesses(), fetchExistingDocuments()]);
    }
  }, [user?._id]);

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
      setLoading(true);
      const response = await api.get(`/management/user/${user._id}`, {
        params: {
          status: 'pending'
        }
      });

      console.log('Fetched pending processes:', response.data);
      setPendingProcesses(response.data.data.entries);
    } catch (err) {
      console.error('Error fetching pending processes:', err);
      setError(err.response?.data?.message || 'Failed to fetch pending processes');
    } finally {
      setLoading(false);
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
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload only images (JPG, PNG) or PDF files.');
    }
    return true;
  };

  const handleFileUpload = async (managementId, documentTypeId, file) => {
    try {
      // Validate file type before uploading
      validateFileType(file);
      
      setUploading(prev => ({ ...prev, [documentTypeId]: true }));
      setProcessingDocuments(prev => ({ ...prev, [documentTypeId]: true }));
      
      const process = pendingProcesses.find(f => f._id === managementId);
      const documentType = process?.documentTypes.find(d => d.documentTypeId === documentTypeId);
      
      // Create unique filename with timestamp and original extension
      const fileExtension = file.name.split('.').pop();
      const timestamp = new Date().getTime();
      const uniqueFilename = `${timestamp}-${documentType?.name.replace(/\s+/g, '_')}.${fileExtension}`;

      const formData = new FormData();
      formData.append('file', file); // Backend handles file naming
      formData.append('name', uniqueFilename);
      formData.append('type', documentType?.name || 'other');
      formData.append('form_category', process?.categoryName || 'other');
      formData.append('managementId', managementId);
      formData.append('documentTypeId', documentTypeId);
      formData.append('managementDocumentId', documentType._id);

      const uploadResponse = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload Response:', uploadResponse.data);

      if (uploadResponse.data?.status === 'success' && uploadResponse.data.data.document) {
        const documentId = uploadResponse.data.data.document._id;
        
        setUploadedDocumentIds(prev => ({
          ...prev,
          [documentTypeId]: documentId
        }));

        // Wait for document processing to complete
        const processingComplete = await checkDocumentProcessing(documentId, documentTypeId);
        
        if (processingComplete) {
          try {
            const documentResponse = await api.get(`/documents/${documentId}`);
            const actualDocType = documentResponse.data.data.document.extractedData?.document_type;
            
            if (actualDocType?.toLowerCase() === documentType?.name.toLowerCase()) {
              await updateDocumentStatus(managementId, documentTypeId);
              await fetchPendingProcesses();
              return true;
            } else {
              // Delete the document if type doesn't match
              await api.delete(`/documents/${documentId}`);
              throw new Error(`Incorrect document type detected. Expected ${documentType?.name}, got ${actualDocType}. Please upload the correct document.`);
            }
          } catch (submitError) {
            console.error('Error during submission:', submitError);
            throw submitError;
          }
        }

        setUploadedFiles(prev => ({
          ...prev,
          [documentTypeId]: {
            managementId,
            documentTypeId,
            uploaded: true,
            filePath: uploadResponse.data.data.document.filePath,
            originalName: uploadResponse.data.data.document.originalName
          }
        }));

        await fetchExistingDocuments();
      } else {
        throw new Error('Upload failed: Invalid response from server');
      }
      return false;
    } catch (err) {
      console.error('Error in upload process:', err);
      throw err;
    } finally {
      setProcessingDocuments(prev => ({ ...prev, [documentTypeId]: false }));
      setUploading(prev => ({ ...prev, [documentTypeId]: false }));
    }
  };

  const checkDocumentProcessing = async (documentId, documentTypeId) => {
    try {
      let attempts = 0;
      const maxAttempts = 20;
      const checkInterval = 2000;
      let lastResponse = null;
      let processingStarted = false;
      
      while (attempts < maxAttempts) {
        console.log(`Checking processing status for document ${documentId}, attempt ${attempts + 1}`);
        
        const response = await api.get(`/documents/${documentId}`);
        lastResponse = response.data.data.document;
        
        // Check if processing has started by looking for processing status or errors
        if (!processingStarted && lastResponse.status === 'processing') {
          processingStarted = true;
        }

        // Early detection of processing errors
        if (lastResponse.processingError || lastResponse.status === 'failed') {
          await api.delete(`/documents/${documentId}`);
          throw new Error('Document processing failed: Invalid or corrupted file');
        }

        // Check for successful processing
        if (lastResponse.extractedData?.document_type) {
          console.log('Document processing completed:', lastResponse);
          setProcessingDocuments(prev => ({ ...prev, [documentTypeId]: false }));
          return true;
        }
        
        // If processing hasn't started after 3 attempts, assume there's an issue
        if (!processingStarted && attempts >= 3) {
          await api.delete(`/documents/${documentId}`);
          throw new Error('Document processing could not start');
        }

        // Exponential backoff for polling interval
        const dynamicInterval = checkInterval * Math.min(Math.pow(2, attempts), 8); // Max 16 seconds interval
        await new Promise(resolve => setTimeout(resolve, dynamicInterval));
        attempts++;

        // Final check using cached response
        if (attempts === maxAttempts - 1) {
          if (lastResponse.extractedData?.document_type) {
            setProcessingDocuments(prev => ({ ...prev, [documentTypeId]: false }));
            return true;
          }
          
          await api.delete(`/documents/${documentId}`);
          throw new Error('Document processing timed out');
        }
      }
      
      throw new Error('Document processing timed out');
    } catch (err) {
      console.error('Error checking document processing:', err);
      setProcessingDocuments(prev => ({ ...prev, [documentTypeId]: false }));
      
      // Clean up document if it exists
      try {
        if (documentId) {
          await api.delete(`/documents/${documentId}`);
        }
      } catch (deleteErr) {
        console.error('Error deleting invalid document:', deleteErr);
      }

      // Provide specific error messages based on the error type
      const errorMessages = {
        'Document processing failed: Invalid or corrupted file': 
          'The document appears to be invalid or corrupted. Please check the file and try again.',
        'Document processing could not start': 
          'The system could not process this type of document. Please ensure you are uploading a valid document.',
        'Document processing timed out': 
          'The document processing took too long. Please try uploading a clearer document.',
      };

      const errorMessage = errorMessages[err.message] || 'Failed to process document. Please try uploading again.';
      throw new Error(errorMessage);
    }
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
      const uploadPromises = [];
      const processedFiles = new Set();
      const processedDocTypes = new Set();
      let matchedCount = 0;

      // Get the specific process
      const process = pendingProcesses.find(p => p._id === processId);
      if (!process) {
        throw new Error('Process not found');
      }

      for (const file of files) {
        if (processedFiles.has(file.name)) continue;

        // Only check document types for this specific process
        for (const docType of process.documentTypes) {
          const docTypeKey = `${process._id}-${docType.documentTypeId}`;
          if (docType.status === 'completed' || processedDocTypes.has(docTypeKey)) continue;
          
          const uploadPromise = (async () => {
            try {
              const response = await handleFileUpload(process._id, docType.documentTypeId, file);
              if (response) {
                processedFiles.add(file.name);
                processedDocTypes.add(docTypeKey);
                matchedCount++;
              }
            } catch (err) {
              console.error(`Error processing ${file.name} for ${docType.name}:`, err);
            }
          })();

          uploadPromises.push(uploadPromise);
        }
      }

      await Promise.all(uploadPromises);

      await fetchPendingProcesses();
      
      if (matchedCount > 0) {
        alert(`Successfully processed ${matchedCount} file${matchedCount !== 1 ? 's' : ''}`);
        window.location.reload();
      } else {
        alert('No files could be processed. Please check the document types and try again.');
      }

    } catch (err) {
      console.error('Error in multiple file upload:', err);
      alert('An error occurred while processing files. Please try again.');
    } finally {
      setProcessingProcessId(null);
    }
  };

  const renderDocumentSection = (process, doc) => (
    <div 
      key={doc._id}
      className="flex items-center justify-between p-4 border rounded-lg"
    >
      <div>
        <p className="font-medium">{doc.name}</p>
        <p className="text-sm text-gray-500">
          Status: 
          <span className={`ml-1 ${
            doc.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {doc.status}
          </span>
          {doc.required && (
            <span className="text-red-500 ml-2">*Required</span>
          )}
        </p>
      </div>
      
      {doc.status === 'completed' && (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">Completed</span>
        </div>
      )}
    </div>
  );

  const ProcessingIndicator = () => (
    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-md">
      <div className="relative">
        <div className="w-4 h-4 border-2 border-blue-200 rounded-full">
          <div className="absolute top-0 left-0 w-4 h-4 border-2 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
      <span className="text-sm text-blue-700">Processing...</span>
    </div>
  );

  const renderProcess = (process) => (
    <div 
      key={process._id} 
      className="bg-white rounded-lg shadow p-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {process.categoryName}
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Assigned: {new Date(process.createdAt).toLocaleDateString()}
            </span>
            {processingProcessId === process._id && <ProcessingIndicator />}
          </div>
          
          {/* Document upload buttons group */}
          <div className="flex items-center space-x-2">
            {/* Multiple file upload button */}
            <div>
              <input
                type="file"
                id={`multiple-files-upload-${process._id}`}
                className="hidden"
                multiple
                onChange={async (e) => {
                  if (e.target.files?.length) {
                    try {
                      const pendingDocs = process.documentTypes.filter(doc => doc.status === 'pending');
                      if (pendingDocs.length === 0) {
                        alert('All documents are already completed for this process.');
                        return;
                      }
                      await handleMultipleFileUpload(Array.from(e.target.files), process._id);
                    } catch (error) {
                      console.error('Error during multiple file upload:', error);
                    }
                  }
                }}
                accept="image/*,application/pdf"
              />
              <label
                htmlFor={`multiple-files-upload-${process._id}`}
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                  bg-primary-600 hover:bg-primary-700 text-white cursor-pointer"
              >
                <Files className="w-4 h-4 mr-2" />
                Upload Documents
              </label>
            </div>

            {/* Camera capture button */}
            <button
              onClick={() => handleCameraCapture(process._id)}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </button>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {process.documentTypes.map((doc) => renderDocumentSection(process, doc))}
      </div>
    </div>
  );

  const renderContent = () => {
    if (!user) {
      return (
        <div className="text-center text-gray-500">
          Please log in to view your pending processes.
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 text-red-500 text-center">
          <p>{error}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Pending Processes</h1>
          <button
            onClick={() => handleAutoFill(existingDocuments)}
            disabled={autoFilling || pendingProcesses.length === 0}
            className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
              ${(autoFilling || pendingProcesses.length === 0)
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-primary-600 hover:bg-primary-700 text-white cursor-pointer'
              }`}
          >
            {autoFilling ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            Auto-fill Documents
          </button>
        </div>
        
        {pendingProcesses.length === 0 ? (
          <div className="text-center text-gray-500 p-8 bg-white rounded-lg shadow">
            <p className="text-lg">No pending processes found</p>
            <p className="text-sm mt-2">You don't have any processes waiting for document uploads.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {existingDocuments.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  You have {existingDocuments.length} existing document{existingDocuments.length !== 1 ? 's' : ''} that might match your requirements.
                  Click "Auto-fill Documents" to automatically match them.
                </p>
              </div>
            )}

            {pendingProcesses.map(renderProcess)}
          </div>
        )}
      </div>
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