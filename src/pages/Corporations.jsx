import { useState, useEffect, useRef } from 'react';
import corporationService from '../services/corporationService';
import { getStoredUser } from '../utils/auth';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  SlidersHorizontal, 
  CirclePlus,
  Building2,
  Users,
  Phone,
  Mail,
  AlertCircle,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { toast } from 'react-hot-toast';

const CorporationsSkeleton = () => (
  <div className="p-4">
    {/* Header Skeleton */}
    <div className="mb-4">
      <div className="h-7 w-32 bg-[#f9fafb] rounded animate-shimmer"></div>
    </div>
    
    {/* Search and Actions Bar Skeleton */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <div className="w-[400px] h-10 bg-[#f9fafb] rounded-lg animate-shimmer"></div>
        <div className="w-24 h-10 bg-[#f9fafb] rounded-lg animate-shimmer"></div>
      </div>
      <div className="w-40 h-10 bg-[#f9fafb] rounded-lg animate-shimmer"></div>
    </div>

    {/* Table Skeleton */}
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-4 px-6 py-3 border-b border-gray-200">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-5 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-4 px-6 py-3 border-b border-gray-100">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="h-5 bg-[#fbfbfc] rounded animate-shimmer"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const Corporations = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [corporations, setCorporations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [showFilters, setShowFilters] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const navigate = useNavigate();
  const filterRef = useRef(null);
  const { setCurrentBreadcrumb } = useBreadcrumb();

  // Add new states for enhanced features
  const [selectedCorporation, setSelectedCorporation] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    setCurrentBreadcrumb([
      { name: 'Home', path: '/' },
      { name: 'Corporations', path: '/corporations' }
    ]);
  }, [setCurrentBreadcrumb]);

  useEffect(() => {
    fetchUserAndCorporations();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    }
    
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  const fetchUserAndCorporations = async () => {
    try {
      setLoading(true);
      // Get user data from localStorage instead of API call
      const user = getStoredUser();
      
      if (!user) {
        setError('User data not found. Please login again.');
        setLoading(false);
        return;
      }
      
      setCurrentUser(user);
      
      // Then fetch corporations
      const response = await corporationService.getAllCorporations();
      
      if (response.success && response.data) {
        // Get the user's lawfirm ID
        const userLawfirmId = user.lawfirm_id._id;
        
        // Filter corporations based on user's lawfirm_id
        const filteredCorporations = response.data.filter(corp => 
          corp.lawfirm_id === userLawfirmId
        );
        
        if (filteredCorporations.length === 0) {
          setError('No corporations found for your law firm');
        } else {
          setError(null);
        }
        
        // Set corporations
        setCorporations(filteredCorporations);
        setPagination(prev => ({
          ...prev,
          totalPages: Math.ceil(filteredCorporations.length / pagination.itemsPerPage),
          totalItems: filteredCorporations.length
        }));
      } else {
        setError('Failed to fetch corporations');
      }
    } catch (error) {
      console.error('Error fetching corporations:', error);
      setError('Failed to load corporations');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedCorporations = () => {
    let filtered = [...corporations];

    filtered = filtered.filter(corp => 
      corp.company_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (employeeFilter) {
      case 'less5':
        filtered = filtered.filter(corp => (Array.isArray(corp.user_id) ? corp.user_id.length : 0) < 5);
        break;
      case '5to10':
        filtered = filtered.filter(corp => {
          const count = Array.isArray(corp.user_id) ? corp.user_id.length : 0;
          return count >= 5 && count <= 10;
        });
        break;
      case 'more10':
        filtered = filtered.filter(corp => (Array.isArray(corp.user_id) ? corp.user_id.length : 0) > 10);
        break;
      default:
        break;
    }

    return filtered;
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      totalPages: Math.ceil(getFilteredAndSortedCorporations().length / pagination.itemsPerPage),
      totalItems: getFilteredAndSortedCorporations().length
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        currentPage: newPage
      }));
    }
  };

  const truncateId = (id) => {
    return id.substring(0, 8);
  };

  const handleFilterChange = (value) => {
    setEmployeeFilter(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const resetFilter = () => {
    setEmployeeFilter('all');
  };

  const handleRowClick = (corporationId) => {
    navigate(`/corporations/${corporationId}`);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedCorporations = () => {
    let sorted = getFilteredAndSortedCorporations();
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        if (sortConfig.key === 'employees') {
          const aValue = Array.isArray(a.user_id) ? a.user_id.length : 0;
          const bValue = Array.isArray(b.user_id) ? b.user_id.length : 0;
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
    }
    return sorted;
  };

  const handleQuickView = (corp, e) => {
    e.stopPropagation();
    setSelectedCorporation(corp);
    setIsQuickViewOpen(true);
  };

  if (loading) {
    return <CorporationsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  } 

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-[1400px] mx-auto"
    >
      {/* Enhanced Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Corporations
          </h1>
        </div>
        <p className="text-gray-600">Manage and view all corporations in your law firm</p>
      </div>
      
      {/* Enhanced Search and Actions Bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative group flex-1 max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by name, contact, or ID..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                       focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
                       transition-all duration-200"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 transition-all duration-200 ${
                employeeFilter !== 'all'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal size={16} />
              <span>Filter</span>
              {employeeFilter !== 'all' && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-600">
                  1
                </span>
              )}
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 right-0 w-64 bg-white border rounded-xl shadow-lg z-10 py-2
                           backdrop-blur-sm bg-white/95"
                >
                  <div className="px-3 py-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Employees
                    </label>
                    <Listbox value={employeeFilter} onChange={handleFilterChange}>
                      <div className="relative">
                        <Listbox.Button className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm text-left flex justify-between items-center">
                          <span>
                            {{
                              all: 'All',
                              less5: 'Less than 5',
                              '5to10': '5 to 10',
                              more10: 'More than 10'
                            }[employeeFilter]}
                          </span>
                          <ChevronUpDownIcon className="w-4 h-4 text-gray-400 ml-2" />
                        </Listbox.Button>
                        <Listbox.Options className="absolute mt-1 w-full bg-white shadow-lg rounded-md z-10">
                          <Listbox.Option value="all" className={({ active, selected }) =>
                            `cursor-pointer select-none relative py-2 px-3
                            ${selected ? 'bg-blue-600 text-white' : ''}
                            ${active && !selected ? 'bg-blue-100' : ''}`
                          }>
                            All
                          </Listbox.Option>
                          <Listbox.Option value="less5" className={({ active, selected }) =>
                            `cursor-pointer select-none relative py-2 px-3
                            ${selected ? 'bg-blue-600 text-white' : ''}
                            ${active && !selected ? 'bg-blue-100' : ''}`
                          }>
                            Less than 5
                          </Listbox.Option>
                          <Listbox.Option value="5to10" className={({ active, selected }) =>
                            `cursor-pointer select-none relative py-2 px-3
                            ${selected ? 'bg-blue-600 text-white' : ''}
                            ${active && !selected ? 'bg-blue-100' : ''}`
                          }>
                            5 to 10
                          </Listbox.Option>
                          <Listbox.Option value="more10" className={({ active, selected }) =>
                            `cursor-pointer select-none relative py-2 px-3
                            ${selected ? 'bg-blue-600 text-white' : ''}
                            ${active && !selected ? 'bg-blue-100' : ''}`
                          }>
                            More than 10
                          </Listbox.Option>
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  </div>
                  {employeeFilter !== 'all' && (
                    <>
                      <div className="border-t my-1" />
                      <div className="px-3 py-2">
                        <button
                          onClick={resetFilter}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Reset filter
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button 
          onClick={() => navigate('/company/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm
                    hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 
                    focus:ring-indigo-500 focus:ring-offset-2 shadow-sm"
        >
          <CirclePlus size={18} />
          Add new Corporation
        </button>
      </div>

      {/* Enhanced Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
      >
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('_id')}>
                <div className="flex items-center gap-2">
                  Corporation ID
                  {sortConfig.key === '_id' && (
                    <ChevronUpDownIcon className={`w-4 h-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('company_name')}>
                <div className="flex items-center gap-2">
                  Corporation name
                  {sortConfig.key === 'company_name' && (
                    <ChevronUpDownIcon className={`w-4 h-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Contact Info</th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('employees')}>
                <div className="flex items-center gap-2">
                  Employees
                  {sortConfig.key === 'employees' && (
                    <ChevronUpDownIcon className={`w-4 h-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getSortedCorporations()
              .slice((pagination.currentPage - 1) * pagination.itemsPerPage, pagination.currentPage * pagination.itemsPerPage)
              .map((corp) => (
                <motion.tr 
                  key={corp._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-gray-100 hover:bg-indigo-50/50 cursor-pointer
                           transition-colors duration-200" 
                  onClick={() => handleRowClick(corp._id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{truncateId(corp._id)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{corp.company_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users size={14} />
                        <span>{corp.contact_name}</span>
                      </div>
                      {corp.contact_email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail size={14} />
                          <span>{corp.contact_email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                  bg-indigo-100 text-indigo-800">
                      {Array.isArray(corp.user_id) ? corp.user_id.length : 0} employees
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => handleQuickView(corp, e)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Quick view
                    </button>
                  </td>
                </motion.tr>
              ))}
          </tbody>
        </table>

        {/* Enhanced Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center">
          <span className="text-sm text-gray-700">
            Showing <span className="font-medium">{((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}</span> to{' '}
            <span className="font-medium">{Math.min(pagination.currentPage * pagination.itemsPerPage, getSortedCorporations().length)}</span> of{' '}
            <span className="font-medium">{getSortedCorporations().length}</span> corporations
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={`p-2 rounded-lg border transition-all duration-200 
                ${pagination.currentPage === 1 
                  ? 'text-gray-300 border-gray-200 cursor-not-allowed' 
                  : 'text-gray-600 border-gray-200 hover:bg-gray-100 active:transform active:scale-95'}`}
            >
              <ChevronLeft size={18} />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, Math.ceil(getSortedCorporations().length / pagination.itemsPerPage)))].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePageChange(idx + 1)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200
                    ${pagination.currentPage === idx + 1
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === Math.ceil(getSortedCorporations().length / pagination.itemsPerPage)}
              className={`p-2 rounded-lg border transition-all duration-200 
                ${pagination.currentPage === Math.ceil(getSortedCorporations().length / pagination.itemsPerPage)
                  ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-100 active:transform active:scale-95'}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {isQuickViewOpen && selectedCorporation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setIsQuickViewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4 transform"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedCorporation.company_name}
                  </h3>
                  <p className="text-sm text-gray-500">ID: {truncateId(selectedCorporation._id)}</p>
                </div>
                <button
                  onClick={() => setIsQuickViewOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Contact Information</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users size={16} className="text-gray-400" />
                      <span>{selectedCorporation.contact_name}</span>
                    </div>
                    {selectedCorporation.contact_email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={16} className="text-gray-400" />
                        <span>{selectedCorporation.contact_email}</span>
                      </div>
                    )}
                    {selectedCorporation.contact_phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={16} className="text-gray-400" />
                        <span>{selectedCorporation.contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Employee Count</h4>
                  <div className="mt-2">
                    <div className="text-2xl font-semibold text-indigo-600">
                      {Array.isArray(selectedCorporation.user_id) ? selectedCorporation.user_id.length : 0}
                    </div>
                    <p className="text-sm text-gray-500">Total employees</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsQuickViewOpen(false);
                      handleRowClick(selectedCorporation._id);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium
                             hover:bg-indigo-700 transition-colors duration-200"
                  >
                    View Full Details
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Empty State */}
      <AnimatePresence>
        {!loading && getSortedCorporations().length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-12 bg-white rounded-xl mt-4 border border-gray-200"
          >
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No corporations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery 
                ? `No results found for "${searchQuery}". Try adjusting your search terms.`
                : "Get started by adding your first corporation."}
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/company/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent 
                         shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 
                         hover:bg-indigo-700 focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-indigo-500"
              >
                <CirclePlus className="-ml-1 mr-2 h-5 w-5" />
                Add Corporation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-40"
          >
            <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-lg">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-sm text-gray-600">Loading corporations...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Corporations;