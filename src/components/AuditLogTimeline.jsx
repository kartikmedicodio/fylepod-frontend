import React, { useEffect, useState, useMemo } from 'react';
import { fetchAuditLogsByManagement } from '../services/auditLogService';
import { History, Search, User, ArrowDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const LoadingSkeleton = () => {
  return (
    <div className="space-y-8 p-4">
      {/* Loading header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-32 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Loading timeline items */}
      {[...Array(5)].map((_, index) => (
        <div key={index} className="relative pl-8 pb-8">
          {/* Timeline line */}
          <div className="absolute left-3 top-5 bottom-0 w-0.5 bg-gray-200"></div>
          
          {/* Timeline dot */}
          <div className="absolute left-2 top-5 h-3 w-3 rounded-full bg-gray-200 animate-pulse"></div>
          
          {/* Content */}
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-4">
              {/* Avatar placeholder */}
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
              
              <div className="flex-1 space-y-3">
                {/* Title placeholder */}
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                
                {/* Description placeholders */}
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse"></div>
                </div>
                
                {/* Footer placeholder */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-32 bg-gray-100 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const AuditLogTimeline = ({ managementId, onMailLogClick }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  useEffect(() => {
    const getLogs = async () => {
      setLoading(true);
      try {
        const res = await fetchAuditLogsByManagement(managementId);
        // Flatten logs for timeline
        const allLogs = res.data.flatMap(item =>
          item.logs.map(log => ({
            ...log,
            user: log.agentName || log.username || (item.userId?.username ?? 'Unknown'),
            performedBy: log.performedBy,
            createdAt: log.createdAt,
            type: log.type || 'system',
            timestamp: log.createdAt,
          }))
        );
        setAuditLogs(allLogs);
      } catch (err) {
        setAuditLogs([]);
      }
      setLoading(false);
    };
    if (managementId) getLogs();
  }, [managementId]);

  // Get unique users from audit logs
  const uniqueUsers = useMemo(() => {
    const users = new Set(auditLogs.map(log => log.user));
    return Array.from(users);
  }, [auditLogs]);

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesUser = selectedUser === 'all' || log.user === selectedUser;
    return matchesSearch && matchesType && matchesUser;
  });

  const getActorIcon = (actor) => {
    if (actor === 'Diana') {
      return (
        <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
          <img src="/assets/diana-avatar.png" alt="Diana" className="w-full h-full object-cover" />
        </div>
      );
    }
    if (actor === 'Fiona') {
      return (
        <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
          <img src="/assets/fiona-avatar.png" alt="Fiona" className="w-full h-full object-cover" />
        </div>
      );
    }
    return <User className="w-6 h-6 text-blue-500" />;
  };

  const getActionColor = (type, isAIAgent) => {
    if (isAIAgent) {
      return 'border-transparent bg-gradient-to-r from-purple-50 via-purple-50 to-blue-50 shadow-sm hover:shadow-md transition-all duration-200';
    }
    switch (type) {
      case 'document':
        return 'border-blue-500 bg-blue-50';
      case 'payment':
        return 'border-green-500 bg-green-50';
      case 'questionnaire':
        return 'border-yellow-500 bg-yellow-50';
      case 'form':
        return 'border-indigo-500 bg-indigo-50';
      case 'letter':
        return 'border-amber-500 bg-amber-50';
      case 'receipt':
        return 'border-cyan-500 bg-cyan-50';
      case 'user':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const isAIAgent = (user) => {
    return (user || '').toLowerCase().includes('diana') || (user || '').toLowerCase().includes('fiona');
  };

  // Utility function to prettify action/type names
  const prettifyAction = (action) =>
    action
      ? action
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : '';

  if (loading) {
    return (
      <div className="relative min-h-[400px] bg-gray-50/50">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <LoadingSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      {/* Header with gradient background */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
          <History className="w-6 h-6 text-purple-600" />
          Activity Logs
        </h2>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search workflow steps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
          />
        </div>
        <div className="relative">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="appearance-none pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition-all duration-200"
          >
            <option value="all">All Users</option>
            {uniqueUsers.map((user) => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
          <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <ArrowDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white transition-all duration-200"
        >
          <option value="all">All Steps</option>
          <option value="document">Documents</option>
          <option value="payment">Payments</option>
          <option value="user">User Actions</option>
          <option value="system">System</option>
          <option value="form">Forms</option>
          <option value="letter">Letters</option>
          <option value="receipt">Receipts</option>
        </select>
      </div>

      {/* Timeline Flowchart */}
      <div className="relative pl-12">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No matching logs found</div>
        ) : (
          filteredLogs.map((log, index) => {
            const isEmailLog = log.type === 'email' && log.mailId;
            return (
              <div
                key={index}
                className={`relative mb-8 ${isEmailLog ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                onClick={isEmailLog ? () => onMailLogClick && onMailLogClick(log.mailId) : undefined}
              >
                {/* Vertical Timeline Line */}
                {index !== filteredLogs.length - 1 && (
                  <div
                    className={`absolute left-6 top-0 w-0.5 ${
                      isAIAgent(log.user)
                        ? 'bg-gradient-to-b from-purple-300 via-blue-200 to-purple-300'
                        : 'bg-gray-200'
                    }`}
                    style={{ height: '100%', top: '2.5rem' }}
                  ></div>
                )}
                {/* Timeline Item */}
                <div className="flex items-start gap-6">
                  {/* Actor Icon */}
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full 
                    ${isAIAgent(log.user)
                      ? 'bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 p-[3px] shadow-lg hover:shadow-purple-200 transition-shadow duration-200'
                      : 'border-2 border-gray-200 bg-white'
                    }`}>
                    <div className={`flex items-center justify-center w-full h-full rounded-full bg-white overflow-hidden
                      ${isAIAgent(log.user) ? 'transform hover:scale-105 transition-transform duration-200' : ''}`}>
                      {getActorIcon(log.user)}
                    </div>
                  </div>
                  {/* Content */}
                  <div className={`flex-1 p-5 border rounded-lg transform hover:scale-[1.01] transition-transform duration-200
                    ${getActionColor(log.type, isAIAgent(log.user))} 
                    ${isAIAgent(log.user)
                      ? 'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-purple-400 before:via-blue-400 before:to-purple-400 before:rounded-l-lg relative shadow-md hover:shadow-lg'
                      : 'hover:shadow-md'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${
                          isAIAgent(log.user)
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text'
                            : 'text-gray-900'
                        }`}>
                          {log.user}
                        </span>
                        {isAIAgent(log.user) && (
                          <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 rounded-full shadow-sm">
                            AI Agent
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 font-medium">
                        {format(new Date(log.timestamp), 'dd MMM yyyy')}
                      </span>
                    </div>
                    <h3 className={`text-base font-semibold mb-2 ${
                      isAIAgent(log.user)
                        ? 'bg-gradient-to-r from-purple-700 to-blue-700 text-transparent bg-clip-text'
                        : 'text-gray-900'
                    }`}>
                      {prettifyAction(log.action)}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{log.description}</p>
                    {/* Action Type Badge */}
                    <div className="mt-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full shadow-sm
                        ${isAIAgent(log.user)
                          ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800'
                          : log.type === 'document'
                            ? 'bg-blue-100 text-blue-800'
                            : log.type === 'payment'
                              ? 'bg-green-100 text-green-800'
                              : log.type === 'questionnaire'
                                ? 'bg-yellow-100 text-yellow-800'
                                : log.type === 'form'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : log.type === 'letter'
                                    ? 'bg-amber-100 text-amber-800'
                                    : log.type === 'receipt'
                                      ? 'bg-cyan-100 text-cyan-800'
                                      : log.type === 'retainer'
                                        ? 'bg-pink-100 text-pink-800'
                                        : 'bg-gray-100 text-gray-800'}`}>
                        {prettifyAction(log.type)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AuditLogTimeline; 