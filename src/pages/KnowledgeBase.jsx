import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import api from '../utils/api';
import { usePage } from '../contexts/PageContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const KnowledgeBase = ({ setCurrentBreadcrumb }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Process Template');
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
                <div className="grid grid-cols-4 px-6 py-3 border-b border-gray-200">
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
                      className="grid grid-cols-4 px-6 py-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(category._id)}
                    >
                      <div className="text-sm text-gray-900">
                        {category.name.split(' - ')[1] || category.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {category.description}
                      </div>
                      <div>
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
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