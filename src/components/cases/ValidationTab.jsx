import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ValidationCard = ({ documentValidation, isExpanded, onToggle }) => {
  // Log expanded state but use normal log level
  console.log(`ValidationCard (${documentValidation.documentType}): expanded=${isExpanded}`);
  
  // Create a more subtle border for expanded state
  const borderStyle = isExpanded 
    ? 'border-2 border-blue-300' 
    : 'border border-gray-200';
    
  // Create a more subtle background for expanded state  
  const bgStyle = isExpanded 
    ? 'bg-blue-50' 
    : 'hover:bg-gray-50';
    
  // Calculate passed and failed counts
  const passedCount = documentValidation.validations.filter(v => v.passed).length;
  const failedCount = documentValidation.validations.filter(v => !v.passed).length;
    
  return (
    <div className={`bg-white rounded-xl ${borderStyle} overflow-hidden transition-all duration-200 mb-2 ${isExpanded ? 'shadow-sm' : ''}`}>
      {/* Document Header - Remove the "EXPANDED" indicator */}
      <div 
        className={`flex items-center justify-between p-4 cursor-pointer ${bgStyle} transition-colors`}
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
            <h3 className={`font-medium ${isExpanded ? 'text-blue-600' : 'text-gray-900'}`}>
              {documentValidation.documentType}
            </h3>
            <p className="text-sm">
              <span className="text-green-600">{passedCount} Passed</span> • <span className="text-red-600">{failedCount} Failed</span>
            </p>
          </div>
        </div>
        <div className="flex items-center">
          {failedCount > 0 && (
            <span className="mr-3 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-full">
              {failedCount} Issues Found
            </span>
          )}
          {documentValidation.passed && (
            <span className="mr-3 px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-full">
              All Passed
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-blue-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Validation Rules - Expandable content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
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

const ValidationTab = ({ 
  validationData, 
  isLoading, 
  onTabChange, 
  caseData, 
  activeDocument,
  onActiveDocumentChange 
}) => {
  // Initialize expandedDocs with activeDocument if it's valid
  const initialExpandedDocs = typeof activeDocument === 'number' && 
                              activeDocument >= 0 && 
                              validationData?.mergedValidations && 
                              activeDocument < validationData.mergedValidations.length
                              ? [activeDocument]
                              : [];
                              
  const [expandedDocs, setExpandedDocs] = useState(initialExpandedDocs);
  const navigate = useNavigate();

  // Log when the component receives new props
  console.log('ValidationTab render with props:', { 
    activeDocument, 
    validationCount: validationData?.mergedValidations?.length,
    initialExpandedDocs
  });

  // Update the useEffect for activeDocument changes
  useEffect(() => {
    console.log('activeDocument changed to:', activeDocument);
    
    // Make sure activeDocument is valid and within range of available documents
    if (typeof activeDocument === 'number' && 
        activeDocument >= 0 && 
        validationData?.mergedValidations && 
        activeDocument < validationData.mergedValidations.length) {
      
      // Expand the document at the active index
      setExpandedDocs([activeDocument]);
    }
  }, [activeDocument, validationData?.mergedValidations]);

  // Log when expandedDocs changes but only at debug level
  useEffect(() => {
    if (expandedDocs.length > 0) {
      console.log('Document expanded:', expandedDocs[0]);
    } else {
      console.log('All documents collapsed');
    }
  }, [expandedDocs]);

  // Handle toggle of document expansion
  const toggleExpand = useCallback((index) => {
    console.log('Toggle request for document at index:', index);
    
    // Update the expandedDocs state
    setExpandedDocs(prev => {
      // If this document is already expanded, collapse it
      if (prev.includes(index)) {
        console.log('Collapsing document at index:', index);
        return [];
      } 
      // Otherwise expand only this document
      else {
        console.log('Expanding document at index:', index);
        return [index];
      }
    });
    
    // Also update the parent's activeDocument state
    if (typeof onActiveDocumentChange === 'function') {
      onActiveDocumentChange(index);
    }
  }, [onActiveDocumentChange]);

  // Add function to check if all documents are uploaded
  const areAllDocumentsUploaded = caseData?.documentTypes?.every(doc => 
    doc.status === 'uploaded' || doc.status === 'approved'
  ) || false;

  const handleNext = () => {
    if (areAllDocumentsUploaded) {
      onTabChange('cross-verification');
    }
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

  console.log('ValidationTab rendering documents with expanded state:', expandedDocs);
  
  return (
    <div>
      {/* Content Area */}
      <div className="p-4">
        <div className="space-y-4">
          {validationData.mergedValidations.map((documentValidation, index) => {
            const isExpanded = expandedDocs.includes(index);
            
            // Simplified logging
            if (isExpanded) {
              console.log(`Rendering ${documentValidation.documentType} (expanded)`);
            }
            
            return (
              <ValidationCard
                key={`validation-${index}-${isExpanded}`}
                documentValidation={documentValidation}
                isExpanded={isExpanded}
                onToggle={() => toggleExpand(index)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Update defaultProps
ValidationTab.defaultProps = {
  validationData: null,
  isLoading: false,
  onTabChange: () => {},
  caseData: null,
  activeDocument: null,
  onActiveDocumentChange: () => {}
};

export default ValidationTab; 