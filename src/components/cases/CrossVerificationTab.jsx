import React, { useState, useEffect } from 'react';
import { Loader2, Mail, X } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// New Email Modal Component
const EmailModal = ({ isOpen, onClose, emailData, onSend }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[600px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Draft Mail</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md" 
              value="John Michael Doe"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md" 
              value={emailData.subject}
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
            <textarea 
              className="w-full p-2 border rounded-md h-64 resize-none"
              value={emailData.body}
              readOnly
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Send
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

const CrossVerificationTab = ({ 
  isLoading, 
  verificationData, 
  managementId,
  recipientEmail = ''
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [emailData, setEmailData] = useState({ subject: '', body: '' });
  const [caseData, setCaseData] = useState(null);
  const [loadingCaseData, setLoadingCaseData] = useState(false);
  const [isDraftingEmail, setIsDraftingEmail] = useState(false);

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

  const handleDraftMail = async (errorType, errorDetails) => {
    try {
      setIsDraftingEmail(true);
      const response = await api.post('/mail/draft', {
        errorType,
        errorDetails,
        recipientEmail
      });

      if (response.data.status === 'success') {
        setEmailData(response.data.data);
        setModalOpen(true);
      } else {
        toast.error('Failed to generate email draft');
      }
    } catch (error) {
      console.error('Error generating mail draft:', error);
      toast.error('Failed to generate email draft');
    } finally {
      setIsDraftingEmail(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      const emailToUse = caseData?.userId?.email;
      const nameToUse = caseData?.userId?.name;
      
      console.log('Sending email to:', emailToUse);
      
      if (!emailToUse) {
        toast.error('Recipient email address is missing');
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading('Sending email...');

      // Send email through backend
      const response = await api.post('/mail/send', {
        subject: emailData.subject,
        body: emailData.body,
        recipientEmail: emailToUse,
        recipientName: nameToUse
      });

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response.data.status === 'success') {
        toast.success('Email sent successfully');
        setModalOpen(false);
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

      await handleDraftMail(errorType, errorDetails);
    } catch (error) {
      console.error('Error handling draft mail click:', error);
      toast.error('Failed to generate email draft');
    }
  };

  // Update the handleSummaryDraftMailClick function
  const handleSummaryDraftMailClick = async () => {
    try {
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
        errorDetails
      );
    } catch (error) {
      console.error('Error handling summary draft mail:', error);
      toast.error('Failed to generate verification report email');
    }
  };

  // Remove the button from SummaryHeader
  const SummaryHeader = () => {
    return (
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Summary</h3>
      </div>
    );
  };

  // Update the DraftSummaryButton component with new name
  const DraftSummaryButton = () => {
    return (
      <button
        className={`inline-flex items-center px-5 py-2.5 text-sm font-medium 
          ${isDraftingEmail 
            ? 'bg-gray-100 text-gray-500 cursor-wait' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
          } 
          rounded-lg transition-colors shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        onClick={handleSummaryDraftMailClick}
        disabled={isDraftingEmail}
      >
        {isDraftingEmail ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Preparing Summary...
          </>
        ) : (
          <>
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Send Summarized Verification Mail
          </>
        )}
      </button>
    );
  };

  // Modify ActionButtons to accept error data
  const ActionButtons = ({ error }) => {
    return (
      <div className="flex items-center gap-2 mt-4">
        <button
          className={`inline-flex items-center px-3 py-2 text-sm font-medium 
            ${isDraftingEmail 
              ? 'bg-gray-100 text-gray-500 cursor-wait' 
              : 'text-gray-700 bg-white hover:bg-gray-50'
            } 
            border border-gray-300 rounded-md transition-colors`}
          onClick={() => handleDraftMailClick(error)} // Pass the specific error
          disabled={isDraftingEmail}
        >
          {isDraftingEmail ? (
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

  // Update EmailModalWithRecipient to use the email state
  const EmailModalWithRecipient = ({ isOpen, onClose, emailData, onSend }) => {
    if (!isOpen) return null;

    // Get email and name from case data
    const emailToShow = caseData?.userId?.email || '';
    const recipientName = caseData?.userId?.name || '';

    console.log('Modal Email:', emailToShow);
    console.log('Modal Recipient Name:', recipientName);

    // Create display value with proper formatting
    const displayValue = emailToShow && recipientName 
      ? `${recipientName} <${emailToShow}>`
      : emailToShow || 'Loading recipient details...';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-[600px] max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Draft Mail</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={emailData.subject}
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
              <textarea 
                className="w-full p-2 border rounded-md h-64 resize-none"
                value={emailData.body}
                readOnly
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add a loading overlay component
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-4 shadow-lg flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Generating email draft...</span>
      </div>
    </div>
  );

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
    <div className="p-6">
      {isDraftingEmail && <LoadingOverlay />}
      
      {/* Draft Summary Button at the top */}
      <div className="flex justify-end mb-4">
        <DraftSummaryButton />
      </div>

      <div className="space-y-6">
        {/* Summary Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <SummaryHeader />
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
        </div>

        {/* Mismatch Errors Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Mismatch errors</h3>
          </div>
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
        </div>

        {/* Missing Errors Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Missing errors</h3>
          </div>
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
        </div>
      </div>

      <EmailModalWithRecipient 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        emailData={emailData}
        onSend={handleSendEmail}
      />
    </div>
  );
};

// Add defaultProps
CrossVerificationTab.defaultProps = {
  recipientEmail: '',
  isLoading: false,
  verificationData: null,
  managementId: null
};

export default CrossVerificationTab; 