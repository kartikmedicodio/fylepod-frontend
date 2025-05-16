import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import CaseDetails from './CaseDetails';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser } from '../utils/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';

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
              return pendingCount === 0 ? '0' : pendingCount;
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
);

const Cases = () => {
  // All useState hooks
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayCases, setDisplayCases] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    currentPage: 1,
    limit: 10,
    totalPages: 0
  });
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
  const location = useLocation();
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
      { value: 'Reviewed', label: 'Reviewed' }
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

  // Combined initial data fetch
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        console.log('Starting initial data fetch');
        
        // Get user data from localStorage instead of API call
        const userDetails = getStoredUser();
        console.log('User details from localStorage:', userDetails);
        
        if (!isMounted) return;

        if (!userDetails) {
          throw new Error('No user data found in localStorage');
        }

        if (!isMounted) return;
        
        // Set logged in user details first
        setLoggedInUserDetails(userDetails);

        if (userDetails.lawfirm_id?._id) {
          console.log('Fetching cases for lawfirm:', userDetails.lawfirm_id._id);
          const response = await api.get('/management/all-managements');
          
          if (response.data.status === 'success') {
            console.log('Received cases from API:', response.data.data.managements);
            // Filter cases by lawfirm ID
            const allCases = response.data.data.managements.filter(caseItem => {
              return caseItem.lawfirmId === userDetails.lawfirm_id._id ||
                     caseItem.createdBy?.lawfirm_id?._id === userDetails.lawfirm_id._id;
            });
            
            console.log('Filtered cases by lawfirm:', allCases);
            if (isMounted) {
              setCases(allCases);
              processCases(allCases);
            }
          }
        } else {
          console.log('No lawfirm ID in user details');
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
  }, []); // Remove currentPage dependency since we're handling pagination in frontend

  // Process cases with filtering, sorting, and pagination
  const processCases = (casesToProcess) => {
    console.log('Processing cases with filters:', filters);
    
    // Step 1: Filter by search term
    let filtered = searchTerm 
      ? casesToProcess.filter(c => 
          c.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c._id?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : casesToProcess;
      
    // Step 2: Apply status filter first (since this is our primary filter from dashboard)
    if (filters.status) {
      console.log('Applying status filter:', filters.status);
      filtered = filtered.filter(c => c.categoryStatus === filters.status);
    }
    
    // Step 3: Apply other filters
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
    
    // Step 4: Update pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const startIndex = (currentPage - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const currentPageCases = filtered.slice(startIndex, endIndex);
    
    console.log('Filtered cases:', filtered.length);
    console.log('Current page cases:', currentPageCases.length);
    
    // Update state
    setDisplayCases(currentPageCases);
    setPagination(prev => ({
      ...prev,
      total,
      totalPages,
      currentPage: Math.min(currentPage, totalPages)
    }));
  };

  // Update handleSearch to use frontend filtering
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setSearching(true);
    setCurrentPage(1);
    
    // Simulate search delay
    setTimeout(() => {
      setSearching(false);
    }, 500);
  };

  // Update handlePageChange to use frontend pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Add useEffect to reprocess cases when filters, search, or page changes
  useEffect(() => {
    console.log('Reprocessing cases due to changes:', { searchTerm, filters, currentPage });
    if (cases.length > 0) {
      processCases(cases);
    } else {
      console.log('No cases to process');
    }
  }, [searchTerm, filters, currentPage]);

  // Add useEffect to monitor displayCases changes
  useEffect(() => {
    console.log('Display cases updated:', displayCases);
  }, [displayCases]);

  // Add useEffect to monitor cases changes
  useEffect(() => {
    console.log('Cases state updated:', cases);
  }, [cases]);

  // Add this useEffect to handle incoming state and apply filter immediately
  useEffect(() => {
    if (location.state?.applyFilter) {
      // Apply the filter that was passed from Dashboard
      const newFilters = {
        ...filters,
        [location.state.filterType]: location.state.filterValue
      };
      
      // Update both temp and active filters
      setTempFilters(newFilters);
      setFilters(newFilters);
      
      // Force reprocess cases with new filter
      if (cases.length > 0) {
        processCases(cases.map(c => ({...c}))); // Create new array to force update
      }

      // Clear the location state to prevent re-applying filter on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location, cases]); // Add cases as dependency

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
        <button 
          onClick={() => navigate('/cases/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          New Case
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
                              : caseItem.categoryStatus === 'Reviewed'
                                ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'
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

export default Cases; 