import React, { useState, useEffect } from 'react';
import { Loader2, Mail, X, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// Create a separate EmailModal component
const EmailModal = ({ isOpen, onClose, initialEmailData, onSend, recipientInfo }) => {
  // Local state for email data
  const [emailData, setEmailData] = useState(initialEmailData);

  // Update local state when initialEmailData changes
  useEffect(() => {
    setEmailData(initialEmailData);
  }, [initialEmailData]);

  const handleEmailDataChange = (field, value) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSend = () => {
    onSend(emailData);
  };

  if (!isOpen) return null;

  const { email: emailToShow, name: recipientName } = recipientInfo;
  const displayValue = emailToShow && recipientName 
    ? `${recipientName} <${emailToShow}>`
    : emailToShow || 'Loading recipient details...';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Draft Mail</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md bg-gray-50" 
              value={displayValue}
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CC:</label>
            <input 
              type="email" 
              className="w-full p-2 border rounded-md" 
              value={emailData.cc}
              onChange={(e) => handleEmailDataChange('cc', e.target.value)}
              placeholder="Enter CC email address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md" 
              value={emailData.subject}
              onChange={(e) => handleEmailDataChange('subject', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
            <textarea 
              className="w-full p-2 border rounded-md h-64 resize-none"
              value={emailData.body}
              onChange={(e) => handleEmailDataChange('body', e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Close
          </button>
          <button
            onClick={handleSend}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Send Mail
          </button>
        </div>
      </div>
    </div>
  );
};

// Update the date formatting function to use spaces instead of slashes
const formatDate = (dateStr) => {
  try {
    // Handle different date formats
    let date;
    if (dateStr.includes('/')) {
      // Handle DD/MMM/YYYY format
      const [day, month, year] = dateStr.split('/');
      date = new Date(`${month} ${day} ${year}`);
    } else {
      date = new Date(dateStr);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateStr; // Return original string if parsing fails
    }

    // Format to MM DD YYYY (with spaces)
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${month} ${day} ${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateStr; // Return original string if any error occurs
  }
};

const VerificationCard = ({ title, children, isExpanded, onToggle }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Header - acts as accordion trigger */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Content - expandable section */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
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

      // Combine all information
      let errorDetails = '';

      // Add Summary section
      if (summaryErrors.length > 0) {
        errorDetails += '=== Summary ===\n';
        errorDetails += summaryErrors
          .map(error => `${error.type}:\n${error.details}`)
          .join('\n\n');
      }

      // Add Mismatch Errors section
      if (mismatchErrors.length > 0) {
        errorDetails += '\n\n=== Mismatch Errors ===\n';
        errorDetails += mismatchErrors
          .map(error => {
            const details = Object.entries(error.details)
              .map(([doc, value]) => `${doc}: ${value}`)
              .join('\n');
            return `${error.type}:\n${details}`;
          })
          .join('\n\n');
      }

      // Add Missing Errors section
      if (missingErrors.length > 0) {
        errorDetails += '\n\n=== Missing Information ===\n';
        errorDetails += missingErrors
          .map(error => `${error.type}:\n${error.details}`)
          .join('\n\n');
      }

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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!verificationData) {
    return null;
  }

  return (
    <div>
      {/* Draft Summary Button */}
      <div className="">
        <div className="flex justify-end">
          <DraftSummaryButton onNextClick={onNextClick} />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        <div className="space-y-4">
          {/* Summary Section */}
          <VerificationCard 
            title="Summary"
            isExpanded={expandedSections.includes('summary')}
            onToggle={() => toggleSection('summary')}
          >
            <div className="divide-y divide-gray-200">
              {verificationData?.verificationResults.summarizationErrors.map((error, index) => (
                <div key={index} className="p-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{error.type}</h4>
                    <p className="text-base text-gray-700 bg-gray-50 p-3 rounded-lg">{error.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </VerificationCard>

          {/* Mismatch Errors Section */}
          <VerificationCard 
            title="Mismatch Errors"
            isExpanded={expandedSections.includes('mismatch')}
            onToggle={() => toggleSection('mismatch')}
          >
            <div className="divide-y divide-gray-200">
              {verificationData?.verificationResults.mismatchErrors.map((error, index) => (
                <div key={index} className="p-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">{error.type}</h4>
                    <div className="flex flex-wrap items-center gap-3">
                      {Object.entries(error.details).map(([document, value], idx) => (
                        <div key={idx} className="inline-flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                          <span className="text-sm font-medium text-gray-500 mr-2">{document}:</span>
                          <span className="text-base text-gray-900">
                            {error.type.toLowerCase().includes('date of birth') 
                              ? formatDate(value)
                              : value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <ActionButtons error={error} />
                  </div>
                </div>
              ))}
            </div>
          </VerificationCard>

          {/* Missing Errors Section */}
          <VerificationCard 
            title="Missing Errors"
            isExpanded={expandedSections.includes('missing')}
            onToggle={() => toggleSection('missing')}
          >
            <div className="divide-y divide-gray-200">
              {verificationData?.verificationResults.missingErrors.map((error, index) => (
                <div key={index} className="p-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{error.type}</h4>
                    <p className="text-base text-gray-700 bg-gray-50 p-3 rounded-lg">{error.details}</p>
                    <ActionButtons error={error} />
                  </div>
                </div>
              ))}
            </div>
          </VerificationCard>
        </div>
      </div>

      <EmailModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialEmailData={emailData}
        onSend={handleSendEmail}
        recipientInfo={{
          email: caseData?.userId?.email,
          name: caseData?.userId?.name
        }}
      />

      {/* Add loading overlay */}
      {isGeneratingDraft && <LoadingOverlay />}
    </div>
  );
};

// Add defaultProps
CrossVerificationTab.defaultProps = {
  recipientEmail: '',
  isLoading: false,
  verificationData: null,
  managementId: null,
  onNextClick: () => {}
};

export default CrossVerificationTab; 