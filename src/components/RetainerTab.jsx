import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import api from "../utils/api";
import { Loader2, Eye, Download, Plus, ArrowLeft, FileText, Calendar, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PDFDocument } from 'pdf-lib';
import PropTypes from 'prop-types';
import { getStoredUser } from '../utils/auth';

const RetainerTab = ({ companyId, profileData, caseId, caseManagerId, applicantId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [retainers, setRetainers] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Get user role from localStorage
    const user = getStoredUser();
    console.log('Current user data:', user);
    setUserRole(user?.role);
    
    if (caseId) {
      fetchRetainerTemplates();
      fetchExistingRetainers();
    }
  }, [caseId]);

  useEffect(() => {
    console.log('RetainerTab Props:', {
      companyId,
      caseId,
      caseManagerId,
      applicantId,
      hasProfileData: !!profileData
    });
    
    const missingProps = [];
    if (!companyId) missingProps.push('companyId');
    if (!caseId) missingProps.push('caseId');
    if (!caseManagerId) missingProps.push('caseManagerId');
    if (!applicantId) missingProps.push('applicantId');
    
    if (missingProps.length > 0) {
      console.warn('RetainerTab initialized with missing required props:', missingProps);
    }
  }, [companyId, caseId, caseManagerId, applicantId]);

  const fetchExistingRetainers = async () => {
    try {
      console.log('Fetching retainers for case:', caseId);
      const response = await api.get(`/retainer/case/${caseId}`);
      console.log('Retainers response:', response.data);
      
      if (response.data && response.data.status === 'success') {
        setRetainers(response.data.data || []);
        console.log('Set retainers:', response.data.data);
      } else {
        console.warn('Unexpected response structure:', response.data);
        setRetainers([]);
      }
    } catch (err) {
      console.error('Error fetching existing retainers:', err);
      toast.error('Failed to fetch retainers');
      setRetainers([]);
    }
  };

  const fetchRetainerTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/retainer-templates/company/${companyId}`);
      if (response.data) {
        setTemplates(response.data);
        if (response.data.length > 0) {
          setSelectedTemplate(response.data[0]._id);
          generatePreview(response.data[0]);
        }
      }
    } catch (err) {
      setError('Failed to fetch retainer templates');
      toast.error('Failed to fetch retainer templates');
      console.error('Error fetching retainer templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = async (e) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    const selectedTemplate = templates.find(t => t._id === templateId);
    if (selectedTemplate) {
      await generatePreview(selectedTemplate);
    }
  };

  const generatePreview = async (template) => {
    try {
      setIsGeneratingPreview(true);
      
      // Load the PDF template from the frontend templates folder
      const templateUrl = `/templates/${template.template_name}.pdf`;
      const templateBytes = await fetch(templateUrl).then(res => res.arrayBuffer());
      
      const pdfDoc = await PDFDocument.load(templateBytes);
      const form = pdfDoc.getForm();

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Fill in the form fields
      try {
        form.getTextField('date').setText(today);
        form.getTextField('company_name').setText(profileData.company_id.company_name);
        form.getTextField('user_name').setText(profileData.name);
      } catch (err) {
        console.error('Error filling form fields:', err);
      }

      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      
      // Create a blob URL for preview
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      toast.error('Failed to generate preview');
      console.error('Error generating preview:', err);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleViewDocument = (pdfUrl) => {
    window.open(pdfUrl, '_blank');
  };

  const handleDownload = async () => {
    if (!previewUrl) return;

    try {
      setIsUploading(true);
      
      console.log('Download Attempt - IDs:', {
        caseId,
        caseManagerId,
        applicantId,
        companyId
      });

      // Validate required IDs before proceeding
      const missingIds = [];
      if (!caseId) missingIds.push('caseId');
      if (!caseManagerId) missingIds.push('caseManagerId');
      if (!applicantId) missingIds.push('applicantId');
      if (!companyId) missingIds.push('companyId');

      if (missingIds.length > 0) {
        console.error('Missing IDs:', missingIds);
        console.error('Current props:', { caseId, caseManagerId, applicantId, companyId });
        throw new Error(`Missing required IDs: ${missingIds.join(', ')}`);
      }

      const template = templates.find(t => t._id === selectedTemplate);
      if (!template) {
        throw new Error('Template not found');
      }

      // Load the PDF template
      const templateUrl = `/templates/${template.template_name}.pdf`;
      const templateBytes = await fetch(templateUrl).then(res => res.arrayBuffer());
      
      // Create and populate the PDF
      const pdfDoc = await PDFDocument.load(templateBytes);
      const form = pdfDoc.getForm();

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Fill in the form fields
      try {
        form.getTextField('date').setText(today);
        form.getTextField('company_name').setText(profileData.company_id.company_name);
        form.getTextField('user_name').setText(profileData.name);
      } catch (err) {
        console.error('Error filling form fields:', err);
      }

      // Get the populated PDF bytes
      const populatedPdfBytes = await pdfDoc.save();
      
      // Create FormData with additional fields
      const formData = new FormData();
      formData.append('file', new Blob([populatedPdfBytes], { type: 'application/pdf' }), 'retainer.pdf');
      formData.append('companyId', companyId);
      formData.append('templateId', selectedTemplate);
      formData.append('caseId', caseId);
      formData.append('caseManagerId', caseManagerId);
      formData.append('applicantId', applicantId);

      // Log FormData contents
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      // Upload to backend
      const uploadResponse = await api.post('/retainer/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (uploadResponse.data.status === 'success') {
        toast.success('Retainer document uploaded successfully');
        
        // Download the PDF locally
        const blob = new Blob([populatedPdfBytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `retainer-${template.template_name}-${today}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Refresh the retainers list
        await fetchExistingRetainers();
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      toast.error('Failed to upload retainer document');
      console.error('Error uploading retainer:', err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!companyId) {
    return (
      <div className="text-gray-500 text-center p-8 bg-white rounded-lg shadow">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg">No company information available</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-8 bg-white rounded-lg shadow">
        <p className="text-lg font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">Retainer Information</h2>
        {!showCreateForm && userRole === 'attorney' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Retainer
          </button>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {!showCreateForm ? (
          // Existing Retainers Section
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Existing Retainers</h3>

            {retainers.length > 0 ? (
              <div className="grid gap-4">
                {retainers.map((retainer) => (
                  <div 
                    key={retainer._id} 
                    className="flex items-center justify-between pl-6 pr-6 pt-4 pb-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{retainer.template_id.template_name}</p>
                        <div className="flex flex-col text-sm text-gray-500 mt-1">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Created: {new Date(retainer.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span>Case: {retainer.case_id?.case_number}</span>
                          <span>Status: {retainer.sign_status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        retainer.sign_status === 'signed' ? 'bg-green-100 text-green-800' :
                        retainer.sign_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {retainer.sign_status.charAt(0).toUpperCase() + retainer.sign_status.slice(1)}
                      </span>
                      <button
                        onClick={() => handleViewDocument(retainer.pdf_url)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Document
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 text-lg">No retainers found</p>
                <p className="text-gray-400 mt-2">Click the Create Retainer button to get started</p>
              </div>
            )}
          </div>
        ) : (
          // Create New Retainer Section
          <div className="p-6">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mr-4 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Retainers
              </button>
              <h3 className="text-2xl font-semibold text-gray-900 pl-6">Create New Retainer</h3>
            </div>

            <div className="space-y-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Retainer Template
                </label>
                <div className="flex gap-4 items-center">
                  <div className="relative w-full">
                    <select
                      id="template-select"
                      value={selectedTemplate}
                      onChange={handleTemplateChange}
                      className="appearance-none block w-full pl-4 pr-10 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    >
                      {templates.map((template) => (
                        <option key={template._id} value={template._id}>
                          {template.template_name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <ChevronDown className="h-5 w-5" />
                    </div>
                  </div>

                  <button
                    onClick={handleDownload}
                    disabled={isGeneratingPreview || isUploading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingPreview || isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? 'Uploading...' : 'Download & Save'}
                  </button>
                </div>
              </div>

              {/* Preview Section */}
              {previewUrl && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900">Preview</h3>
                  </div>
                  <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                    <iframe
                      src={previewUrl}
                      className="w-full h-[600px]"
                      title="PDF Preview"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

RetainerTab.propTypes = {
  companyId: PropTypes.string.isRequired,
  profileData: PropTypes.object.isRequired,
  caseId: PropTypes.string.isRequired,
  caseManagerId: PropTypes.string.isRequired, 
  applicantId: PropTypes.string.isRequired
};

export default RetainerTab; 