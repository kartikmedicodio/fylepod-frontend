import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Search, Edit, Plus, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, Link as LinkIcon } from 'lucide-react';
import api from '../utils/api';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import EditChecklistModal from '../components/modals/EditChecklistModal';
import PropTypes from 'prop-types';

const DocumentChecklist = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [masterDocuments, setMasterDocuments] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Process Template');
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [expandedDocs, setExpandedDocs] = useState({});
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    if (selectedCategory === 'Process Template') {
      console.log('Initiating category details fetch for ID:', id);
      fetchCategoryDetails();
    } else if (selectedCategory === 'Master Form List') {
      fetchForms();
    }
  }, [id, selectedCategory]);

  const fetchMasterDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/masterdocuments');
      if (response.data.status === 'success') {
        setMasterDocuments(response.data.data.masterDocuments);
      }
    } catch (err) {
      setError('Failed to fetch master documents');
      console.error('Error fetching master documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchForms = async () => {
    try {
      setLoading(true);
      console.log('Fetching forms for category:', id);
      const response = await api.get(`/forms?category_id=${id}`);
      console.log('Forms API response:', response.data);
      if (response.data.status === 'success') {
        setForms(response.data.data.forms);
      }
    } catch (err) {
      setError('Failed to fetch forms');
      console.error('Error fetching forms:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryDetails = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      if (!id) {
        setError('Category ID is missing');
        console.error('Category ID is missing');
        return;
      }

      console.log('Fetching category details for ID:', id);
      const response = await api.get(`/categories/${id}`);
      
      console.log('API Response:', response);

      if (response.data.status === 'success') {
        setCategory(response.data.data.category);
        setCurrentBreadcrumb([
          { name: 'Dashboard', path: '/' },
          { name: 'Knowledge Base', path: '/knowledge' },
          { name: response.data.data.category.name, path: '#' }
        ]);
      } else {
        setError(`Failed to fetch category details: ${response.data.message || 'Unknown error'}`);
        console.error('API returned non-success status:', response.data);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      setError(`Failed to fetch category details: ${errorMessage}`);
      console.error('Error fetching category details:', {
        error: err,
        message: errorMessage,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const sidebarCategories = [
    { id: 'back', name: '← Back', path: '/knowledge', clickable: true },
    { id: 'pt', name: 'Process Template', path: '/knowledge/templates', clickable: true },
    { id: 'mdl', name: 'Forms List', path: '/knowledge/master-documents', clickable: true }
  ];

  const handleSidebarClick = (categoryName, path, clickable) => {
    if (!clickable) return;
    if (categoryName === '← Back') {
      navigate(path);
      return;
    }
    if (categoryName === 'Process Template') {
      setSelectedCategory(categoryName);
      return;
    }
    if (path === '/knowledge/master-documents') {
      setSelectedCategory('Master Form List');
      setCurrentBreadcrumb([
        { name: 'Dashboard', path: '/' },
        { name: 'Knowledge Base', path: '/knowledge' },
        { name: 'Master Form List', path: '#' }
      ]);
    }
  };

  const isSelected = (categoryPath) => {
    if (categoryPath === '/knowledge') {
      return false; // Back button is never selected
    }
    if (categoryPath === '/knowledge/templates') {
      return selectedCategory === 'Process Template';
    }
    if (categoryPath === '/knowledge/master-documents') {
      return selectedCategory === 'Master Form List';
    }
    return false;
  };

  const renderSidebar = () => (
    <div className="w-64 bg-white shadow-sm rounded-lg h-fit">
      <div className="p-4">
        {sidebarCategories.map((category) => (
          <Link
            key={category.id}
            to={category.path}
            className={`block w-full text-left px-4 py-2 rounded-lg text-sm mb-1 ${
              isSelected(category.path)
                ? 'bg-blue-50 text-blue-600'
                : category.clickable 
                  ? 'text-gray-700 hover:bg-gray-50'
                  : 'text-gray-400 cursor-not-allowed'
            }`}
            onClick={(e) => {
              e.preventDefault();
              handleSidebarClick(category.name, category.path, category.clickable);
            }}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );

  const handleSaveChecklist = async (updatedCategory) => {
    try {
      const response = await api.put(`/categories/${id}`, updatedCategory);
      
      if (response.data.success) {
        // Close modal first
        setIsEditModalOpen(false);
        // Then refresh data in background
        await fetchCategoryDetails(false);
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
      alert('Failed to update checklist. Please try again.');
      setIsEditModalOpen(false);
    }
  };

  const toggleDocument = (docId) => {
    setExpandedDocs(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  const handleDocumentClick = (doc) => {
    console.log('Document clicked:', doc);
    setSelectedDoc(selectedDoc?._id === doc._id ? null : doc);
  };

  if (loading) {
    return (
      <div className="flex h-full">
        {renderSidebar()}
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full">
        {renderSidebar()}
        <div className="flex-1 p-6 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 mt-10">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-sm rounded-lg h-fit">
        {renderSidebar()}
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-[#f8fafc] rounded-lg shadow-sm h-fit">
        {selectedCategory === 'Master Form List' ? (
          // Forms List View
          <div className="px-6 pt-6">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="min-w-full divide-y divide-gray-200">
                <div className="bg-white">
                  <div className="grid grid-cols-4 px-6 py-3 border-b border-gray-200">
                    <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Form Name
                    </div>
                    <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </div>
                    <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Links
                    </div>
                    <div className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider justify-end">
                      Created At
                    </div>
                  </div>
                </div>
                <div className="bg-white divide-y divide-gray-200">
                  {forms.length === 0 ? (
                    <div className="px-6 py-8">
                      <div className="text-center text-gray-500">
                        <div className="text-sm">No forms available</div>
                      </div>
                    </div>
                  ) : (
                    forms
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((form) => (
                        <div key={form._id} className="grid grid-cols-4 px-6 py-4 hover:bg-gray-50">
                          <div className="text-sm text-gray-900">{form.form_name}</div>
                          <div className="text-sm text-gray-500">
                            {form.description || 'No description available'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {form.form_links && form.form_links.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {form.form_links.map((link, index) => (
                                  <a
                                    key={index}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline truncate w-fit"
                                  >
                                    <LinkIcon className="h-4 w-4" />
                                    <span className="truncate">{form.form_name}</span>
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">No links available</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 text-right">
                            {new Date(form.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, forms.length)} of {forms.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || forms.length === 0}
                  className={`p-1 rounded hover:bg-gray-100 ${
                    currentPage === 1 || forms.length === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {Math.max(1, Math.ceil(forms.length / itemsPerPage))}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(forms.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(forms.length / itemsPerPage) || forms.length === 0}
                  className={`p-1 rounded hover:bg-gray-100 ${
                    currentPage === Math.ceil(forms.length / itemsPerPage) || forms.length === 0 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-600'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Original Process Template View
          <>
            {/* Category Header with Description and AI Banner */}
            <div className="px-6 pt-6">
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
                      <Clock className="h-4 w-4 mr-1 text-blue-500" />
                      <span>Expected completion time: <strong>{category.deadline} days</strong></span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm"
                >
                  <Edit className="h-4 w-4" />
                  Edit Process
                </button>
              </div>
              
              {/* AI Validation Banner */}
              <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-blue-500">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    AI-Powered Document Validation
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 ml-6">
                  Our AI agent automatically verifies all document requirements during upload
                </p>
              </div>
            </div>

            {/* Document List */}
            <div className="px-6 pt-6 pb-6 h-fit">
              {/* Header Section with Document Checklist */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Document Checklist</h2>
                  <p className="mt-1 text-sm text-gray-500">List of required documents and their validation requirements.</p>
                </div>
              </div>

              {/* Existing Document List */}
              <div className="space-y-4">
                {category?.documentTypes.map((doc) => (
                  <div key={doc._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Document Header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-50 rounded-lg">
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{doc.name}</h3>
                          {doc.required && (
                            <span className="text-xs text-blue-600 font-medium">Required</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleDocument(doc._id)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                          expandedDocs[doc._id]
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {expandedDocs[doc._id] ? 'Hide Verification' : 'View Verification'}
                      </button>
                    </div>

                    {/* Requirements Section (Expandable) */}
                    {expandedDocs[doc._id] && (
                      <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                        <div className="pt-4">
                          <div className="space-y-4">
                            {/* Requirements Section */}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="p-1 bg-blue-100 rounded-lg">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                </div>
                                <h4 className="text-sm font-medium text-gray-900">Document Requirements</h4>
                              </div>
                              <div className="space-y-3 ml-8">
                                {doc.validations?.map((validation, index) => (
                                  <div key={index} className="flex items-start gap-2">
                                    <div className="mt-1">
                                      <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                    <span className="text-sm text-gray-600">{validation}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Verification Results Section */}
                            {doc.validationResults && (
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="p-1 bg-green-100 rounded-lg">
                                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <h4 className="text-sm font-medium text-gray-900">Verification Results</h4>
                                </div>
                                <div className="space-y-2 ml-8">
                                  {doc.validationResults.map((result, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                      {result.status === 'success' ? (
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                                      ) : (
                                        <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                      )}
                                      <span className={`text-sm ${
                                        result.status === 'success' ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {result.message}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Centered Modal Overlay */}
            {selectedDoc && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                {/* Dark overlay */}
                <div 
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  onClick={() => setSelectedDoc(null)}
                ></div>

                {/* Modal container */}
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    {/* Card Header */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-50 rounded-lg">
                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h4 className="text-sm font-medium text-gray-900">{selectedDoc.name} Requirements</h4>
                        </div>
                        <button
                          onClick={() => setSelectedDoc(null)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      <div className="space-y-4">
                        {selectedDoc.validations?.map((validation, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="mt-1">
                              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-sm text-gray-600">{validation}</span>
                          </div>
                        ))}
                      </div>

                      {selectedDoc.validationResults && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-1 bg-green-50 rounded-lg">
                              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h4 className="text-sm font-medium text-gray-900">Verification Results</h4>
                          </div>
                          <div className="space-y-3">
                            {selectedDoc.validationResults.map((result, index) => (
                              <div key={index} className="flex items-start gap-2">
                                {result.status === 'success' ? (
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                )}
                                <span className={`text-sm ${
                                  result.status === 'success' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {result.message}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Modal */}
      <EditChecklistModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        category={category}
        onSave={handleSaveChecklist}
      />
    </div>
  );
};

DocumentChecklist.propTypes = {
  setCurrentBreadcrumb: PropTypes.func.isRequired
};

export default DocumentChecklist; 