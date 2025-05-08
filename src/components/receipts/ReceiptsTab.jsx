import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, Eye, Edit, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import api from "../../utils/api"

const ReceiptsTab = ({ managementId }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchReceipts();
  }, [managementId]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/receipts/by-management/${managementId}`);
      if (response.data.status === 'success') {
        setReceipts(response.data.data.receipts);
      }
    } catch (error) {
      toast.error('Failed to fetch receipts');
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

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
      uploadFiles(validFiles);
    }
  };

  const validateFileType = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    return allowedTypes.includes(file.type);
  };

  const uploadFiles = async (filesToUpload) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (const file of filesToUpload) {
        console.log(file);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('managementId', managementId);

        await api.post('/receipts', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          },
        });
      }
      
      toast.success('Government Notice uploaded successfully');
      setFiles([]);
      fetchReceipts(); // Refresh the receipts list
    } catch (error) {
      toast.error('Failed to upload file');
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleViewDocument = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  const handleEditDocument = (receiptId) => {
    toast.success('Editing document: ' + receiptId);
  };

  const getGridColsClass = (columns) => {
    switch (columns) {
      case 2: return "grid-cols-2";
      case 3: return "grid-cols-3";
      case 4: return "grid-cols-4";
      default: return "grid-cols-1";
    }
  };

  const ReceiptCard = ({ receipt }) => {
    const extractedData = receipt.extractedData || {};
    const additionalInfo = receipt.additionalInformation?.additionalInfo?.otherDetails || '';

    // Function to render a field
    const renderField = (fieldKey, fieldData) => {
      if (!fieldData) return null;
      
      return (
        <div>
          <p className="text-sm text-gray-500 mb-1">{fieldData.displayName}</p>
          <p className="text-sm font-medium">{fieldData.value || 'N/A'}</p>
        </div>
      );
    };

    // Group fields into sections based on their type
    const renderFieldSection = (fields, columns = 3) => {
      const fieldEntries = Object.entries(fields).filter(([_, data]) => data && data.displayName);
      
      if (fieldEntries.length === 0) return null;

      return (
        <div className={`grid ${getGridColsClass(columns)} gap-6 mb-4`}>
          {fieldEntries.map(([key, data]) => (
            <div key={key}>
              {renderField(key, data)}
            </div>
          ))}
        </div>
      );
    };

    // Group fields by their type
    const groupFieldsByType = () => {
      const groups = {
        required: {},
        dates: {},
        typeSpecific: {},
        additional: {}
      };

      Object.entries(extractedData).forEach(([key, data]) => {
        if (!data || !data.displayName) return;

        // Check if it's a date field
        if (data.type === 'date') {
          groups.dates[key] = data;
        }
        // Check if it's a required field
        else if (data.required) {
          groups.required[key] = data;
        }
        // Check if it's type-specific (based on field name pattern)
        else if (key.toLowerCase().includes(receipt.type.toLowerCase())) {
          groups.typeSpecific[key] = data;
        }
        // All other fields go to additional
        else {
          groups.additional[key] = data;
        }
      });

      return groups;
    };

    const fieldGroups = groupFieldsByType();

    // Calculate optimal columns for type-specific fields
    const getTypeSpecificColumns = () => {
      const typeSpecificCount = Object.keys(fieldGroups.typeSpecific).length;
      if (typeSpecificCount <= 2) return 2;
      if (typeSpecificCount <= 3) return 3;
      return 4;
    };

    return (
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
              <h3 className="text-lg font-medium">
                {receipt.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </h3>
              {extractedData.noticeDate?.value && (
                <span className="text-sm text-gray-500">
                  Notice date {extractedData.noticeDate.value}
                </span>
              )}
              {receipt.status && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                  {receipt.status}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {receipt.fileUrl && (
                <button
                  onClick={() => handleViewDocument(receipt.fileUrl)}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm border border-blue-200 rounded-md px-3 py-1"
                >
                  <Eye className="w-4 h-4" />
                  View document
                </button>
              )}
              
            </div>
          </div>

          {/* Required Fields Section */}
          {Object.keys(fieldGroups.required).length > 0 && (
            <>
              {/* <h4 className="text-sm font-medium text-gray-700 mb-2">Required Information</h4> */}
              {renderFieldSection(fieldGroups.required)}
            </>
          )}

          {/* Dates Section */}
          {Object.keys(fieldGroups.dates).length > 0 && (
            <>
              {/* <h4 className="text-sm font-medium text-gray-700 mb-2">Dates</h4> */}
              {renderFieldSection(fieldGroups.dates)}
            </>
          )}

          {/* Type-specific Fields */}
          {Object.keys(fieldGroups.typeSpecific).length > 0 && (
            <>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Details</h4>
              {renderFieldSection(fieldGroups.typeSpecific, getTypeSpecificColumns())}
            </>
          )}

          {/* Additional Fields */}
          {Object.keys(fieldGroups.additional).length > 0 && (
            <>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Other Information</h4>
              {renderFieldSection(fieldGroups.additional)}
            </>
          )}

          {/* Additional info from API */}
          {additionalInfo && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Information</h4>
              <p className="text-sm text-gray-600">{additionalInfo}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

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

      {/* Receipts List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : receipts.length > 0 ? (
          receipts.map((receipt) => (
            <ReceiptCard key={receipt._id} receipt={receipt} />
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