import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import CaseDetails from './CaseDetails';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

// Components
const SearchBar = ({ value, onChange, isSearching }) => (
  <div className="flex-1 relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Search className="h-5 w-5 text-gray-400" />
    </div>
    <input
      type="text"
      placeholder="Search by Case ID or Individual Name"
      value={value}
      onChange={onChange}
      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      aria-label="Search cases"
    />
    {isSearching && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      </div>
    )}
  </div>
);

const TableHeader = () => (
  <thead className="bg-gray-50">
    <tr className="border-b border-gray-200">
      {[
        'Case Id', 'Individual Name', 'Case Manager', 'Process Name',
        'Deadline', 'Status', 'Documents Pending'
      ].map((header) => (
        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          {header}
        </th>
      ))}
    </tr>
  </thead>
);

const CaseRow = ({ caseItem, onClick }) => {
  // Format the deadline date to display only the date portion (not time)
  const formattedDeadline = caseItem.deadline 
    ? new Date(caseItem.deadline).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : '-';

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onClick(caseItem)}
    >
      <td className="px-6 py-4 text-sm text-gray-900">{caseItem._id?.substring(0, 6)}</td>
      <td className="px-6 py-4 text-sm text-gray-900">{caseItem.userName}</td>
      <td className="px-6 py-4 text-sm text-gray-900">{caseItem.createdBy?.name}</td>
      <td className="px-6 py-4 text-sm text-gray-900">{caseItem.categoryName}</td>
      <td className="px-6 py-4 text-sm text-gray-900">{formattedDeadline}</td>
      <td className="px-6 py-4 text-sm">
        <span className={`px-2 py-1 rounded-full text-xs ${
          caseItem.categoryStatus === 'completed' 
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
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
};

// Update the CasesSkeleton component
const CasesSkeleton = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6"
    >
      {/* Header Skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer"></div>
        <div className="h-10 w-28 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer"></div>
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer"></div>
        </div>
        <div className="h-10 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer"></div>
        <div className="h-10 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {[...Array(7)].map((_, index) => (
                  <th key={index} className="px-6 py-3">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-100">
                  {[...Array(7)].map((_, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Skeleton */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50/80">
          <div className="h-4 w-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-8 w-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Add this component definition before the Cases component
const FiltersDropdown = ({ 
  tempFilters, 
  filterOptions, 
  handleFilterChange, 
  handleApplyFilters, 
  clearAllFilters 
}) => (
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
);

const Cases = () => {
  // All useState hooks
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCases, setFilteredCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [error, setError] = useState(null);
  const [loggedInUserDetails, setLoggedInUserDetails] = useState(null);
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

  // Navigation hooks
  const navigate = useNavigate();
  const { setCurrentBreadcrumb } = useBreadcrumb();

  // Set initial breadcrumb
  useEffect(() => {
    setCurrentBreadcrumb([
      { name: 'Home', path: '/dashboard' },
      { name: 'Cases', path: '/cases' }
    ]);

    return () => {
      setCurrentBreadcrumb([]);
    };
  }, [setCurrentBreadcrumb]);

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

  // Handler functions
  const handleFilterChange = (filterType, value) => {
    setTempFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setShowFilters(false);
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
  };

  const applyFilters = (cases) => {
    return cases.filter(caseItem => {
      if (filters.status && caseItem.categoryStatus !== filters.status) {
        return false;
      }

      if (filters.documentStatus) {
        const pendingDocs = caseItem.documentTypes?.filter(
          doc => doc.status === 'pending'
        ).length;
        
        if (filters.documentStatus === 'pending' && pendingDocs === 0) {
          return false;
        }
        if (filters.documentStatus === 'complete' && pendingDocs > 0) {
          return false;
        }
      }

      if (filters.deadline) {
        const deadline = new Date(caseItem.deadline);
        const today = new Date();
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);

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
      }

      return true;
    });
  };

  const fetchCases = async (page, search = '') => {
    try {
      if (!loggedInUserDetails?.lawfirm_id?._id) {
        console.log('No lawfirm ID available');
        return;
      }

      const response = await api.get(`/management/all-managements?page=${page}`);
      
      if (response.data.status === 'success') {
        // Filter cases by lawfirm ID
        const allCases = response.data.data.managements.filter(caseItem => {
          return caseItem.lawfirmId === loggedInUserDetails.lawfirm_id._id ||
                 caseItem.createdBy?.lawfirm_id?._id === loggedInUserDetails.lawfirm_id._id;
        });
        
        if (search.trim()) {
          const searchLower = search.toLowerCase();
          const filtered = allCases.filter(caseItem => 
            (caseItem._id && caseItem._id.toLowerCase().includes(searchLower)) ||
            (caseItem.userName && caseItem.userName.toLowerCase().includes(searchLower)) ||
            (caseItem.name && caseItem.name.toLowerCase().includes(searchLower))
          );
          
          setFilteredCases(filtered);
          setPagination({
            ...response.data.data.pagination,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / response.data.data.pagination.limit)
          });
        } else {
          setFilteredCases(allCases);
          setPagination({
            ...response.data.data.pagination,
            total: allCases.length,
            totalPages: Math.ceil(allCases.length / response.data.data.pagination.limit)
          });
        }
        setCases(allCases);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      setError('Error loading cases. Please try again later.');
    }
  };

  // Combined initial data fetch
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Get user data from localStorage instead of API call
        const userDetails = getStoredUser();
        
        if (!isMounted) return;

        if (!userDetails) {
          throw new Error('No user data found in localStorage');
        }

        if (!isMounted) return;
        
        setLoggedInUserDetails(userDetails);

        if (userDetails.lawfirm_id?._id) {
          const casesResponse = await api.get('/management/all-managements?page=1');
          
          if (!isMounted) return;

          if (casesResponse.data.status === 'success') {
            const allCases = casesResponse.data.data.managements.filter(caseItem => {
              return caseItem.lawfirmId === userDetails.lawfirm_id._id ||
                     caseItem.createdBy?.lawfirm_id?._id === userDetails.lawfirm_id._id;
            });
            
            setFilteredCases(allCases);
            setPagination({
              ...casesResponse.data.data.pagination,
              total: allCases.length,
              totalPages: Math.ceil(allCases.length / casesResponse.data.data.pagination.limit)
            });
            setCases(allCases);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching initial data:', error);
          setError(error.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loading && loggedInUserDetails?.lawfirm_id?._id) {
      fetchCases(currentPage);
    }
  }, [currentPage, loggedInUserDetails]);

  useEffect(() => {
    if (!loading) {
      const delayDebounce = setTimeout(() => {
        if (searchTerm) {
          fetchCases(1, searchTerm);
        } else {
          fetchCases(1);
        }
      }, 300);

      return () => clearTimeout(delayDebounce);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (!cases.length) return;

    let filtered = [...cases];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(caseItem =>
        (caseItem._id && caseItem._id.toLowerCase().includes(searchLower)) ||
        (caseItem.userName && caseItem.userName.toLowerCase().includes(searchLower)) ||
        (caseItem.name && caseItem.name.toLowerCase().includes(searchLower))
      );
    }

    // Apply other filters
    filtered = applyFilters(filtered);

    setFilteredCases(filtered);
  }, [cases, searchTerm, filters]);

  useEffect(() => {
    if (showFilters) {
      setTempFilters(filters);
    }
  }, [showFilters]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination?.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCaseClick = (caseItem) => {
    setCurrentBreadcrumb([
      { name: 'Home', path: '/dashboard' },
      { name: 'Cases', path: '/cases' },
      { name: caseItem.categoryName || `Case ${caseItem._id.substring(0, 6)}`, path: `/cases/${caseItem._id}` }
    ]);

    navigate(`/cases/${caseItem._id}`);

    setSelectedCase(caseItem._id);
  };

  const handleBackToCases = () => {
    setSelectedCase(null);
  };

  if (selectedCase) {
    return <CaseDetails caseId={selectedCase} onBack={handleBackToCases} />;
  }

  if (loading) {
    return <CasesSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">Error loading cases: {error}</div>
        <button 
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchInitialData();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
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
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          + New Case
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <SearchBar value={searchTerm} onChange={handleSearch} isSearching={searching} />
        
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
            <FiltersDropdown
              tempFilters={tempFilters}
              filterOptions={filterOptions}
              handleFilterChange={handleFilterChange}
              handleApplyFilters={handleApplyFilters}
              clearAllFilters={clearAllFilters}
            />
          )}
        </div>
      </div>

      {/* Table with integrated pagination */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[
                  'Case Id', 'Individual Name', 'Case Manager', 'Process Name',
                  'Deadline', 'Status', 'Documents Pending'
                ].map((header) => (
                  <th key={header} className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence>
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <p className="text-gray-500 text-sm font-medium">No cases found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((caseItem) => {
                    // Format deadline for this case
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
                        onClick={() => handleCaseClick(caseItem)}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {caseItem._id?.substring(0, 6)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{caseItem.userName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{caseItem.createdBy?.name}</td>
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
        {pagination && filteredCases.length > 0 && (
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

export default Cases; 