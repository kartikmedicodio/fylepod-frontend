import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {  
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

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

const IndividualCaseDetails = () => {
  const { caseId } = useParams();
  const [activeTab, setActiveTab] = useState('case-details');
  const [caseData, setCaseData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('pending');
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

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
      const processedDocs = await Promise.all(
        uploadedDocs.map(async (doc) => {
          try {
            const processedDoc = await checkDocumentProcessing(doc._id);
            if (!processedDoc) {
              throw new Error('Document processing failed');
            }

            // Update document with management document ID
            if (processedDoc.extractedData?.document_type) {
              const extractedType = processedDoc.extractedData.document_type.toLowerCase().trim();
              const matchingDocType = caseData.documentTypes.find(type => {
                return type.name.toLowerCase().trim() === extractedType && 
                       type.status !== 'completed';
              });

              if (matchingDocType) {
                await api.patch(`/documents/${doc._id}`, {
                  documentTypeId: matchingDocType.documentTypeId,
                  managementDocumentId: matchingDocType._id
                });

                // Update document status
                await api.patch(`/management/${caseId}/documents/${matchingDocType.documentTypeId}/status`, {
                  status: 'completed'
                });
              }
            }

            return processedDoc;
          } catch (err) {
            console.error(`Error processing document ${doc._id}:`, err);
            return null;
          }
        })
      );

      // Check if all documents are completed
      const response = await api.get(`/management/${caseId}`);
      if (response.data.status === 'success') {
        const allCompleted = response.data.data.entry.documentTypes.every(doc => doc.status === 'completed');
        
        if (allCompleted) {
          await api.patch(`/management/${caseId}/status`, {
            status: 'completed',
            categoryStatus: 'completed'
          });
        }
        
        setCaseData(response.data.data.entry);
      }

      setFiles([]);
      toast.success('Documents processed successfully');

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
        toast.error('Failed to load case details');
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

    fetchCaseDetails();
    fetchProfileData();
  }, [caseId]);

  if (!caseData || !profileData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const CaseDetailsTab = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="space-y-6">
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
        
        <div className="mt-8">
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
    </div>
  );

  const QueriesTab = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-6">Queries</h3>
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
    const pendingDocuments = caseData.documentTypes.filter(doc => doc.status === 'pending');
    const uploadedDocuments = caseData.documentTypes.filter(doc => doc.status === 'completed');

    const renderDocumentsList = () => (
      <div className="flex-1 border border-gray-200 rounded-lg p-4">
        <div className="space-y-3">
          {uploadStatus === 'pending' ? (
            pendingDocuments.length > 0 ? (
              pendingDocuments.map((doc) => (
                <div key={doc._id} className="bg-white rounded-lg shadow-sm p-4">
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
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
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
                <div key={doc._id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm mb-1">{doc.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center text-sm text-green-600">
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          Completed
                        </span>
                        <button className="text-blue-600 text-sm hover:underline">
                          View
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm text-center py-8">
                No documents have been completed yet.
              </div>
            )
          )}
        </div>
      </div>
    );

    const renderSmartUpload = () => (
      uploadStatus === 'pending' && (
        <div className="flex-1 border border-gray-200 rounded-lg p-4">
          <div className="mb-4">
            <h4 className="font-medium text-sm">Smart Upload Files</h4>
          </div>
          
          <div 
            className={`flex flex-col items-center justify-center py-8 rounded-lg h-[calc(100%-3rem)] transition-colors
              ${isDragging 
                ? 'bg-blue-50 border-2 border-dashed border-blue-300' 
                : 'bg-gray-50'
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
                      className="flex items-center justify-between bg-white p-2 rounded"
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                        </svg>
                        <span className="text-sm truncate max-w-xs">{file.name}</span>
                      </div>
                      <button 
                        onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <label 
                    htmlFor="file-upload"
                    className="bg-blue-600 text-white py-2.5 px-6 rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors text-center"
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
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
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

  return (
    <>
      {/* Profile Section */}
      <div className="p-6 flex justify-start">
        <div className="w-1/2">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start gap-6">
              {/* Profile Picture with Initials */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center">
                  <span className="text-2xl font-medium text-blue-600">
                    {getInitials(profileData.name)}
                  </span>
                </div>
              </div>

              {/* Profile Info Grid */}
              <div className="flex-grow grid grid-cols-2 gap-x-12 gap-y-2">
                {/* Left Column - Basic Info */}
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-gray-500">Name</div>
                    <div className="font-medium">{profileData.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Phone Number</div>
                    <div className="font-medium">
                      {profileData.contact?.mobileNumber || profileData.contact?.residencePhone || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email Address</div>
                    <div className="font-medium">{profileData.email}</div>
                  </div>
                </div>

                {/* Right Column - Location Info */}
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-gray-500">Nationality</div>
                    <div className="font-medium">{profileData.address?.country || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Address</div>
                    <div className="font-medium">
                      {[
                        profileData.address?.city,
                        profileData.address?.country,
                        profileData.address?.zipCode
                      ]
                        .filter(Boolean)
                        .join(', ') || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Passport Number</div>
                    <div className="font-medium">{profileData.passport?.number || '-'}</div>
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
          {['Case Details', 'Documents Checklist', 'Queries'].map((tab) => (
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
            {/* Documents Checklist - Left Side */}
            <div className="w-[66%]">
              <div className="bg-white rounded-lg border border-gray-200">
                <DocumentsChecklistTab />
              </div>
            </div>

            {/* Questionnaire - Right Side */}
            <div className="w-[33%]">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
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
          </div>
        )}
        {activeTab === 'queries' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <QueriesTab />
          </div>
        )}
      </div>
    </>
  );
};

export default IndividualCaseDetails;
