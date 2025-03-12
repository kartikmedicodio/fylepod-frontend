import React, { useState, useEffect } from 'react';
import { Loader2, FileText, User, CreditCard, Receipt, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const DocumentCard = ({ title, data, isExpanded, onToggle }) => {
  // Get icon based on document type
  const getIcon = () => {
    switch (title) {
      case 'Resume':
        return FileText;
      case 'Passport':
        return User;
      case 'National ID Card':
        return CreditCard;
      case 'Paystub':
        return Receipt;
      default:
        return FileText;
    }
  };

  const Icon = getIcon();

  // Format the date string
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateStr; // Return original string if parsing fails
    }
  };

  // Format field name from camelCase to Title Case
  const formatFieldName = (field) => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Render array data (like workHistory and educationHistory)
  const renderArrayData = (array, title) => {
    if (!array || array.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
        <div className="space-y-3">
          {array.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              {Object.entries(item).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="text-gray-600">{formatFieldName(key)}: </span>
                  <span className="text-gray-900">{value || 'N/A'}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">
              {Object.keys(data).length} extracted fields
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-4 grid grid-cols-2 gap-4">
            {Object.entries(data).map(([key, value]) => {
              // Skip arrays as they'll be rendered separately
              if (Array.isArray(value)) return null;
              if (typeof value === 'object' && value !== null) {
                // Handle nested objects (like companyDetails in Paystub)
                return (
                  <div key={key} className="col-span-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{formatFieldName(key)}</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      {Object.entries(value).map(([nestedKey, nestedValue]) => (
                        <div key={nestedKey} className="text-sm">
                          <span className="text-gray-600">{formatFieldName(nestedKey)}: </span>
                          <span className="text-gray-900">{nestedValue || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div key={key} className="text-sm">
                  <span className="text-gray-600">{formatFieldName(key)}: </span>
                  <span className="text-gray-900">
                    {key.toLowerCase().includes('date') ? formatDate(value) : value || 'N/A'}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Render arrays after the grid */}
          {data.workHistory && renderArrayData(data.workHistory, 'Work History')}
          {data.educationHistory && renderArrayData(data.educationHistory, 'Education History')}
        </div>
      )}
    </div>
  );
};

const ExtractedDataTab = ({ extractedData, isLoading, error }) => {
  const [expandedDocs, setExpandedDocs] = useState([]);

  // Set first document as expanded when data is loaded
  useEffect(() => {
    if (extractedData) {
      const firstDoc = Object.keys(extractedData)[0];
      setExpandedDocs([firstDoc]);
    }
  }, [extractedData]);

  const toggleExpand = (docType) => {
    setExpandedDocs(prev => 
      prev.includes(docType) 
        ? prev.filter(type => type !== docType)
        : [...prev, docType]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 mb-2">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Diana's AI Assistant Card */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-1">
              Intelligent Data Extraction
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Diana has analyzed your documents and extracted key information. The data has been structured and organized for easy verification. Please review the extracted information below.
            </p>
          </div>
        </div>
      </div>

      {/* Document Cards */}
      <div className="space-y-4">
        {extractedData && Object.entries(extractedData).map(([docType, docData]) => (
          <DocumentCard
            key={docType}
            title={docType}
            data={docData.data}
            isExpanded={expandedDocs.includes(docType)}
            onToggle={() => toggleExpand(docType)}
          />
        ))}
      </div>
    </div>
  );
};

export default ExtractedDataTab; 