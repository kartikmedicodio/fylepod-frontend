import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Search, Edit, Plus } from 'lucide-react';
import api from '../utils/api';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import EditChecklistModal from '../components/modals/EditChecklistModal';

const DocumentChecklist = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Process Template');
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchCategoryDetails();
  }, [id]);

  const fetchCategoryDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      const selectedCategory = response.data.data.categories.find(cat => cat._id === id);
      
      if (selectedCategory) {
        setCategory(selectedCategory);
        setCurrentBreadcrumb({
          breadcrumbs: [
            { name: 'Knowledge Base', path: '/knowledge', id: 'kb' },
            { name: 'Process Templates', path: '/knowledge', id: 'pt' },
            { name: 'Document Checklist', path: `/knowledge/checklist/${id}`, id: 'dc' }
          ]
        });
      } else {
        setError('Category not found');
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

        {/* Category Header */}
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
        </div>

        {/* Document List */}
        <div className="px-6 pt-6 pb-6">
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {category?.documentTypes.map((doc, index) => (
              <div key={doc._id} className="flex flex-col">
                {/* Document Header */}
                <div className="flex items-center gap-4 px-6 py-4">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {doc.name}
                    </div>
                  </div>
                  {doc.required && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                      Required
                    </span>
                  )}
                </div>

                {/* Questions and Validations */}
                <div className="px-14 pb-4">
                  {/* Questions Section */}
                  {doc.questions && doc.questions.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Questions
                      </h4>
                      <div className="space-y-2">
                        {doc.questions.map((question, qIndex) => (
                          <div 
                            key={question._id} 
                            className="flex items-start gap-2 text-sm text-gray-600"
                          >
                            <span className="text-gray-400">{qIndex + 1}.</span>
                            <span>{question.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Validations Section */}
                  {doc.validations && doc.validations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Validations
                      </h4>
                      <div className="space-y-2">
                        {doc.validations.map((validation, vIndex) => (
                          <div 
                            key={vIndex}
                            className="flex items-start gap-2 text-sm text-gray-600"
                          >
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                              <span className="text-xs text-blue-600">✓</span>
                            </div>
                            <span>{validation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
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

export default DocumentChecklist; 