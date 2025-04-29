import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Edit2, Clock, ChevronDown, Plus, X } from 'lucide-react';
import api from '../utils/api';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/KBSidebar';
import EditChecklistModal from '../components/modals/EditChecklistModal';

const DocumentChecklist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Document Checklist');
  const { setCurrentBreadcrumb } = useBreadcrumb();
  // State for inline validation dropdown
  const [openValidationDocId, setOpenValidationDocId] = useState(null);
  // State for edit process modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditDocChecklistModalOpen, setIsEditDocChecklistModalOpen] = useState(false);
  const [isAddFormModalOpen, setIsAddFormModalOpen] = useState(false);
  const [allForms, setAllForms] = useState([]);
  const [selectedFormIds, setSelectedFormIds] = useState([]);
  const [formSearch, setFormSearch] = useState("");
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [isFormSelected, setIsFormSelected] = useState({});
  const [isAddingForms, setIsAddingForms] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    // Update breadcrumb before navigation
    setCurrentBreadcrumb([
      { label: 'Dashboard', link: '/' },
      { label: 'Knowledge Base', link: '/knowledge' },
      { label: category, link: '#' }
    ]);
    navigate('/knowledge');
  };

  // Tabs configuration
  const tabs = [
    'Document Checklist',
    'Forms'
  ];

  useEffect(() => {
    if (id) {
      fetchCategoryDetails();
    }
  }, [id]);

  const fetchCategoryDetails = async (refresh = true) => {
    try {
      setLoading(true);
      
      // Fetch category details
      const categoryResponse = await api.get(`/categories/${id}`);
      if (categoryResponse.data.status === 'success') {
        const categoryData = categoryResponse.data.data.category;
        setCategory(categoryData);
        
        // Set documents from the category data
        if (categoryData.documentTypes) {
          setDocuments(categoryData.documentTypes);
        }

        // Update breadcrumb
        setCurrentBreadcrumb([
          { label: 'Dashboard', link: '/' },
          { label: 'Knowledge Base', link: '/knowledge' },
          { label: categoryData.name, link: '#' }
        ]);

        // Use forms from category data
        setForms(categoryData.forms || []);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch category details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveForm = async (formId) => {
    try {
      // Update UI immediately for better user experience
      setForms(prevForms => prevForms.filter(form => form._id !== formId));
      setCategory(prevCategory => ({
        ...prevCategory,
        forms: prevCategory.forms.filter(form => form._id !== formId)
      }));

      // Get the current category data from state
      const updatedForms = category.forms
        .filter(form => form._id !== formId)
        .map(form => form._id);

      // API call - Update the category with the new forms array
      const response = await api.put(`/categories/${id}`, {
        forms: updatedForms
      });

      if (response.data.success) {
        toast.success('Form removed successfully');
      } else {
        // If the API call fails, revert the UI changes
        await fetchCategoryDetails();
        toast.error(response.data.message || 'Failed to remove form');
      }
    } catch (err) {
      console.error('Error removing form:', err);
      // Revert the UI changes if the API call fails
      await fetchCategoryDetails();
      toast.error(err.response?.data?.message || 'Failed to remove form');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full gap-4 mt-8">
        <Sidebar onCategorySelect={handleCategorySelect} selectedCategory={category?.name} />
        <div className="flex-1 bg-[#f8fafc] rounded-lg shadow-sm h-fit">
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full gap-4 mt-8">
        <Sidebar onCategorySelect={handleCategorySelect} selectedCategory={category?.name} />
        <div className="flex-1 bg-[#f8fafc] rounded-lg shadow-sm h-fit p-6">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 mt-8">
      <Sidebar onCategorySelect={handleCategorySelect} selectedCategory={category?.name} />

      {/* Main Content */}
      <div className="flex-1 bg-[#f8fafc] rounded-lg p-6">
        {/* Category Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {category?.name}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {category?.description}
              </p>
              {category?.deadline > 0 && (
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1 text-gray-400" />
                  <span>Expected completion time: {category.deadline} days</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:text-blue-600'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'Document Checklist' && (
          <>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Document Checklist</h2>
                <p className="text-gray-500 mb-6">Below is the list of required and optional documents for this process. Please review each document and its validations.</p>
              </div>
              <button
                className="ml-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                onClick={() => setIsEditModalOpen(true)}
                title="Edit Process"
              >
                <Edit2 className="h-4 w-4 inline" />
                Edit Process
              </button>
            </div>
          </>
        )}

        {activeTab === 'Document Checklist' && (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc._id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <h3 className="text-sm font-medium text-gray-900 mr-2">{doc.name}</h3>
                    {doc.required && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Required
                      </span>
                    )}
                  </div>
                  <button
                    className="px-3 py-1 rounded border border-blue-200 text-blue-600 text-xs font-medium hover:bg-blue-50 transition-colors"
                    onClick={() => setOpenValidationDocId(openValidationDocId === doc._id ? null : doc._id)}
                  >
                    {openValidationDocId === doc._id ? 'Hide Validations' : 'View Validations'}
                  </button>
                </div>
                {openValidationDocId === doc._id && (
                  <div className="mt-3 w-full">
                    <div className="mb-2">
                      <h4 className="text-sm font-semibold text-gray-800">Validations</h4>
                    </div>
                    {doc.validations && doc.validations.length > 0 ? (
                      <ul className="space-y-2 border border-gray-200 rounded-lg bg-gray-50 p-3">
                        {doc.validations.map((val, idx) => (
                          <li key={idx} className="p-2 rounded bg-white border border-gray-100 text-sm">
                            {val}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-500">No validations found for this document.</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Forms' && (
          <>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Forms</h2>
                <p className="text-gray-500 mb-6">Below is the list of forms associated with this process. Please review and use the relevant forms as needed.</p>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                onClick={async () => {
                  setIsAddFormModalOpen(true);
                  setIsLoadingForms(true);
                  // Fetch all forms from backend
                  try {
                    const response = await api.get('/forms');
                    if (response.data.status === 'success') {
                      setAllForms(response.data.data.forms);
                    }
                  } catch (err) {
                    setAllForms([]);
                  } finally {
                    setIsLoadingForms(false);
                  }
                }}
              >
                <Plus className="h-4 w-4 inline" />
                Add Form
              </button>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {forms.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-gray-500 text-center py-8">No forms available.</td>
                    </tr>
                  ) : (
                    forms.map(form => (
                      <tr key={form._id} className="bg-white">
                        <td className="px-6 py-4 text-sm font-mono text-gray-900">{form._id?.substring(0, 8)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{form.form_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{form.description || 'No description available'}</td>
                        <td className="px-6 py-4 text-sm">
                          {form.form_links ? (
                            <a href={form.form_links} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{form.form_name}</a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{form.createdAt ? new Date(form.createdAt).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleRemoveForm(form._id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove form"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Add Form Modal */}
            {isAddFormModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-0 max-w-lg w-full shadow-lg">
                  <div className="px-6 pt-6 pb-2 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Add Forms to Process</h2>
                    <button className="text-gray-400 hover:text-gray-600 p-1" onClick={() => setIsAddFormModalOpen(false)}>
                      <span className="sr-only">Close</span>
                      &times;
                    </button>
                  </div>
                  <div className="px-6 pt-4">
                    <input
                      type="text"
                      placeholder="Search forms by name or description..."
                      className="w-full mb-4 px-3 py-2 border border-gray-200 rounded text-sm"
                      value={formSearch}
                      onChange={e => setFormSearch(e.target.value)}
                    />
                    <div className="max-h-64 overflow-y-auto">
                      {isLoadingForms ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      ) : allForms.length === 0 ? (
                        <div className="text-gray-500">No forms available.</div>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {allForms
                            .filter(form =>
                              form.form_name.toLowerCase().includes(formSearch.toLowerCase()) ||
                              (form.description || '').toLowerCase().includes(formSearch.toLowerCase())
                            )
                            .map(form => {
                              const alreadyAdded = forms.some(f => f._id === form._id);
                              return (
                                <li
                                  key={form._id}
                                  className={`flex items-center gap-3 py-3 rounded-lg px-2
                                    ${selectedFormIds.includes(form._id) && !alreadyAdded ? 'bg-blue-50' : ''}
                                    ${alreadyAdded ? 'group' : 'cursor-pointer hover:bg-gray-50'}
                                  `}
                                  onClick={() => {
                                    if (alreadyAdded) return;
                                    setSelectedFormIds(ids =>
                                      ids.includes(form._id)
                                        ? ids.filter(id => id !== form._id)
                                        : [...ids, form._id]
                                    );
                                  }}
                                  style={alreadyAdded ? {} : {}}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{form.form_name}</div>
                                    <div className="text-xs text-gray-500 truncate">{form.description || 'No description'}</div>
                                  </div>
                                  {alreadyAdded && (
                                    <div className="text-blue-600">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                  {selectedFormIds.includes(form._id) && !alreadyAdded && (
                                    <div className="text-blue-600">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                  {/* Custom style for not-allowed cursor on hover if already added */}
                                  <style jsx>{`
                                    li.group:hover {
                                      cursor: not-allowed !important;
                                      background: #fff !important;
                                    }
                                  `}</style>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="px-6 py-4 flex justify-end gap-2 border-t border-gray-100">
                    <button
                      className="px-4 py-2 bg-gray-200 rounded"
                      onClick={() => setIsAddFormModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={async () => {
                        // Only add forms that are not already in the category
                        const newFormIds = selectedFormIds.filter(
                          id => !forms.some(f => f._id === id)
                        );
                        if (newFormIds.length === 0) {
                          setIsAddFormModalOpen(false);
                          setSelectedFormIds([]);
                          return;
                        }
                        try {
                          setIsAddingForms(true);
                          await api.put(`/categories/${id}`, {
                            forms: [...(category.forms || []), ...newFormIds]
                          });
                          
                          // Update forms state with the new forms
                          const newForms = allForms.filter(form => newFormIds.includes(form._id));
                          setForms(prevForms => [...prevForms, ...newForms]);
                          setCategory(prevCategory => ({
                            ...prevCategory,
                            forms: [...(prevCategory.forms || []), ...newFormIds]
                          }));
                          
                          setIsAddFormModalOpen(false);
                          setSelectedFormIds([]);
                        } catch (err) {
                          setIsAddFormModalOpen(false);
                          setSelectedFormIds([]);
                          toast.error('Failed to add forms');
                        } finally {
                          setIsAddingForms(false);
                        }
                      }}
                      disabled={isAddingForms}
                    >
                      {isAddingForms ? 'Adding...' : 'Add Selected'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Process Modal */}
      <EditChecklistModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        category={category}
        onSave={async (updatedCategory) => {
          try {
            const response = await api.put(`/categories/${id}`, updatedCategory);
            if (response.data.status === 'success' || response.data.success) {
              setIsEditModalOpen(false);
              await fetchCategoryDetails(false);
            }
          } catch (error) {
            toast.error('Failed to update process');
            setIsEditModalOpen(false);
          }
        }}
      />

      {/* Edit Document Checklist Modal */}
      {isEditDocChecklistModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 min-w-[350px] max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Edit Document Checklist</h2>
            {/* Add your document checklist editing UI here */}
            <div className="mb-4 text-gray-500">
              Document checklist editing UI goes here.
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setIsEditDocChecklistModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => {
                  // Placeholder save action
                  setIsEditDocChecklistModalOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentChecklist; 