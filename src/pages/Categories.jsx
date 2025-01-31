import { useState, useEffect } from 'react';
import { FolderTree, Loader2, Plus, X, FileText, Check, AlertCircle, Edit } from 'lucide-react';
import api from '../utils/api';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion } from 'framer-motion';

const ProcessTemplates = () => {
  const [processTemplates, setProcessTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newProcessTemplate, setNewProcessTemplate] = useState({
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
  const [editingProcessTemplate, setEditingProcessTemplate] = useState(null);

  useEffect(() => {
    fetchProcessTemplates();
  }, []);

  const fetchProcessTemplates = async () => {
    try {
      const response = await api.get('/categories');
      setProcessTemplates(response.data.data.categories);
    } catch (err) {
      setError(err.message || 'Failed to fetch process templates');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocumentType = () => {
    setNewProcessTemplate({
      ...newProcessTemplate,
      documentTypes: [...newProcessTemplate.documentTypes, { 
        name: '', 
        required: false,
        questions: [{ text: '' }],
        validations: ['']
      }]
    });
  };

  const handleRemoveDocumentType = (index) => {
    const updatedTypes = newProcessTemplate.documentTypes.filter((_, i) => i !== index);
    setNewProcessTemplate({
      ...newProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const handleDocumentTypeChange = (index, field, value) => {
    const updatedTypes = newProcessTemplate.documentTypes.map((type, i) => {
      if (i === index) {
        return { ...type, [field]: value };
      }
      return type;
    });
    setNewProcessTemplate({
      ...newProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const handleAddQuestion = (docTypeIndex) => {
    const updatedTypes = newProcessTemplate.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        return {
          ...type,
          questions: [...type.questions, { text: '' }]
        };
      }
      return type;
    });

    setNewProcessTemplate({
      ...newProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const handleQuestionChange = (docTypeIndex, questionIndex, value) => {
    const updatedTypes = newProcessTemplate.documentTypes.map((type, idx) => {
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

    setNewProcessTemplate({
      ...newProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const handleRemoveQuestion = (docTypeIndex, questionIndex) => {
    const updatedTypes = newProcessTemplate.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        const updatedQuestions = type.questions.filter((_, qIdx) => qIdx !== questionIndex);
        return {
          ...type,
          questions: updatedQuestions
        };
      }
      return type;
    });

    setNewProcessTemplate({
      ...newProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const handleAddValidation = (docTypeIndex) => {
    const updatedTypes = newProcessTemplate.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        return {
          ...type,
          validations: [...type.validations, '']
        };
      }
      return type;
    });

    setNewProcessTemplate({
      ...newProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const handleValidationChange = (docTypeIndex, validationIndex, value) => {
    const updatedTypes = newProcessTemplate.documentTypes.map((type, idx) => {
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

    setNewProcessTemplate({
      ...newProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const handleRemoveValidation = (docTypeIndex, validationIndex) => {
    const updatedTypes = newProcessTemplate.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        const updatedValidations = type.validations.filter((_, vIdx) => vIdx !== validationIndex);
        return {
          ...type,
          validations: updatedValidations
        };
      }
      return type;
    });

    setNewProcessTemplate({
      ...newProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const handleCreateProcessTemplate = async (e) => {
    e.preventDefault();
    try {
        const response = await api.post('/categories', newProcessTemplate);
        if (response.data && response.data.data) {
            setProcessTemplates([...processTemplates, response.data.data]);
            setShowModal(false);
            setNewProcessTemplate({ 
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
        setError(err.response?.data?.message || 'Error creating process template');
    }
  };

  const handleEditClick = (processTemplate) => {
    setEditingProcessTemplate({
      ...processTemplate,
      documentTypes: processTemplate.documentTypes.map(type => ({
        ...type,
        questions: type.questions || [{ text: '' }],
        validations: type.validations || ['']
      }))
    });
    setShowEditModal(true);
  };

  const handleUpdateProcessTemplate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/categories/${editingProcessTemplate._id}`, editingProcessTemplate);
      
      setProcessTemplates(processTemplates.map(pt => 
        pt._id === editingProcessTemplate._id ? response.data.data : pt
      ));
      
      setShowEditModal(false);
      setEditingProcessTemplate(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating process template');
    }
  };

  const handleEditDocumentTypeChange = (index, field, value) => {
    const updatedTypes = editingProcessTemplate.documentTypes.map((type, i) => {
      if (i === index) {
        return { ...type, [field]: value };
      }
      return type;
    });
    setEditingProcessTemplate({
      ...editingProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const handleEditAddQuestion = (docTypeIndex) => {
    const updatedTypes = editingProcessTemplate.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        return {
          ...type,
          questions: [...type.questions, { text: '' }]
        };
      }
      return type;
    });

    setEditingProcessTemplate({
      ...editingProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const handleEditQuestionChange = (docTypeIndex, questionIndex, value) => {
    const updatedTypes = editingProcessTemplate.documentTypes.map((type, idx) => {
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

    setEditingProcessTemplate({
      ...editingProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const handleEditRemoveQuestion = (docTypeIndex, questionIndex) => {
    const updatedTypes = editingProcessTemplate.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        const updatedQuestions = type.questions.filter((_, qIdx) => qIdx !== questionIndex);
        return {
          ...type,
          questions: updatedQuestions
        };
      }
      return type;
    });

    setEditingProcessTemplate({
      ...editingProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const handleEditAddValidation = (docTypeIndex) => {
    const updatedTypes = editingProcessTemplate.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        return {
          ...type,
          validations: [...type.validations, '']
        };
      }
      return type;
    });

    setEditingProcessTemplate({
      ...editingProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const handleEditValidationChange = (docTypeIndex, validationIndex, value) => {
    const updatedTypes = editingProcessTemplate.documentTypes.map((type, idx) => {
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

    setEditingProcessTemplate({
      ...editingProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const handleEditRemoveValidation = (docTypeIndex, validationIndex) => {
    const updatedTypes = editingProcessTemplate.documentTypes.map((type, idx) => {
      if (idx === docTypeIndex) {
        const updatedValidations = type.validations.filter((_, vIdx) => vIdx !== validationIndex);
        return {
          ...type,
          validations: updatedValidations
        };
      }
      return type;
    });

    setEditingProcessTemplate({
      ...editingProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const handleEditRemoveDocumentType = (index) => {
    const updatedTypes = editingProcessTemplate.documentTypes.filter((_, i) => i !== index);
    setEditingProcessTemplate({
      ...editingProcessTemplate,
      documentTypes: updatedTypes
    });
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm flex items-center justify-center z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 shadow-xl border border-gray-200"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Create New Process Template</h2>
            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateProcessTemplate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={newProcessTemplate.name}
                onChange={(e) => setNewProcessTemplate({ ...newProcessTemplate, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newProcessTemplate.description}
                onChange={(e) => setNewProcessTemplate({ ...newProcessTemplate, description: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                rows="3"
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Document List</label>
                <button
                  type="button"
                  onClick={handleAddDocumentType}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Document
                </button>
              </div>
              
              {newProcessTemplate.documentTypes.map((type, typeIndex) => (
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
                        className="text-xs text-blue-600 hover:text-blue-700"
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
                        className="text-xs text-blue-600 hover:text-blue-700"
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Create Process Template
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Process Templates</h1>
            <p className="text-gray-600 mt-1">Manage and organize your document processing workflows</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-blue-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Process Template
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 rounded-t-xl">
            <div className="col-span-3 font-medium text-gray-700">Process Template</div>
            <div className="col-span-9 font-medium text-gray-700">Document List</div>
          </div>

          <div className="divide-y divide-gray-100">
            {processTemplates && processTemplates.map((processTemplate) => (
              <motion.div
                key={processTemplate?._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 group transition-colors duration-200"
              >
                <div className="col-span-3">
                  <div className="flex items-start space-x-3">
                    <motion.div 
                      whileHover={{ rotate: 15 }}
                      className="p-2 bg-blue-50 rounded-lg shrink-0"
                    >
                      <FolderTree className="w-5 h-5 text-blue-500" />
                    </motion.div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                        {processTemplate?.name}
                      </h3>
                      {processTemplate?.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{processTemplate.description}</p>
                      )}
                      <button
                        onClick={() => handleEditClick(processTemplate)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-span-9">
                  <div className="flex flex-wrap gap-3">
                    {processTemplate?.documentTypes?.map((type) => (
                      <motion.div
                        key={type?._id || Math.random()}
                        whileHover={{ y: -2 }}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-blue-200 transition-all duration-200 flex-grow basis-[calc(50%-0.75rem)]"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="font-semibold text-base text-gray-900">{type?.name}</span>
                          </div>
                          {type?.required && (
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                              Required
                            </span>
                          )}
                        </div>

                        {type?.questions?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-600 mb-2">Suggested Questions:</p>
                            <div className="pl-3 border-l-2 border-gray-100 space-y-2">
                              {type.questions.map((question, qIndex) => (
                                <div key={qIndex} className="flex items-start gap-2">
                                  <span className="text-gray-400 mt-1 text-xs">•</span>
                                  <p className="text-xs text-gray-500 leading-relaxed">
                                    {question.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {type?.validations?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-2">Validations:</p>
                            <div className="pl-3 border-l-2 border-gray-100 space-y-2">
                              {type.validations.map((validation, vIndex) => (
                                <div key={vIndex} className="flex items-center gap-2">
                                  <Check className="w-3 h-3 text-gray-400" />
                                  <p className="text-xs text-gray-500">
                                    {validation}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {showEditModal && editingProcessTemplate && (
          <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 shadow-xl border border-gray-200"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Edit Process Template</h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProcessTemplate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editingProcessTemplate.name}
                    onChange={(e) => setEditingProcessTemplate({ 
                      ...editingProcessTemplate, 
                      name: e.target.value 
                    })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={editingProcessTemplate.description}
                    onChange={(e) => setEditingProcessTemplate({ 
                      ...editingProcessTemplate, 
                      description: e.target.value 
                    })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    rows="3"
                  />
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">Document List</label>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedTypes = [...editingProcessTemplate.documentTypes, {
                          name: '',
                          required: false,
                          questions: [{ text: '' }],
                          validations: ['']
                        }];
                        setEditingProcessTemplate({
                          ...editingProcessTemplate,
                          documentTypes: updatedTypes
                        });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Document
                    </button>
                  </div>
                  
                  {editingProcessTemplate.documentTypes.map((type, typeIndex) => (
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
                            className="text-xs text-blue-600 hover:text-blue-700"
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
                            className="text-xs text-blue-600 hover:text-blue-700"
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
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Update Process Template
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {renderModal()}
      </div>
    </DashboardLayout>
  );
};

export default ProcessTemplates; 