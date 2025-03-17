import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ValidationCard = ({ documentValidation, isExpanded, onToggle }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Document Header - Now acts as accordion trigger */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            documentValidation.passed 
              ? 'bg-green-50 text-green-600' 
              : 'bg-red-50 text-red-600'
          }`}>
            {documentValidation.passed ? (
              <Check className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {documentValidation.documentType}
            </h3>
            <p className={`text-sm ${
              documentValidation.passed 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {documentValidation.passed ? 'Passed' : 'Failed'} • {documentValidation.validations.length} Validation{documentValidation.validations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Validation Rules - Expandable content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="divide-y divide-gray-100">
            {documentValidation.validations.map((validation, vIndex) => (
              <div 
                key={vIndex}
                className="flex items-start gap-4 py-4"
              >
                <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  validation.passed 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {validation.passed ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {validation.rule}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {validation.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ValidationTab = ({ validationData, isLoading, onTabChange }) => {
  const [expandedDocs, setExpandedDocs] = useState([]);
  const navigate = useNavigate();

  // Set first document as expanded when data is loaded
  useEffect(() => {
    if (validationData?.mergedValidations?.length) {
      setExpandedDocs([0]); // Expand first document by default
    }
  }, [validationData]);

  const toggleExpand = (index) => {
    setExpandedDocs(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleNext = () => {
    // Instead of navigation, call the onTabChange prop
    onTabChange('cross-verification');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!validationData?.mergedValidations?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-gray-600">No validation data available</p>
      </div>
    );
  }

  return (
    <div>
      {/* Next Button */}
      <div className="">
        <div className="flex justify-end">
          <button
            onClick={handleNext}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-150 shadow-sm"
          >
            Next : Cross Verification
            <svg 
              className="ml-2 w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        <div className="space-y-4">
          {validationData.mergedValidations.map((documentValidation, index) => (
            <ValidationCard
              key={index}
              documentValidation={documentValidation}
              isExpanded={expandedDocs.includes(index)}
              onToggle={() => toggleExpand(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ValidationTab; 