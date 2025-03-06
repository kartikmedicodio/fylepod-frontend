import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import CaseDetails from './CaseDetails';
import { motion, AnimatePresence } from 'framer-motion';

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
        'Deadline', 'Document Upload Status', 'Queries Pending'
      ].map((header) => (
        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          {header}
        </th>
      ))}
    </tr>
  </thead>
);

const CaseRow = ({ caseItem, onClick }) => (
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
    <td className="px-6 py-4 text-sm text-gray-900">-</td>
    <td className="px-6 py-4 text-sm">
      <span className={`px-2 py-1 rounded-full text-xs ${
        caseItem.categoryStatus === 'completed' 
          ? 'bg-green-100 text-green-800'
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {caseItem.categoryStatus}
      </span>
    </td>
    <td className="px-6 py-4 text-sm text-gray-900">-</td>
  </motion.tr>
);

// Add CasesSkeleton component at the top of the file
const CasesSkeleton = () => {
  return (
    <div className="p-6">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-10 w-24 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {[...Array(7)].map((_, index) => (
                  <th key={index} className="px-6 py-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-200">
                  {[...Array(7)].map((_, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="mt-4 flex items-center justify-between">
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
};

const Cases = () => {
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

  // Add effect to fetch logged in user details
  useEffect(() => {
    const fetchLoggedInUserDetails = async () => {
      try {
        const response = await api.get('/auth/me');
        if (!response.data || !response.data.data || !response.data.data.user) {
          throw new Error('No user data received from /auth/me');
        }
        const userDetails = response.data.data.user;
        console.log('Logged in user lawfirm_id:', userDetails.lawfirm_id?._id);
        setLoggedInUserDetails(userDetails);
      } catch (error) {
        console.error('Error fetching logged in user details:', error);
        setError(error.message);
      }
    };

    fetchLoggedInUserDetails();
  }, []);

  const fetchCases = async (page, search = '') => {
    try {
      if (!loggedInUserDetails?.lawfirm_id?._id) {
        console.log('No lawfirm ID available');
        return;
      }

      if (search.trim()) {
        setSearching(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(`/management/all-managements?page=${page}`);
      
      if (response.data.status === 'success') {
        // Filter cases by lawfirm ID
        const allCases = response.data.data.managements.filter(caseItem => 
          caseItem.lawfirmId === loggedInUserDetails.lawfirm_id._id
        );
        
        if (search.trim()) {
          // Filter cases based on search term
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
          // If no search term, show all filtered cases with pagination
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
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    if (loggedInUserDetails?.lawfirm_id?._id) {
      fetchCases(currentPage);
    }
  }, [currentPage, loggedInUserDetails]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm) {
        fetchCases(1, searchTerm);
      } else {
        // Reset to original state when search is cleared
        fetchCases(1);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

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
    setSelectedCase(caseItem._id);
  };

  const handleBackToCases = () => {
    setSelectedCase(null);
  };

  if (selectedCase) {
    return <CaseDetails caseId={selectedCase} onBack={handleBackToCases} />;
  }

  if (loading && !searching) {
    return (
      <div className="p-6">
        <CasesSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">Error loading cases: {error}</div>
        <button 
          onClick={() => fetchCases(currentPage)}
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
        
        <button className="px-4 py-2 text-sm bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
        
        <button className="px-4 py-2 text-sm bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4" />
          Sort
        </button>
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
                  'Deadline', 'Document Upload Status', 'Queries Pending'
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
                  filteredCases.map((caseItem) => (
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
                      <td className="px-6 py-4 text-sm text-gray-600">-</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          caseItem.categoryStatus === 'completed' 
                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                            : 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20'
                        }`}>
                          {caseItem.categoryStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">-</td>
                    </motion.tr>
                  ))
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