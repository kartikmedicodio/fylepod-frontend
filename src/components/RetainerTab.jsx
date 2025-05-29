import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import api from "../utils/api";
import { Loader2, Eye, Download, Plus, ArrowLeft, FileText, Calendar, ChevronDown, CheckCircle, XCircle, Mail, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PDFDocument } from 'pdf-lib';
import PropTypes from 'prop-types';
import { getStoredUser } from '../utils/auth';

const RetainerTab = ({ companyId, profileData, caseId, caseManagerId, applicantId ,caseData}) => {
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
  const [isEscalating, setIsEscalating] = useState(false);

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
        
        // Reset form and redirect to retainers list
        setShowCreateForm(false);
        setSelectedTemplate('');
        setPreviewUrl(null);
        
        // Show success message with animation
        toast.success('Retainer created and saved successfully!', {
          duration: 3000,
          icon: '✅',
          style: {
            borderRadius: '10px',
            background: '#fff',
            color: '#333',
            boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
            border: '1px solid #4CAF50',
          },
        });
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

  const handleEscalateToSignature = async (retainerId) => {
    try {
      setIsEscalating(true);
      
      // Find the retainer details
      const retainer = retainers.find(r => r._id === retainerId);
      if (!retainer) {
        throw new Error('Retainer not found');
      }

      console.log('Attempting to fetch PDF from URL:', retainer.pdf_url);
      console.log("retainerId", retainerId);
      console.log("caseData", caseData);

      // Download the PDF from Azure URL
      const pdfResponse = await fetch(retainer.pdf_url);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
      }
      const pdfBlob = await pdfResponse.blob();
      console.log('PDF blob size:', pdfBlob.size);
      
      if (pdfBlob.size === 0) {
        throw new Error('Downloaded PDF is empty');
      }

      // Create form data
      const formData = new FormData();
      console.log("profileData", profileData);
      console.log("caseId", caseId);
      formData.append('file', pdfBlob, 'retainer.pdf');
      formData.append('name', caseData.userId.name);
      formData.append('email', caseData.userId.email);
      formData.append('managementId', caseId);
      formData.append('retainerId', retainerId);

      // Log form data contents for debugging
      for (let pair of formData.entries()) {
        console.log('FormData entry:', pair[0], pair[1]);
      }

      // Make API call to Zoho signature endpoint
      const response = await api.post('/zoho-signature/send-retainer', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        toast.success('Retainer successfully sent for signature');
        // Refresh the retainers list to update status
        await fetchExistingRetainers();
      } else {
        throw new Error(response.data.message || 'Failed to send retainer for signature');
      }
    } catch (err) {
      console.error('Error escalating retainer to signature:', err);
      toast.error(err.message || 'Failed to send retainer for signature');
    } finally {
      setIsEscalating(false);
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
                    className="flex items-center justify-between p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{retainer.template_id.template_name}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-1.5" />
                            <span>Created: {new Date(retainer.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span
                            className={`
                              px-3 py-1 rounded-full text-xs font-medium
                              ${retainer.sign_status === 'signed' ? 'bg-emerald-50 text-emerald-700' :
                                retainer.sign_status === 'rejected' ? 'bg-red-50 text-red-700' :
                                retainer.sign_status === 'sent' ? 'bg-blue-50 text-blue-700' :
                                'bg-amber-50 text-amber-700'
                              }
                            `}
                          >
                            {retainer.sign_status.charAt(0).toUpperCase() + retainer.sign_status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleViewDocument(retainer.pdf_url)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      >
                        <Eye className="w-4 h-4 mr-2 text-gray-500" />
                        View
                      </button>

                      {userRole === 'attorney' && retainer.sign_status !== 'signed' && (
                        <button
                          onClick={() => handleEscalateToSignature(retainer._id)}
                          disabled={isEscalating}
                          className={`
                            inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                            ${isEscalating 
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                              : 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            }
                            transition-all duration-200 shadow-sm
                          `}
                        >
                          {isEscalating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4 mr-2" />
                              Request Signature
                            </>
                          )}
                        </button>
                      )}

                      {/* Info Banners with improved styling */}
                      {retainer.sign_status === 'sent' && userRole !== 'attorney' && (
                        <div className="absolute bottom-0 left-0 right-0 mt-4 mx-6 mb-4">
                          <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-3 text-sm">
                            <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <span className="text-blue-700">
                              <span className="font-medium">Action Required:</span> Please check your email for the signature request.
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* {retainer.sign_status === 'pending' && userRole !== 'attorney' && (
                        <div className="absolute bottom-0 left-0 right-0 mt-4 mx-6 mb-4">
                          <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-4 py-3 text-sm">
                            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            <span className="text-amber-700">
                              <span className="font-medium">Pending Review:</span> Your attorney will send this for signature soon.
                            </span>
                          </div>
                        </div>
                      )} */}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 text-lg">No retainers found</p>
                
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