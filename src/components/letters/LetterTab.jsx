import { useState, useEffect } from 'react';
import { FileText, Save, Download } from 'lucide-react';
import api from '../../utils/api';
import PropTypes from 'prop-types';

const LetterTab = ({ managementId }) => {
  const [letters, setLetters] = useState([]);
  const [letterTemplates, setLetterTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

      // Convert the edited content to PDF
      const pdfResponse = await api.post('/letters/convert-to-pdf', {
        letterContent: generatedContent,
        managementId: managementId
      });

      if (pdfResponse.data.success) {
        const letterData = {
          content: generatedContent,
          pdf: pdfResponse.data.data.pdf
        };
        
        // Save to letters list
        setLetters(prevLetters => [...prevLetters, letterData]);

        // Download PDF
        const pdfUrl = `data:application/pdf;base64,${letterData.pdf}`;
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = `letter_${letters.length + 1}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        throw new Error(pdfResponse.data.error || 'Failed to convert to PDF');
      }
    } catch (err) {
      console.error('Error converting to PDF:', err);
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred while converting to PDF';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Template Selection Section */}
        <div className="col-span-4">
          <div className="bg-white rounded-lg border border-gray-200 h-[800px] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Letter Template</h2>
            </div>
            
            <div className="p-6 flex-1 flex flex-col space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template
                </label>
                <select
                  value={selectedTemplate?._id || ''}
                  onChange={(e) => {
                    const template = letterTemplates.find(t => t._id === e.target.value);
                    setSelectedTemplate(template);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <>
                  <div className="flex-1 flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Instructions
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full p-4 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1"
                      placeholder="Enter any additional instructions or specific details for this letter..."
                    />
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Generating...
                      </>
                    ) : (
                      'Generate Content'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Preview & Editor Section */}
        <div className="col-span-8">
          <div className="bg-white rounded-lg border border-gray-200 h-[800px] flex flex-col">
            {/* Header with actions */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Generated Letter</h3>
              {generatedContent && (
                <div className="flex items-center gap-3">
        <button
                    onClick={handleSaveAndDownload}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save & Download
                      </>
                    )}
        </button>
                </div>
              )}
            </div>

            {/* Content area */}
            <div className="p-6 flex-1 flex flex-col">
              {generatedContent ? (
                <textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  className="w-full flex-1 p-4 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <FileText className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">
                    {selectedTemplate 
                      ? "Click 'Generate Content' to create your letter" 
                      : "Select a template to get started"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generated Letters List */}
      {letters.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Letters</h3>
      <div className="space-y-3">
            {letters.map((letter, index) => (
            <div
              key={index}
                className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-900">
                    Generated Letter #{letters.length - index}
                </span>
              </div>
                <div className="flex items-center gap-3">
                <button
                    onClick={() => setGeneratedContent(letter.content)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                    Edit
                </button>
                <button
                  onClick={() => {
                      const pdfUrl = `data:application/pdf;base64,${letter.pdf}`;
                      const a = document.createElement('a');
                      a.href = pdfUrl;
                      a.download = `letter_${letters.length - index}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                  }}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                    <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
            ))}
          </div>
          </div>
        )}
    </div>
  );
};

LetterTab.propTypes = {
  managementId: PropTypes.string.isRequired
};

export default LetterTab; 