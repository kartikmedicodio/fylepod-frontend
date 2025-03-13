import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Clock, Check, ChevronDown, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import api from '../../utils/api';

const EditChecklistModal = ({ isOpen, onClose, category, onSave }) => {
  const [editedCategory, setEditedCategory] = useState({
    name: '',
    description: '',
    deadline: 0,
    documentTypes: []
  });
  const [masterDocuments, setMasterDocuments] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (category) {
      setEditedCategory({
        ...category,
        documentTypes: category.documentTypes || []
      });
    } else {
      setEditedCategory({
        name: '',
        description: '',
        deadline: 0,
        documentTypes: []
      });
    }
  }, [category]);

  useEffect(() => {
    if (isOpen) {
      fetchMasterDocuments();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchMasterDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/masterdocuments');
      if (response.data.status === 'success') {
        setMasterDocuments(response.data.data.masterDocuments);
      } else {
        setError('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching master documents:', error);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCategoryChange = (field, value) => {
    setEditedCategory({ ...editedCategory, [field]: value });
  };

  const handleDocumentChange = (docIndex, field, value) => {
    const updatedDocs = [...editedCategory.documentTypes];
    const doc = updatedDocs[docIndex];
    
    // If doc is a string (just ID), get the full document from masterDocuments
    if (typeof doc === 'string') {
      const fullDoc = masterDocuments.find(d => d._id === doc);
      if (fullDoc) {
        updatedDocs[docIndex] = { ...fullDoc, [field]: value };
      }
    } else {
      updatedDocs[docIndex] = { ...doc, [field]: value };
    }
    
    const updatedCategory = {
      ...editedCategory,
      documentTypes: updatedDocs
    };
    
    setEditedCategory(updatedCategory);
  };

  const handleSave = async (categoryToSave = editedCategory) => {
    try {
      if (!categoryToSave.name?.trim()) {
        alert('Please enter a process name');
        return;
      }

      if (categoryToSave.documentTypes.length === 0) {
        alert('Please add at least one document');
        return;
      }

      setIsSaving(true);
      const deadlineValue = parseInt(categoryToSave.deadline) || 0;
      
      const documentIds = categoryToSave.documentTypes.map(doc => {
        const id = typeof doc === 'string' ? doc : doc._id;
        return id;
      });
      
      const cleanedCategory = {
        name: categoryToSave.name,
        description: categoryToSave.description || '',
        deadline: deadlineValue,
        documentTypes: documentIds
      };

      if (category?._id) {
        // Update existing category
        const response = await api.patch(`/categories/${category._id}`, cleanedCategory);
        
        if (response.data.success) {
          // Call onSave to trigger parent refresh
          await onSave(response.data.data);
          setError(null);
          onClose(); // Close modal after successful update
        } else {
          throw new Error(response.data.message || 'Failed to update category');
        }
      } else {
        // Create new category
        await onSave(cleanedCategory);
        onClose(); // Close modal after successful creation
      }
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save changes. Please try again.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDocument = (docId) => {
    const doc = masterDocuments.find(d => d._id === docId);
    if (!doc) return;

    const updatedDocs = [...editedCategory.documentTypes];
    const existingIndex = updatedDocs.findIndex(d => 
      (d._id === docId) || (typeof d === 'string' && d === docId)
    );

    if (existingIndex >= 0) {
      // Remove document if already selected
      updatedDocs.splice(existingIndex, 1);
    } else {
      // Add new document
      updatedDocs.push(doc);
    }

    const updatedCategory = {
      ...editedCategory,
      documentTypes: updatedDocs
    };

    setEditedCategory(updatedCategory);
  };

  const removeDocument = (docIndex) => {
    const updatedDocs = [...editedCategory.documentTypes];
    updatedDocs.splice(docIndex, 1);
    const updatedCategory = {
      ...editedCategory,
      documentTypes: updatedDocs
    };
    setEditedCategory(updatedCategory);
  };

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ${
      isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl transform transition-transform duration-300 scale-100">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-semibold text-gray-900">
            {category ? 'Edit Process' : 'Create New Process'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Process Details Section */}
          <div className="space-y-6 mb-8">
            <div className="grid gap-6">
              <div>
                <label htmlFor="name" className="block mb-2 text-sm font-semibold text-gray-700">
                  Process Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={editedCategory?.name || ''}
                  onChange={(e) => handleCategoryChange('name', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  placeholder="Enter process name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block mb-2 text-sm font-semibold text-gray-700">
                  Process Description
                </label>
                <textarea
                  id="description"
                  value={editedCategory?.description || ''}
                  onChange={(e) => handleCategoryChange('description', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  rows="3"
                  placeholder="Describe the purpose of this process"
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="deadline" className="block mb-2 text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Deadline (days)
                </label>
                <div className="max-w-[200px]">
                  <input
                    type="number"
                    id="deadline"
                    min="0"
                    value={editedCategory?.deadline || 0}
                    onChange={(e) => handleCategoryChange('deadline', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Number of days typically needed to complete this process
                </p>
              </div>
            </div>
          </div>
          
          {/* Document Selection Section */}
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-700">
                Required Documents <span className="text-red-500">*</span>
              </label>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={loading}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white flex items-center justify-between transition-colors ${
                  loading ? 'bg-gray-50 text-gray-500' : 'border-gray-300 hover:border-gray-400'
                } ${error ? 'border-red-300 bg-red-50' : ''}`}
              >
                <span className="truncate">Select documents...</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'transform rotate-180' : ''
                }`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px] overflow-auto">
                  {masterDocuments.map(doc => {
                    const isSelected = editedCategory.documentTypes.some(d => 
                      (d._id === doc._id) || (typeof d === 'string' && d === doc._id)
                    );

                    return (
                      <div
                        key={doc._id}
                        onClick={() => toggleDocument(doc._id)}
                        className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-blue-50 transition-colors"
                      >
                        <div className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <span className="flex-1 text-gray-700">
                          {doc.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
                Loading documents...
              </div>
            )}
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {/* Selected Documents List */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Selected Documents</h3>
            
            {editedCategory?.documentTypes?.length > 0 ? (
              <div className="space-y-4">
                {editedCategory.documentTypes.map((doc, docIndex) => (
                  <div 
                    key={typeof doc === 'string' ? doc : doc._id} 
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {typeof doc === 'string' 
                              ? masterDocuments.find(d => d._id === doc)?.name || 'Loading...'
                              : doc.name
                            }
                          </h4>
                        </div>
                        <button
                          onClick={() => removeDocument(docIndex)}
                          className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {typeof doc !== 'string' && (
                        <div className="mt-4">
                          {doc.validations?.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-gray-500 mb-2">Validations</h5>
                              <ul className="space-y-2 text-sm text-gray-600">
                                {doc.validations.map((validation, vIndex) => (
                                  <li key={vIndex} className="flex gap-2">
                                    <span className="text-gray-400">{vIndex + 1}.</span>
                                    {validation}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                No documents added yet. Please select documents from the dropdown above.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-200 flex justify-end gap-3 bg-white sticky bottom-0 z-10">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave()}
            disabled={isSaving}
            className={`px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
              isSaving ? 'pl-4 pr-8' : ''
            }`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

EditChecklistModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  category: PropTypes.object,
  onSave: PropTypes.func.isRequired
};

export default EditChecklistModal; 