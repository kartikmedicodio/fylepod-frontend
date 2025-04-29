import { useState, useEffect, useRef } from 'react';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import api from '../../utils/api';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

const TINYMCE_API_KEY = 'ddqwuqhde6t5al5rxogsrzlje9q74nujwn1dbou5zq2kqpd1';

// Custom CSS for letter formatting
const LETTER_STYLES = `
body {
  font-family: 'Times New Roman', Times, serif;
  font-size: 14px;
  line-height: 1.6;
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
}

.letter-date {
  text-align: right;
  margin-bottom: 30px;
}

.letter-address {
  margin-bottom: 20px;
}

.letter-subject {
  font-weight: bold;
  margin-bottom: 20px;
}

.letter-salutation {
  margin-bottom: 20px;
}

.letter-body {
  margin-bottom: 30px;
  text-align: justify;
}

.letter-closing {
  margin-top: 30px;
  margin-bottom: 10px;
}

.letter-signature {
  margin-top: 40px;
}
`;

const LetterTab = ({ managementId }) => {
  const editorRef = useRef(null);
  const [letterTemplates, setLetterTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
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

  useEffect(() => {
    if (generatedContent && editorRef.current) {
      editorRef.current.setContent(generatedContent);
    }
  }, [generatedContent]);

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
        const formattedContent = formatLetterContent(letterData.content);
        setGeneratedContent(formattedContent);
        
        if (editorRef.current) {
          editorRef.current.setContent(formattedContent);
        }
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

  const formatLetterContent = (content) => {
    // Split content into sections
    const sections = content.split('\n\n');
    let formattedContent = '';

    // Format each section based on its position and content
    sections.forEach((section, index) => {
      const trimmedSection = section.trim();
      
      if (index === 0) {
        // Date
        formattedContent += `<div class="letter-date">${trimmedSection}</div>`;
      } else if (trimmedSection.startsWith('Dear') || trimmedSection.startsWith('To')) {
        // Salutation
        formattedContent += `<div class="letter-salutation">${trimmedSection}</div>`;
      } else if (trimmedSection.startsWith('Subject:') || trimmedSection.startsWith('Re:')) {
        // Subject
        formattedContent += `<div class="letter-subject">${trimmedSection}</div>`;
      } else if (trimmedSection.startsWith('Sincerely') || trimmedSection.startsWith('Yours truly')) {
        // Closing
        formattedContent += `<div class="letter-closing">${trimmedSection}</div>`;
      } else if (index === 1 || index === 2) {
        // Address block
        formattedContent += `<div class="letter-address">${trimmedSection.replace(/\n/g, '<br>')}</div>`;
      } else if (index === sections.length - 1) {
        // Signature block
        formattedContent += `<div class="letter-signature">${trimmedSection.replace(/\n/g, '<br>')}</div>`;
      } else {
        // Body paragraphs
        formattedContent += `<div class="letter-body">${trimmedSection}</div>`;
      }
    });

    return formattedContent;
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

      <div className="flex gap-8 h-[800px]">
        {/* Template Selection and Generation Section */}
        <div className="w-[400px] bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200">
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
        </div>

        {/* Editor Section */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Letter Content</h3>
          </div>

          <div className="flex-1 p-6">
            <Editor
              apiKey={TINYMCE_API_KEY}
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue=""
              init={{
                height: '100%',
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
                content_style: LETTER_STYLES,
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
                min_height: 500,
                autoresize_bottom_margin: 50,
                setup: (editor) => {
                  editor.on('init', () => {
                    editor.formatter.register('letterStyles', {
                      block: 'div',
                      classes: ['letter-date', 'letter-address', 'letter-subject', 'letter-salutation', 'letter-body', 'letter-closing', 'letter-signature']
                    });
                  });
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

LetterTab.propTypes = {
  managementId: PropTypes.string.isRequired
};

export default LetterTab; 