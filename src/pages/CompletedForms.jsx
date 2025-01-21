import { useState, useEffect } from 'react';
import { FileCheck } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';

const CompletedProcesses = () => {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?._id) {
      fetchCompletedProcesses();
    }
  }, [user?._id]);

  const fetchCompletedProcesses = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/management/user/${user._id}`, {
        params: {
          status: 'completed'
        }
      });
      setProcesses(response.data.data.entries || []);
    } catch (err) {
      setError('Failed to fetch completed processes');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-semibold text-gray-900">Completed Processes</h1>
        </div>

        {processes.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No completed processes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Completed processes will appear here once processed.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Types
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processes.map((process) => (
                  <tr key={process._id}>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {renderDocumentTypes(process.documentTypes)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(process.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {process.categoryStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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