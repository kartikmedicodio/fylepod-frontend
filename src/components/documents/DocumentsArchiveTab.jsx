import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Loader2, Download, FileText, Check, AlertCircle, Mail } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

const DocumentsArchiveTab = ({ managementId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [letters, setLetters] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);

  useEffect(() => {
    fetchDocuments();
    fetchLetters();
  }, [managementId]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/documents/management/${managementId}/documents`);
      if (response.data.status === 'success') {
        setDocuments(response.data.data.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLetters = async () => {
    try {
      const response = await api.get(`/letters/management/${managementId}?status=final`);
      if (response.data.success) {
        setLetters(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching letters:', error);
      toast.error('Failed to load letters');
    }
  };

  const handleDocumentSelect = (documentId) => {
    setSelectedDocuments(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      }
      return [...prev, documentId];
    });
  };

  const handleLetterSelect = (letterId) => {
    setSelectedLetters(prev => {
      if (prev.includes(letterId)) {
        return prev.filter(id => id !== letterId);
      }
      return [...prev, letterId];
    });
  };

  const handleSelectAll = () => {
    const allItems = [...documents.map(doc => doc._id), ...letters.map(letter => letter._id)];
    const allSelected = selectedDocuments.length + selectedLetters.length === allItems.length;
    
    if (allSelected) {
      setSelectedDocuments([]);
      setSelectedLetters([]);
    } else {
      setSelectedDocuments(documents.map(doc => doc._id));
      setSelectedLetters(letters.map(letter => letter._id));
    }
  };

  const generateCombinedPDF = async () => {
    if (selectedDocuments.length === 0 && selectedLetters.length === 0) {
      toast.error('Please select at least one document or letter');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      let hasAddedPages = false;
      
      // Process each selected document
      for (const docId of selectedDocuments) {
        try {
          // Find the document info
          const doc = documents.find(d => d._id === docId);
          if (!doc) continue;

          // Get the document's data
          const response = await api.get(`/documents/${docId}/download`, {
            responseType: 'arraybuffer'
          });
          
          // Handle based on mime type
          if (doc.mimeType === 'application/pdf') {
            // Handle PDF
            const pdfBytes = response.data;
            try {
              const pdf = await PDFDocument.load(pdfBytes);
              const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
              pages.forEach(page => mergedPdf.addPage(page));
              hasAddedPages = true;
            } catch (pdfError) {
              console.error(`Error loading PDF ${docId}:`, pdfError);
              toast.error(`Failed to load ${doc.originalName || doc.name}`);
              continue;
            }
          } else if (doc.mimeType.startsWith('image/')) {
            // Handle Image
            try {
              const imageBytes = new Uint8Array(response.data);
              let image;
              if (doc.mimeType === 'image/png') {
                image = await mergedPdf.embedPng(imageBytes);
              } else if (doc.mimeType === 'image/jpeg' || doc.mimeType === 'image/jpg') {
                image = await mergedPdf.embedJpg(imageBytes);
              } else {
                toast.error(`Unsupported image type: ${doc.originalName || doc.name}`);
                continue;
              }
              
              // Add a new page with the image
              const page = mergedPdf.addPage();
              const { width, height } = image.scale(1);
              const pageWidth = page.getWidth();
              const pageHeight = page.getHeight();
              
              // Calculate scaling to fit the page while maintaining aspect ratio
              const scale = Math.min(
                pageWidth / width,
                pageHeight / height
              );
              
              // Calculate centered position
              const x = (pageWidth - width * scale) / 2;
              const y = (pageHeight - height * scale) / 2;
              
              // Draw the image
              page.drawImage(image, {
                x,
                y,
                width: width * scale,
                height: height * scale,
              });
              
              hasAddedPages = true;
            } catch (imageError) {
              console.error(`Error processing image ${docId}:`, imageError);
              toast.error(`Failed to process ${doc.originalName || doc.name}`);
              continue;
            }
          } else {
            toast.error(`Unsupported file type: ${doc.originalName || doc.name}`);
            continue;
          }
        } catch (error) {
          console.error(`Error processing document ${docId}:`, error);
          const doc = documents.find(d => d._id === docId);
          toast.error(`Failed to process ${doc?.originalName || doc?.name || 'document'}`);
          continue;
        }
      }

      // Process each selected letter
      for (const letterId of selectedLetters) {
        try {
          // Find the letter info
          const letter = letters.find(l => l._id === letterId);
          if (!letter) continue;

          // Get the letter's PDF
          const response = await api.get(`/letters/${letterId}/download`, {
            responseType: 'arraybuffer'
          });
          
          // Load and merge the letter PDF
          try {
            const letterPdf = await PDFDocument.load(response.data);
            const pages = await mergedPdf.copyPages(letterPdf, letterPdf.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
            hasAddedPages = true;
          } catch (pdfError) {
            console.error(`Error loading letter PDF ${letterId}:`, pdfError);
            toast.error(`Failed to load letter`);
            continue;
          }
        } catch (error) {
          console.error(`Error processing letter ${letterId}:`, error);
          toast.error('Failed to process letter');
          continue;
        }
      }

      if (!hasAddedPages) {
        toast.error('No valid documents or letters were found to combine');
        return;
      }
      
      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      
      // Create a blob and download
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `combined_documents_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Documents combined successfully');
    } catch (error) {
      console.error('Error generating combined PDF:', error);
      toast.error('Failed to combine documents');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const allItems = [...documents, ...letters];
  const hasItems = allItems.length > 0;
  const selectedCount = selectedDocuments.length + selectedLetters.length;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Packaging</h2>
          <p className="text-sm text-gray-500 mt-1">
            Select documents and letters to combine into a single PDF file
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {selectedCount === allItems.length ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={generateCombinedPDF}
            disabled={selectedCount === 0 || isGenerating}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Combined PDF
              </>
            )}
          </button>
        </div>
      </div>

      {!hasItems ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No documents or letters available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Documents Section */}
          {documents.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Documents</h3>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className={`flex items-center p-4 rounded-lg border transition-colors cursor-pointer ${
                      selectedDocuments.includes(doc._id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleDocumentSelect(doc._id)}
                  >
                    <div className={`p-2 rounded-lg mr-4 ${
                      selectedDocuments.includes(doc._id)
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}>
                      {selectedDocuments.includes(doc._id) ? (
                        <Check className="w-5 h-5 text-blue-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {doc.originalName || doc.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Letters Section */}
          {letters.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Letters</h3>
              <div className="space-y-3">
                {letters.map((letter) => (
                  <div
                    key={letter._id}
                    className={`flex items-center p-4 rounded-lg border transition-colors cursor-pointer ${
                      selectedLetters.includes(letter._id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleLetterSelect(letter._id)}
                  >
                    <div className={`p-2 rounded-lg mr-4 ${
                      selectedLetters.includes(letter._id)
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}>
                      {selectedLetters.includes(letter._id) ? (
                        <Check className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Mail className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {letter.templateId?.name || 'Custom Letter'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Created on {new Date(letter.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {letter.content.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentsArchiveTab; 