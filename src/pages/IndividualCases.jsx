import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ChevronLeft, ChevronRight, ListFilter, ArrowDownUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCases, setFilteredCases] = useState([]);
  const navigate = useNavigate();

  // Add console.log to check user data
  useEffect(() => {
    console.log('Current user:', user);
  }, [user]);

  const fetchUserCases = async (page, search = '') => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.log('No user ID available');
        return;
      }

      // Add a console.log to check the params being sent
      console.log('Fetching with params:', { page, limit: 5, search });

      const response = await api.get(`/management/user/${user.id}`, {
        params: {
          page,
          limit: 5,
          search,
          // Add any other required params your API might need
          sort: '-createdAt' // Optional: if you want newest first
        }
      });
      
      // Log the response to check what we're getting
      console.log('API Response:', {
        entries: response.data.data.entries?.length,
        total: response.data.data.total,
        page: page
      });

      if (response.data.status === 'success') {
        // Ensure we only take 5 items even if API returns more
        const cases = response.data.data.entries?.slice(0, 5) || [];
        setFilteredCases(cases);

        setPagination({
          total: response.data.data.total,
          currentPage: page,
          limit: 5,
          totalPages: Math.ceil(response.data.data.total / 5)
        });
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  // Remove the duplicate useEffect and combine the logic
  useEffect(() => {
    if (user?.id) {
      fetchUserCases(currentPage, searchTerm);
    }
  }, [currentPage, searchTerm, user?.id]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination?.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  if (loading) {
    return (
      <div className="p-6">
        <CasesSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Search Bar and Actions Row */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-lg">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 14L11 11" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>

          {/* Filters and Sort */}
          <button className="flex items-center gap-2 px-5 py-2.5 text-base bg-white rounded-lg border border-gray-300 hover:bg-gray-50 font-semibold">
            <span>All Filters</span>
            <ListFilter className="h-5 w-5 text-gray-500" />
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 text-base bg-white rounded-lg border border-gray-300 hover:bg-gray-50 font-semibold">
            <span>Sort</span>
            <ArrowDownUp className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Add New Button */}
        <button 
          onClick={() => navigate('/individuals/new')}
          className="flex items-center gap-2 px-5 py-2.5 text-base bg-white rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 ml-3 font-semibold"
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 3.33334V12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.33334 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Add new Individual</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase">
                  Case Id
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase">
                  Individual Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase">
                  Case Manager
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase">
                  Process Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase">
                  Deadline
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase">
                  Document Upload Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase">
                  Queries Pending
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-base text-gray-500">
                    No cases found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCases.map((caseItem) => (
                  <tr 
                    key={caseItem._id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/individuals/case/${caseItem._id}`)}
                  >
                    <td className="px-6 py-4 text-base text-gray-900">
                      {caseItem._id}
                    </td>
                    <td className="px-6 py-4 text-base text-gray-900">
                      {caseItem.userName}
                    </td>
                    <td className="px-6 py-4 text-base text-gray-900">
                      {caseItem.createdBy?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-base text-gray-900">
                      {caseItem.categoryName}
                    </td>
                    <td className="px-6 py-4 text-base text-green-500">
                      {'-'}
                    </td>
                    <td className="px-6 py-4 text-base text-gray-500">
                      {`${caseItem.documentTypes.filter(doc => doc.status === 'completed').length} of ${caseItem.documentTypes.length} uploaded`}
                    </td>
                    <td className="px-6 py-4 text-base text-gray-900">
                      {caseItem.documentTypes.filter(doc => doc.status === 'pending').length}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && filteredCases.length > 0 && (
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div>
            Showing {(currentPage - 1) * pagination.limit + 1} - {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span>Page {currentPage} of {pagination.totalPages}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualCases; 