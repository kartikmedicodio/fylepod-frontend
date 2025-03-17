import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ChevronLeft, ChevronRight, ListFilter, ChevronDown, ChevronUp, Search, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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

const IndividualCases = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayCases, setDisplayCases] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    currentPage: 1,
    limit: 5,
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
      setLoading(true);
      
      if (!userIds.length) {
        console.log('No user IDs available');
        return;
      }

      // Only pass userIds to backend - everything else will be handled in frontend
      const response = await api.get('/management/users', {
        params: {
          userIds: userIds.join(',')
        }
      });

      if (response.data.status === 'success') {
        const cases = response.data.data.entries || [];
        setAllCases(cases); // Store all cases
        
        // Process all filtering and sorting here
        processCases(cases);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  // Process cases with filtering, sorting, and pagination
  const processCases = (cases) => {
    // Step 1: Filter by search term
    const searchFiltered = searchTerm 
      ? cases.filter(c => 
          c.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c._id?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : cases;
      
    // Step 2: Apply filters
    let filtered = [...searchFiltered];
    
    if (filters.status) {
      filtered = filtered.filter(c => c.categoryStatus === filters.status);
    }
    
    if (filters.documentStatus) {
      filtered = filtered.filter(c => {
        const pendingCount = c.documentTypes?.filter(doc => 
          doc.status === 'pending'
        ).length || 0;
        
        if (filters.documentStatus === 'pending') {
          return pendingCount > 0;
        } else if (filters.documentStatus === 'complete') {
          return pendingCount === 0;
        }
        return true;
      });
    }
    
    if (filters.deadline) {
      const today = new Date();
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      
      filtered = filtered.filter(c => {
        const deadline = new Date(c.deadline);
        switch (filters.deadline) {
          case 'thisWeek':
            return deadline <= weekEnd;
          case 'thisMonth':
            return deadline <= monthEnd;
          case 'nextMonth':
            return deadline > monthEnd && deadline <= nextMonthEnd;
          default:
            return true;
        }
      });
    }
    
    // Step 3: Sort the filtered data
    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle nested fields (e.g., createdBy.name)
      if (sortField.includes('.')) {
        const parts = sortField.split('.');
        aValue = parts.reduce((obj, key) => obj?.[key], a);
        bValue = parts.reduce((obj, key) => obj?.[key], b);
      }
      
      // Handle null/undefined values
      if (aValue === undefined || aValue === null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue === undefined || bValue === null) return sortDirection === 'asc' ? 1 : -1;
      
      // Compare strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Compare numbers/dates
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    // Step 4: Paginate the sorted data
    const total = sorted.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const startIndex = (currentPage - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const currentPageCases = sorted.slice(startIndex, endIndex);
    
    // Update state with processed data
    setDisplayCases(currentPageCases);
    setPagination({
      total,
      currentPage,
      limit: pagination.limit,
      totalPages
    });
  };

  // Initial load - fetch related users and then their cases
  useEffect(() => {
    if (user?.id) {
      const loadData = async () => {
        const userIds = await fetchRelatedUsers();
        await fetchAllUsersCases(userIds);
      };
      loadData();
    }
  }, [user?.id]);

  // Reprocess cases when filtering, sorting, or pagination changes
  useEffect(() => {
    if (allCases.length > 0) {
      processCases(allCases);
    }
  }, [searchTerm, filters, sortField, sortDirection, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setSearching(true);
    setCurrentPage(1);
    
    // Simulate search delay
    setTimeout(() => {
      setSearching(false);
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
                  <select
                    value={tempFilters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                  >
                    {filterOptions.status.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Document Status Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Document Status</label>
                  <select
                    value={tempFilters.documentStatus}
                    onChange={(e) => handleFilterChange('documentStatus', e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                  >
                    {filterOptions.documentStatus.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deadline Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Deadline</label>
                  <select
                    value={tempFilters.deadline}
                    onChange={(e) => handleFilterChange('deadline', e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                  >
                    {filterOptions.deadline.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
                                return pendingCount === 0 ? '0 (completed)' : pendingCount;
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

export default IndividualCases;     