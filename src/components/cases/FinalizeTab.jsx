import React, { useState, useEffect } from 'react';
import { Check, AlertTriangle, X, FileText, Bot, Loader2, Eye } from 'lucide-react';
import { useDocumentContext } from '../../contexts/DocumentContext';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import PropTypes from 'prop-types';

const ProcessState = ({ state, status, onClick }) => {
  const getStateStyles = () => {
    switch (status) {
      case 'success':
        return 'bg-blue-50/30 border-blue-100/50';
      case 'partial':
        return 'bg-amber-50/30 border-amber-100/50';
      case 'error':
        return 'bg-rose-50/30 border-rose-100/50';
      default:
        return 'bg-slate-50/30 border-slate-100/50';
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'success':
        return 'bg-gradient-to-r from-blue-400 to-blue-500';
      case 'partial':
        return 'bg-gradient-to-r from-amber-400 to-amber-500';
      case 'error':
        return 'bg-gradient-to-r from-rose-400 to-rose-500';
      default:
        return 'bg-slate-200';
    }
  };
  
  // Check if this is a clickable verification state
  const isClickableState = state === 'Verification' || state === 'Cross Verification';
  
  // Add hover effects and shadow for clickable states
  const clickableStyles = isClickableState 
    ? 'hover:shadow-md hover:brightness-105 hover:-translate-y-0.5 transform transition-all duration-200' 
    : '';

  return (
    <div 
      className={`relative flex-1 cursor-pointer group ${isClickableState ? 'hover:z-10' : ''}`}
      onClick={onClick}
    >
      {/* Invisible click area */}
      <div className="absolute inset-0 -top-9 -bottom-2" />
      
      {/* State Label - Simple high-contrast text with shadow for clickable states */}
      <div className={`absolute -top-7 left-0 w-full text-[13px] font-semibold whitespace-nowrap transition-colors text-center 
        text-slate-600 bg-white/90 py-0.5 px-1 rounded ${isClickableState ? 'shadow-sm' : ''}`}>
        {state}
      </div>
      
      {/* Progress Bar with shadow for clickable states */}
      <div className={`h-1.5 rounded-full border ${getStateStyles()} group-hover:brightness-95 transition-all ${clickableStyles} ${isClickableState ? 'shadow-sm' : ''}`}>
        <div 
          className={`h-full rounded-full ${getProgressBarColor()} transition-all duration-300 backdrop-blur-sm`}
          style={{ 
            width: status === 'pending' ? '0%' : '100%',
            opacity: status === 'pending' ? 0.3 : 1
          }}
        />
      </div>
    </div>
  );
};

ProcessState.propTypes = {
  state: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

const DocumentStatus = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'Approved':
        return {
          icon: Check,
          text: 'Approved',
          className: 'text-emerald-600 bg-emerald-50/50 border-emerald-100 ring-1 ring-emerald-100/50'
        };
      case 'Verification pending':
        return {
          icon: AlertTriangle,
          text: 'Approve pending',
          className: 'text-amber-600 bg-amber-50/50 border-amber-100 ring-1 ring-amber-100/50'
        };
      default:
        return {
          icon: X,
          text: 'Not verified',
          className: 'text-rose-600 bg-rose-50/50 border-rose-100 ring-1 ring-rose-100/50'
        };
    }
  };

  const { icon: Icon, text, className } = getStatusConfig();

  return (
    <span className={`text-sm font-medium px-3 py-1 rounded-full border shadow-sm backdrop-blur-sm ${className}`}>
      <Icon className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
      {text}
    </span>
  );
};

DocumentStatus.propTypes = {
  status: PropTypes.string.isRequired
};

