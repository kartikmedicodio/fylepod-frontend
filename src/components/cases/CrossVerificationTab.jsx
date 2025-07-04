import React, { useState, useEffect } from 'react';
import { Loader2, ChevronDown, ChevronUp, Eye, Mail, ChevronRight } from 'lucide-react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

// Update the date formatting function
const formatDate = (dateStr) => {
  try {
    let date;
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      date = new Date(`${month} ${day} ${year}`);
    } else {
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) {
      return dateStr;
    }

    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${month} ${day} ${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateStr;
  }
};

// Add LoadingOverlay component at the top level
const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-4 shadow-lg flex items-center gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      <span className="text-sm font-medium">Generating email draft...</span>
    </div>
  </div>
);

const CrossVerificationTab = ({ 
  isLoading, 
  verificationData, 
  managementId,
  isAutoExpanded = false
}) => {
  const [caseData, setCaseData] = useState(null);
  const [loadingCaseData, setLoadingCaseData] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Add useEffect to handle auto-expansion
  useEffect(() => {
    if (isAutoExpanded) {
      console.log('Auto-expanding cross verification tab');
      setIsExpanded(true);
    }
  }, [isAutoExpanded]);

  if (isLoading || loadingCaseData) {
    return (
      <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="mt-6 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-28 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="flex flex-wrap gap-3">
                  <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!verificationData) {
    return null;
  }

  // Normalize the data structure to handle different formats
  let normalizedVerificationData = verificationData;
  
  // If verificationData has a verificationResults property, use it
  if (!verificationData.verificationResults) {
    // Check if verificationData itself might be the verificationResults
    if (verificationData.summarizationErrors || verificationData.mismatchErrors || verificationData.missingErrors) {
      normalizedVerificationData = {
        verificationResults: verificationData
      };
    } else {
      // No recognizable structure, display a message
      return (
        <div className="p-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">No Verification Results Available</h3>
                <p className="mt-2 text-sm text-gray-500">Verification results will appear here after your documents have been processed.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Combine all errors into one array with type indicators
  const allErrors = [
    ...((normalizedVerificationData.verificationResults?.summarizationErrors) || []).map(error => ({
      ...error,
      errorType: 'Summary Issue'
    })),
    ...((normalizedVerificationData.verificationResults?.mismatchErrors) || []).map(error => ({
      ...error,
      errorType: 'Data Mismatch'
    })),
    ...((normalizedVerificationData.verificationResults?.missingErrors) || []).map(error => ({
      ...error,
      errorType: 'Missing Information'
    }))
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Accordion Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Cross Verification Results</h3>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium
            ${allErrors.length === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
          >
            {allErrors.length === 0 ? 'All Clear' : `${allErrors.length} ${allErrors.length === 1 ? 'Issue' : 'Issues'} Found`}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          <div className="p-4 space-y-4">
            {allErrors.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">All Documents Verified</h3>
                <p className="mt-2 text-sm text-gray-500">No issues found in the uploaded documents.</p>
              </div>
            ) : (
              allErrors.map((error, index) => (
                <div key={index} className="bg-gray-50 rounded-lg overflow-hidden">
                  <div className="p-4">
                    {/* Error Type Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                        ${error.errorType === 'Summary Issue' ? 'bg-purple-100 text-purple-700' : 
                          error.errorType === 'Data Mismatch' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'}`}
                      >
                        {error.errorType}
                      </span>

                      {/* Add View Document link if URL exists */}
                      {normalizedVerificationData?.documentUrls && normalizedVerificationData.documentUrls[error.documentType] && (
                        <a 
                          href={normalizedVerificationData.documentUrls[error.documentType]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Document
                        </a>
                      )}
                    </div>

                    {/* Error Title */}
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{error.type}</h4>

                    {/* Error Details */}
                    {error.details && (
                      <div className="text-sm text-gray-700 bg-white p-3 rounded-lg">
                        {(() => {
                          if (typeof error.details === 'string') {
                            return error.details;
                          }
                          
                          if (error.details.missingFields) {
                            return Array.isArray(error.details.missingFields) 
                              ? error.details.missingFields.join(', ')
                              : 'Missing fields detected';
                          }
                          
                          if (error.details.description) {
                            return error.details.description;
                          }
                          
                          if (typeof error.details === 'object' && !Array.isArray(error.details)) {
                            return (
                              <div className="flex flex-wrap items-center gap-3">
                                {Object.entries(error.details).map(([document, value], idx) => (
                                  <div key={idx} className="inline-flex items-center bg-white px-3 py-2 rounded-lg border border-gray-100">
                                    <span className="text-sm font-medium text-gray-500 mr-2">{document}:</span>
                                    <span className="text-sm text-gray-900">
                                      {error.type.toLowerCase().includes('date of birth') 
                                        ? formatDate(String(value))
                                        : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          
                          return 'Error details not available';
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

CrossVerificationTab.propTypes = {
  isLoading: PropTypes.bool,
  verificationData: PropTypes.object,
  managementId: PropTypes.string,
  isAutoExpanded: PropTypes.bool
};

export default CrossVerificationTab; 