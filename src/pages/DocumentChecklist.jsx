import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Search, Edit, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Process Template');
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (selectedCategory === 'Process Template') {
      fetchCategoryDetails();
    } else if (selectedCategory === 'Master Document List') {
      fetchMasterDocuments();
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

  const fetchCategoryDetails = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await api.get(`/categories/${id}`);
      if (response.data.status === 'success') {
        setCategory(response.data.data.category);
        setCurrentBreadcrumb([
          { name: 'Dashboard', path: '/' },
          { name: 'Knowledge Base', path: '/knowledge' },
          { name: response.data.data.category.name, path: '#' }
        ]);
      }
    } catch (err) {
      setError('Failed to fetch category details');
      console.error('Error fetching category details:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const sidebarCategories = [
    { id: 'back', name: '← Back', path: '/knowledge', clickable: true },
    { id: 'pt', name: 'Process Template', path: '/knowledge/templates', clickable: true },
    { id: 'mdl', name: 'Master Document List', path: '/knowledge/master-documents', clickable: true }
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
      setSelectedCategory(categoryName);
      setCurrentBreadcrumb([
        { name: 'Dashboard', path: '/' },
        { name: 'Knowledge Base', path: '/knowledge' },
        { name: 'Master Document List', path: '#' }
      ]);
      fetchMasterDocuments();
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
      return selectedCategory === 'Master Document List';
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
        {selectedCategory === 'Master Document List' ? (
          // Master Documents List View
          <div className="px-6 pt-6">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="min-w-full divide-y divide-gray-200">
                <div className="bg-white">
                  <div className="grid grid-cols-3 px-6 py-3 border-b border-gray-200">
                    <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Name
                    </div>
                    <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Validations
                    </div>
                    <div className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider justify-end">
                      Created At
                    </div>
                  </div>
                </div>
                <div className="bg-white divide-y divide-gray-200">
                  {masterDocuments
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((doc) => (
                      <div key={doc._id} className="grid grid-cols-3 px-6 py-4 hover:bg-gray-50">
                        <div className="text-sm text-gray-900">{doc.name}</div>
                        <div className="text-sm text-gray-500">
                          <ul className="list-disc pl-4 space-y-1">
                            {doc.validations.map((validation, index) => (
                              <li key={index} className="whitespace-pre-wrap break-words">{validation}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-sm text-gray-500 text-right">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
              <div>
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, masterDocuments.length)} of {masterDocuments.length}
              </div>
              <div>
                Page {currentPage} of {Math.ceil(masterDocuments.length / itemsPerPage)}
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
              <div className="space-y-4">
                {category?.documentTypes.map((doc) => (
                  <div key={doc._id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium">{doc.name}</h3>
                        {doc.validations && doc.validations.length > 0 && (
                          <div className="mt-1">
                            <div className="space-y-1.5 pl-2">
                              {doc.validations.map((validation, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                                    <svg 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      className="w-2 h-2 text-white"
                                      stroke="currentColor"
                                    >
                                      <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth="3" 
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                      />
                                    </svg>
                                  </div>
                                  <span className="text-xs text-gray-600">{validation}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {doc.required && (
                        <span className="text-xs text-green-600 font-medium">Required</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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