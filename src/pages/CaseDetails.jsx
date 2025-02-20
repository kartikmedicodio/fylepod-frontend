import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Search, SlidersHorizontal, MoreVertical, Upload, X, Loader2, Camera, Files } from 'lucide-react';
import CaseDetailsSidebar from '../components/cases/CaseDetailsSidebar';
import caseService from '../services/caseService';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const CaseDetails = () => {
  const { caseId } = useParams();
  const [activeTab, setActiveTab] = useState('document-checklist');
  const [caseDetails, setCaseDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocumentTab, setSelectedDocumentTab] = useState('pending');
  const [documents, setDocuments] = useState({ uploaded: [], pending: [] });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = React.useRef(null);

  const steps = [
    { id: 'case-started', name: 'Case Started', completed: true },
    { id: 'data-collection', name: 'Data Collection', completed: true },
    { id: 'in-review', name: 'In Review', completed: false },
    { id: 'preparation', name: 'Preparation', completed: false },
    { id: 'filing', name: 'Filing', completed: false },
  ];

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        const response = await caseService.getCaseDetails(caseId);
        setCaseDetails(response.data.entry);
        
        // Segregate documents based on status
        const documentTypes = response.data.entry.documentTypes || [];
        const uploaded = documentTypes.filter(doc => doc.status === 'completed');
        const pending = documentTypes.filter(doc => !doc.status || doc.status === 'pending' || doc.status === 'uploaded');
        setDocuments({ uploaded, pending });
        console.log('Documents:', { uploaded, pending });
      } catch (error) {
        console.error('Error fetching case details:', error);
      }
    };
    
    fetchCaseDetails();
  }, [caseId]);

  // Filter documents based on search query
  const filteredDocuments = {
    uploaded: documents.uploaded.filter(doc => 
      doc.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    pending: documents.pending.filter(doc => 
      doc.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (files) => {
    if (!files.length) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      // Get the first file for now
      const file = files[0];
      formData.append('file', file);
      formData.append('name', `${Date.now()}-${file.name}`);
      formData.append('managementId', caseId);
      formData.append('type', 'document');
      formData.append('form_category', 'document_verification');
      
      const response = await caseService.uploadDocuments(formData, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      
      if (response.status === 'success') {
        toast.success('Documents uploaded successfully');
        // Refresh documents list
        const updatedCase = await caseService.getCaseDetails(caseId);
        setCaseDetails(updatedCase.data.entry);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload documents');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex h-full">
      <CaseDetailsSidebar caseDetails={caseDetails} />
      <div className="flex-1 p-8">
        {/* Case Progress Steps */}
          <h2 className="text-3xl font-medium mb-4 text-gray-700">Case Progress</h2>
        <div className="mb-6 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                {/* Step Circle */}
                <div className="flex flex-col items-center relative group">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 
                    ${step.completed 
                      ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-100' 
                      : 'border-gray-300 bg-white'
                    }`}
                  >
                    {step.completed ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors" />
                    )}
                  </div>
                  <span className="mt-2 text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                    {step.name}
                  </span>
                  {/* Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {step.completed ? 'Completed' : 'Pending'}
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-[1px] mx-4
                    ${steps[index].completed && steps[index + 1].completed 
                      ? 'bg-blue-600 shadow-sm' 
                      : 'bg-gray-200'
                    }`} 
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
          {['profile', 'document-checklist', 'questionnaire', 'forms', 'queries'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[500px]">
          {activeTab === 'document-checklist' && (
            <div className="p-6 space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center justify-between">
                <div className="relative w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 text-sm hover:bg-gray-50">
                    <SlidersHorizontal size={16} />
                    All Filters
                  </button>
                  <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                    Sort
                  </button>
                </div>
              </div>

              {/* Document Status Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedDocumentTab('uploaded')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                      ${selectedDocumentTab === 'uploaded' 
                        ? 'bg-blue-50 border border-blue-100 text-blue-600' 
                        : 'bg-white border border-gray-200 text-gray-600'
                      }`}
                  >
                    Uploaded ({documents.uploaded.length})
                  </button>
                  <button 
                    onClick={() => setSelectedDocumentTab('pending')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium
                      ${selectedDocumentTab === 'pending' 
                        ? 'bg-blue-50 border border-blue-100 text-blue-600' 
                        : 'bg-white border border-gray-200 text-gray-600'
                      }`}
                  >
                    Upload Pending ({documents.pending.length})
                  </button>
                </div>
                {selectedDocumentTab === 'pending' && (
                  <button 
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg text-sm flex items-center gap-2 cursor-not-allowed"
                    onClick={handleUploadClick}
                    disabled={true}
                  >
                    <Upload size={16} />
                    Upload Documents (Coming Soon)
                  </button>
                )}
              </div>

              {/* Documents List */}
              <div className="space-y-4">
                {filteredDocuments[selectedDocumentTab].map((doc) => (
                  <div key={doc._id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="font-medium capitalize">{doc.name || 'Untitled Document'}</span>
                        {doc.required && (
                          <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">Required</span>
                        )}
                        <span className="text-xs text-gray-500">
                          {doc.documentCategoryName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.status === 'completed' ? (
                          <>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                              Approve
                            </button>
                            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                              Request for Reupload
                            </button>
                          </>
                        ) : (!doc.status || doc.status === 'pending') ? (
                         <></>
                        ) : doc.status === 'uploaded' && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            Uploaded
                          </span>
                        )}
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Document Verification Steps */}
                    <div className="mt-4 flex items-center gap-2">
                      {(!doc.status || doc.status === 'pending') ? (
                        <>
                          <div className="flex-1 h-1 bg-gray-200 rounded" />
                          <div className="flex-1 h-1 bg-gray-200 rounded" />
                          <div className="flex-1 h-1 bg-gray-200 rounded" />
                          <div className="flex-1 h-1 bg-gray-200 rounded" />
                        </>
                      ) : doc.status === 'completed' ? (
                        <>
                          <div className="flex-1 h-1 bg-blue-600 rounded" />
                          <div className="flex-1 h-1 bg-blue-600 rounded" />
                          <div className="flex-1 h-1 bg-blue-200 rounded" />
                          <div className="flex-1 h-1 bg-gray-200 rounded" />
                        </>
                      ) : (
                        <>
                          <div className="flex-1 h-1 bg-blue-600 rounded" />
                          <div className="flex-1 h-1 bg-blue-200 rounded" />
                          <div className="flex-1 h-1 bg-gray-200 rounded" />
                          <div className="flex-1 h-1 bg-gray-200 rounded" />
                        </>
                      )}
                    </div>
                   
                  </div>
                ))}
                {filteredDocuments[selectedDocumentTab].length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No {selectedDocumentTab} documents found
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Other tab contents */}
        </div>
      </div>
    </div>
  );
};

export default CaseDetails; 