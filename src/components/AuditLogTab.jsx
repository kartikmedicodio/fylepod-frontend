import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Download, User, Bot, ArrowDown } from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';

const AuditLogTab = ({ caseId }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchAuditLogs();
  }, [caseId]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/audit-logs/${caseId}`);
      if (response.data.status === 'success') {
        setAuditLogs(response.data.data.logs);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && log.type === filterType;
  });

  const handleExport = () => {
    // Implementation for exporting logs
    console.log('Exporting logs...');
  };

  const getActorIcon = (actor) => {
    if (actor.toLowerCase().includes('diana') || actor.toLowerCase().includes('fiona')) {
      return <Bot className="w-5 h-5 text-purple-500" />;
    }
    return <User className="w-5 h-5 text-blue-500" />;
  };

  const getActionColor = (type) => {
    switch (type) {
      case 'document':
        return 'border-blue-500 bg-blue-50';
      case 'payment':
        return 'border-green-500 bg-green-50';
      case 'user':
        return 'border-purple-500 bg-purple-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <History className="w-5 h-5" />
          Workflow Timeline
        </h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search workflow steps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Steps</option>
          <option value="document">Documents</option>
          <option value="payment">Payments</option>
          <option value="user">User Actions</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* Timeline Flowchart */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="relative pl-8">
          {filteredLogs.map((log, index) => (
            <div key={index} className="relative mb-8">
              {/* Vertical Timeline Line */}
              {index !== filteredLogs.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200"></div>
              )}
              
              {/* Timeline Item */}
              <div className="flex items-start gap-4">
                {/* Actor Icon */}
                <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-gray-200">
                  {getActorIcon(log.user)}
                </div>
                
                {/* Content */}
                <div className={`flex-1 p-4 border rounded-lg ${getActionColor(log.type)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{log.user}</span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(log.timestamp), 'dd MMM yyyy HH:mm:ss')}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{log.action}</h3>
                  <p className="text-sm text-gray-600">{log.description}</p>
                  
                  {/* Action Type Badge */}
                  <div className="mt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full
                      ${log.type === 'document' ? 'bg-blue-100 text-blue-800' :
                        log.type === 'payment' ? 'bg-green-100 text-green-800' :
                        log.type === 'user' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {log.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogTab;
