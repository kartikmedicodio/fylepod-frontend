import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Search, Edit, Plus } from 'lucide-react';
import api from '../utils/api';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import EditChecklistModal from '../components/modals/EditChecklistModal';
import PropTypes from 'prop-types';

const DocumentChecklist = ({ setCurrentBreadcrumb }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Process Template');
  const { setCurrentBreadcrumb: contextSetBreadcrumb } = useBreadcrumb();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchCategoryDetails();
  }, [id]);

  const fetchCategoryDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/categories/${id}`);
      if (response.data.status === 'success') {
        setCategory(response.data.data.category);
        // Use the prop instead of context
        setCurrentBreadcrumb([
          { label: 'Dashboard', link: '/' },
          { label: 'Knowledge Base', link: '/knowledge' },
          { label: response.data.data.category.name, link: '#' }
        ]);
      }
    } catch (err) {
      setError('Failed to fetch category details');
      console.error('Error fetching category details:', err);
    } finally {
      setLoading(false);
    }
  };

  const sidebarCategories = [
    { id: 'kb', name: 'Knowledge Base', path: '/knowledge', clickable: true },
    { id: 'pt', name: 'Process Template', path: '/knowledge/templates', clickable: true },
    { id: 'mdl', name: 'Master Document List', path: '/knowledge/master-documents', clickable: false },
    { id: 'fl', name: 'Forms List', path: '/knowledge/forms', clickable: false },
    { id: 'lt', name: 'Letter Templates', path: '/knowledge/letter-templates', clickable: false }
  ];

  const navigationTabs = [
    { id: 'doc-checklist', name: 'Document Checklist', path: '/knowledge/checklist' },
    { id: 'forms-list', name: 'Forms List', path: '/knowledge/forms-list' },
    { id: 'questionnaire-list', name: 'Questionnaire List', path: '/knowledge/questionnaire' },
    { id: 'letter-templates', name: 'Letter Templates', path: '/knowledge/letters' }
  ];

  const handleSidebarClick = (categoryName, path, clickable) => {
    if (!clickable) return;
    setSelectedCategory(categoryName);
    navigate(path);
  };

  const isSelected = (categoryPath) => {
    if (location.pathname.includes('/knowledge/checklist')) {
      return categoryPath === '/knowledge/templates';
    }
    return location.pathname === categoryPath;
  };

  const renderSidebar = () => (
    <div className="w-64 bg-white">
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
      // Close modal first
      setIsEditModalOpen(false);
      
      // Then update the data if successful
      if (response.data) {
        setCategory(updatedCategory);
        await fetchCategoryDetails();
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
      alert('Failed to update checklist. Please try again.');
      // Close modal even if there's an error
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
    <div className="flex h-full">
      {renderSidebar()}

      {/* Main Content */}
      <div className="flex-1 bg-[#f8fafc]">
        {/* Navigation Tabs */}
        <div className="px-6 pt-6 flex gap-2">
          {navigationTabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 rounded-lg text-sm ${
                tab.name === 'Document Checklist'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="px-6 pt-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

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
            </div>
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
        <div className="px-6 pt-6 pb-6">
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit className="h-4 w-4" />
              Edit Checklist
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Plus className="h-4 w-4" />
              Add more
            </button>
          </div>
        </div>
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