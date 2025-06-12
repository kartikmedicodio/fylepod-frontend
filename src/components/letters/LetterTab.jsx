import { useState, useEffect, useRef } from 'react';
import { FileText, Loader2, AlertCircle, Save, Download, Trash2, Plus, Eye } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import api from '../../utils/api';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Button, List, message, Popconfirm, Space, Typography, Modal, Spin } from 'antd';
import { DeleteOutlined, EyeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const TINYMCE_API_KEY = 'ddqwuqhde6t5al5rxogsrzlje9q74nujwn1dbou5zq2kqpd1';

const LetterTab = ({ managementId, stepId }) => {
  const editorRef = useRef(null);
  const [letterTemplates, setLetterTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showError, setShowError] = useState(false);
  const [currentLetterId, setCurrentLetterId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [savedLetters, setSavedLetters] = useState([]);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [pendingContent, setPendingContent] = useState(null);
  const [dianaMessages, setDianaMessages] = useState([]);
  const [showDiana, setShowDiana] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [letterToDelete, setLetterToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Add Diana's messages
  const dianaSteps = [
    {
      message: "Greetings. I'm Diana, your AI assistant for letter drafting. I'm here to help you craft a precise and professional letter tailored to your needs.",
      color: "bg-blue-100"
    },
    {
      message: "I am analyzing the requirements you've provided and gathering the necessary information to ensure accuracy and compliance.",
      color: "bg-indigo-100"
    },
    {
      message: "I'm identifying the appropriate format and legal structure for the letter based on your specified needs and intended outcome.",
      color: "bg-purple-100"
    },
    {
      message: "I will incorporate the required legal formatting and professional elements, in line with industry standards.",
      color: "bg-pink-100"
    },
    {
      message: "I will ensure the inclusion of proper salutations, subject lines, and contact information as per legal best practices.",
      color: "bg-green-100"
    },
    {
      message: "I'm ensuring the letter's paragraph structure and content flow adhere to professional standards and legal clarity.",
      color: "bg-yellow-100"
    },
    {
      message: "I will add the necessary professional closing statements and signature blocks, in line with legal correspondence.",
      color: "bg-orange-100"
    },
    {
      message: "I'm performing a final review, including formatting checks, to ensure the document is polished and ready for professional use.",
      color: "bg-red-100"
    },
    {
      message: "Your letter is now prepared for your review and final edits, ready for any necessary revisions.",
      color: "bg-emerald-100"
    }
  ];
  
  const animateDiana = async () => {
    setShowDiana(true);
    for (let i = 0; i < dianaSteps.length; i++) {
      setDianaMessages(prev => [...prev, dianaSteps[i]]);
      setCurrentMessageIndex(Math.floor(i / 3) * 3);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  };

  // Get the current visible messages
  const visibleMessages = dianaMessages.slice(currentMessageIndex, currentMessageIndex + 3);
  const hasMoreMessages = currentMessageIndex + 3 < dianaMessages.length;
  const hasPreviousMessages = currentMessageIndex > 0;

  useEffect(() => {
    if (!managementId) {
      setError('Management ID is required');
      setLoading(false);
      return;
    }
    fetchManagementDetails();
  }, [managementId]);

  useEffect(() => {
    if (selectedTemplate) {
      setPrompt(selectedTemplate.internalPrompt || '');
    }
  }, [selectedTemplate]);

  const fetchManagementDetails = async () => {
    try {
      const response = await api.get(`/management/${managementId}`);
      if (response.data.status === "success") {
        setLetterTemplates(response.data.data.entry.letterTemplates || []);
        setError(null);
      } else {
        setError('Failed to fetch letter templates');
      }
    } catch (error) {
      console.error('Error fetching management details:', error);
      setError('Failed to load letter templates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedLetters = async () => {
    try {
      const response = await api.get(`/letters/management/${managementId}?stepId=${stepId}`);
      if (response.data.success) {
        setSavedLetters(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching saved letters:', error);
    }
  };

  useEffect(() => {
    if (managementId) {
      fetchSavedLetters();
    }
  }, [managementId]);

  // Effect to handle setting content when editor becomes ready
  useEffect(() => {
    const setPendingEditorContent = async () => {
      if (isEditorReady && editorRef.current && pendingContent) {
        try {
          await setEditorContent(pendingContent);
          setPendingContent(null); // Clear pending content after successful set
        } catch (err) {
          console.error('Error setting pending content:', err);
          setError('Failed to load letter content. Please try again.');
          setShowError(true);
        }
      }
    };

    setPendingEditorContent();
  }, [isEditorReady, pendingContent]);

  const setEditorContent = async (content) => {
    return new Promise((resolve, reject) => {
      if (!editorRef.current) {
        reject(new Error('Editor reference not available'));
        return;
      }

      try {
        // Ensure content is properly formatted
        const formattedContent = formatLetterContent(content);
        
        // Set content with a larger delay to ensure editor is ready
        setTimeout(() => {
          try {
            if (editorRef.current) {
              editorRef.current.setContent(formattedContent);
              resolve();
            } else {
              reject(new Error('Editor not available after delay'));
            }
          } catch (err) {
            reject(new Error(`Failed to set editor content: ${err.message}`));
          }
        }, 500); // Increased delay to 500ms
      } catch (err) {
        reject(new Error(`Error formatting content: ${err.message}`));
      }
    });
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setError('Please select a letter template first');
      setShowError(true);
      return;
    }

    if (!prompt || prompt.trim() === '') {
      setError('Please enter the letter content');
      setShowError(true);
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setShowError(false);
      setDianaMessages([]);
      
      // Start Diana's animation
      animateDiana();

      const generateResponse = await api.post('/letters/generate', {
        content: prompt,
        managementId: managementId,
        templateId: selectedTemplate._id,
        stepId: stepId,
        save: true
      });

      if (generateResponse.data.success) {
        const letterData = generateResponse.data.data;
        if (!letterData.content || !letterData.letterId) {
          console.error('Invalid letter data:', letterData);
          throw new Error('Invalid letter data received from server');
        }

        setCurrentLetterId(letterData.letterId);
        setPendingContent(letterData.content);
        setShowTemplateSelection(false);
        setShowEditor(true);
        await fetchSavedLetters();
        
        setError('Letter generated successfully');
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
      } else {
        throw new Error(generateResponse.data.error || 'Failed to generate letter');
      }
    } catch (err) {
      console.error('Error generating letter:', err);
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred while generating the letter';
      setError(errorMessage);
      setShowError(true);
    } finally {
      setIsGenerating(false);
      setShowDiana(false);
      setDianaMessages([]);
    }
  };

  // Add a function to validate editor state
  const validateEditor = () => {
    if (!editorRef.current) {
      throw new Error('Editor not initialized');
    }
    
    const content = editorRef.current.getContent();
    if (!content || !content.trim()) {
      throw new Error('Letter content cannot be empty');
    }
    
    return content;
  };

  // Add this new function to get user details from management
  const getUserDetailsFromManagement = async (managementId) => {
    try {
      console.log('Fetching user details for management:', managementId);
      const response = await api.get(`/management/${managementId}`);
      console.log('Management response:', response.data);
      
      if (response.data.status === "success" && response.data.data?.entry?.userId) {
        const userDetails = {
          email: response.data.data.entry.userId.email,
          name: response.data.data.entry.userId.name || 'User'
        };
        console.log('Found user details:', userDetails);
        return userDetails;
      }
      console.warn('No user details found in management response:', response.data);
      return null;
    } catch (error) {
      console.error('Error fetching user details:', error.response?.data || error.message);
      return null;
    }
  };

  const sendLetterNotification = async (userDetails, letterData, templateName) => {
    try {
      console.log('Sending letter notification with:', {
        email: userDetails.email,
        letterName: templateName,
        pdfUrl: letterData.pdfUrl
      });

      const response = await api.post('/mail/letter-notification', {
        recipientEmail: userDetails.email,
        letterName: templateName || 'Generated Letter',
        letterUrl: letterData.pdfUrl,
        userName: userDetails.name,
        letterType: templateName || 'Generated'
      });

      console.log('Letter notification response:', response.data);
      return true;
    } catch (err) {
      console.error('Letter notification error:', err.response?.data || err.message);
      throw err;
    }
  };

  const handleSave = async () => {
    if (!currentLetterId) {
      setError('No letter to save');
      setShowError(true);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setShowError(false);

      // Validate editor state and content
      const currentContent = validateEditor();

      console.log('Saving letter:', currentLetterId);
      const response = await api.put(`/letters/${currentLetterId}`, {
        status: 'final',
        content: currentContent,
        isHtml: true
      });

      if (response.data.success) {
        await fetchSavedLetters();
        
        // Send email notification
        try {
          const letter = savedLetters.find(l => l._id === currentLetterId);
          console.log('Found letter for notification:', letter);
          
          if (!letter?.managementId) {
            console.warn('No managementId found for letter:', currentLetterId);
            throw new Error('Management ID not found');
          }

          // Get user details from management
          const userDetails = await getUserDetailsFromManagement(letter.managementId);
          
          if (userDetails?.email) {
            await sendLetterNotification(
              userDetails,
              response.data.data,
              selectedTemplate?.name
            );
          } else {
            console.warn('No user email found for management:', letter.managementId);
          }
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError.response?.data || emailError.message);
        }

        setError('Letter saved successfully');
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
      } else {
        throw new Error(response.data.error || 'Failed to save letter');
      }
    } catch (err) {
      console.error('Error saving letter:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred while saving the letter';
      setError(errorMessage);
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPDF = async (letterId, filename) => {
    try {
      console.log('Downloading PDF for letter:', letterId);
      const response = await api({
        url: `/letters/${letterId}/download`,
        method: 'GET',
        params: { stepId },
        responseType: 'blob'
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty PDF data');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const objectUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = objectUrl;
      link.download = filename || `letter_${letterId}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
      
      return true;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw new Error('Failed to download PDF: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDownloadPDF = async (letterId) => {
    if (!letterId) {
      setError('Letter ID not available');
      return;
    }
    try {
      setIsDownloading(true);
      const letterName = savedLetters.find(l => l._id === letterId)?.templateId?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'letter';
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${letterName}_${timestamp}.pdf`;
      await downloadPDF(letterId, filename);
    } catch (error) {
      setError('Failed to download PDF');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveAndDownload = async () => {
    if (!currentLetterId) {
      setError('No letter to save');
      setShowError(true);
      return;
    }

    try {
      setIsDownloading(true);
      setError(null);
      setShowError(false);

      // Validate editor state and content
      const currentContent = validateEditor();

      console.log('Saving letter for download:', currentLetterId);
      // First save the letter
      const saveResponse = await api.put(`/letters/${currentLetterId}`, {
        status: 'final',
        content: currentContent,
        isHtml: true
      });

      if (!saveResponse.data.success) {
        throw new Error(saveResponse.data.error || 'Failed to save letter');
      }

      const updatedLetter = saveResponse.data.data;
      await fetchSavedLetters();

      // Send email notification
      try {
        if (!updatedLetter?.managementId) {
          console.warn('No managementId found in updated letter:', currentLetterId);
          throw new Error('Management ID not found');
        }

        // Get user details from management
        const userDetails = await getUserDetailsFromManagement(updatedLetter.managementId);
          
        if (userDetails?.email) {
          await sendLetterNotification(
            userDetails,
            updatedLetter,
            selectedTemplate?.name
          );
        } else {
          console.warn('No user email found for management:', updatedLetter.managementId);
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError.response?.data || emailError.message);
      }

      // Then download the PDF
      const letterName = selectedTemplate?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'letter';
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${letterName}_${timestamp}.pdf`;
      
      await downloadPDF(currentLetterId, filename);
      
      // Show success message
      setError('Letter saved and downloaded successfully');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    } catch (err) {
      console.error('Error saving and downloading letter:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred while saving and downloading the letter';
      setError(errorMessage);
      setShowError(true);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatLetterContent = (content) => {
    if (content.includes('<div class="letter-')) {
      return content;
    }

    const sections = content.split('\n\n');
    let formattedContent = '';

    sections.forEach((section, index) => {
      const trimmedSection = section.trim();
      
      if (index === 0) {
        formattedContent += `<div class="letter-date">${trimmedSection}</div>`;
      } else if (trimmedSection.startsWith('Dear') || trimmedSection.startsWith('To')) {
        formattedContent += `<div class="letter-salutation">${trimmedSection}</div>`;
      } else if (trimmedSection.startsWith('Subject:') || trimmedSection.startsWith('Re:')) {
        formattedContent += `<div class="letter-subject">${trimmedSection}</div>`;
      } else if (trimmedSection.startsWith('Sincerely') || trimmedSection.startsWith('Yours truly')) {
        formattedContent += `<div class="letter-closing">${trimmedSection}</div>`;
      } else if (index === 1 || index === 2) {
        formattedContent += `<div class="letter-address">${trimmedSection.replace(/\n/g, '<br>')}</div>`;
      } else if (index === sections.length - 1) {
        formattedContent += `<div class="letter-signature">${trimmedSection.replace(/\n/g, '<br>')}</div>`;
      } else {
        formattedContent += `<div class="letter-body">${trimmedSection}</div>`;
      }
    });

    return formattedContent;
  };

  const showDeleteConfirm = (letterId, event) => {
    event.preventDefault();
    event.stopPropagation();
    setLetterToDelete(letterId);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!letterToDelete) return;

    try {
      setIsDeleting(true);
      const response = await api.delete(`/letters/${letterToDelete}`);

      if (response.data.success) {
        setSavedLetters(savedLetters.filter(letter => letter._id !== letterToDelete));
        if (currentLetterId === letterToDelete) {
          setCurrentLetterId(null);
          setShowEditor(false);
        }
        message.success('Letter deleted successfully');
      } else {
        throw new Error('Failed to delete letter');
      }
    } catch (error) {
      console.error('Delete letter error:', error);
      message.error('Failed to delete letter');
    } finally {
      setIsDeleting(false);
      setDeleteModalVisible(false);
      setLetterToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setLetterToDelete(null);
  };

  const loadSavedLetter = async (letterId) => {
    try {
      setLoading(true);
      setError(null);
      setShowError(false);

      const response = await api.get(`/letters/${letterId}`);
      
      if (response.data.success) {
        const letter = response.data.data;
        setCurrentLetterId(letterId);
        setSelectedTemplate(letter.templateId);
        setPendingContent(letter.content);
        setShowTemplateSelection(false);
        setShowEditor(true);
      } else {
        throw new Error('Failed to load letter');
      }
    } catch (error) {
      console.error('Error loading letter:', error);
      setError('Failed to load letter');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleNewLetter = () => {
    setShowTemplateSelection(true);
    setShowEditor(false);
    setSelectedTemplate(null);
    setCurrentLetterId(null);
    setPrompt('');
  };

  const handleViewPDF = async (letterId) => {
    try {
      // First ensure the PDF exists by saving if needed
      const letter = savedLetters.find(l => l._id === letterId);
      if (!letter.pdfUrl) {
        const saveResponse = await api.put(`/letters/${letterId}`, {
          status: 'final',
          content: letter.content,
          isHtml: letter.isHtml || false,
          stepId: stepId
        });
        if (saveResponse.data.success) {
          await fetchSavedLetters();
          // Add stepId to the PDF URL
          const pdfUrl = new URL(saveResponse.data.data.pdfUrl);
          pdfUrl.searchParams.append('stepId', stepId);
          window.open(pdfUrl.toString(), '_blank');
        }
      } else {
        // Add stepId to the existing PDF URL
        const pdfUrl = new URL(letter.pdfUrl);
        pdfUrl.searchParams.append('stepId', stepId);
        window.open(pdfUrl.toString(), '_blank');
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      setError('Failed to view PDF');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[600px] p-6 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <AnimatePresence>
        {showError && error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-4 p-4 rounded-lg flex items-center space-x-3 ${
              error.includes('successfully') 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <AlertCircle className={`w-5 h-5 ${
              error.includes('successfully') ? 'text-green-500' : 'text-red-500'
            }`} />
            <p className={
              error.includes('successfully') ? 'text-green-700' : 'text-red-700'
            }>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!showEditor && !showTemplateSelection && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Letters</h2>
            <button
              onClick={handleNewLetter}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Letter
            </button>
          </div>
          <div className="p-6">
            {savedLetters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No letters yet. Click "New Letter" to create one.
              </div>
            ) : (
              <div className="space-y-4">
                {savedLetters.map((letter) => (
                  <div
                    key={letter._id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => loadSavedLetter(letter._id)}
                        className="flex-1 text-left flex items-center"
                      >
                        <FileText className="w-5 h-5 mr-3 text-gray-500" />
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {letter.templateId.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            Created: {new Date(letter.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-sm text-gray-500">
                            Status: {letter.status}
                          </span>
                        </div>
                      </button>
                      <div className="flex items-center space-x-2">
                        {letter.status === 'final' && (
                          <>
                            <button
                              onClick={() => handleViewPDF(letter._id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View PDF"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(letter._id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => showDeleteConfirm(letter._id, e)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete letter"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showTemplateSelection && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Select Template</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Choose a Template
                </label>
                <select
                  value={selectedTemplate?._id || ''}
                  onChange={(e) => {
                    const template = letterTemplates.find(t => t._id === e.target.value);
                    setSelectedTemplate(template);
                  }}
                  className="w-full p-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                >
                  <option value="">Select a template...</option>
                  {letterTemplates.map(template => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplate && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Additional Instructions
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full p-4 text-base border border-gray-300 rounded-lg h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                      placeholder="Add any specific details or instructions for your letter..."
                    />
                  </div>

                  <div className="flex justify-between items-start">
                    <AnimatePresence>
                      {showDiana && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-100 max-w-[900px]"
                        >
                          <div className="flex items-center space-x-3 mb-4">
                            <motion.div
                              animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "reverse",
                              }}
                              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md"
                            >
                              <span className="text-white text-xl font-bold">D</span>
                            </motion.div>
                            <div>
                              <span className="font-semibold text-blue-800">Diana</span>
                              <div className="text-xs text-blue-600">AI Letter Assistant</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <AnimatePresence mode="popLayout">
                              {visibleMessages.map((step, index) => (
                                <motion.div
                                  key={currentMessageIndex + index}
                                  initial={{ opacity: 0, x: 50 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -50 }}
                                  transition={{ duration: 0.3 }}
                                  className={`p-3 ${step.color} rounded-lg shadow-sm`}
                                >
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-800 min-h-[2.5rem]">{step.message}</p>
                                    <div className="mt-2 h-1 w-full bg-white/50 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 1.5 }}
                                        className="h-full bg-blue-500/30 rounded-full"
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                          {/* Navigation dots */}
                          <div className="flex justify-center items-center mt-4 space-x-2">
                            {Array.from({ length: Math.ceil(dianaMessages.length / 3) }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                                  Math.floor(currentMessageIndex / 3) === i
                                    ? 'bg-blue-500'
                                    : 'bg-blue-200'
                                }`}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setShowTemplateSelection(false);
                          setSelectedTemplate(null);
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <motion.button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          'Generate Letter'
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditor && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setShowEditor(false);
                  setCurrentLetterId(null);
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Letters
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedTemplate?.name || 'Edit Letter'}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving || isDownloading}
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={handleSaveAndDownload}
                disabled={isSaving || isDownloading}
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Save & Download
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-6">
            <Editor
              apiKey={TINYMCE_API_KEY}
              onInit={(evt, editor) => {
                console.log('Editor initialized');
                editorRef.current = editor;
                setIsEditorReady(true);
              }}
              init={{
                height: 600,
                menubar: true,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | ' +
                  'bold italic forecolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | help',
                content_style: `
                  body {
                    font-family: 'Times New Roman', Times, serif;
                    font-size: 12pt;
                    line-height: 1.15;
                    width: 100%;
                    margin: 0;
                    padding: 2em;
                    background: white;
                  }
                  .letter-date { text-align: right; margin-bottom: 2em; }
                  .letter-address { margin-bottom: 1em; line-height: 1.15; }
                  .letter-subject { font-weight: bold; margin-bottom: 1em; }
                  .letter-salutation { margin-bottom: 1em; }
                  .letter-body { margin-bottom: 1em; text-align: left; }
                  .letter-closing { margin-top: 1em; margin-bottom: 0.3em; }
                  .letter-signature { margin-top: 1.5em; }
                  p { margin: 0 0 1em 0; }
                  br { line-height: 1.15; }
                `,
                formats: {
                  letterDate: { block: 'div', classes: 'letter-date' },
                  letterAddress: { block: 'div', classes: 'letter-address' },
                  letterSubject: { block: 'div', classes: 'letter-subject' },
                  letterSalutation: { block: 'div', classes: 'letter-salutation' },
                  letterBody: { block: 'div', classes: 'letter-body' },
                  letterClosing: { block: 'div', classes: 'letter-closing' },
                  letterSignature: { block: 'div', classes: 'letter-signature' }
                },
                style_formats: [
                  { title: 'Date', format: 'letterDate' },
                  { title: 'Address', format: 'letterAddress' },
                  { title: 'Subject', format: 'letterSubject' },
                  { title: 'Salutation', format: 'letterSalutation' },
                  { title: 'Body', format: 'letterBody' },
                  { title: 'Closing', format: 'letterClosing' },
                  { title: 'Signature', format: 'letterSignature' }
                ],
                branding: false,
                resize: false,
                statusbar: false,
                autoresize_bottom_margin: 50,
                setup: function(editor) {
                  editor.on('init', function() {
                    console.log('Editor setup complete');
                  });
                }
              }}
            />
          </div>
        </div>
      )}

      <Modal
        title="Delete Letter"
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmLoading={isDeleting}
        okText="Delete"
        okButtonProps={{
          danger: true,
          className: 'bg-red-600'
        }}
        cancelButtonProps={{
          className: 'border-gray-200'
        }}
      >
        <div className="py-4">
          <p className="text-gray-600">Are you sure you want to delete this letter? This action cannot be undone.</p>
        </div>
      </Modal>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

LetterTab.propTypes = {
  managementId: PropTypes.string.isRequired,
  stepId: PropTypes.string.isRequired
};

export default LetterTab; 