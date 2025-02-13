import { useState, useEffect, useCallback } from 'react';
import { FileCheck, ChevronLeft, ChevronRight, Search, Filter, Clock, User, Calendar, CheckCircle2, X, FileText, Mail, Phone, Tag, Hash, Flag, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import PDFGenerator from '../components/PDFGenerator';
import { useNavigate } from 'react-router-dom';

const CompletedProcesses = () => {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'pending'
  const itemsPerPage = 10; // Increased from 5 to 10
  const { user } = useAuth();
  const [selectedProcess, setSelectedProcess] = useState(null);
  const navigate = useNavigate();

  const fetchCompletedProcesses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/management/user/${user.id}`, {
        params: {
          status: ['completed', 'pending']
        }
      });
      
      const allProcesses = response.data.data.entries || [];
      setProcesses(allProcesses);
      setTotalPages(Math.ceil(allProcesses.length / itemsPerPage));
    } catch (err) {
      setError('Failed to fetch processes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, itemsPerPage]);

  useEffect(() => {
    if (user?.id) {
      fetchCompletedProcesses();
    }
  }, [user?.id, fetchCompletedProcesses]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getFilteredProcesses = useCallback(() => {
    let filtered = processes;
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(process => 
        process.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(process => process.categoryStatus === statusFilter);
    }

    return filtered;
  }, [processes, searchQuery, statusFilter]);

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
  }, [searchQuery, processes, getFilteredProcesses, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleProcessClick = (process) => {
    // First navigate to ensure we're on the CRM page
    navigate(`/crm/user/${process.userId._id}/application/${process._id}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Process List</h1>
            <p className="text-gray-600 mt-1">Track and monitor all process</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg pl-10 pr-8 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
            {error}
          </div>
        ) : getFilteredProcesses().length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-white rounded-lg border border-gray-200"
          >
            <FileCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {searchQuery ? 'No matching forms found' : 'No forms available'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchQuery 
                ? 'Try adjusting your search criteria'
                : 'Forms will appear here once they are submitted'}
            </p>
          </motion.div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Process Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Info
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getCurrentPageProcesses().map((process) => (
                    <motion.tr 
                      key={process._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      className="group cursor-pointer"
                      onClick={() => handleProcessClick(process)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                              <FileCheck className="h-5 w-5 text-blue-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                              {process.categoryName}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {process._id.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">{process.userId.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(process.categoryStatus)}`}>
                          {process.categoryStatus === 'completed' ? (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          ) : (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {process.categoryStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(process.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, getFilteredProcesses().length)} of {getFilteredProcesses().length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedProcess && (
          <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm z-50">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl"
            >
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Process Details</h2>
                    <button 
                      onClick={() => setSelectedProcess(null)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 space-y-6">
                    {/* Process Info */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                            <FileCheck className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {selectedProcess.categoryName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              ID: {selectedProcess._id}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProcess.categoryStatus)}`}>
                          {selectedProcess.categoryStatus === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          ) : (
                            <Clock className="w-4 h-4 mr-1.5" />
                          )}
                          {selectedProcess.categoryStatus}
                        </span>
                      </div>

                      {/* Customer Info - Enhanced */}
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">Customer Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Name: {selectedProcess.userId.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Email: {selectedProcess.userId.email}
                            </span>
                          </div>
                          {selectedProcess.userId.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Phone: {selectedProcess.userId.phone}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Submitted: {new Date(selectedProcess.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Process Details */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">Process Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Tag className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Category: {selectedProcess.categoryName}
                            </span>
                          </div>
                          {selectedProcess.reference && (
                            <div className="flex items-center space-x-2">
                              <Hash className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Reference: {selectedProcess.reference}
                              </span>
                            </div>
                          )}
                          {selectedProcess.priority && (
                            <div className="flex items-center space-x-2">
                              <Flag className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Priority: {selectedProcess.priority}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Documents Section */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-700">Submitted Documents</h4>
                        {selectedProcess.documentTypes?.map((doc) => (
                          <div 
                            key={doc._id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors duration-200"
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${
                                doc.status === 'completed' 
                                  ? 'bg-emerald-50' 
                                  : 'bg-yellow-50'
                              }`}>
                                <FileText className={`w-4 h-4 ${
                                  doc.status === 'completed' 
                                    ? 'text-emerald-500' 
                                    : 'text-yellow-500'
                                }`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-900 capitalize">{doc.name}</h5>
                                    {doc.required && (
                                      <span className="text-xs text-gray-500 mt-0.5">Required Document</span>
                                    )}
                                  </div>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    doc.status === 'completed'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-yellow-50 text-yellow-700'
                                  }`}>
                                    {doc.status === 'completed' ? (
                                      <div className="flex items-center">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Completed
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Pending
                                      </div>
                                    )}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center text-xs text-gray-500">
                                  <div className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Last Updated: {new Date(selectedProcess.updatedAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Process Timeline */}
                      <div className="space-y-3 mt-6">
                        <h4 className="text-sm font-medium text-gray-700">Process Timeline</h4>
                        <div className="border-l-2 border-gray-200 pl-4 space-y-6">
                          <div className="relative">
                            <div className="absolute -left-[1.625rem] top-1 w-3 h-3 bg-blue-500 rounded-full" />
                            <div className="space-y-1">
                              <p className="text-sm text-gray-900">Process Started</p>
                              <p className="text-xs text-gray-500">
                                {new Date(selectedProcess.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {selectedProcess.categoryStatus === 'completed' && (
                            <div className="relative">
                              <div className="absolute -left-[1.625rem] top-1 w-3 h-3 bg-emerald-500 rounded-full" />
                              <div className="space-y-1">
                                <p className="text-sm text-gray-900">Process Completed</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(selectedProcess.updatedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Comments/Notes Section */}
                      {selectedProcess.comments && selectedProcess.comments.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-700">Comments</h4>
                          <div className="space-y-4">
                            {selectedProcess.comments.map((comment, index) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-start space-x-3">
                                  <MessageSquare className="w-4 h-4 text-gray-400 mt-1" />
                                  <div>
                                    <p className="text-sm text-gray-600">{comment.text}</p>
                                    <div className="mt-1 flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">
                                        By: {comment.author}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {new Date(comment.createdAt).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setSelectedProcess(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CompletedProcesses; 