import { useState, useEffect } from 'react';
import { getStoredUser } from '../utils/auth';
import { ChevronLeft, ChevronRight, Search, CirclePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';

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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-3 px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="text-sm font-medium text-gray-500">ID</div>
          <div className="text-sm font-medium text-gray-500">Name</div>
          <div className="text-sm font-medium text-gray-500">Email</div>
        </div>

        {/* Table Body */}
        {currentIndividuals.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500 text-sm">No individuals found</p>
          </div>
        ) : (
          currentIndividuals.map((individual) => (
            <div
              key={individual._id}
              onClick={() => handleRowClick(individual._id)}
              className="grid grid-cols-3 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
            >
              <div className="text-sm font-medium text-gray-500">{individual._id.slice(-8)}</div>
              <div className="text-sm font-medium text-gray-900">{individual.name}</div>
              <div className="text-sm text-gray-500">{individual.email}</div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredIndividuals.length > 0 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredIndividuals.length)} of {filteredIndividuals.length} individuals
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={`p-2 rounded-lg border ${
                pagination.currentPage === 1
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className={`p-2 rounded-lg border ${
                pagination.currentPage === pagination.totalPages
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Individuals; 