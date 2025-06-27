import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { ChevronLeft, ChevronRight, ListFilter, ChevronDown, ChevronUp, Search, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';

// Reuse the same skeleton component
const CasesSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-8 w-24 bg-gray-200 rounded"></div>
      </div>

      {/* Search Bar Skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {[...Array(6)].map((_, index) => (
                  <th key={index} className="px-6 py-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-200">
                  {[...Array(6)].map((_, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FNCases = () => {
  const { user } = useAuth();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayCases, setDisplayCases] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    currentPage: 1,
    limit: 8,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    documentStatus: '',
    deadline: ''
  });
  const [tempFilters, setTempFilters] = useState({
    status: '',
    documentStatus: '',
    deadline: ''
  });

  // Define filter options
  const filterOptions = {
    status: [
      { value: '', label: 'All Status' },
      { value: 'pending', label: 'Pending' },
      { value: 'completed', label: 'Completed' },
      { value: 'processing', label: 'Processing' }
    ],
    documentStatus: [
      { value: '', label: 'All Document Status' },
      { value: 'pending', label: 'Documents Pending' },
      { value: 'complete', label: 'Documents Complete' }
    ],
    deadline: [
      { value: '', label: 'All Deadlines' },
      { value: 'thisWeek', label: 'This Week' },
      { value: 'thisMonth', label: 'This Month' },
      { value: 'nextMonth', label: 'Next Month' }
    ]
  };

  const navigate = useNavigate();

  // Add searchTimeout ref at the top with other state declarations
  const searchTimeout = useRef(null);

  // Fetch related users
  const fetchRelatedUsers = async () => {
    try {
      if (!user?.id) return;
      
      const response = await api.get(`/auth/user-relationships/${user.id}`);
      
      if (response.data.status === 'success') {
        // Extract related user IDs and include current user
        const relationships = response.data.data.relationships || [];
        const relatedUserIds = relationships.map(rel => rel.user_id._id);
        
        // Include current user's ID
        const allUsers = [user.id, ...relatedUserIds];
        return allUsers;
      }
      return [user.id]; // Default to just the current user if no relationships
    } catch (error) {
      console.error('Error fetching user relationships:', error);
      toast.error('Failed to fetch related users');
      return [user.id]; // Default to just the current user
    }
  };

  // Fetch all cases without any backend filtering or sorting
  const fetchAllUsersCases = async (userIds) => {
    try {
      if (!userIds.length) {
        console.log('No user IDs available');
        return;
      }

      const params = {
        userIds: userIds.join(','),
        page: currentPage,
        limit: pagination.limit,
        sortBy: sortField,
        order: sortDirection
      };

      // Only add search param if there's a search term
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await api.get('/management/users', { params });

      if (response.data.status === 'success') {
        const { entries, pagination: paginationData } = response.data.data;
        setDisplayCases(entries);
        setPagination(paginationData);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  // Set breadcrumb immediately when component mounts
  useEffect(() => {
    setCurrentBreadcrumb([
      { name: 'All Cases', path: '/individual-cases' }
    ]);
  }, []); // Empty dependency array to run only once on mount

  // Initial load - fetch related users and then their cases
  useEffect(() => {
    if (user?.id) {
      const loadData = async () => {
        const userIds = await fetchRelatedUsers();
        await fetchAllUsersCases(userIds);
      };
      loadData();
    }
  }, [currentPage, sortField, sortDirection, filters]); // Remove searchTerm from dependencies

  useEffect(() => {
    // Cleanup breadcrumb on unmount
    return () => {
      setCurrentBreadcrumb([]);
    };
  }, [setCurrentBreadcrumb]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearching(true);
    setCurrentPage(1); // Reset to first page when searching
    
    // Debounce the API call
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const loadData = async () => {
        const userIds = await fetchRelatedUsers();
        await fetchAllUsersCases(userIds);
        setSearching(false);
      };
      loadData();
    }, 500);
  };

  // Handle column sort
  const handleSort = (field) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleFilterChange = (filter, value) => {
    setTempFilters({
      ...tempFilters,
      [filter]: value
    });
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setShowFilters(false);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    const emptyFilters = {
      status: '',
      documentStatus: '',
      deadline: ''
    };
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
    setShowFilters(false);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="p-6">
        <CasesSkeleton />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Cases</h1>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by Case ID or Individual Name"
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            aria-label="Search cases"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 text-sm bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2 ${
              Object.values(filters).some(v => v) ? 'border-blue-500 text-blue-600' : ''
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {Object.values(filters).some(v => v) && (
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            )}
          </button>
          {showFilters && (
            <div className="absolute right-0 top-12 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
              <div className="space-y-4">
                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Status</label>
                  <Listbox
                    value={tempFilters.status}
                    onChange={value => handleFilterChange('status', value)}
                  >
                    <div className="relative">
                      <Listbox.Button className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm text-left flex justify-between items-center">
                        <span>
                          {filterOptions.status.find(o => o.value === tempFilters.status)?.label || 'Select...'}
                        </span>
                        <ChevronUpDownIcon className="w-4 h-4 text-gray-400 ml-2" />
                      </Listbox.Button>
                      <Listbox.Options className="absolute mt-1 w-full bg-white shadow-lg rounded-md z-10">
                        {filterOptions.status.map((option) => (
                          <Listbox.Option
                            key={option.value}
                            value={option.value}
                            className={({ active, selected }) =>
                              `cursor-pointer select-none relative py-2 px-3
                              ${selected ? 'bg-blue-600 text-white' : ''}
                              ${active && !selected ? 'bg-blue-100' : ''}`
                            }
                          >
                            {option.label}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                </div>

                {/* Document Status Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Document Status</label>
                  <Listbox
                    value={tempFilters.documentStatus}
                    onChange={value => handleFilterChange('documentStatus', value)}
                  >
                    <div className="relative">
                      <Listbox.Button className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm text-left flex justify-between items-center">
                        <span>
                          {filterOptions.documentStatus.find(o => o.value === tempFilters.documentStatus)?.label || 'Select...'}
                        </span>
                        <ChevronUpDownIcon className="w-4 h-4 text-gray-400 ml-2" />
                      </Listbox.Button>
                      <Listbox.Options className="absolute mt-1 w-full bg-white shadow-lg rounded-md z-10">
                        {filterOptions.documentStatus.map((option) => (
                          <Listbox.Option
                            key={option.value}
                            value={option.value}
                            className={({ active, selected }) =>
                              `cursor-pointer select-none relative py-2 px-3
                              ${selected ? 'bg-blue-600 text-white' : ''}
                              ${active && !selected ? 'bg-blue-100' : ''}`
                            }
                          >
                            {option.label}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                </div>

                {/* Deadline Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Deadline</label>
                  <Listbox
                    value={tempFilters.deadline}
                    onChange={value => handleFilterChange('deadline', value)}
                  >
                    <div className="relative">
                      <Listbox.Button className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm text-left flex justify-between items-center">
                        <span>
                          {filterOptions.deadline.find(o => o.value === tempFilters.deadline)?.label || 'Select...'}
                        </span>
                        <ChevronUpDownIcon className="w-4 h-4 text-gray-400 ml-2" />
                      </Listbox.Button>
                      <Listbox.Options className="absolute mt-1 w-full bg-white shadow-lg rounded-md z-10">
                        {filterOptions.deadline.map((option) => (
                          <Listbox.Option
                            key={option.value}
                            value={option.value}
                            className={({ active, selected }) =>
                              `cursor-pointer select-none relative py-2 px-3
                              ${selected ? 'bg-blue-600 text-white' : ''}
                              ${active && !selected ? 'bg-blue-100' : ''}`
                            }
                          >
                            {option.label}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={clearAllFilters}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={handleApplyFilters}
                    className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th 
                  className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('_id')}
                >
                  <div className="flex items-center">
                    Case Id
                    {sortField === '_id' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('userName')}
                >
                  <div className="flex items-center">
                    Individual Name
                    {sortField === 'userName' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdBy.name')}
                >
                  <div className="flex items-center">
                    Case Manager
                    {sortField === 'createdBy.name' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('categoryName')}
                >
                  <div className="flex items-center">
                    Process Name
                    {sortField === 'categoryName' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('deadline')}
                >
                  <div className="flex items-center">
                    Deadline
                    {sortField === 'deadline' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('categoryStatus')}
                >
                  <div className="flex items-center">
                    Status
                    {sortField === 'categoryStatus' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Documents Pending
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence>
                {displayCases.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <p className="text-gray-500 text-sm font-medium">No cases found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayCases.map((caseItem) => {
                    // Format the deadline date
                    const formattedDeadline = caseItem.deadline 
                      ? new Date(caseItem.deadline).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : '-';

                    return (
                      <motion.tr
                        key={caseItem._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors duration-200"
                        onClick={() => navigate(`/individuals/case/${caseItem._id}`)}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {caseItem._id?.substring(0, 6)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{caseItem.userName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{caseItem.createdBy?.name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{caseItem.categoryName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formattedDeadline}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            caseItem.categoryStatus === 'completed' 
                              ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                              : 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20'
                          }`}>
                            {caseItem.categoryStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {caseItem.documentTypes ? (
                            <span>
                              {(() => {
                                const pendingCount = caseItem.documentTypes.filter(doc => 
                                  doc.status === 'pending'
                                ).length;
                                return pendingCount === 0 ? '0' : pendingCount;
                              })()}
                            </span>
                          ) : '-'}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm">
            <span className="text-sm text-gray-600">
              Showing <span className="font-medium text-gray-900">{(currentPage - 1) * pagination.limit + 1}</span>
              {' '}-{' '}
              <span className="font-medium text-gray-900">{Math.min(currentPage * pagination.limit, pagination.total)}</span>
              {' '}of{' '}
              <span className="font-medium text-gray-900">{pagination.total}</span>
            </span>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border transition-all duration-200 
                  ${currentPage === 1
                    ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                    : 'text-gray-600 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-sm active:transform active:scale-95'
                  }`}
              >
                <ChevronLeft size={18} />
              </button>

              <span className="text-sm font-medium text-gray-900">
                Page {currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className={`p-2 rounded-lg border transition-all duration-200 
                  ${currentPage === pagination.totalPages
                    ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                    : 'text-gray-600 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-sm active:transform active:scale-95'
                  }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default FNCases;     