const DocumentRow = ({ 
  document, 
  documentDetails,
  onStateClick, 
  onApprove, 
  onRequestReupload,
  processingDocuments 
}) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewDocument = (e) => {
    e.stopPropagation();
    if (documentDetails?.fileUrl) {
      const token = localStorage.getItem('auth_token');
      const url = new URL(documentDetails.fileUrl);
      url.searchParams.set('token', token);
      url.searchParams.set('t', Date.now());
      window.open(url.toString(), '_blank');
    }
  };

  return (
    <>
      <div className="group bg-white rounded-xl border border-slate-100 p-6 hover:shadow-md hover:border-slate-200 transition-all duration-200">
        <div className="flex items-center justify-between mb-6">
          {/* Document Info */}
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 flex items-center justify-center group-hover:border-slate-300 transition-colors">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
            <div className="space-y-1">
              <span className="text-base font-medium text-slate-900">
                {documentDetails?.type || 'Unknown Type'}
              </span>
              {documentDetails && (
                <div className="text-sm text-slate-500">
                  <p>Size: {formatFileSize(documentDetails.size)}</p>
                  <p>Type: {documentDetails.mimeType}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Document Button */}
            <button
              onClick={handleViewDocument}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="View document"
            >
              <Eye className="w-5 h-5 text-slate-600" />
            </button>

            {/* Only show status badge for approved documents */}
            {document.status === 'Approved' && (
              <DocumentStatus status={document.status} />
            )}
            
            {/* Add approval buttons for documents that are uploaded but not approved */}
            {document.status === 'Verification pending' && (
              <div className="flex items-center gap-2 ml-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove(document.documentTypeId, document.id);
                  }}
                  disabled={processingDocuments[document.id]}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2
                    ${processingDocuments[document.id] 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-70' 
                      : 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 hover:shadow-md active:shadow-sm transform hover:-translate-y-0.5 active:translate-y-0'
                    }`}
                >
                  {processingDocuments[document.id] ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Approve
                    </span>
                  )}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestReupload(document.documentTypeId, document.id);
                  }}
                  disabled={processingDocuments[document.id]}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2
                    ${processingDocuments[document.id] 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-70' 
                      : 'bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700 hover:shadow-md active:shadow-sm transform hover:-translate-y-0.5 active:translate-y-0'
                    }`}
                >
                  {processingDocuments[document.id] ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <X className="w-4 h-4" />
                      Request Reupload
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress States - Remove Extract state */}
        <div className="flex items-center gap-3 px-1 py-3">
          {document.states
            // Filter out the Extract state
            .filter(state => state.name !== 'Extract')
            .map((state, index, filteredStates) => (
              <React.Fragment key={state.name}>
                <ProcessState 
                  state={state.name}
                  status={state.status}
                  onClick={() => {
                    
                    onStateClick(state.name, document);
                   
                  }}
                />
                {index < filteredStates.length - 1 && (
                  <div className="w-2 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
        </div>
      </div>
    </>
  );
};

DocumentRow.propTypes = {
  document: PropTypes.shape({
    id: PropTypes.string.isRequired,
    documentTypeId: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    states: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired
    })).isRequired
  }).isRequired,
  documentDetails: PropTypes.shape({
    fileUrl: PropTypes.string,
    type: PropTypes.string,
    size: PropTypes.number,
    mimeType: PropTypes.string
  }),
  onStateClick: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onRequestReupload: PropTypes.func.isRequired,
  processingDocuments: PropTypes.object.isRequired
};

const FinalizeTab = ({ 
  documents = [], 
  onStateClick,
  onApprove,
  onRequestReupload,
  processingDocuments = {},
  onDocumentsUpdate
}) => {
  const { documentDetailsMap, isLoading, fetchDocumentDetails } = useDocumentContext();
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  useEffect(() => {
    // Only fetch if we don't already have the details for these documents
    const needsFetch = documents.some(doc => !documentDetailsMap[doc.id]);
    if (needsFetch) {
      fetchDocumentDetails(documents);
    }
  }, [documents]);

  const handleBulkApprove = async () => {
    try {
      setIsBulkApproving(true);
      const documentTypeIds = documents
        .filter(doc => doc.status === 'Verification pending')
        .map(doc => doc.documentTypeId);

      console.log('Documents to approve:', documents);
      console.log('DocumentTypeIds to approve:', documentTypeIds);
      console.log('Management ID:', documents[0]?.managementId);

      if (documentTypeIds.length === 0) {
        console.log('No documents to approve');
        return;
      }

      if (!documents[0]?.managementId) {
        console.error('No management ID found');
        return;
      }

      const response = await api.patch(`/management/${documents[0].managementId}/documents/bulk-approve`, {
        documentTypeIds
      });

      console.log('Bulk approve response:', response);

      if (response.data?.status === 'success') {
        // Update documents in the background
        if (onDocumentsUpdate) {
          const updatedDocuments = documents.map(doc => {
            if (documentTypeIds.includes(doc.documentTypeId)) {
              return {
                ...doc,
                status: 'Approved',
                states: doc.states.map(state => ({
                  ...state,
                  status: state.name === 'Document collection' || state.name === 'Read' ? 'success' : state.status
                }))
              };
            }
            return doc;
          });
          onDocumentsUpdate(updatedDocuments);
          toast.success('Documents approved successfully');
        }
      } else {
        throw new Error('Failed to approve documents');
      }
    } catch (error) {
      console.error('Error bulk approving documents:', error);
      toast.error('Failed to approve documents');
    } finally {
      setIsBulkApproving(false);
    }
  };

  const pendingDocumentsCount = documents.filter(doc => doc.status === 'Verification pending').length;

  return (
    <div>
      {/* Header Section */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium text-slate-900">Document Review & Finalization</h2>
            <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100/50 ring-1 ring-blue-100/20 flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Diana&apos;s analysis
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>{documents.length} document{documents.length !== 1 ? 's' : ''} to review</span>
            </div>
            {pendingDocumentsCount > 0 && (
              <button
                onClick={handleBulkApprove}
                disabled={isBulkApproving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2
                  ${isBulkApproving 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-70' 
                    : 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 hover:shadow-md active:shadow-sm transform hover:-translate-y-0.5 active:translate-y-0'
                  }`}
              >
                {isBulkApproving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Approving All...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Approve All ({pendingDocumentsCount})
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Diana's card */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mt-4 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-start gap-4 relative z-10">
            {/* Diana's Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 -m-2">
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-lg"></div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl"></div>
                  <span className="relative text-sm font-semibold text-white">Diana</span>
                </div>
              </div>
            </div>

            {/* Description Text */}
            <div className="flex-1">
              <h4 className="text-base font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                Intelligent Document Processing
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Agent Diana automatically identifies, sorts, and extracts relevant data from uploaded documents. It then performs human language-based validations to ensure the accuracy of the extracted data before storing it securely in the system.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="p-4">
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : (
            documents.map(doc => {
              console.log('Rendering document:', doc);
              console.log('Document details for this doc:', documentDetailsMap[doc.id]);
              return (
                <DocumentRow 
                  key={doc.id} 
                  document={doc} 
                  documentDetails={documentDetailsMap[doc.id]}
                  onStateClick={onStateClick}
                  onApprove={onApprove}
                  onRequestReupload={onRequestReupload}
                  processingDocuments={processingDocuments}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

FinalizeTab.propTypes = {
  documents: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    documentTypeId: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    states: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired
    })).isRequired
  })),
  onStateClick: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onRequestReupload: PropTypes.func.isRequired,
  processingDocuments: PropTypes.object,
  onDocumentsUpdate: PropTypes.func
};

export default FinalizeTab; 