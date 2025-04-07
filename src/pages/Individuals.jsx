import { useState, useEffect } from 'react';
import { getStoredUser } from '../utils/auth';
import { ChevronLeft, ChevronRight, Search, CirclePlus } from 'lucide-react';
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
      className="p-4"
    >
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Individuals
        </h1>
      </div>
      
      {/* Search and Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search individuals..."
              className="w-[400px] pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                       focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                       transition-all duration-200"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* New Individual Button */}
        <button
          onClick={() => navigate('/individual/new')}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium
                     hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
        >
          <CirclePlus size={16} />
          New Individual
        </button>
      </div>

      {/* Table */}
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
                className="border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer
                         transition-colors duration-200"
                onClick={() => handleRowClick(individual._id)}
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{individual._id.slice(-8)}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{individual.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{individual.email}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Enhanced Pagination Section */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <span className="text-sm text-gray-600">
            Showing {startIndex + 1} - {Math.min(endIndex, filteredIndividuals.length)} of {filteredIndividuals.length}
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
              Page {pagination.currentPage} of {Math.ceil(filteredIndividuals.length / pagination.itemsPerPage)}
            </span>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === Math.ceil(filteredIndividuals.length / pagination.itemsPerPage)}
              className={`p-2 rounded-lg border transition-all duration-200 ${pagination.currentPage === Math.ceil(filteredIndividuals.length / pagination.itemsPerPage) ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-600 border-gray-200 hover:bg-gray-100 active:transform active:scale-95'}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Enhanced No Results Message */}
      <AnimatePresence>
        {!loading && filteredIndividuals.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl mt-4"
          >
            <p className="text-lg">No individuals found {searchQuery && `for "${searchQuery}"`}</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Individuals; 