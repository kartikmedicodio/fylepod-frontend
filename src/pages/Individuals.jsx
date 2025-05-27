import { useState, useEffect } from 'react';
import { getStoredUser } from '../utils/auth';
import { ChevronLeft, ChevronRight, Search, CirclePlus, Users, User, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { usePage } from '../contexts/PageContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

const IndividualsSkeleton = () => (
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

const Individuals = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [individuals, setIndividuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const navigate = useNavigate();
  const { setPageTitle } = usePage();
  const { setCurrentBreadcrumb } = useBreadcrumb();

  // Set breadcrumb immediately when component mounts
  useEffect(() => {
    setCurrentBreadcrumb([
      { name: 'Home', path: '/' },
      { name: 'Individuals', path: '/individuals' }
    ]);

    // Cleanup breadcrumb when component unmounts
    return () => {
      setCurrentBreadcrumb([]);
    };
  }, []); // Empty dependency array to run only once on mount

  useEffect(() => {
    setPageTitle('Individuals');
    return () => setPageTitle('');
  }, [setPageTitle]);

  useEffect(() => {
    fetchIndividuals();
  }, []);

  const fetchIndividuals = async () => {
    try {
      setLoading(true);
      const user = getStoredUser();
      
      if (!user) {
        setError('User data not found. Please login again.');
        setLoading(false);
        return;
      }
      
      // Fetch individuals using the new API endpoint
      const response = await api.get('/auth/individuals');
      const { data } = response.data;
      
      if (!data || !data.individuals) {
        setError('No individuals found');
        setIndividuals([]);
      } else {
        // Filter individuals based on user's lawfirm_id
        const filteredIndividuals = data.individuals.filter(individual => 
          individual.lawfirm_id?._id === user.lawfirm_id._id
        );
        
        setIndividuals(filteredIndividuals);
        setPagination(prev => ({
          ...prev,
          totalPages: Math.ceil(filteredIndividuals.length / pagination.itemsPerPage),
          totalItems: filteredIndividuals.length
        }));
      }
    } catch (error) {
      console.error('Error fetching individuals:', error);
      setError('Failed to load individuals');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedIndividuals = () => {
    let filtered = [...individuals];

    filtered = filtered.filter(individual => 
      individual.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      individual.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered;
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      totalPages: Math.ceil(getFilteredAndSortedIndividuals().length / pagination.itemsPerPage),
      totalItems: getFilteredAndSortedIndividuals().length
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

  const handleRowClick = (individualId) => {
    navigate(`/individuals/${individualId}`);
  };

  if (loading) {
    return <IndividualsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const filteredIndividuals = getFilteredAndSortedIndividuals();
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const endIndex = startIndex + pagination.itemsPerPage;
  const currentIndividuals = filteredIndividuals.slice(startIndex, endIndex);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-[1400px] mx-auto"
    >
      {/* Enhanced Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Individuals
          </h1>
        </div>
        <p className="text-gray-600">Manage and view all individuals in your law firm</p>
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
              placeholder="Search by name, email, or ID..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                       focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
                       transition-all duration-200"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        <button 
          onClick={() => navigate('/individual/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm
                    hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 
                    focus:ring-indigo-500 focus:ring-offset-2 shadow-sm"
        >
          <CirclePlus size={18} />
          New Individual
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
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Individual ID</th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
            </tr>
          </thead>
          <tbody>
            {currentIndividuals.map((individual) => (
              <motion.tr 
                key={individual._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-gray-100 hover:bg-indigo-50/50 cursor-pointer
                         transition-colors duration-200"
                onClick={() => handleRowClick(individual._id)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{individual._id.slice(-8)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{individual.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} />
                      <span>{individual.email}</span>
                    </div>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Enhanced Pagination */}
        {pagination && pagination.totalItems > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center">
            <span className="text-sm text-gray-700">
              Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> of{' '}
              <span className="font-medium">{pagination.totalItems}</span> individuals
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
                {(() => {
                  const pages = [];
                  const totalPages = pagination.totalPages;

                  // Always show first page
                  pages.push(1);

                  // Calculate range around current page
                  let start = Math.max(2, pagination.currentPage - 1);
                  let end = Math.min(totalPages - 1, pagination.currentPage + 1);

                  // Adjust range if at edges
                  if (pagination.currentPage <= 3) {
                    end = Math.min(4, totalPages - 1);
                  }
                  if (pagination.currentPage >= totalPages - 2) {
                    start = Math.max(2, totalPages - 3);
                  }

                  // Add ellipsis and buffer numbers
                  if (start > 2) {
                    pages.push('...');
                  }

                  // Add middle pages
                  for (let i = start; i <= end; i++) {
                    pages.push(i);
                  }

                  // Add ending ellipsis
                  if (end < totalPages - 1) {
                    pages.push('...');
                  }

                  // Always show last page if there is more than one page
                  if (totalPages > 1) {
                    pages.push(totalPages);
                  }

                  return pages.map((page, idx) => (
                    page === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                        {page}
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[32px] h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors duration-200
                          ${pagination.currentPage === page
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        {page}
                      </button>
                    )
                  ));
                })()}
              </div>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`p-2 rounded-lg border transition-all duration-200 
                  ${pagination.currentPage === pagination.totalPages
                    ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                    : 'text-gray-600 border-gray-200 hover:bg-gray-100 active:transform active:scale-95'}`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Enhanced Empty State */}
      <AnimatePresence>
        {!loading && filteredIndividuals.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-12 bg-white rounded-xl mt-4 border border-gray-200"
          >
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No individuals found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery 
                ? `No results found for "${searchQuery}". Try adjusting your search terms.`
                : "Get started by adding your first individual."}
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/individual/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent 
                         shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 
                         hover:bg-indigo-700 focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-indigo-500"
              >
                <CirclePlus className="-ml-1 mr-2 h-5 w-5" />
                Add Individual
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
              <p className="mt-4 text-sm text-gray-600">Loading individuals...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Individuals; 