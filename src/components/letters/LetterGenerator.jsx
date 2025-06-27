import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, FileText, AlertCircle, LayoutPanelLeft, Eye } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import api from '../../utils/api';

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

const LetterGenerator = ({ 
  isOpen, 
  onClose, 
  letterTemplates, 
  selectedTemplate,
  onTemplateSelect,
  onGenerate 
}) => {
  const editorRef = useRef(null);
  const [content, setContent] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'edit', 'preview'

  useEffect(() => {
    if (selectedTemplate) {
      setPrompt(selectedTemplate.internalPrompt || '');
    }
  }, [selectedTemplate]);

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

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setError('Please select a letter template first');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const editorContent = editorRef.current ? editorRef.current.getContent() : content;

      const response = await api.post('/letters/generate', {
        content: editorContent,
        prompt: prompt,
        templateId: selectedTemplate._id
      });

      if (response.data.success) {
        const generatedContent = formatLetterContent(response.data.data.content);
        setPreview({
          content: generatedContent
        });
        
        if (editorRef.current) {
          editorRef.current.setContent(generatedContent);
        }
        
        if (onGenerate) {
          onGenerate(response.data.data);
        }
      } else {
        throw new Error(response.data.error || 'Failed to generate letter');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while generating the letter');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Generate Letter</h2>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-colors ${
                viewMode === 'edit' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-colors ${
                viewMode === 'split' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <LayoutPanelLeft className="w-4 h-4" />
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-colors ${
                viewMode === 'preview' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex gap-6 p-6 min-h-0">
          {/* Editor - Hidden in preview mode */}
          {viewMode !== 'preview' && (
            <div className={`flex-1 flex flex-col min-h-0 ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Letter Template
                </label>
                <select
                  value={selectedTemplate?._id || ''}
                  onChange={(e) => {
                    const template = letterTemplates.find(t => t._id === e.target.value);
                    onTemplateSelect(template);
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
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customize Prompt
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full p-4 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                      placeholder="Edit the prompt for letter generation..."
                    />
                  </div>

                  <div className="flex-1">
                    <Editor
                      apiKey={TINYMCE_API_KEY}
                      onInit={(evt, editor) => editorRef.current = editor}
                      initialValue={content}
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
                </>
              )}
            </div>
          )}

          {/* Preview - Hidden in edit mode */}
          {viewMode !== 'edit' && (
            <div className={`flex-1 flex flex-col min-h-0 ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
              <label className="text-sm font-medium text-gray-700 mb-3">
                Preview
              </label>
              <div className="flex-1 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                {preview ? (
                  <div 
                    className="h-full p-6 overflow-auto"
                    dangerouslySetInnerHTML={{ __html: preview.content }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <FileText className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">
                      Click "Generate" to preview the formatted letter
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-100">
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedTemplate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LetterGenerator; 