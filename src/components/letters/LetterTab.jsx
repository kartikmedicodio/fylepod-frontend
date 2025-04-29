import { useState, useEffect } from 'react';
import { FileText, Save, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

const LetterTab = ({ managementId }) => {
  const [letterTemplates, setLetterTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showError, setShowError] = useState(false);

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
      setGeneratedContent('');
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

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setError('Please select a letter template first');
      return;
    }

    if (!prompt || prompt.trim() === '') {
      setError('Please enter the letter content');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const generateResponse = await api.post('/letters/generate', {
        content: prompt,
        managementId: managementId,
        templateId: selectedTemplate._id
      });

      if (generateResponse.data.success) {
        const letterData = generateResponse.data.data;
        setGeneratedContent(letterData.content);
      } else {
        throw new Error(generateResponse.data.error || 'Failed to generate letter');
      }
    } catch (err) {
      console.error('Error generating letter:', err);
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred while generating the letter';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndDownload = async () => {
    if (!generatedContent || generatedContent.trim() === '') {
      setError('No content to convert');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Convert the edited content to DOCX
      const docxResponse = await api.post('/letters/convert-to-docx', {
        letterContent: generatedContent,
        managementId: managementId
      });

      if (docxResponse.data.success) {
        // Download DOCX
        const docxUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${docxResponse.data.data.docx}`;
        const a = document.createElement('a');
        a.href = docxUrl;
        a.download = 'generated_letter.docx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        throw new Error(docxResponse.data.error || 'Failed to convert to DOCX');
      }
    } catch (err) {
      console.error('Error converting to DOCX:', err);
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred while converting to DOCX';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleError = (message) => {
    setError(message);
    setShowError(true);
    setTimeout(() => setShowError(false), 5000);
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
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-8 h-[800px] overflow-x-auto">
        {/* Template Selection Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-[400px] min-w-[300px] max-w-[800px] bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden resize-x"
          style={{ resize: 'horizontal' }}
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-semibold text-gray-900">Letter Template</h2>
          </div>
          
          <div className="p-6 flex-1 flex flex-col space-y-6 overflow-y-auto">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Template
              </label>
              <select
                value={selectedTemplate?._id || ''}
                onChange={(e) => {
                  const template = letterTemplates.find(t => t._id === e.target.value);
                  setSelectedTemplate(template);
                }}
                className="w-full p-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
              >
                <option value="">Choose a template...</option>
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
                className="flex-1 flex flex-col space-y-6"
              >
                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Instructions
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full p-4 text-base border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex-1 shadow-sm"
                    placeholder="Add any specific details or instructions for your letter..."
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-3" />
                      Generating...
                    </>
                  ) : (
                    'Generate Content'
                  )}
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Preview & Editor Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-[600px] min-w-[400px] max-w-[1200px] bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden resize-x"
          style={{ resize: 'horizontal' }}
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <h3 className="text-xl font-semibold text-gray-900">Generated Letter</h3>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-6 overflow-auto">
              {generatedContent ? (
                <textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  className="w-full h-full p-6 text-base border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono shadow-sm"
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center"
                >
                  <div className="bg-gray-50 p-8 rounded-2xl">
                    <FileText className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {selectedTemplate ? "Ready to Generate" : "No Template Selected"}
                    </h4>
                    <p className="text-gray-500 max-w-sm">
                      {selectedTemplate 
                        ? "Click 'Generate Content' to create your letter based on the selected template" 
                        : "Start by selecting a template from the left panel"}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sticky Footer with Actions */}
            {generatedContent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-gray-200 bg-gray-50 p-4 rounded-b-xl"
              >
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveAndDownload}
                    disabled={isSaving}
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-3" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Save & Download
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

LetterTab.propTypes = {
  managementId: PropTypes.string.isRequired
};

export default LetterTab; 