import React, { useState } from 'react';
import { History, Search, Filter, Download, User, Bot, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';

const AuditLogTab = ({ caseId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Static audit logs data
  const staticAuditLogs = [
    {
      id: 1,
      user: 'Fiona',
      type: 'system',
      action: 'Case Initiated',
      description: 'New immigration case has been initiated in the system.',
      timestamp: '2024-03-20T09:00:00Z'
    },
    {
      id: 2,
      user: 'Fiona',
      type: 'document',
      action: 'Email Sent',
      description: 'Initial email sent to applicant with document checklist and requirements.',
      timestamp: '2024-03-20T09:05:00Z'
    },
    {
      id: 3,
      user: 'Fiona',
      type: 'system',
      action: 'Case Assignment',
      description: 'Case handed over to AI Agent Diana for document processing and verification.',
      timestamp: '2024-03-20T09:10:00Z'
    },
    {
      id: 4,
      user: 'Diana',
      type: 'system',
      action: 'Case Accepted',
      description: 'AI Agent Diana has accepted the case and initiated document verification process.',
      timestamp: '2024-03-20T09:11:00Z'
    },
    {
      id: 5,
      user: 'Ravi Kumar',
      type: 'document',
      action: 'Retainer Created',
      description: 'Attorney initiated retainer agreement creation for the case.',
      timestamp: '2024-03-21T10:00:00Z'
    },
    {
      id: 6,
      user: 'Diana',
      type: 'document',
      action: 'Retainer Processing',
      description: 'Auto-filled retainer details and stored in database.',
      timestamp: '2024-03-21T10:01:00Z'
    },
    {
      id: 7,
      user: 'Diana',
      type: 'document',
      action: 'Signature Request Sent',
      description: 'Generated and sent signature request for retainer agreement.',
      timestamp: '2024-03-21T10:02:00Z'
    }
  ];

  const filteredLogs = staticAuditLogs.filter(log => {
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
      return <Bot className="w-5 h-5 text-purple-600" />;
    }
    return <User className="w-5 h-5 text-blue-500" />;
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
      case 'user':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const isAIAgent = (user) => {
    return user.toLowerCase().includes('diana') || user.toLowerCase().includes('fiona');
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
      <div className="relative pl-8">
        {filteredLogs.map((log, index) => (
          <div key={index} className="relative mb-8">
            {/* Vertical Timeline Line */}
            {index !== filteredLogs.length - 1 && (
              <div 
                className={`absolute left-5 top-0 w-0.5 ${
                  isAIAgent(log.user) 
                    ? 'bg-gradient-to-b from-purple-300 to-blue-200' 
                    : 'bg-gray-200'
                }`}
                style={{ height: '100%', top: '2.5rem' }}
              ></div>
            )}
            
            {/* Timeline Item */}
            <div className="flex items-start gap-4">
              {/* Actor Icon */}
              <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white 
                ${isAIAgent(log.user) 
                  ? 'border-2 border-transparent bg-gradient-to-r from-purple-400 to-blue-400 p-[2px]' 
                  : 'border-2 border-gray-200'
                }`}>
                <div className={`flex items-center justify-center w-full h-full rounded-full ${
                  isAIAgent(log.user) ? 'bg-white' : ''
                }`}>
                  {getActorIcon(log.user)}
                </div>
              </div>
              
              {/* Content */}
              <div className={`flex-1 p-4 border rounded-lg ${getActionColor(log.type, isAIAgent(log.user))} 
                ${isAIAgent(log.user) 
                  ? 'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-purple-400 before:to-blue-400 before:rounded-l-lg relative' 
                  : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isAIAgent(log.user) 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text' 
                      : 'text-gray-900'
                  }`}>
                    {log.user}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(log.timestamp), 'dd MMM yyyy')}
                  </span>
                </div>
                <h3 className={`text-base font-semibold mb-1 ${
                  isAIAgent(log.user) 
                    ? 'bg-gradient-to-r from-purple-700 to-blue-700 text-transparent bg-clip-text' 
                    : 'text-gray-900'
                }`}>
                  {log.action}
                </h3>
                <p className="text-sm text-gray-600">{log.description}</p>
                
                {/* Action Type Badge */}
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full
                    ${isAIAgent(log.user) 
                      ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800' 
                      : log.type === 'document' 
                        ? 'bg-blue-100 text-blue-800'
                        : log.type === 'payment' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'}`}>
                    {isAIAgent(log.user) ? 'AI Action' : log.type}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditLogTab;
