import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Clock, Edit2, CheckCircle, XCircle, FileText, Plus, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import api from '../utils/api';
import { usePage } from '../contexts/PageContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/KBSidebar';
import { useNavigate, useLocation } from 'react-router-dom';

const KnowledgeBase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [masterDocuments, setMasterDocuments] = useState([]);
  const [forms, setForms] = useState([]);
  const [letterTemplates, setLetterTemplates] = useState([]);
  const [retainerTemplates, setRetainerTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Process Template');
  const [currentPages, setCurrentPages] = useState({
    'Process Template': 1,
    'Master Document List': 1,
    'Master Forms List': 1,
    'Letter Templates': 1,
    'Retainer Templates': 1
  });
  const itemsPerPage = 5;
  const { setPageTitle } = usePage();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [deadlineValue, setDeadlineValue] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [expandedPromptId, setExpandedPromptId] = useState(null);

  // Initial setup and data fetch
  useEffect(() => {
    setPageTitle('Knowledge Base');
    setCurrentBreadcrumb([
      { label: 'Dashboard', link: '/' },
      { label: 'Knowledge Base', link: '/knowledge' }
    ]);

    // Only fetch if we don't have categories data
    if (categories.length === 0) {
      setLoading(true);
      api.get('/categories')
        .then(response => {
          if (response.data.status === 'success') {
            setCategories(response.data.data.categories);
          }
        })
        .catch(err => {
          console.error('Error fetching categories:', err);
          setError('Failed to load initial data');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []); // Empty dependency array for single execution

  const handleCategorySelect = async (category) => {
    // Don't refetch if selecting Process Template and we already have data
    if (category === 'Process Template' && categories.length > 0) {
      setSelectedCategory(category);
      setCurrentBreadcrumb([
        { label: 'Dashboard', link: '/' },
        { label: 'Knowledge Base', link: '/knowledge' },
        { label: category, link: '#' }
      ]);
      return;
    }

    setSelectedCategory(category);
    setLoading(true);
    setError(null);

    // Update breadcrumb immediately
    setCurrentBreadcrumb([
      { label: 'Dashboard', link: '/' },
      { label: 'Knowledge Base', link: '/knowledge' },
      { label: category, link: '#' }
    ]);

    try {
      let response;
      switch (category) {
        case 'Process Template':
          response = await api.get('/categories');
          if (response.data.status === 'success') {
            setCategories(response.data.data.categories);
          }
          break;
        case 'Master Document List':
          response = await api.get('/masterdocuments');
          if (response.data.status === 'success') {
            setMasterDocuments(response.data.data.masterDocuments);
          }
          break;
        case 'Master Forms List':
          response = await api.get('/forms');
          if (response.data.status === 'success') {
            setForms(response.data.data.forms);
          }
          break;
        case 'Letter Templates':
          response = await api.get('/letter-templates');
          if (response.data.status === 'success') {
            setLetterTemplates(response.data.data);
          }
          break;
        case 'Retainer Templates':
          response = await api.get('/retainer-templates');
          if (response.data) {
            setRetainerTemplates(response.data);
          }
          break;
      }
    } catch (err) {
      console.error('Error loading category data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/knowledge/checklist/${categoryId}`);
  };

  const handleDeadlineEdit = (e, category) => {
    e.stopPropagation(); // Prevent row click event
    setEditingDeadline(category._id);
    setDeadlineValue(category.deadline?.toString() || '0');
  };

  const handleDeadlineChange = (e) => {
    setDeadlineValue(e.target.value);
  };

  const handleDeadlineKeyDown = (e, categoryId) => {
    if (e.key === 'Enter') {
      saveDeadline(categoryId);
    } else if (e.key === 'Escape') {
      setEditingDeadline(null);
    }
  };

  const saveDeadline = async (categoryId) => {
    try {
      const value = parseInt(deadlineValue);
      if (isNaN(value) || value < 0) {
        toast.error('Please enter a valid number of days');
        return;
      }

      const response = await api.patch(`/categories/${categoryId}`, {
        deadline: value
      });

      if (response.data.success) {
        // Update the local state with the new deadline
        setCategories(categories.map(cat => 
          cat._id === categoryId ? {...cat, deadline: value} : cat
        ));
        toast.success('Deadline updated successfully');
      } else {
        toast.error('Failed to update deadline');
      }
    } catch (err) {
      console.error('Error updating deadline:', err);
      toast.error('Failed to update deadline');
    } finally {
      setEditingDeadline(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="px-6 py-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="px-6 py-4 text-center text-red-500">
          {error}
        </div>
      );
    }

    const filteredItems = selectedCategory === 'Process Template' 
      ? categories.filter(category =>
          category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : selectedCategory === 'Master Document List'
      ? masterDocuments.filter(doc =>
          doc.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : selectedCategory === 'Letter Templates'
      ? letterTemplates.filter(template =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.internalPrompt?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : selectedCategory === 'Retainer Templates'
      ? retainerTemplates.filter(template =>
          template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (template.company_id?.company_name || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      : forms.filter(form =>
          form.form_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          form.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );

    if (filteredItems.length === 0) {
      return (
        <div className="px-6 py-4 text-center text-gray-500">
          No items found
        </div>
      );
    }

    // Calculate pagination
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPages[selectedCategory] - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredItems.slice(startIndex, endIndex);

    return (
      <>
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="min-w-full divide-y divide-gray-200">
            {selectedCategory !== 'Letter Templates' && selectedCategory !== 'Retainer Templates' && (
              <div className="bg-white">
                <div className={`grid ${
                  selectedCategory === 'Process Template' 
                    ? 'grid-cols-5' 
                    : selectedCategory === 'Letter Templates' || selectedCategory === 'Retainer Templates'
                    ? 'grid-cols-4'
                    : 'grid-cols-4'
                } px-6 py-3 border-b border-gray-200`}>
                  {selectedCategory === 'Process Template' ? (
                    <>
                      <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Process Name
                      </div>
                      <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Process Description
                      </div>
                      <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </div>
                      <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deadline (days)
                      </div>
                      <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage
                      </div>
                    </>
                  ) : selectedCategory === 'Master Forms List' ? (
                    <>
                      <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </div>
                      <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Form Name
                      </div>
                      <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </div>
                      <div className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document Name
                      </div>
                      <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Required
                      </div>
                      <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Validations
                      </div>
                      <div className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="bg-white divide-y divide-gray-200">
              {selectedCategory === 'Letter Templates' ? (
                <>
                  <div className="p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
                      {currentItems.map((item) => {
                        const isExpanded = expandedPromptId === item._id;
                        return (
                          <div
                            key={item._id}
                            className={`bg-white rounded-lg shadow border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow duration-200 cursor-pointer ${isExpanded ? 'ring-2 ring-blue-300' : ''}`}
                            onClick={() => setExpandedPromptId(isExpanded ? null : item._id)}
                          >
                            <div className="mb-2 text-base font-semibold text-gray-800">{item.name}</div>
                            <div className="mb-2 text-sm text-gray-600">{item.description || 'No description'}</div>
                            <div className="mb-2 text-sm text-gray-700">
                              {isExpanded ? (
                                <>
                                  {item.internalPrompt}
                                  <div className="mt-2">
                                    <button
                                      className="text-blue-500 hover:underline text-xs focus:outline-none"
                                      onClick={e => { e.stopPropagation(); setExpandedPromptId(null); }}
                                    >
                                      Collapse
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {item.internalPrompt.length > 120
                                    ? item.internalPrompt.slice(0, 120) + '...'
                                    : item.internalPrompt}
                                </>
                              )}
                            </div>
                            <div className="mt-auto text-xs text-gray-400 text-right">{new Date(item.createdAt).toLocaleDateString()}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Pagination */}
                  <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
                    <div>
                      Showing {startIndex + 1} - {Math.min(endIndex, filteredItems.length)} of {filteredItems.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPages(prev => ({
                          ...prev,
                          [selectedCategory]: Math.max(1, prev[selectedCategory] - 1)
                        }))}
                        disabled={currentPages[selectedCategory] === 1}
                        className={`p-1 rounded-md ${
                          currentPages[selectedCategory] === 1 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span>
                        Page {currentPages[selectedCategory]} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPages(prev => ({
                          ...prev,
                          [selectedCategory]: Math.min(totalPages, prev[selectedCategory] + 1)
                        }))}
                        disabled={currentPages[selectedCategory] === totalPages}
                        className={`p-1 rounded-md ${
                          currentPages[selectedCategory] === totalPages 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : selectedCategory === 'Retainer Templates' ? (
                <>
                  <div className="p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
                      {currentItems.map((item) => (
                        <div
                          key={item._id}
                          className="bg-white rounded-lg shadow border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="mb-2 text-base font-semibold text-gray-800">{item.template_name}</div>
                          <div className="mb-2 text-sm text-gray-600">{item.company_id?.company_name || 'No company'}</div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</div>
                            <button
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                              onClick={e => { e.stopPropagation(); window.open(item.pdf_url, '_blank'); }}
                              disabled={!item.pdf_url}
                            >
                              View PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Pagination */}
                  <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
                    <div>
                      Showing {startIndex + 1} - {Math.min(endIndex, filteredItems.length)} of {filteredItems.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPages(prev => ({
                          ...prev,
                          [selectedCategory]: Math.max(1, prev[selectedCategory] - 1)
                        }))}
                        disabled={currentPages[selectedCategory] === 1}
                        className={`p-1 rounded-md ${
                          currentPages[selectedCategory] === 1 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span>
                        Page {currentPages[selectedCategory]} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPages(prev => ({
                          ...prev,
                          [selectedCategory]: Math.min(totalPages, prev[selectedCategory] + 1)
                        }))}
                        disabled={currentPages[selectedCategory] === totalPages}
                        className={`p-1 rounded-md ${
                          currentPages[selectedCategory] === totalPages 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                currentItems.map((item) => (
                  <div 
                    key={item._id} 
                    className={`grid ${
                      selectedCategory === 'Process Template' 
                        ? 'grid-cols-5' 
                        : selectedCategory === 'Letter Templates'
                        ? 'grid-cols-4'
                        : 'grid-cols-4'
                    } px-6 py-4 hover:bg-gray-50 ${selectedCategory === 'Process Template' ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (selectedCategory === 'Process Template') {
                        handleCategoryClick(item._id);
                      }
                    }}
                  >
                    {selectedCategory === 'Process Template' ? (
                      <>
                        <div className="text-sm text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                        <div>
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          {editingDeadline === item._id ? (
                            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                min="0"
                                className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={deadlineValue}
                                onChange={handleDeadlineChange}
                                onKeyDown={(e) => handleDeadlineKeyDown(e, item._id)}
                                autoFocus
                              />
                              <button 
                                className="ml-2 p-1 text-green-600 hover:text-green-800"
                                onClick={() => saveDeadline(item._id)}
                              >
                                ✓
                              </button>
                              <button 
                                className="ml-1 p-1 text-red-600 hover:text-red-800"
                                onClick={() => setEditingDeadline(null)}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 mr-1" />
                              {item.deadline || 0} days
                              <button 
                                className="ml-2 text-blue-600 hover:text-blue-800"
                                onClick={(e) => handleDeadlineEdit(e, item)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {`${Math.floor(Math.random() * 5) + 1} cases in use`}
                        </div>
                      </>
                    ) : selectedCategory === 'Letter Templates' ? (
                      <>
                        <div className="text-sm text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.description || "No description"}</div>
                        <div className="text-sm text-gray-700 mb-4">
                          {item.internalPrompt.length > 100
                            ? item.internalPrompt.slice(0, 100) + '...'
                            : item.internalPrompt}
                        </div>
                        <div className="text-sm text-gray-500 text-right">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </>
                    ) : selectedCategory === 'Master Forms List' ? (
                      <>
                        <div className="text-sm font-mono text-gray-900">{item._id.substring(0, 8)}</div>
                        <div className="text-sm text-gray-900">
                          {item.form_name}
                        </div>
                        <div className="text-sm text-gray-500">{item.description || "No description available"}</div>
                        <div className="text-sm text-gray-500 text-right">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {item.required ? (
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Required
                            </span>
                          ) : (
                            <span className="flex items-center text-gray-500">
                              <XCircle className="w-4 h-4 mr-1" />
                              Optional
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          <ul className="list-disc pl-4 space-y-1">
                            {item.validations && item.validations.map((validation, index) => (
                              <li key={index} className="whitespace-pre-wrap break-words">{validation}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-sm text-gray-500 text-right">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full gap-4 mt-8">
        <Sidebar onCategorySelect={handleCategorySelect} />
        <div className="flex-1 bg-[#f8fafc] rounded-lg shadow-sm h-fit">
          <div className="p-4 flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full gap-4 mt-8">
        <Sidebar onCategorySelect={handleCategorySelect} />
        <div className="flex-1 bg-[#f8fafc] rounded-lg shadow-sm h-fit">
          <div className="p-4 flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="p-6 text-red-500">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 mt-8">
      <Sidebar onCategorySelect={handleCategorySelect} />
      
      {/* Main Content */}
      <div className="flex-1 bg-[#f8fafc] rounded-lg shadow-sm h-fit">
        {/* Search Bar */}
        <div className="p-4 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 pb-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase; 