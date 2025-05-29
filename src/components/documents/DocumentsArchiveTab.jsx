import { useState, useEffect } from 'react';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { Loader2, Download, FileText, Check, AlertCircle, Mail, Plus, GripVertical, Package2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PropTypes from 'prop-types';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

const SortableItem = ({ id, item, documents, letters, onRemove, onAddBlank }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {item.type === 'blank' ? (
        <div className="flex items-center p-4 rounded-lg border bg-gray-50 border-gray-200">
          <div {...attributes} {...listeners} className="p-2 cursor-grab">
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1 text-center text-gray-500">
            Blank Page
          </div>
          <button
            onClick={() => onRemove(id)}
            className="p-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="flex items-center p-4 rounded-lg border bg-blue-50 border-blue-200">
          <div {...attributes} {...listeners} className="p-2 cursor-grab">
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
          <div className="p-2 rounded-lg mr-4 bg-blue-100">
            {item.type === 'document' ? (
              <FileText className="w-5 h-5 text-blue-600" />
            ) : (
              <Mail className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {item.type === 'document'
                ? (documents.find(d => d._id === item.id)?.originalName || 'Document')
                : (letters.find(l => l._id === item.id)?.templateId?.name || 'Custom Letter')}
            </h3>
          </div>
          <button
            onClick={() => onRemove(id)}
            className="p-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      <button
        onClick={() => onAddBlank(id)}
        className="absolute left-1/2 transform -translate-x-1/2 -bottom-2 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:shadow-md transition-shadow"
      >
        <Plus className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
};

SortableItem.propTypes = {
  id: PropTypes.string.isRequired,
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['document', 'letter', 'blank']).isRequired,
  }).isRequired,
  documents: PropTypes.array.isRequired,
  letters: PropTypes.array.isRequired,
  onRemove: PropTypes.func.isRequired,
  onAddBlank: PropTypes.func.isRequired,
};

const DocumentsArchiveTab = ({ managementId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [letters, setLetters] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [showPackageAnimation, setShowPackageAnimation] = useState(false);
  const [currentPackageStep, setCurrentPackageStep] = useState(0);
  
  const packageSteps = [
    "Creating your package...",
    "Organizing documents...",
    "Combining files...",
    "Adding page numbers...",
    "Optimizing file size...",
    "Almost ready...",
  ];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        // Filter out any letters that might still be in draft status
        const nonDraftLetters = response.data.data.filter(letter => 
          letter.status === 'final' || letter.status === 'approved'
        );
        setLetters(nonDraftLetters);
      }
    } catch (error) {
      console.error('Error fetching letters:', error);
      toast.error('Failed to load letters');
    }
  };

  const handleDocumentSelect = (documentId) => {
    setSelectedDocuments(prev => {
      const newSelection = prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId];
      
      // Update selectedItems accordingly
      updateSelectedItems(newSelection, selectedLetters);
      return newSelection;
    });
  };

  const handleLetterSelect = (letterId) => {
    setSelectedLetters(prev => {
      const newSelection = prev.includes(letterId)
        ? prev.filter(id => id !== letterId)
        : [...prev, letterId];
      
      // Update selectedItems accordingly
      updateSelectedItems(selectedDocuments, newSelection);
      return newSelection;
    });
  };

  const updateSelectedItems = (docs, letters) => {
    const items = [
      ...docs.map(id => ({ id, type: 'document' })),
      ...letters.map(id => ({ id, type: 'letter' }))
    ];
    setSelectedItems(items);
  };

  const handleSelectAll = () => {
    const allDocs = documents.map(doc => doc._id);
    const allLetters = letters.map(letter => letter._id);
    const allSelected = selectedDocuments.length + selectedLetters.length === allDocs.length + allLetters.length;
    
    if (allSelected) {
      setSelectedDocuments([]);
      setSelectedLetters([]);
      setSelectedItems([]);
    } else {
      setSelectedDocuments(allDocs);
      setSelectedLetters(allLetters);
      updateSelectedItems(allDocs, allLetters);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSelectedItems((items) => {
        const oldIndex = items.findIndex(item => `${item.type}-${item.id}` === active.id);
        const newIndex = items.findIndex(item => `${item.type}-${item.id}` === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const removeItem = (itemId) => {
    const [type, id] = itemId.split('-');
    const newItems = selectedItems.filter(item => `${item.type}-${item.id}` !== itemId);
    setSelectedItems(newItems);

    if (type === 'document') {
      setSelectedDocuments(prev => prev.filter(docId => docId !== id));
    } else if (type === 'letter') {
      setSelectedLetters(prev => prev.filter(letterId => letterId !== id));
    }
  };

  const addBlankPage = (afterItemId) => {
    const index = selectedItems.findIndex(item => `${item.type}-${item.id}` === afterItemId);
    const newItems = [...selectedItems];
    newItems.splice(index + 1, 0, { id: `blank-${Date.now()}`, type: 'blank' });
    setSelectedItems(newItems);
  };

  const generateCombinedPDF = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one document or letter');
      return;
    }

    try {
      setIsGenerating(true);
      setShowPackageAnimation(true);
      
      // Start cycling through package steps
      const stepInterval = setInterval(() => {
        setCurrentPackageStep(prev => (prev + 1) % packageSteps.length);
      }, 2000);

      const mergedPdf = await PDFDocument.create();
      let hasAddedPages = false;

      // Process items in the order specified by selectedItems
      for (const item of selectedItems) {
        if (item.type === 'blank') {
          // Add a blank page
          mergedPdf.addPage(PageSizes.A4);
          hasAddedPages = true;
          continue;
        }

        try {
          if (item.type === 'document') {
            const doc = documents.find(d => d._id === item.id);
            if (!doc) continue;

            const response = await api.get(`/documents/${item.id}/download`, {
              responseType: 'arraybuffer'
            });

            if (doc.mimeType === 'application/pdf') {
              const pdf = await PDFDocument.load(response.data);
              const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
              pages.forEach(page => mergedPdf.addPage(page));
              hasAddedPages = true;
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
                console.error(`Error processing image:`, imageError);
                toast.error(`Failed to process ${doc.originalName || doc.name}`);
                continue;
              }
            }
          } else if (item.type === 'letter') {
            const response = await api.get(`/letters/${item.id}/download`, {
              responseType: 'arraybuffer'
            });
            const letterPdf = await PDFDocument.load(response.data);
            const pages = await mergedPdf.copyPages(letterPdf, letterPdf.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
            hasAddedPages = true;
          }
        } catch (error) {
          console.error(`Error processing item:`, error);
          toast.error(`Failed to process item`);
          continue;
        }
      }

      if (!hasAddedPages) {
        toast.error('No valid documents or letters were found to combine');
        return;
      }

      const mergedPdfBytes = await mergedPdf.save();
      
      // Create form data with the PDF and metadata
      const formData = new FormData();
      formData.append('pdf', new Blob([mergedPdfBytes], { type: 'application/pdf' }), 'combined.pdf');
      formData.append('name', `Combined Documents ${new Date().toISOString().split('T')[0]}`);
      formData.append('managementId', managementId);
      formData.append('documents', JSON.stringify(selectedItems.filter(item => item.type === 'document').map(item => item.id)));
      formData.append('letters', JSON.stringify(selectedItems.filter(item => item.type === 'letter').map(item => item.id)));
      formData.append('blankPages', JSON.stringify(selectedItems.map((item, index) => item.type === 'blank' ? index : null).filter(index => index !== null)));

      // Upload to backend
      const response = await api.post('/combined-pdfs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status === 'success') {
        toast.success('Documents combined successfully');
        
        // Get the blob URL from the response
        const blobUrl = response.data.data.combinedPdf.blobUrl;
        
        try {
          // Fetch the PDF content
          const pdfResponse = await fetch(blobUrl);
          if (!pdfResponse.ok) throw new Error('Failed to download PDF');
          
          const blob = await pdfResponse.blob();
          
          // Create a download link
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `Combined_Documents_${new Date().toISOString().split('T')[0]}.pdf`;
          
          // Trigger download
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
        } catch (downloadError) {
          console.error('Error downloading PDF:', downloadError);
          toast.error('Failed to download the combined PDF');
          
          // Fallback to opening in new tab
          window.open(blobUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Error generating combined PDF:', error);
      toast.error('Failed to combine documents');
    } finally {
      setIsGenerating(false);
      // Add a small delay before hiding the animation
      setTimeout(() => {
        setShowPackageAnimation(false);
        setCurrentPackageStep(0);
      }, 1000);
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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Packaging</h2>
          <p className="text-sm text-gray-500 mt-1">
            Select documents and letters to combine into a single package
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {selectedItems.length === allItems.length ? 'Deselect All' : 'Select All'}
          </button>
          
          {/* Create Package Button with Animation */}
          <div className="relative">
            <button
              onClick={generateCombinedPDF}
              disabled={selectedItems.length === 0 || isGenerating}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Package...
                </>
              ) : (
                <>
                  <Package2 className="w-4 h-4 mr-2" />
                  Create Package
                </>
              )}
            </button>

            {/* Diana Mini Animation */}
            <AnimatePresence>
              {showPackageAnimation && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg py-2 px-3 border border-gray-100 flex items-center gap-3 whitespace-nowrap z-10 min-w-[250px]"
                >
                  <motion.div
                    className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  >
                    <span className="text-sm font-bold text-white">D</span>
                  </motion.div>
                  <AnimatePresence mode="wait">
                    <motion.span 
                      key={currentPackageStep}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm text-blue-500 font-medium"
                    >
                      {packageSteps[currentPackageStep]}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {!hasItems ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No documents or letters available</p>
        </div>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedItems.map(item => `${item.type}-${item.id}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {selectedItems.map((item) => (
                  <SortableItem
                    key={`${item.type}-${item.id}`}
                    id={`${item.type}-${item.id}`}
                    item={item}
                    documents={documents}
                    letters={letters}
                    onRemove={removeItem}
                    onAddBlank={addBlankPage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Original document and letter lists for selection */}
          <div className="space-y-3 mt-8">
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
        </>
      )}
    </div>
  );
};

DocumentsArchiveTab.propTypes = {
  managementId: PropTypes.string.isRequired,
};

export default DocumentsArchiveTab; 