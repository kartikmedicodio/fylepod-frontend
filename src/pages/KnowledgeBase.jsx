import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Clock, Edit2, CheckCircle, XCircle, FileText, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import { usePage } from '../contexts/PageContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';

const KnowledgeBase = () => {
  const [categories, setCategories] = useState([]);
  const [masterDocuments, setMasterDocuments] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Process Template');
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [deadlineValue, setDeadlineValue] = useState('');
  const [currentPages, setCurrentPages] = useState({
    'Process Template': 1,
    'Master Document List': 1,
    'Master Forms List': 1
  });
  const itemsPerPage = 5;
  const { setPageTitle } = usePage();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const navigate = useNavigate();

  useEffect(() => {
    setPageTitle(selectedCategory);
    setCurrentBreadcrumb([
      { label: 'Dashboard', link: '/' },
      { label: 'Knowledge Base', link: '/knowledge' },
      ...(selectedCategory !== 'Knowledge Base' ? [{ label: selectedCategory, link: '#' }] : [])
    ]);
    if (selectedCategory === 'Process Template') {
      fetchCategories();
    } else if (selectedCategory === 'Master Document List') {
      fetchMasterDocuments();
    } else if (selectedCategory === 'Master Forms List') {
      fetchForms();
    }
  }, [setPageTitle, setCurrentBreadcrumb, selectedCategory]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      if (response.data.status === 'success') {
        setCategories(response.data.data.categories);
      }
    } catch (err) {
      setError('Failed to fetch categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

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
      const response = await api.get('/forms');
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

  const filteredItems = selectedCategory === 'Process Template' 
    ? categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : selectedCategory === 'Master Document List'
    ? masterDocuments.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : forms.filter(form =>
        form.form_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPages[selectedCategory] - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPages(prev => ({
        ...prev,
        [selectedCategory]: newPage
      }));
    }
  };

  const sidebarCategories = [
    { name: 'Process Template', path: '/knowledge/process-templates' },
    { name: 'Master Document List', path: '/knowledge/master-documents' },
    { name: 'Master Forms List', path: '/knowledge/master-forms' }
  ];

  const handleRowClick = (categoryId) => {
    navigate(`/knowledge/checklist/${categoryId}`);
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

      if (response.data.status === 'success') {
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

  // Render the main content based on selected category
  const renderMainContent = () => {
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
    
    if (filteredItems.length === 0) {
      return (
        <div className="px-6 py-4 text-center text-gray-500">
          No items found
        </div>
      );
    }

    // Render tables for all categories
    return (
      <>
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="min-w-full divide-y divide-gray-200">
            <div className="bg-white">
              <div className={`grid ${
                selectedCategory === 'Process Template' 
                  ? 'grid-cols-5' 
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
            <div className="bg-white divide-y divide-gray-200">
              {currentItems.map((item) => (
                <div 
                  key={item._id} 
                  className={`grid ${
                    selectedCategory === 'Process Template' 
                      ? 'grid-cols-5' 
                      : 'grid-cols-4'
                  } px-6 py-4 hover:bg-gray-50 ${selectedCategory === 'Process Template' ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (selectedCategory === 'Process Template') {
                      handleRowClick(item._id);
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
                  ) : selectedCategory === 'Master Forms List' ? (
                    <>
                      <div className="text-sm font-mono text-gray-900">{item._id.substring(0, 8)}</div>
                      <div className="text-sm text-gray-900">{item.form_name}</div>
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
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex h-full gap-4 pt-6">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-sm rounded-lg">
        <div className="p-4">
          {sidebarCategories.map((category) => (
            <Link
              key={category.name}
              to={category.path}
              className={`block w-full text-left px-4 py-2 rounded-lg text-sm mb-1 ${
                selectedCategory === category.name
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={(e) => {
                e.preventDefault(); // Prevent navigation for now
                setSelectedCategory(category.name);
              }}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-[#f8fafc] rounded-lg shadow-sm">
        {/* Search Bar */}
        <div className="p-4 flex items-center gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
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
          {renderMainContent()}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
          <div>
            Showing {startIndex + 1} - {Math.min(endIndex, filteredItems.length)} of {filteredItems.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPages[selectedCategory] - 1)}
              disabled={currentPages[selectedCategory] === 1}
              className={`p-1 rounded-md ${currentPages[selectedCategory] === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span>
              Page {currentPages[selectedCategory]} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPages[selectedCategory] + 1)}
              disabled={currentPages[selectedCategory] === totalPages}
              className={`p-1 rounded-md ${currentPages[selectedCategory] === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

KnowledgeBase.propTypes = {
  setCurrentBreadcrumb: PropTypes.func.isRequired
};

export default KnowledgeBase; 