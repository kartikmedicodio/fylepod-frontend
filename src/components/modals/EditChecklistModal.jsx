import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock } from 'lucide-react';
import PropTypes from 'prop-types';

const EditChecklistModal = ({ isOpen, onClose, category, onSave }) => {
  const [editedCategory, setEditedCategory] = useState(category);

  useEffect(() => {
    setEditedCategory(category);
  }, [category]);

  if (!isOpen) return null;

  const handleCategoryChange = (field, value) => {
    setEditedCategory({ ...editedCategory, [field]: value });
  };

  const handleDocumentChange = (docIndex, field, value) => {
    const updatedDocs = [...editedCategory.documentTypes];
    updatedDocs[docIndex] = { ...updatedDocs[docIndex], [field]: value };
    setEditedCategory({ ...editedCategory, documentTypes: updatedDocs });
  };

  const handleQuestionChange = (docIndex, qIndex, newText) => {
    const updatedDocs = [...editedCategory.documentTypes];
    updatedDocs[docIndex].questions[qIndex] = {
      ...updatedDocs[docIndex].questions[qIndex],
      text: newText
    };
    setEditedCategory({ ...editedCategory, documentTypes: updatedDocs });
  };

  const handleValidationChange = (docIndex, vIndex, newText) => {
    const updatedDocs = [...editedCategory.documentTypes];
    updatedDocs[docIndex].validations[vIndex] = newText;
    setEditedCategory({ ...editedCategory, documentTypes: updatedDocs });
  };

  const addQuestion = (docIndex) => {
    const updatedDocs = [...editedCategory.documentTypes];
    updatedDocs[docIndex].questions.push({
      text: ''
    });
    setEditedCategory({ ...editedCategory, documentTypes: updatedDocs });
  };

  const addValidation = (docIndex) => {
    const updatedDocs = [...editedCategory.documentTypes];
    updatedDocs[docIndex].validations.push('');
    setEditedCategory({ ...editedCategory, documentTypes: updatedDocs });
  };

  const removeQuestion = (docIndex, qIndex) => {
    const updatedDocs = [...editedCategory.documentTypes];
    updatedDocs[docIndex].questions.splice(qIndex, 1);
    setEditedCategory({ ...editedCategory, documentTypes: updatedDocs });
  };

  const removeValidation = (docIndex, vIndex) => {
    const updatedDocs = [...editedCategory.documentTypes];
    updatedDocs[docIndex].validations.splice(vIndex, 1);
    setEditedCategory({ ...editedCategory, documentTypes: updatedDocs });
  };

  const addNewDocument = () => {
    const newDoc = {
      name: '',
      required: false,
      questions: [],
      validations: []
    };
    
    setEditedCategory({
      ...editedCategory,
      documentTypes: [...editedCategory.documentTypes, newDoc]
    });
  };

  const removeDocument = (docIndex) => {
    const updatedDocs = [...editedCategory.documentTypes];
    updatedDocs.splice(docIndex, 1);
    setEditedCategory({
      ...editedCategory,
      documentTypes: updatedDocs
    });
  };

  const handleSave = async () => {
    try {
      const deadlineValue = parseInt(editedCategory.deadline) || 0;
      
      const cleanedCategory = {
        ...editedCategory,
        deadline: deadlineValue,
        documentTypes: editedCategory.documentTypes.map(doc => {
          if (doc._id && doc._id.length === 24) {
            return doc;
          }
          
          return {
            name: doc.name,
            required: doc.required,
            questions: doc.questions.map(q => ({
              text: q.text
            })),
            validations: doc.validations
          };
        })
      };

      await onSave(cleanedCategory);
      onClose();
    } catch (error) {
      console.error('Error saving changes:', error);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Edit Checklist</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Process Details */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700">
                  Process Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={editedCategory?.name || ''}
                  onChange={(e) => handleCategoryChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700">
                  Process Description
                </label>
                <textarea
                  id="description"
                  value={editedCategory?.description || ''}
                  onChange={(e) => handleCategoryChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows="2"
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="deadline" className="block mb-1 text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Deadline (days)
                </label>
                <input
                  type="number"
                  id="deadline"
                  min="0"
                  value={editedCategory?.deadline || 0}
                  onChange={(e) => handleCategoryChange('deadline', parseInt(e.target.value) || 0)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Number of days typically needed to complete this process
                </p>
              </div>
            </div>
          </div>
          
          {/* Add Document Button */}
          <button
            onClick={addNewDocument}
            className="mb-6 w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Document
          </button>

          {editedCategory?.documentTypes.map((doc, docIndex) => (
            <div key={doc._id} className="mb-8 p-6 border border-gray-200 rounded-lg">
              {/* Document Header with Remove Button */}
              <div className="flex items-center gap-4 mb-4">
                <input
                  type="text"
                  value={doc.name}
                  placeholder="Enter document name"
                  onChange={(e) => handleDocumentChange(docIndex, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">Status: -</span>
                  <span className="text-sm text-gray-500">Usage: -</span>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={doc.required}
                    onChange={(e) => handleDocumentChange(docIndex, 'required', e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Required</span>
                </label>
                <button
                  onClick={() => removeDocument(docIndex)}
                  className="text-red-500 hover:text-red-600 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Questions Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Questions</h3>
                  <button
                    onClick={() => addQuestion(docIndex)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Question
                  </button>
                </div>
                {doc.questions.map((q, qIndex) => (
                  <div key={q._id} className="flex items-start gap-2 mb-2">
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => handleQuestionChange(docIndex, qIndex, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={() => removeQuestion(docIndex, qIndex)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Validations Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Validations</h3>
                  <button
                    onClick={() => addValidation(docIndex)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Validation
                  </button>
                </div>
                {doc.validations.map((v, vIndex) => (
                  <div key={vIndex} className="flex items-start gap-2 mb-2">
                    <input
                      type="text"
                      value={v}
                      onChange={(e) => handleValidationChange(docIndex, vIndex, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={() => removeValidation(docIndex, vIndex)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Save Changes
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