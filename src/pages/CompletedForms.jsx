import { useState, useEffect } from 'react';
import { FileCheck, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';

const CompletedProcesses = () => {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 5; // Fixed number of items per page
  const { user } = useAuth();

  const fetchCompletedProcesses = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/management/user/${user._id}`, {
        params: {
          status: ['completed', 'pending']
        }
      });
      
      const allProcesses = response.data.data.entries || [];
      setProcesses(allProcesses);
      setTotalPages(Math.ceil(allProcesses.length / itemsPerPage));
      console.log("All processes.......", response.data.data.entries);
    } catch (err) {
      setError('Failed to fetch processes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchCompletedProcesses();
    }
  }, [user?._id]);

  // Filter processes based on search query
  const getFilteredProcesses = () => {
    if (!searchQuery.trim()) return processes;
    
    return processes.filter(process => 
      process.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Get current page processes after filtering
  const getCurrentPageProcesses = () => {
    const filteredProcesses = getFilteredProcesses();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProcesses.slice(startIndex, endIndex);
  };

  // Update total pages when search query changes
  useEffect(() => {
    const filteredProcesses = getFilteredProcesses();
    setTotalPages(Math.ceil(filteredProcesses.length / itemsPerPage));
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchQuery, processes]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderPagination = () => {
    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, processes.length);
    const totalItems = processes.length;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="text-sm text-gray-700">
          Showing {startItem}-{endItem} of {totalItems}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderDocumentTypes = (documentTypes) => {
    return documentTypes.map(doc => doc.name).join(', ');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Process list</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search process..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-8 pr-4 py-1.5 rounded-md border border-blue-100 text-sm text-gray-600 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search className="h-4 w-4 text-blue-500" />
            </div>
          </div>
        </div>

        {getFilteredProcesses().length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchQuery ? 'No matching processes found' : 'No processes found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Processes will appear here once they are created.'}
            </p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Process Id
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Process Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getCurrentPageProcesses().map((process) => (
                  <tr key={process._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {process._id.substring(0, 6)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <FileCheck className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {process.categoryName}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {process.userId.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        process.categoryStatus === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {process.categoryStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {renderPagination()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CompletedProcesses; 