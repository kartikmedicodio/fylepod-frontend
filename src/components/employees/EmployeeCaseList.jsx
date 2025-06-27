import React, { useState } from 'react';
import { Search, SlidersHorizontal, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmployeeCaseList = ({ cases = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    documentStatus: '',
    queriesPending: ''
  });
  const casesPerPage = 6;
  const navigate = useNavigate();

  const handleCaseClick = (caseId) => {
    navigate(`case/${caseId}`);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      documentStatus: '',
      queriesPending: ''
    });
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setShowFilters(false);
  };

  const filteredCases = cases.filter(caseItem => {
    // Search filter
    const matchesSearch = caseItem._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.caseManagerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.categoryId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.categoryStatus?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = !filters.status || caseItem.categoryStatus === filters.status;
    
    // Document status filter
    const matchesDocumentStatus = !filters.documentStatus || 
      (filters.documentStatus === 'complete' && caseItem.documentTypes?.length === 5) ||
      (filters.documentStatus === 'incomplete' && caseItem.documentTypes?.length < 5);
    
    // Queries pending filter
    const matchesQueries = !filters.queriesPending || 
      (filters.queriesPending === 'yes' && caseItem.documentTypes?.length > 0) ||
      (filters.queriesPending === 'no' && caseItem.documentTypes?.length === 0);

    return matchesSearch && matchesStatus && matchesDocumentStatus && matchesQueries;
  });

  // Get current cases
  const indexOfLastCase = currentPage * casesPerPage;
  const indexOfFirstCase = indexOfLastCase - casesPerPage;
  const currentCases = filteredCases.slice(indexOfFirstCase, indexOfLastCase);
  const totalPages = Math.ceil(filteredCases.length / casesPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDocumentUploadStatus = (docTypes) => {
    if (!docTypes || docTypes.length === 0) return '0/0 uploaded';
    return `${docTypes.length}/5 uploaded`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header with Search and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search cases..."
              className="w-[400px] pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                       transition-all duration-200"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
            />
          </div>

          {/* Filters Button and Popup */}
          <div className="flex items-center gap-2 relative">
            <button 
              className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>

            {/* Filters Popup */}
            {showFilters && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 space-y-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Case Status</label>
                    <select
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-blue-500"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="in_progress">In Progress</option>
                    </select>
                  </div>

                  {/* Document Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Status</label>
                    <select
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-blue-500"
                      value={filters.documentStatus}
                      onChange={(e) => handleFilterChange('documentStatus', e.target.value)}
                    >
                      <option value="">All Documents</option>
                      <option value="complete">Complete</option>
                      <option value="incomplete">Incomplete</option>
                    </select>
                  </div>

                  {/* Queries Pending Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Queries Pending</label>
                    <select
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-blue-500"
                      value={filters.queriesPending}
                      onChange={(e) => handleFilterChange('queriesPending', e.target.value)}
                    >
                      <option value="">All Cases</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add New Case Button */}
        <div className="flex items-center gap-2">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            onClick={() => navigate('/cases/new')}
          >
            <Plus size={16} />
            Add New Case
          </button>
        </div>
      </div>

      {/* Cases Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-800">Case Id</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-800">Applicant Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-800">Process Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-800">Deadline</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-800">Document Upload Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-800">Queries Pending</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-800">Case Status</th>
            </tr>
          </thead>
          <tbody>
            {currentCases.length > 0 ? (
              currentCases.map((caseItem, index) => (
                <tr 
                  key={caseItem._id} 
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  onClick={() => handleCaseClick(caseItem._id)}
                >
                  <td className="px-6 py-3 text-sm text-gray-600">{caseItem._id?.substring(0, 8)}</td>
                  <td className="px-6 py-3 text-sm text-gray-800">{caseItem.userId?.name || 'N/A'}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{caseItem.categoryId?.name || 'N/A'}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {formatDate(caseItem.createdAt)}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {getDocumentUploadStatus(caseItem.documentTypes)}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {caseItem.documentTypes?.length || 0}
                  </td>
                  <td className={`px-6 py-3 text-sm ${
                    caseItem.categoryStatus === 'pending' ? 'text-gray-600' : 'text-green-600'
                  }`}>
                    {caseItem.categoryStatus?.charAt(0).toUpperCase() + caseItem.categoryStatus?.slice(1) || 'Pending'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-gray-500 text-sm font-medium">No cases found</p>
                    <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Enhanced Pagination */}
        {filteredCases.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm">
            <span className="text-sm text-gray-600">
              Showing <span className="font-medium text-gray-900">{indexOfFirstCase + 1}</span>
              {' '}-{' '}
              <span className="font-medium text-gray-900">{Math.min(indexOfLastCase, filteredCases.length)}</span>
              {' '}of{' '}
              <span className="font-medium text-gray-900">{filteredCases.length}</span>
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
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border transition-all duration-200 
                  ${currentPage === totalPages
                    ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                    : 'text-gray-600 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-sm active:transform active:scale-95'
                  }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeCaseList; 