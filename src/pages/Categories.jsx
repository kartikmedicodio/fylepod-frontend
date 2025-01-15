import { useState, useEffect } from 'react';
import { FolderTree, Loader2, Plus, X, FileText, Check, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import DashboardLayout from '../layouts/DashboardLayout';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    documentTypes: [{ name: '', required: false }]
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data.categories);
    } catch (err) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocumentType = () => {
    setNewCategory({
      ...newCategory,
      documentTypes: [...newCategory.documentTypes, { name: '', required: false }]
    });
  };

  const handleRemoveDocumentType = (index) => {
    const updatedTypes = newCategory.documentTypes.filter((_, i) => i !== index);
    setNewCategory({
      ...newCategory,
      documentTypes: updatedTypes
    });
  };

  const handleDocumentTypeChange = (index, field, value) => {
    const updatedTypes = newCategory.documentTypes.map((type, i) => {
      if (i === index) {
        return { ...type, [field]: value };
      }
      return type;
    });
    setNewCategory({
      ...newCategory,
      documentTypes: updatedTypes
    });
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/categories', newCategory);
      setCategories([...categories, response.data.data.category]);
      setShowModal(false);
      setNewCategory({ name: '', description: '', documentTypes: [{ name: '', required: false }] });
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating category');
    }
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Create New Category</h2>
            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                rows="3"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Document Types</label>
                <button
                  type="button"
                  onClick={handleAddDocumentType}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Type
                </button>
              </div>
              
              {newCategory.documentTypes.map((type, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={type.name}
                      onChange={(e) => handleDocumentTypeChange(index, 'name', e.target.value)}
                      placeholder="Document Type Name"
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={type.required}
                      onChange={(e) => handleDocumentTypeChange(index, 'required', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Required</span>
                  </div>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDocumentType(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
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
                Create Category
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
          <h1 className="text-2xl font-semibold">Categories</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category._id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center mb-3">
                <FolderTree className="w-5 h-5 text-primary-500 mr-2" />
                <h3 className="text-lg font-medium">{category.name}</h3>
              </div>
              {category.description && (
                <p className="text-gray-600 text-sm mb-3">{category.description}</p>
              )}
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Document Types:</h4>
                <div className="space-y-2">
                  {category.documentTypes?.map((type) => (
                    <div key={type._id} className="flex items-center text-sm">
                      <FileText className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{type.name}</span>
                      {type.required ? (
                        <span className="ml-auto flex items-center text-green-600">
                          <Check className="w-4 h-4 mr-1" />
                          Required
                        </span>
                      ) : (
                        <span className="ml-auto flex items-center text-gray-500">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Optional
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {renderModal()}
      </div>
    </DashboardLayout>
  );
};

export default Categories; 