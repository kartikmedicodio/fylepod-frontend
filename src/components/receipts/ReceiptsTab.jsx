import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Eye, Edit, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Mock data for testing
const MOCK_RECEIPTS = [
  {
    id: 1,
    type: 'Approval Notice',
    analysis: "Fiona's analysis",
    noticeDate: '23/10/2025',
    receiptNumber: '2735254',
    formType: '2735254',
    caseType: 'H1B',
    filingDate: 'DD/MM/YYYY',
    priorityDate: 'DD/MM/YYYY',
    applicantName: 'John Doe',
    approvalDetails: '',
    validityDates: '',
    additionalInfo: 'Next Steps: Instructions for next steps, such as the issuance of a visa or a green card. Contact Information: USCIS contact details for further questions.'
  },
  {
    id: 2,
    type: 'Transfer Notice',
    analysis: "Fiona's analysis",
    noticeDate: '23/10/2025',
    receiptNumber: '2735254',
    formType: '2735254',
    caseType: 'H1B',
    filingDate: 'DD/MM/YYYY',
    priorityDate: 'DD/MM/YYYY',
    applicantName: 'John Doe',
    oldServiceCenter: '',
    newServiceCenter: '',
    additionalInfo: 'Reason for Transfer: Explanation for why the case was transferred (e.g., workload balancing). No Action Required Statement: Confirmation that no action is needed from the applicant. Next Steps: Information about what to expect after the transfer.',
    noticeChanged: true
  },
  {
    id: 3,
    type: 'Receipt Notice',
    analysis: "Fiona's analysis",
    noticeDate: '23/10/2025',
    receiptNumber: 'SRC202512345',
    formType: 'I-130',
    caseType: 'H1B',
    filingDate: 'DD/MM/YYYY',
    priorityDate: 'DD/MM/YYYY',
    applicantName: 'John Doe',
    processingCenter: '',
    paymentAmount: '',
    paymentMethod: '',
    additionalInfo: 'Next Steps: Instructions for further actions (e.g., waiting for biometrics or interview notice). Case Status Tracking: Instructions to track the case online. USCIS Contact Information: Phone number for inquiries.'
  }
];

const ReceiptsTab = ({ managementId }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [receipts, setReceipts] = useState(MOCK_RECEIPTS); // Using mock data
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (selectedFiles) => {
    const validFiles = selectedFiles.filter(file => {
      const isValid = validateFileType(file);
      if (!isValid) {
        toast.error(`Invalid file type: ${file.name}`);
      }
      return isValid;
    });
    setFiles(validFiles);
    if (validFiles.length > 0) {
      simulateUpload(validFiles);
    }
  };

  const validateFileType = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    return allowedTypes.includes(file.type);
  };

  // Simulate upload process
  const simulateUpload = (filesToUpload) => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress updates
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          // Add new mock receipt after upload
          const newReceipt = {
            id: Date.now(),
            type: 'New Notice',
            analysis: "Pending analysis",
            noticeDate: new Date().toLocaleDateString(),
            receiptNumber: `RN${Math.floor(Math.random() * 1000000)}`,
            formType: 'I-129',
            caseType: 'H1B',
            filingDate: 'DD/MM/YYYY',
            priorityDate: 'DD/MM/YYYY',
            applicantName: 'John Doe',
            additionalInfo: 'Newly uploaded notice pending processing.'
          };
          setReceipts(prev => [newReceipt, ...prev]);
          toast.success('Government Notice uploaded successfully');
          setFiles([]);
          return 0;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleViewDocument = (receiptId) => {
    toast.success('Viewing document: ' + receiptId);
  };

  const handleEditDocument = (receiptId) => {
    toast.success('Editing document: ' + receiptId);
  };

  const ReceiptCard = ({ receipt }) => (
    <div className="py-6 first:pt-0 last:pb-0 relative">
      {/* Left vertical line and dot */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center z-10">
          <Check className="w-4 h-4 text-white" />
        </div>
        <div className="w-0.5 bg-gray-200 flex-grow"></div>
      </div>

      {/* Content with left padding for the line */}
      <div className="pl-12">
        {/* Header with title and buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">{receipt.type}</h3>
            <span className="text-sm text-gray-500">Notice date {receipt.noticeDate}</span>
            {receipt.analysis && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                {receipt.analysis}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewDocument(receipt.id)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm border border-blue-200 rounded-md px-3 py-1"
            >
              <Eye className="w-4 h-4" />
              View document
            </button>
            <button
              onClick={() => handleEditDocument(receipt.id)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm border border-blue-200 rounded-md px-3 py-1"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>

        {/* First row of fields */}
        <div className="grid grid-cols-3 gap-6 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Receipt Number</p>
            <p className="text-sm font-medium">{receipt.receiptNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Form Type</p>
            <p className="text-sm font-medium">{receipt.formType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Case type</p>
            <p className="text-sm font-medium">{receipt.caseType}</p>
          </div>
        </div>

        {/* Applicant name */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">Applicant/Beneficiary Name</p>
          <p className="text-sm font-medium">{receipt.applicantName}</p>
        </div>

        {/* Dates row */}
        <div className="grid grid-cols-3 gap-6 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Notice Date</p>
            <p className="text-sm font-medium">{receipt.noticeDate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Filing Date</p>
            <p className="text-sm font-medium">{receipt.filingDate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Priority Date</p>
            <p className="text-sm font-medium">{receipt.priorityDate}</p>
          </div>
        </div>

        {/* Conditional fields based on notice type */}
        {receipt.type === 'Approval Notice' && (
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Approval Details</p>
              <p className="text-sm font-medium">{receipt.approvalDetails || ''}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Validity Dates</p>
              <p className="text-sm font-medium">{receipt.validityDates || ''}</p>
            </div>
          </div>
        )}

        {receipt.type === 'Transfer Notice' && (
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Old Service Center</p>
              <p className="text-sm font-medium">{receipt.oldServiceCenter || ''}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">New Service Center</p>
              <p className="text-sm font-medium">{receipt.newServiceCenter || ''}</p>
            </div>
          </div>
        )}

        {receipt.type === 'Receipt Notice' && (
          <div className="grid grid-cols-3 gap-6 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Processing Center</p>
              <p className="text-sm font-medium">{receipt.processingCenter || ''}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Payment amount</p>
              <p className="text-sm font-medium">{receipt.paymentAmount || ''}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Payment method</p>
              <p className="text-sm font-medium">{receipt.paymentMethod || ''}</p>
            </div>
          </div>
        )}

        {/* Additional info */}
        {receipt.additionalInfo && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Additional Info</p>
            <p className="text-sm text-gray-600">{receipt.additionalInfo}</p>
          </div>
        )}

        {/* Notice changed alert */}
        {receipt.noticeChanged && (
          <div className="mt-4 py-2 px-3 bg-amber-50 text-amber-800 text-sm rounded-md border border-amber-200">
            Government Notice number has been changed
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Government Notices</h2>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">
          Upload Government Notices
        </h3>

        {/* Drag & Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center">
            <Upload className="w-10 h-10 text-gray-400 mb-3" />
            <p className="text-gray-600 mb-1">
              Drag & drop or <span className="text-blue-600">Choose file</span> to upload Government Notices
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: PDF, JPG, PNG
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            onChange={handleFileSelect}
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Uploading...</span>
              <span className="text-sm text-gray-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Receipts List - Single Container */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {receipts.length > 0 ? (
          receipts.map((receipt, index) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No government notices found
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptsTab; 