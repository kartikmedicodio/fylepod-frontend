import React, { useState, useEffect } from 'react';
import { X, Loader2, FileText, Download, AlertCircle, LayoutPanelLeft, Eye } from 'lucide-react';
import api from '../../utils/api';

const LetterGenerator = ({ 
  isOpen, 
  onClose, 
  letterTemplates, 
  selectedTemplate,
  onTemplateSelect,
  onGenerate 
}) => {
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

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setError('Please select a letter template first');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const response = await api.post('/letters/generate', {
        content: content,
        prompt: prompt,
        templateId: selectedTemplate._id
      });

      if (response.data.success) {
        setPreview({
          content: response.data.data.content,
          pdf: response.data.data.pdf
        });
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

  const handleDownload = () => {
    if (preview?.pdf) {
      try {
        const binaryString = window.atob(preview.pdf);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated_letter.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Error downloading PDF:', error);
        setError('Failed to download PDF');
      }
    }
  };

  const renderPDFPreview = () => {
    if (!preview?.pdf) return null;

    try {
      const pdfUrl = `data:application/pdf;base64,${preview.pdf}`;
      return (
        <iframe
          src={`${pdfUrl}#toolbar=0&zoom=100`}
          className="w-full h-full rounded-lg"
          title="PDF Preview"
        />
      );
    } catch (error) {
      console.error('Error rendering PDF:', error);
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          <AlertCircle className="w-6 h-6 mr-2" />
          Failed to load PDF preview
        </div>
      );
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

                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Additional Content (Optional)
                    </label>
                    <div className="text-xs text-gray-500">
                      {content.length} characters
                    </div>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex-1 p-4 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter any additional content or context for the letter..."
                  />
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
                  renderPDFPreview()
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
          <div className="flex items-center gap-3">
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
            {preview && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </button>
            )}
          </div>
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