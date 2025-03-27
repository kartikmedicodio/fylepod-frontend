import React, { useState, useEffect } from 'react';
import { Loader2, ChevronDown, ChevronUp, Mail, ChevronRight } from 'lucide-react';
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
  recipientEmail = '',
  onNextClick
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [emailData, setEmailData] = useState({ 
    subject: '', 
    body: '',
    cc: '' 
  });
  const [caseData, setCaseData] = useState(null);
  const [loadingCaseData, setLoadingCaseData] = useState(false);
  const [draftingEmailIds, setDraftingEmailIds] = useState(new Set()); // Track loading state per draft
  const [expandedSections, setExpandedSections] = useState(['summary']);
  const [ccEmail, setCcEmail] = useState(''); // Add state for CC email
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false); // Add new state for loading overlay
  const [isExpanded, setIsExpanded] = useState(false);

  // Add console logs to debug recipient data
  useEffect(() => {
    console.log('Case Data:', caseData);
    console.log('Recipient Email:', recipientEmail);
    console.log('User Email from Case:', caseData?.userId?.email);
    console.log('Contact Email from Case:', caseData?.userId?.contact?.email);
  }, [caseData, recipientEmail]);

  // Fetch case data when component mounts
  useEffect(() => {
    const fetchCaseData = async () => {
      if (!managementId) return;

      setLoadingCaseData(true);
      try {
        const response = await api.get(`/management/${managementId}`);
        if (response.data.status === 'success') {
          setCaseData(response.data.data.entry);
        } else {
          toast.error('Failed to fetch case details');
        }
      } catch (error) {
        console.error('Error fetching case data:', error);
        toast.error('Failed to fetch case details');
      } finally {
        setLoadingCaseData(false);
      }
    };

    fetchCaseData();
  }, [managementId]);

  const handleDraftMail = async (errorType, errorDetails, errorId) => {
    try {
      setIsGeneratingDraft(true); // Show loading overlay
      setDraftingEmailIds(prev => new Set([...prev, errorId]));
      
      // Get recipient name from caseData
      const recipientName = caseData?.userId?.name;
      
      // Get logged in user data from localStorage
      const userData = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const senderName = userData.name;
      
      const response = await api.post('/mail/draft', {
        errorType,
        errorDetails,
        recipientEmail,
        recipientName,
        senderName // Add sender's name for email signature
      });

      if (response.data.status === 'success') {
        setEmailData(prev => ({
          ...response.data.data,
          cc: prev.cc
        }));
        setModalOpen(true);
      } else {
        toast.error('Failed to generate email draft');
      }
    } catch (error) {
      console.error('Error generating mail draft:', error);
      toast.error('Failed to generate email draft');
    } finally {
      setDraftingEmailIds(prev => {
        const next = new Set(prev);
        next.delete(errorId);
        return next;
      });
      setIsGeneratingDraft(false); // Hide loading overlay
    }
  };

  const handleSendEmail = async (updatedEmailData) => {
    try {
      const emailToUse = caseData?.userId?.email;
      const nameToUse = caseData?.userId?.name;
      
      if (!emailToUse) {
        toast.error('Recipient email address is missing');
        return;
      }

      const loadingToast = toast.loading('Sending email...');

      const response = await api.post('/mail/send', {
        subject: updatedEmailData.subject,
        body: updatedEmailData.body,
        recipientEmail: emailToUse,
        recipientName: nameToUse,
        ccEmail: updatedEmailData.cc
      });

      toast.dismiss(loadingToast);

      if (response.data.status === 'success') {
        toast.success('Email sent successfully');
        setModalOpen(false);
        setEmailData({ subject: '', body: '', cc: '' });
      } else {
        toast.error(response.data.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    }
  };

  const handleDraftMailClick = async (error) => {
    try {
      if (!error) {
        toast.error('No validation error found to draft email about');
        return;
      }

      const errorType = error.type;
      const errorDetails = typeof error.details === 'string' 
        ? error.details 
        : Object.entries(error.details)
            .map(([doc, value]) => `${doc}: ${value}`)
            .join('\n');

      // Generate a unique ID for this error
      const errorId = `${error.type}-${Date.now()}`;
      await handleDraftMail(errorType, errorDetails, errorId);
    } catch (error) {
      console.error('Error handling draft mail click:', error);
      toast.error('Failed to generate email draft');
    }
  };

  // Update the handleSummaryDraftMailClick function
  const handleSummaryDraftMailClick = async () => {
    try {
      setIsGeneratingDraft(true); // Show loading overlay
      const summaryErrors = verificationData?.verificationResults.summarizationErrors || [];
      const mismatchErrors = verificationData?.verificationResults.mismatchErrors || [];
      const missingErrors = verificationData?.verificationResults.missingErrors || [];

      if (summaryErrors.length === 0 && mismatchErrors.length === 0 && missingErrors.length === 0) {
        toast.error('No verification information available');
        return;
      }

      // Fetch validation data
      const validationResponse = await api.get(`/documents/management/${managementId}/validations`);
      const validationResults = validationResponse.data.data.mergedValidations.flatMap(doc => 
        doc.validations.map(validation => ({
          ...validation,
          documentType: doc.documentType
        }))
      );

      // Combine all information
      let errorDetails = {
        validationResults,
        mismatchErrors,
        missingErrors
      };

      // Send complete verification report
      await handleDraftMail(
        'Complete Verification Report', 
        errorDetails,
        'complete-verification-report'
      );
    } catch (error) {
      console.error('Error handling summary draft mail:', error);
      toast.error('Failed to generate verification report email');
    } finally {
      setIsGeneratingDraft(false); // Hide loading overlay
    }
  };

  // Update the DraftSummaryButton component to include both buttons
  const DraftSummaryButton = ({ onNextClick }) => {
    const summaryDraftId = 'summary-draft';
    const isLoading = draftingEmailIds.has(summaryDraftId);

    const handleClick = async () => {
      try {
        setDraftingEmailIds(prev => new Set([...prev, summaryDraftId]));
        await handleSummaryDraftMailClick();
      } finally {
        setDraftingEmailIds(prev => {
          const next = new Set(prev);
          next.delete(summaryDraftId);
          return next;
        });
      }
    };

    return (
      <div className="flex items-center gap-3">
        <button
          className={`inline-flex items-center px-5 py-2.5 text-sm font-medium 
            ${isLoading 
              ? 'bg-gray-100 text-gray-500 cursor-wait' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
            } 
            rounded-lg transition-colors shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          onClick={handleClick}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Preparing Summary...
            </>
          ) : (
            <>
              <Mail className="w-5 h-5 mr-2" />
              Send Summarized Verification Mail
            </>
          )}
        </button>

        <button
          onClick={onNextClick}
          className="inline-flex items-center px-5 py-2.5 text-sm font-medium 
            bg-blue-600 text-white hover:bg-blue-700
            rounded-lg transition-colors shadow-md hover:shadow-lg"
        >
          Next : Finalize
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  // Modify ActionButtons to use error-specific loading state
  const ActionButtons = ({ error }) => {
    // Generate consistent ID for this error
    const errorId = `${error.type}-${JSON.stringify(error.details)}`;
    const isLoading = draftingEmailIds.has(errorId);

    return (
      <div className="flex items-center gap-2 mt-4">
        <button
          className={`inline-flex items-center px-3 py-2 text-sm font-medium 
            ${isLoading 
              ? 'bg-gray-100 text-gray-500 cursor-wait' 
              : 'text-gray-700 bg-white hover:bg-gray-50'
            } 
            border border-gray-300 rounded-md transition-colors`}
          onClick={() => handleDraftMailClick(error)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Drafting...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Draft mail
            </>
          )}
        </button>
      </div>
    );
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

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

  // Combine all errors into one array with type indicators
  const allErrors = [
    ...(verificationData.verificationResults.summarizationErrors || []).map(error => ({
      ...error,
      errorType: 'Summary Issue'
    })),
    ...(verificationData.verificationResults.mismatchErrors || []).map(error => ({
      ...error,
      errorType: 'Data Mismatch'
    })),
    ...(verificationData.verificationResults.missingErrors || []).map(error => ({
      ...error,
      errorType: 'Missing Information'
    }))
  ];

  return (
    <div className="p-4">
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
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                          ${error.errorType === 'Summary Issue' ? 'bg-purple-100 text-purple-700' : 
                            error.errorType === 'Data Mismatch' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'}`}
                        >
                          {error.errorType}
                        </span>
                      </div>

                      {/* Error Title */}
                      <h4 className="text-sm font-medium text-gray-900 mb-2">{error.type}</h4>

                      {/* Error Details */}
                      {error.details && typeof error.details === 'object' ? (
                        <div className="flex flex-wrap items-center gap-3">
                          {Object.entries(error.details).map(([document, value], idx) => (
                            <div key={idx} className="inline-flex items-center bg-white px-3 py-2 rounded-lg">
                              <span className="text-sm font-medium text-gray-500 mr-2">{document}:</span>
                              <span className="text-sm text-gray-900">
                                {error.type.toLowerCase().includes('date of birth') 
                                  ? formatDate(value)
                                  : value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 bg-white p-3 rounded-lg">
                          {error.details}
                        </p>
                      )}
                      <ActionButtons error={error} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {isGeneratingDraft && <LoadingOverlay />}
    </div>
  );
};

CrossVerificationTab.propTypes = {
  isLoading: PropTypes.bool,
  verificationData: PropTypes.object,
  managementId: PropTypes.string,
  recipientEmail: PropTypes.string,
  onNextClick: PropTypes.func
};

export default CrossVerificationTab; 