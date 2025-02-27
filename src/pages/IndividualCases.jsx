import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ChevronLeft, ChevronRight, ListFilter, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [displayCases, setDisplayCases] = useState([]);
  const [allCases, setAllCases] = useState([]); // Keep this to store ALL cases
  const [pagination, setPagination] = useState({
    total: 0,
    currentPage: 1,
    limit: 5,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  // const [filteredCases, setFilteredCases] = useState([]); // Remove this unused state
  // New states for sorting
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  // New state for status filter
  const [statusFilter, setStatusFilter] = useState('');
  
  const navigate = useNavigate();

  // Fetch related users
  const fetchRelatedUsers = async () => {
    try {
      if (!user?.id) return;
      
      const response = await api.get(`/auth/user-relationships/${user.id}`);
      
      if (response.data.status === 'success') {
        // Extract related user IDs and include current user
        const relationships = response.data.data.relationships || [];
        const relatedUserIds = relationships.map(rel => rel.user_id._id);
        
        // Include current user's ID
        const allUsers = [user.id, ...relatedUserIds];
        return allUsers;
      }
      return [user.id]; // Default to just the current user if no relationships
    } catch (error) {
      console.error('Error fetching user relationships:', error);
      toast.error('Failed to fetch related users');
      return [user.id]; // Default to just the current user
    }
  };

  // Fetch all cases without any backend filtering or sorting
  const fetchAllUsersCases = async (userIds) => {
    try {
      setLoading(true);
      
      if (!userIds.length) {
        console.log('No user IDs available');
        return;
      }

      // Only pass userIds to backend - everything else will be handled in frontend
      const response = await api.get('/management/users', {
        params: {
          userIds: userIds.join(',')
        }
      });

      if (response.data.status === 'success') {
        const cases = response.data.data.entries || [];
        setAllCases(cases); // Store all cases
        
        // Process all filtering and sorting here
        processCases(cases);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  // Process cases with filtering, sorting, and pagination
  const processCases = (cases) => {
    // Step 1: Filter by search term
    const searchFiltered = searchTerm 
      ? cases.filter(c => 
          c.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c._id?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : cases;
      
    // Step 2: Filter by status if selected
    const statusFiltered = statusFilter
      ? searchFiltered.filter(c => c.categoryStatus === statusFilter)
      : searchFiltered;
    
    // Step 3: Sort the filtered data
    const sorted = [...statusFiltered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle nested fields (e.g., createdBy.name)
      if (sortField.includes('.')) {
        const parts = sortField.split('.');
        aValue = parts.reduce((obj, key) => obj?.[key], a);
        bValue = parts.reduce((obj, key) => obj?.[key], b);
      }
      
      // Handle null/undefined values
      if (aValue === undefined || aValue === null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue === undefined || bValue === null) return sortDirection === 'asc' ? 1 : -1;
      
      // Compare strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Compare numbers/dates
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    // Step 4: Paginate the sorted data
    const total = sorted.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const startIndex = (currentPage - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const currentPageCases = sorted.slice(startIndex, endIndex);
    
    // Update state with processed data
    setDisplayCases(currentPageCases); // Set the display cases for current page
    setPagination({
      total,
      currentPage,
      limit: pagination.limit,
      totalPages
    });
  };

  // Initial load - fetch related users and then their cases
  useEffect(() => {
    if (user?.id) {
      const loadData = async () => {
        const userIds = await fetchRelatedUsers();
        await fetchAllUsersCases(userIds);
      };
      loadData();
    }
  }, [user?.id]);

  // Reprocess cases when filtering, sorting, or pagination changes
  useEffect(() => {
    if (allCases.length > 0) {
      processCases(allCases);
    }
  }, [searchTerm, statusFilter, sortField, sortDirection, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle column sort
  const handleSort = (field) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Toggle status filter
  const handleStatusFilter = (status) => {
    setStatusFilter(status === statusFilter ? '' : status);
    setCurrentPage(1); // Reset to first page when filtering
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

          {/* Filters dropdown */}
          <div className="relative">
            <button 
              className="flex items-center gap-2 px-5 py-2.5 text-base bg-white rounded-lg border border-gray-300 hover:bg-gray-50 font-semibold"
              onClick={() => document.getElementById('statusFilterDropdown').classList.toggle('hidden')}
            >
              <span>All Filters</span>
              <ListFilter className="h-5 w-5 text-gray-500" />
            </button>
            
            {/* Status Filter Dropdown */}
            <div id="statusFilterDropdown" className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden">
              <div className="py-1">
                <button 
                  className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${statusFilter === 'pending' ? 'bg-blue-50 text-blue-600' : ''}`}
                  onClick={() => handleStatusFilter('pending')}
                >
                  Pending
                </button>
                <button 
                  className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${statusFilter === 'approved' ? 'bg-blue-50 text-blue-600' : ''}`}
                  onClick={() => handleStatusFilter('approved')}
                >
                  Approved
                </button>
                {/* <button 
                  className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${statusFilter === 'completed' ? 'bg-blue-50 text-blue-600' : ''}`}
                  onClick={() => handleStatusFilter('completed')}
                >
                  Completed
                </button> */}
                <button 
                  className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${statusFilter === 'uploaded' ? 'bg-blue-50 text-blue-600' : ''}`}
                  onClick={() => handleStatusFilter('uploaded')}
                >
                  Uploaded
                </button>
                {statusFilter && (
                  <button 
                    className="block px-4 py-2 text-sm text-left w-full text-red-500 hover:bg-gray-100"
                    onClick={() => setStatusFilter('')}
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sort button - now just a visual indicator */}
          <div className="relative">
            <button 
              className="flex items-center gap-2 px-5 py-2.5 text-base bg-white rounded-lg border border-gray-300 hover:bg-gray-50 font-semibold"
            >
              <span>Sort: {sortField}</span>
              {sortDirection === 'asc' ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
            </button>
          </div>
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
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('_id')}
                >
                  <div className="flex items-center">
                    Case Id
                    {sortField === '_id' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('userName')}
                >
                  <div className="flex items-center">
                    Individual Name
                    {sortField === 'userName' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('createdBy.name')}
                >
                  <div className="flex items-center">
                    Case Manager
                    {sortField === 'createdBy.name' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('categoryName')}
                >
                  <div className="flex items-center">
                    Process Name
                    {sortField === 'categoryName' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase">
                  Deadline
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('categoryStatus')}
                >
                  <div className="flex items-center">
                    Document Upload Status
                    {sortField === 'categoryStatus' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase">
                  Queries Pending
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayCases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-base text-gray-500">
                    No cases found matching your search.
                  </td>
                </tr>
              ) : (
                displayCases.map((caseItem) => (
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
                      {`${caseItem.documentTypes.filter(doc => 
                        doc.status === 'uploaded' || doc.status === 'approved'
                      ).length} of ${caseItem.documentTypes.length} uploaded`}
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
      {pagination && pagination.total > 0 && (
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div>
            Showing {((currentPage - 1) * pagination.limit) + 1} - {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
            {statusFilter && <span> • Filtered by status: <strong>{statusFilter}</strong></span>}
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