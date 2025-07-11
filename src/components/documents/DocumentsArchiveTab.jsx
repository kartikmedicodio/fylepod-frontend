import { useState, useEffect } from 'react';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { Loader2, Download, FileText, Check, AlertCircle, Mail, Plus, GripVertical, Package2, Sparkles, FileCheck } from 'lucide-react';
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
            {item.type === 'letter' && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-600">
                  From: <span className="text-blue-600 font-medium">{letters.find(l => l._id === item.id)?.stepName || 'Letters Tab'}</span>
                </span>
              </div>
            )}
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

const DocumentsArchiveTab = ({ managementId, stepId, onStepCompleted }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [letters, setLetters] = useState([]);
  const [retainers, setRetainers] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [selectedRetainers, setSelectedRetainers] = useState([]);
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
    fetchStepsAndData();
  }, [managementId]);

  const fetchStepsAndData = async () => {
    try {
      // Get all steps in one call
      const stepsResponse = await api.get(`/case-steps/${managementId}`);
      if (stepsResponse.data.status === 'success') {
        const steps = stepsResponse.data.data.steps;
        
        // Process letters
        const letterSteps = steps.filter(step => step.key === 'letters');
        await fetchLettersForSteps(letterSteps);
        
        // Process retainers - get all retainers in one call
        const retainerSteps = steps.filter(step => step.key === 'retainer');
        if (retainerSteps.length > 0) {
          await fetchRetainersForSteps(retainerSteps);
        }
      }
    } catch (error) {
      console.error('Error fetching steps:', error);
      toast.error('Failed to load data');
    }
  };

  const fetchLettersForSteps = async (letterSteps) => {
    try {
      // Fetch letters for each step
      const allLettersPromises = letterSteps.map(step => 
        api.get(`/letters/management/${managementId}?stepId=${step._id}&status=final`)
          .then(response => ({
            response,
            stepId: step._id,
            stepName: step.name || step.displayName || 'Letter'
          }))
      );
      
      const responses = await Promise.all(allLettersPromises);
      
      // Combine all letters from different steps
      const allLetters = responses.reduce((acc, { response, stepId, stepName }) => {
        if (response.data.success) {
          const nonDraftLetters = response.data.data.filter(letter => 
            letter.status === 'final' || letter.status === 'approved'
          ).map(letter => ({
            ...letter,
            stepId,
            stepName
          }));
          return [...acc, ...nonDraftLetters];
        }
        return acc;
      }, []);
      
      setLetters(allLetters);
    } catch (error) {
      console.error('Error fetching letters:', error);
      toast.error('Failed to load letters');
    }
  };

  const fetchRetainersForSteps = async (retainerSteps) => {
    try {
      // Fetch retainers for each step in parallel
      const retainerPromises = retainerSteps.map(step => 
        api.get(`/retainer/case/${managementId}`, {
          params: { stepId: step._id }
        }).then(response => ({
          response,
          stepId: step._id,
          stepName: step.name || step.displayName || 'Retainer'
        }))
      );

      const responses = await Promise.all(retainerPromises);
      
      // Combine all retainers from different steps
      const allRetainers = responses.reduce((acc, { response, stepId, stepName }) => {
        if (response.data.status === 'success') {
          const retainerDocs = response.data.data.map(retainer => ({
            ...retainer,
            stepId,
            stepName
          }));
          return [...acc, ...retainerDocs];
        }
        return acc;
      }, []);
      
      setRetainers(allRetainers);
    } catch (error) {
      console.error('Error fetching retainers:', error);
      toast.error('Failed to load retainers');
    }
  };

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

  const handleDocumentSelect = (documentId) => {
    setSelectedDocuments(prev => {
      const newSelection = prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId];
      
      // Update selectedItems accordingly
      updateSelectedItems(newSelection, selectedLetters, selectedRetainers);
      return newSelection;
    });
  };

  const handleLetterSelect = (letterId) => {
    setSelectedLetters(prev => {
      const newSelection = prev.includes(letterId)
        ? prev.filter(id => id !== letterId)
        : [...prev, letterId];
      
      // Update selectedItems accordingly
      updateSelectedItems(selectedDocuments, newSelection, selectedRetainers);
      return newSelection;
    });
  };

  const handleRetainerSelect = (retainerId) => {
    setSelectedRetainers(prev => {
      const newSelection = prev.includes(retainerId)
        ? prev.filter(id => id !== retainerId)
        : [...prev, retainerId];
      
      // Update selectedItems accordingly
      updateSelectedItems(selectedDocuments, selectedLetters, newSelection);
      return newSelection;
    });
  };

  const updateSelectedItems = (docs, letters, retainers) => {
    const items = [
      ...docs.map(id => ({ id, type: 'document' })),
      ...letters.map(id => ({ id, type: 'letter' })),
      ...retainers.map(id => ({ id, type: 'retainer' }))
    ];
    setSelectedItems(items);
  };

  const handleSelectAll = () => {
    const allDocs = documents.map(doc => doc._id);
    const allLetters = letters.map(letter => letter._id);
    const allRetainers = retainers.map(retainer => retainer._id);
    const allSelected = selectedDocuments.length + selectedLetters.length + selectedRetainers.length === 
                       allDocs.length + allLetters.length + allRetainers.length;
    
    if (allSelected) {
      setSelectedDocuments([]);
      setSelectedLetters([]);
      setSelectedRetainers([]);
      setSelectedItems([]);
    } else {
      setSelectedDocuments(allDocs);
      setSelectedLetters(allLetters);
      setSelectedRetainers(allRetainers);
      updateSelectedItems(allDocs, allLetters, allRetainers);
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
    } else if (type === 'retainer') {
      setSelectedRetainers(prev => prev.filter(retainerId => retainerId !== id));
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
      toast.error('Please select at least one document, letter, or retainer');
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
            const letter = letters.find(l => l._id === item.id);
            if (!letter) {
              console.error(`Letter not found: ${item.id}`);
              continue;
            }
            const response = await api.get(`/letters/${item.id}/download?stepId=${letter.stepId}`, {
              responseType: 'arraybuffer'
            });
            const letterPdf = await PDFDocument.load(response.data);
            const pages = await mergedPdf.copyPages(letterPdf, letterPdf.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
            hasAddedPages = true;
          } else if (item.type === 'retainer') {
            const retainer = retainers.find(r => r._id === item.id);
            if (!retainer) {
              console.error(`Retainer not found: ${item.id}`);
              continue;
            }
            const response = await api.get(`/retainer/${item.id}/download?stepId=${retainer.stepId}`, {
              responseType: 'arraybuffer'
            });
            const retainerPdf = await PDFDocument.load(response.data);
            const pages = await mergedPdf.copyPages(retainerPdf, retainerPdf.getPageIndices());
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
        toast.error('No valid documents, letters, or retainers were found to combine');
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
      formData.append('retainers', JSON.stringify(selectedItems.filter(item => item.type === 'retainer').map(item => item.id)));
      formData.append('blankPages', JSON.stringify(selectedItems.map((item, index) => item.type === 'blank' ? index : null).filter(index => index !== null)));

      // Upload to backend
      const response = await api.post('/combined-pdfs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status === 'success') {
        // Update step status to completed
        try {
          await api.put(`/case-steps/case/${managementId}/step/packaging/status`, {
            status: 'completed'
          });
          console.log('[Debug] Successfully updated packaging step status');
          // Call the callback to refresh case steps
          if (onStepCompleted) {
            onStepCompleted();
          }
        } catch (stepError) {
          console.error('[Debug] Error updating packaging step status:', stepError);
          toast.error('Failed to update step status');
        }

        toast.success('Documents combined successfully');
        
        // Get the blob URL from the response
        const blobUrl = response.data.data.combinedPdf.blobUrl;
        const packageName = `Combined Documents ${new Date().toISOString().split('T')[0]}`;

        // Send email notification
        try {
          // Get document names for the email
          const documentNames = selectedItems
            .filter(item => item.type === 'document')
            .map(item => documents.find(d => d._id === item.id)?.originalName || 'Document');

          const letterNames = selectedItems
            .filter(item => item.type === 'letter')
            .map(item => letters.find(l => l._id === item.id)?.templateId?.name || 'Custom Letter');

          const retainerNames = selectedItems
            .filter(item => item.type === 'retainer')
            .map(item => retainers.find(r => r._id === item.id)?.name || 'Retainer Document');

          // Get management details to get the user's email
          const managementResponse = await api.get(`/management/${managementId}`);
          if (managementResponse.data.status === 'success' && managementResponse.data.data?.entry?.userId) {
            const userDetails = managementResponse.data.data.entry.userId;
            
            await api.post('/mail/package-notification', {
              recipientEmail: userDetails.email,
              userName: userDetails.name || 'User',
              packageName,
              packageUrl: blobUrl,
              documents: documentNames,
              letters: letterNames,
              retainers: retainerNames
            });
          }
        } catch (emailError) {
          console.error('Failed to send package notification:', emailError);
          // Don't block the download if email fails
        }
        
        try {
          // Fetch the PDF content
          const pdfResponse = await fetch(blobUrl);
          if (!pdfResponse.ok) throw new Error('Failed to download PDF');
          
          const blob = await pdfResponse.blob();
          
          // Create a download link
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${packageName}.pdf`;
          
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

  const allItems = [...documents, ...letters, ...retainers];
  const hasItems = allItems.length > 0;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Packaging</h2>
          <p className="text-sm text-gray-500 mt-1">
            Select documents, letters, and retainers to combine into a single package
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
          <p className="text-gray-500">No documents, letters, or retainers available</p>
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
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-600">
                            From: <span className="text-blue-600 font-medium">{letter.stepName || 'Letters Tab'}</span>
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">
                            Created on {new Date(letter.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {letter.content.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Retainers Section */}
            {retainers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Retainers</h3>
                <div className="space-y-3">
                  {retainers.map((retainer) => (
                    <div
                      key={retainer._id}
                      className={`flex items-center p-4 rounded-lg border transition-colors cursor-pointer ${
                        selectedRetainers.includes(retainer._id)
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleRetainerSelect(retainer._id)}
                    >
                      <div className={`p-2 rounded-lg mr-4 ${
                        selectedRetainers.includes(retainer._id)
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}>
                        {selectedRetainers.includes(retainer._id) ? (
                          <Check className="w-5 h-5 text-blue-600" />
                        ) : (
                          <FileCheck className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {retainer.name || 'Retainer Document'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-600">
                            From: <span className="text-blue-600 font-medium">{retainer.stepName || 'Retainer Tab'}</span>
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">
                            Created on {new Date(retainer.createdAt).toLocaleDateString()}
                          </span>
                        </div>
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
  stepId: PropTypes.string.isRequired,
  onStepCompleted: PropTypes.func
};

export default DocumentsArchiveTab; 