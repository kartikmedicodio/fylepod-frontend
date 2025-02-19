import React, { useState, useEffect } from 'react';
import corporationService from '../services/corporationService';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, CirclePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="grid grid-cols-4 px-6 py-3 border-b border-gray-200">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-5 bg-[#f9fafb] rounded animate-shimmer"></div>
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
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [showFilters, setShowFilters] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCorporations();
  }, []);

  const fetchCorporations = async () => {
    try {
      setLoading(true);
      const data = await corporationService.getAllCorporations();
      console.log("data", data);
      setCorporations(data.data || []);
      setPagination(prev => ({
        ...prev,
        totalPages: Math.ceil((data.data?.length || 0) / pagination.itemsPerPage),
        totalItems: data.data?.length || 0
      }));
    } catch (err) {
      setError('Failed to fetch corporations');
      console.error('Error fetching corporations:', err);
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
        filtered = filtered.filter(corp => (corp.user_id?.length || 0) < 5);
        break;
      case '5to10':
        filtered = filtered.filter(corp => (corp.user_id?.length || 0) >= 5 && (corp.user_id?.length || 0) <= 10);
        break;
      case 'more10':
        filtered = filtered.filter(corp => (corp.user_id?.length || 0) > 10);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
    <div className="p-4">
      {/* Header Section */}
      <div className="mb-4">
        <h1 className="text-xl font-medium text-gray-800">
          Corporation
        </h1>
      </div>
      
      {/* Search and Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search corporations..."
              className="w-[400px] pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:border-blue-500"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          {/* Simplified Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
                employeeFilter !== 'all'
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'border-gray-200'
              }`}
            >
              <SlidersHorizontal size={16} />
              <span>Filter</span>
            </button>

            {showFilters && (
              <div className="absolute top-full mt-1 left-0 w-48 bg-white border rounded-lg shadow-lg z-10 py-2">
                <div className="px-3 py-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Employees
                  </label>
                  <select
                    value={employeeFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="w-full p-1.5 text-sm border rounded"
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
              </div>
            )}
          </div>
        </div>

        {/* Add New Individual Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
            <CirclePlus />
          Add new individual
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-medium text-black">Corporation ID</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black">Corporation name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black">Contact Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black">No. of Employees</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredAndSortedCorporations()
              .slice((pagination.currentPage - 1) * pagination.itemsPerPage, pagination.currentPage * pagination.itemsPerPage)
              .map((corp) => (
                <tr 
                  key={corp._id} 
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" 
                  onClick={() => handleRowClick(corp._id)}
                >
                  <td className="px-6 py-3 text-sm">
                    {truncateId(corp._id)}
                  </td>
                  <td className="px-6 py-3 text-sm">{corp.company_name}</td>
                  <td className="px-6 py-3 text-sm">John Doe</td>
                  <td className="px-6 py-3 text-sm">{corp.user_id?.length || 0}</td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Pagination Section */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, getFilteredAndSortedCorporations().length)} of {getFilteredAndSortedCorporations().length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={`p-1.5 rounded border ${
                pagination.currentPage === 1
                  ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft size={18} />
            </button>

            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} of {Math.ceil(getFilteredAndSortedCorporations().length / pagination.itemsPerPage)}
            </span>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === Math.ceil(getFilteredAndSortedCorporations().length / pagination.itemsPerPage)}
              className={`p-1.5 rounded border ${
                pagination.currentPage === Math.ceil(getFilteredAndSortedCorporations().length / pagination.itemsPerPage)
                  ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Show "No results found" message when search yields no results */}
      {!loading && getFilteredAndSortedCorporations().length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No corporations found {searchQuery && `for "${searchQuery}"`}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default Corporations; 