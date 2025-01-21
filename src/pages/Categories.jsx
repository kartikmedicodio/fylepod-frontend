import { useState, useEffect } from 'react';
import { FolderTree, Loader2, Plus, X, FileText, Check, AlertCircle, Edit } from 'lucide-react';
import api from '../utils/api';
import DashboardLayout from '../layouts/DashboardLayout';

const ProcessTypes = () => {
  const [processTypes, setProcessTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newProcessType, setNewProcessType] = useState({
    name: '',
    description: '',
    documentTypes: [{ 
      name: '', 
      required: false,
      questions: [{ text: '' }],
      validations: ['']
    }]
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProcessType, setEditingProcessType] = useState(null);

  useEffect(() => {
    fetchProcessTypes();
  }, []);

  const fetchProcessTypes = async () => {
    try {
      const response = await api.get('/categories');
      setProcessTypes(response.data.data.categories);
    } catch (err) {
      setError(err.message || 'Failed to fetch process types');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocumentType = () => {
    setNewProcessType({
      ...newProcessType,
      documentTypes: [...newProcessType.documentTypes, { 
        name: '', 
        required: false,
        questions: [{ text: '' }],
        validations: ['']
      }]
    });
  };

  const handleRemoveDocumentType = (index) => {
    const updatedTypes = newProcessType.documentTypes.filter((_, i) => i !== index);
    setNewProcessType({
      ...newProcessType,
      documentTypes: updatedTypes
    });
  };

  const handleDocumentTypeChange = (index, field, value) => {
    const updatedTypes = newProcessType.documentTypes.map((type, i) => {
      if (i === index) {
        return { ...type, [field]: value };
      }
      return type;
    });
    setNewProcessType({
      ...newProcessType,
      documentTypes: updatedTypes
    });
  };

  const handleAddQuestion = (docTypeIndex) => {
    const updatedTypes = newProcessType.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        return {
          ...type,
          questions: [...type.questions, { text: '' }]
        };
      }
      return type;
    });

    setNewProcessType({
      ...newProcessType,
      documentTypes: updatedTypes
    });
  };

  const handleQuestionChange = (docTypeIndex, questionIndex, value) => {
    const updatedTypes = newProcessType.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        const updatedQuestions = type.questions.map((q, qIdx) => {
          if (qIdx === questionIndex) {
            return { ...q, text: value };
          }
          return q;
        });
        return {
          ...type,
          questions: updatedQuestions
        };
      }
      return type;
    });

    setNewProcessType({
      ...newProcessType,
      documentTypes: updatedTypes
    });
  };

  const handleRemoveQuestion = (docTypeIndex, questionIndex) => {
    const updatedTypes = newProcessType.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        const updatedQuestions = type.questions.filter((_, qIdx) => qIdx !== questionIndex);
        return {
          ...type,
          questions: updatedQuestions
        };
      }
      return type;
    });

    setNewProcessType({
      ...newProcessType,
      documentTypes: updatedTypes
    });
  };

  const handleAddValidation = (docTypeIndex) => {
    const updatedTypes = newProcessType.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        return {
          ...type,
          validations: [...type.validations, '']
        };
      }
      return type;
    });

    setNewProcessType({
      ...newProcessType,
      documentTypes: updatedTypes
    });
  };

  const handleValidationChange = (docTypeIndex, validationIndex, value) => {
    const updatedTypes = newProcessType.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        const updatedValidations = [...type.validations];
        updatedValidations[validationIndex] = value;
        return {
          ...type,
          validations: updatedValidations
        };
      }
      return type;
    });

    setNewProcessType({
      ...newProcessType,
      documentTypes: updatedTypes
    });
  };

  const handleRemoveValidation = (docTypeIndex, validationIndex) => {
    const updatedTypes = newProcessType.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        const updatedValidations = type.validations.filter((_, vIdx) => vIdx !== validationIndex);
        return {
          ...type,
          validations: updatedValidations
        };
      }
      return type;
    });

    setNewProcessType({
      ...newProcessType,
      documentTypes: updatedTypes
    });
  };

  const handleCreateProcessType = async (e) => {
    e.preventDefault();
    try {
        const response = await api.post('/categories', newProcessType);
        if (response.data && response.data.data) {
            setProcessTypes([...processTypes, response.data.data]);
            setShowModal(false);
            setNewProcessType({ 
                name: '', 
                description: '', 
                documentTypes: [{ 
                    name: '', 
                    required: false, 
                    questions: [{ text: '' }],
                    validations: ['']
                }] 
            });
        }
    } catch (err) {
        console.error('Create error:', err);
        setError(err.response?.data?.message || 'Error creating process type');
    }
  };

  const handleEditClick = (processType) => {
    setEditingProcessType({
      ...processType,
      documentTypes: processType.documentTypes.map(type => ({
        ...type,
        questions: type.questions || [{ text: '' }],
        validations: type.validations || ['']
      }))
    });
    setShowEditModal(true);
  };

  const handleUpdateProcessType = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/categories/${editingProcessType._id}`, editingProcessType);
      
      setProcessTypes(processTypes.map(pt => 
        pt._id === editingProcessType._id ? response.data.data : pt
      ));
      
      setShowEditModal(false);
      setEditingProcessType(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating process type');
    }
  };

  const handleEditDocumentTypeChange = (index, field, value) => {
    const updatedTypes = editingProcessType.documentTypes.map((type, i) => {
      if (i === index) {
        return { ...type, [field]: value };
      }
      return type;
    });
    setEditingProcessType({
      ...editingProcessType,
      documentTypes: updatedTypes
    });
  };

  const handleEditAddQuestion = (docTypeIndex) => {
    const updatedTypes = editingProcessType.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        return {
          ...type,
          questions: [...type.questions, { text: '' }]
        };
      }
      return type;
    });

    setEditingProcessType({
      ...editingProcessType,
      documentTypes: updatedTypes
    });
  };

  const handleEditQuestionChange = (docTypeIndex, questionIndex, value) => {
    const updatedTypes = editingProcessType.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        const updatedQuestions = type.questions.map((q, qIdx) => {
          if (qIdx === questionIndex) {
            return { ...q, text: value };
          }
          return q;
        });
        return {
          ...type,
          questions: updatedQuestions
        };
      }
      return type;
    });

    setEditingProcessType({
      ...editingProcessType,
      documentTypes: updatedTypes
    });
  };

  const handleEditRemoveQuestion = (docTypeIndex, questionIndex) => {
    const updatedTypes = editingProcessType.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        const updatedQuestions = type.questions.filter((_, qIdx) => qIdx !== questionIndex);
        return {
          ...type,
          questions: updatedQuestions
        };
      }
      return type;
    });

    setEditingProcessType({
      ...editingProcessType,
      documentTypes: updatedTypes
    });
  };

  const handleEditAddValidation = (docTypeIndex) => {
    const updatedTypes = editingProcessType.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        return {
          ...type,
          validations: [...type.validations, '']
        };
      }
      return type;
    });

    setEditingProcessType({
      ...editingProcessType,
      documentTypes: updatedTypes
    });
  };

  const handleEditValidationChange = (docTypeIndex, validationIndex, value) => {
    const updatedTypes = editingProcessType.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        const updatedValidations = [...type.validations];
        updatedValidations[validationIndex] = value;
        return {
          ...type,
          validations: updatedValidations
        };
      }
      return type;
    });

    setEditingProcessType({
      ...editingProcessType,
      documentTypes: updatedTypes
    });
  };

  const handleEditRemoveValidation = (docTypeIndex, validationIndex) => {
    const updatedTypes = editingProcessType.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        const updatedValidations = type.validations.filter((_, vIdx) => vIdx !== validationIndex);
        return {
          ...type,
          validations: updatedValidations
        };
      }
      return type;
    });

    setEditingProcessType({
      ...editingProcessType,
      documentTypes: updatedTypes
    });
  };

  const handleEditRemoveDocumentType = (index) => {
    const updatedTypes = editingProcessType.documentTypes.filter((_, i) => i !== index);
    setEditingProcessType({
      ...editingProcessType,
      documentTypes: updatedTypes
    });
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Create New Process Type</h2>
            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateProcessType} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={newProcessType.name}
                onChange={(e) => setNewProcessType({ ...newProcessType, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newProcessType.description}
                onChange={(e) => setNewProcessType({ ...newProcessType, description: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                rows="3"
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Document Types</label>
                <button
                  type="button"
                  onClick={handleAddDocumentType}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Document Type
                </button>
              </div>
              
              {newProcessType.documentTypes.map((type, typeIndex) => (
                <div key={typeIndex} className="border rounded-lg p-4 space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={type.name}
                        onChange={(e) => handleDocumentTypeChange(typeIndex, 'name', e.target.value)}
                        placeholder="Document Type Name"
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                        required
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={type.required}
                        onChange={(e) => handleDocumentTypeChange(typeIndex, 'required', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Required</span>
                    </div>
                    {typeIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDocumentType(typeIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Suggested Questions</label>
                      <button
                        type="button"
                        onClick={() => handleAddQuestion(typeIndex)}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        + Add Suggested Question
                      </button>
                    </div>
                    
                    {type.questions.map((question, questionIndex) => (
                      <div key={questionIndex} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={question.text}
                          onChange={(e) => handleQuestionChange(typeIndex, questionIndex, e.target.value)}
                          placeholder="Enter suggested question"
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                          required
                        />
                        {type.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(typeIndex, questionIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Validations</label>
                      <button
                        type="button"
                        onClick={() => handleAddValidation(typeIndex)}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        + Add Validation
                      </button>
                    </div>
                    
                    {type.validations.map((validation, validationIndex) => (
                      <div key={validationIndex} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={validation}
                          onChange={(e) => handleValidationChange(typeIndex, validationIndex, e.target.value)}
                          placeholder="Enter validation rule"
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                          required
                        />
                        {type.validations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveValidation(typeIndex, validationIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Create Process Type
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Process Types</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Process Type
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processTypes && processTypes.map((processType) => (
            <div key={processType?._id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <FolderTree className="w-5 h-5 text-primary-500 mr-2" />
                  <h3 className="text-lg font-medium">{processType?.name}</h3>
                </div>
                <button
                  onClick={() => handleEditClick(processType)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              {processType?.description && (
                <p className="text-gray-600 text-sm mb-4">{processType.description}</p>
              )}
              
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Document Types:</h4>
                <div className="space-y-4">
                  {processType?.documentTypes?.map((type) => (
                    <div key={type?._id || Math.random()} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-medium text-sm">{type?.name}</span>
                        </div>
                        {type?.required && (
                          <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                      
                      {type?.questions?.length > 0 && (
                        <div className="mt-2 pl-6 border-l-2 border-gray-200">
                          <p className="text-xs font-medium text-gray-500 mb-1">Suggested Questions:</p>
                          <ul className="space-y-1">
                            {type.questions.map((question, qIndex) => (
                              <li 
                                key={qIndex} 
                                className="text-sm text-gray-600 flex items-start"
                              >
                                <span className="text-xs text-gray-400 mr-2 mt-1">•</span>
                                {question?.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {type?.validations?.length > 0 && (
                        <div className="mt-2 pl-6 border-l-2 border-gray-200">
                          <p className="text-xs font-medium text-gray-500 mb-1">Validations:</p>
                          <ul className="space-y-1">
                            {type.validations.map((validation, vIndex) => (
                              <li key={vIndex} className="text-sm text-gray-600 flex items-start">
                                <Check className="w-3 h-3 text-green-500 mr-2 mt-1" />
                                {validation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {showEditModal && editingProcessType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Edit Process Type</h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProcessType} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editingProcessType.name}
                    onChange={(e) => setEditingProcessType({ 
                      ...editingProcessType, 
                      name: e.target.value 
                    })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={editingProcessType.description}
                    onChange={(e) => setEditingProcessType({ 
                      ...editingProcessType, 
                      description: e.target.value 
                    })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    rows="3"
                  />
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">Document Types</label>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedTypes = [...editingProcessType.documentTypes, {
                          name: '',
                          required: false,
                          questions: [{ text: '' }],
                          validations: ['']
                        }];
                        setEditingProcessType({
                          ...editingProcessType,
                          documentTypes: updatedTypes
                        });
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      + Add Document Type
                    </button>
                  </div>
                  
                  {editingProcessType.documentTypes.map((type, typeIndex) => (
                    <div key={typeIndex} className="border rounded-lg p-4 space-y-4">
                      <div className="flex gap-4 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={type.name}
                            onChange={(e) => handleEditDocumentTypeChange(typeIndex, 'name', e.target.value)}
                            placeholder="Document Type Name"
                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                            required
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={type.required}
                            onChange={(e) => handleEditDocumentTypeChange(typeIndex, 'required', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">Required</span>
                        </div>
                        {typeIndex > 0 && (
                          <button
                            type="button"
                            onClick={() => handleEditRemoveDocumentType(typeIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-gray-700">Suggested Questions</label>
                          <button
                            type="button"
                            onClick={() => handleEditAddQuestion(typeIndex)}
                            className="text-xs text-primary-600 hover:text-primary-700"
                          >
                            + Add Suggested Question
                          </button>
                        </div>
                        
                        {type.questions.map((question, questionIndex) => (
                          <div key={questionIndex} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={question.text}
                              onChange={(e) => handleEditQuestionChange(typeIndex, questionIndex, e.target.value)}
                              placeholder="Enter suggested question"
                              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                              required
                            />
                            {type.questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleEditRemoveQuestion(typeIndex, questionIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-gray-700">Validations</label>
                          <button
                            type="button"
                            onClick={() => handleEditAddValidation(typeIndex)}
                            className="text-xs text-primary-600 hover:text-primary-700"
                          >
                            + Add Validation
                          </button>
                        </div>
                        
                        {type.validations.map((validation, validationIndex) => (
                          <div key={validationIndex} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={validation}
                              onChange={(e) => handleEditValidationChange(typeIndex, validationIndex, e.target.value)}
                              placeholder="Enter validation rule"
                              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                              required
                            />
                            {type.validations.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleEditRemoveValidation(typeIndex, validationIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  >
                    Update Process Type
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {renderModal()}
      </div>
    </DashboardLayout>
  );
};

export default ProcessTypes; 