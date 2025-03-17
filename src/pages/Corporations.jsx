import { useState, useEffect, useRef } from 'react';
import corporationService from '../services/corporationService';
import { getStoredUser } from '../utils/auth';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, CirclePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

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
      className="p-4"
    >
      {/* Header Section - Updated styling */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Corporation
        </h1>
      </div>
      
      {/* Search and Actions Bar - Enhanced styling */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search corporations..."
              className="w-[400px] pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                       focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                       transition-all duration-200"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          {/* Enhanced Filter Button */}
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 border rounded-xl bg-gray-50 flex items-center gap-2 transition-all duration-200 ${
                employeeFilter !== 'all'
                  ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-100'
              }`}
            >
              <SlidersHorizontal size={16} />
              <span>Filter</span>
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 left-0 w-48 bg-white border rounded-xl shadow-lg z-10 py-2
                           backdrop-blur-sm bg-white/95"
                >
                  <div className="px-3 py-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Employees
                    </label>
                    <select
                      value={employeeFilter}
                      onChange={(e) => handleFilterChange(e.target.value)}
                      className="w-full p-2 text-sm border rounded-lg focus:outline-none focus:border-blue-500
                               focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    >
                      <option value="all">All</option>
                      <option value="less5">Less than 5</option>
                      <option value="5to10">5 to 10</option>
                      <option value="more10">More than 10</option>
                    </select>
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

        {/* Enhanced Add New Button */}
        <button 
          onClick={() => navigate('/company/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm
                    hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 
                    focus:ring-indigo-500 focus:ring-offset-2"
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
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Corporation ID</th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Corporation name</th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Contact Name</th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">No. of Employees</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredAndSortedCorporations()
              .slice((pagination.currentPage - 1) * pagination.itemsPerPage, pagination.currentPage * pagination.itemsPerPage)
              .map((corp) => (
                <motion.tr 
                  key={corp._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer
                           transition-colors duration-200" 
                  onClick={() => handleRowClick(corp._id)}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{truncateId(corp._id)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{corp.company_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{corp.contact_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {Array.isArray(corp.user_id) ? corp.user_id.length : 0}
                  </td>
                </motion.tr>
              ))}
          </tbody>
        </table>

        {/* Enhanced Pagination Section */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <span className="text-sm text-gray-600">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, getFilteredAndSortedCorporations().length)} of {getFilteredAndSortedCorporations().length}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={`p-2 rounded-lg border transition-all duration-200 ${pagination.currentPage === 1 ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-600 border-gray-200 hover:bg-gray-100 active:transform active:scale-95'}`}
            >
              <ChevronLeft size={18} />
            </button>

            <span className="text-sm font-medium text-gray-700">
              Page {pagination.currentPage} of {Math.ceil(getFilteredAndSortedCorporations().length / pagination.itemsPerPage)}
            </span>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === Math.ceil(getFilteredAndSortedCorporations().length / pagination.itemsPerPage)}
              className={`p-2 rounded-lg border transition-all duration-200 ${pagination.currentPage === Math.ceil(getFilteredAndSortedCorporations().length / pagination.itemsPerPage) ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-600 border-gray-200 hover:bg-gray-100 active:transform active:scale-95'}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Enhanced No Results Message */}
      <AnimatePresence>
        {!loading && getFilteredAndSortedCorporations().length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl mt-4"
          >
            <p className="text-lg">No corporations found {searchQuery && `for "${searchQuery}"`}</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
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
            className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600 mt-2">Loading...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Corporations;