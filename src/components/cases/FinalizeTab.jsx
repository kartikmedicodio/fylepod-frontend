import React from 'react';
import { Check, AlertTriangle, X, FileText, Bot, ChevronRight, Loader2 } from 'lucide-react';

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

  return (
    <div 
      className="relative flex-1 cursor-pointer group"
      onClick={onClick}
    >
      {/* Invisible click area */}
      <div className="absolute inset-0 -top-9 -bottom-2" />
      
      {/* State Label - Simple high-contrast text */}
      <div className="absolute -top-7 left-0 w-full text-[13px] font-semibold whitespace-nowrap transition-colors text-center 
        text-slate-600 bg-white/90 py-0.5 px-1 rounded shadow-sm">
        {state}
      </div>
      
      {/* Progress Bar */}
      <div className={`h-1.5 rounded-full border ${getStateStyles()} group-hover:brightness-95 transition-all`}>
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

const DocumentRow = ({ document, onStateClick, onApprove, onRequestReupload, processingDocuments }) => {
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

  return (
    <div className="group bg-white rounded-xl border border-slate-100 p-6 hover:shadow-md hover:border-slate-200 transition-all duration-200">
      <div className="flex items-center justify-between mb-6">
        {/* Document Info */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 flex items-center justify-center group-hover:border-slate-300 transition-colors">
            <FileText className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <span className="text-base font-medium text-slate-900">
              {document.name}
            </span>
          
          </div>
        </div>

        <div className="flex items-center gap-2">
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
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors
                  ${processingDocuments[document.id] 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                  }`}
              >
                {processingDocuments[document.id] ? (
                  <span className="flex items-center">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Processing
                  </span>
                ) : (
                  'Approve'
                )}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestReupload(document.documentTypeId, document.id);
                }}
                disabled={processingDocuments[document.id]}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors
                  ${processingDocuments[document.id] 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white border border-red-200 text-red-500 hover:bg-red-50 shadow-sm'
                  }`}
              >
                {processingDocuments[document.id] ? (
                  <span className="flex items-center">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Processing
                  </span>
                ) : (
                  'Request Reupload'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress States */}
      <div className="flex items-center gap-3 px-1 py-3">
        {document.states.map((state, index) => (
          <React.Fragment key={state.name}>
            <ProcessState 
              state={state.name}
              status={state.status}
              onClick={() => onStateClick(state.name.toLowerCase().replace(' ', '-'), document)}
            />
            {index < document.states.length - 1 && (
              <div className="w-2 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const FinalizeTab = ({ 
  documents = [], 
  validationData, 
  onStateClick,
  onApprove,
  onRequestReupload,
  processingDocuments = {}
}) => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium text-slate-900">Document Review & Finalization</h2>
          <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100/50 ring-1 ring-blue-100/20 flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Diana's analysis
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>{documents.length} document{documents.length !== 1 ? 's' : ''} to review</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Diana's card for intelligent document processing */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-start gap-4 relative z-10">
          {/* Diana's Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              {/* Animated Background Ring */}
              <div className="absolute inset-0 -m-2">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-lg"></div>
              </div>
              {/* Avatar Container */}
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

      {/* Documents List */}
      <div className="space-y-3">
        {documents.map(doc => (
          <DocumentRow 
            key={doc.id} 
            document={doc} 
            onStateClick={onStateClick}
            onApprove={onApprove}
            onRequestReupload={onRequestReupload}
            processingDocuments={processingDocuments}
          />
        ))}
      </div>
    </div>
  );
};

export default FinalizeTab; 