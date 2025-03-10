import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Clock, Edit2 } from 'lucide-react';
import api from '../utils/api';
import { usePage } from '../contexts/PageContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';

const KnowledgeBase = ({ setCurrentBreadcrumb }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Process Template');
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [deadlineValue, setDeadlineValue] = useState('');
  const { setPageTitle } = usePage();
  const navigate = useNavigate();

  useEffect(() => {
    setPageTitle('Knowledge Base');
    setCurrentBreadcrumb([
      { label: 'Dashboard', link: '/' },
      { label: 'Knowledge Base', link: '#' }
    ]);
    fetchCategories();
  }, [setPageTitle, setCurrentBreadcrumb]);

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

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarCategories = [
    { name: 'Knowledge Base', path: '/knowledge' },
    { name: 'Process Template', path: '/knowledge/process-templates' },
    { name: 'Master Document List', path: '/knowledge/master-documents' },
    { name: 'Forms List', path: '/knowledge/forms' },
    { name: 'Letter Templates', path: '/knowledge/letter-templates' }
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

  return (
    <div className="flex h-full">
      {/* Left Sidebar */}
      <div className="w-64 bg-white">
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
      <div className="flex-1 bg-[#f8fafc]">
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
          <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <SlidersHorizontal className="h-4 w-4" />
            All Filters
          </button>
          <button className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Sort
          </button>
        </div>

        {/* Process Templates Table */}
        <div className="px-4">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="min-w-full divide-y divide-gray-200">
              <div className="bg-white">
                <div className="grid grid-cols-5 px-6 py-3 border-b border-gray-200">
                  <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    Process Name
                    <span className="text-gray-400">↑↓</span>
                  </div>
                  <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    Process Description
                    <span className="text-gray-400">↑↓</span>
                  </div>
                  <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    Status
                    <span className="text-gray-400">↑↓</span>
                  </div>
                  <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    Deadline (days)
                    <span className="text-gray-400">↑↓</span>
                  </div>
                  <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    Usage
                    <span className="text-gray-400">↑↓</span>
                  </div>
                </div>
              </div>
              <div className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <div className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : error ? (
                  <div className="px-6 py-4 text-center text-red-500">
                    {error}
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="px-6 py-4 text-center text-gray-500">
                    No processes found
                  </div>
                ) : (
                  filteredCategories.map((category) => (
                    <div 
                      key={category._id} 
                      className="grid grid-cols-5 px-6 py-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(category._id)}
                    >
                      <div className="text-sm text-gray-900">
                        {category.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {category.description}
                      </div>
                      <div>
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        {editingDeadline === category._id ? (
                          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              min="0"
                              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={deadlineValue}
                              onChange={handleDeadlineChange}
                              onKeyDown={(e) => handleDeadlineKeyDown(e, category._id)}
                              autoFocus
                            />
                            <button 
                              className="ml-2 p-1 text-green-600 hover:text-green-800"
                              onClick={() => saveDeadline(category._id)}
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
                            {category.deadline || 0} days
                            <button 
                              className="ml-2 text-blue-600 hover:text-blue-800"
                              onClick={(e) => handleDeadlineEdit(e, category)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {`${Math.floor(Math.random() * 5) + 1} cases in use`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between py-3 text-sm text-gray-500">
            <div>
              Showing 1 - {filteredCategories.length} of {filteredCategories.length}
            </div>
            <div>
              Page 1 of {Math.ceil(filteredCategories.length / 10)}
            </div>
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