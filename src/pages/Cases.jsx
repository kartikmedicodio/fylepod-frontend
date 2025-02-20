import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

// Add CasesSkeleton component at the top of the file
const CasesSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-8 w-24 bg-gray-200 rounded"></div>
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {[...Array(7)].map((_, index) => (
                  <th key={index} className="px-6 py-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-200">
                  {[...Array(7)].map((_, colIndex) => (
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

      {/* Pagination Skeleton */}
      <div className="mt-4 flex items-center justify-between">
        <div className="h-4 w-64 bg-gray-200 rounded"></div>
        <div className="flex items-center gap-2">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-8 w-8 bg-gray-200 rounded"></div>
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

  const fetchCases = async (page, search = '') => {
    try {
      if (search.trim()) {
        setSearching(true);
      } else {
        setLoading(true);
      }

      let response;
      
      if (search.trim()) {
        // If searching, fetch all cases without pagination
        response = await api.get(`/management/all-managements?limit=1000`);
        if (response.data.status === 'success') {
          const allCases = response.data.data.managements;
          
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
          setCases(allCases);
        }
      } else {
        // If not searching, fetch with pagination
        response = await api.get(`/management/all-managements?page=${page}`);
        if (response.data.status === 'success') {
          const allCases = response.data.data.managements;
          setFilteredCases(allCases);
          setPagination(response.data.data.pagination);
          setCases(allCases);
        }
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // Initial fetch without search
  useEffect(() => {
    fetchCases(currentPage);
  }, [currentPage]);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCases(1, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination?.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Only show skeleton for initial load, not during search
  if (loading && !searching) {
    return (
      <div className="p-6">
        <CasesSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Cases</h1>
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
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="px-4 py-2 text-sm bg-white rounded-lg border border-gray-300 hover:bg-gray-50">
          All Filters
        </button>
        <button className="px-4 py-2 text-sm bg-white rounded-lg border border-gray-300 hover:bg-gray-50">
          Sort
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case Id
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Individual Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Process Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Upload Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Queries Pending
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No cases found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCases.map((caseItem) => (
                  <tr key={caseItem._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {caseItem._id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {caseItem.userName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {caseItem.createdBy.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {caseItem.categoryName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      -
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {caseItem.categoryStatus}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      -
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optional loading indicator during search */}
      {searching && (
        <div className="absolute top-4 right-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Pagination */}
      {pagination && filteredCases.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
          <div>
            Showing {(currentPage - 1) * pagination.limit + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(page => {
                // Show first page, last page, current page, and pages around current page
                return (
                  page === 1 ||
                  page === pagination.totalPages ||
                  Math.abs(page - currentPage) <= 1
                );
              })
              .map((page, index, array) => (
                <>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span key={`ellipsis-${page}`} className="px-2">
                      ...
                    </span>
                  )}
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                </>
              ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases; 