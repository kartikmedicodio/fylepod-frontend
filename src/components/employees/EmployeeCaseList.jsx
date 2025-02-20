import React, { useState } from 'react';
import { Search, SlidersHorizontal, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmployeeCaseList = ({ cases = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const casesPerPage = 6;
  const navigate = useNavigate();

  const handleCaseClick = (caseId) => {
    navigate(`case/${caseId}`);
  };

  const filteredCases = cases.filter(caseItem => 
    caseItem.categoryId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                       focus:outline-none focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters Button */}
          <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 text-sm hover:bg-gray-50">
            <SlidersHorizontal size={16} />
            All Filters
          </button>
          <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 text-sm hover:bg-gray-50">
            Sort
          </button>
        </div>

        {/* Add New Case Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} />
          Add New Case
        </button>
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
            {currentCases.map((caseItem, index) => (
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
            ))}
          </tbody>
        </table>

        {/* Updated Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            Showing {indexOfFirstCase + 1} - {Math.min(indexOfLastCase, filteredCases.length)} of {filteredCases.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 border border-gray-200 rounded-lg flex items-center justify-center ${
                currentPage === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 border border-gray-200 rounded-lg flex items-center justify-center ${
                currentPage === totalPages 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCaseList; 