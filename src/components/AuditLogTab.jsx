import React, { useState, useMemo } from 'react';
import { History, Search, Filter, Download, User, Bot, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';

const AuditLogTab = ({ caseId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  // Static audit logs data
  const staticAuditLogs = [
    {
      id: 1,
      user: 'Fiona',
      type: 'system',
      action: 'Case Initiated',
      description: '🚀 New immigration case has been initiated in the system.',
      timestamp: '2024-05-29T09:00:00Z'
    },
    {
      id: 2,
      user: 'Fiona',
      type: 'document',
      action: 'Email Sent',
      description: '📧 Initial email sent to applicant with document checklist and requirements.',
      timestamp: '2024-05-29T09:05:00Z'
    },
    {
      id: 3,
      user: 'Fiona',
      type: 'system',
      action: 'Case Assignment',
      description: '🔄 Case handed over to AI Agent Diana for document processing and verification.',
      timestamp: '2024-05-29T09:10:00Z'
    },
    {
      id: 4,
      user: 'Diana',
      type: 'system',
      action: 'Case Accepted',
      description: '✅ AI Agent Diana has accepted the case and initiated document verification process.',
      timestamp: '2024-05-29T09:15:00Z'
    },
    {
      id: 5,
      user: 'Ravi Kumar',
      type: 'document',
      action: 'Retainer Created',
      description: '📝 Attorney initiated retainer agreement creation for the case.',
      timestamp: '2024-05-29T09:30:00Z'
    },
    {
      id: 6,
      user: 'Diana',
      type: 'document',
      action: 'Retainer Processing',
      description: '⚙️ Auto-filled retainer details and stored in database.',
      timestamp: '2024-05-29T09:35:00Z'
    },
    {
      id: 7,
      user: 'Diana',
      type: 'document',
      action: 'Signature Request Sent',
      description: '✍️ Generated and sent signature request for retainer agreement.',
      timestamp: '2024-05-29T09:40:00Z'
    },
    {
      id: 8,
      user: 'Ravi Kumar',
      type: 'payment',
      action: 'Payment Amount Set',
      description: '💰 Attorney set the payment amount for case processing.',
      timestamp: '2024-05-29T10:00:00Z'
    },
    {
      id: 9,
      user: 'Diana',
      type: 'payment',
      action: 'Payment Link Generated',
      description: '🔗 Created secure payment link for applicant.',
      timestamp: '2024-05-29T10:05:00Z'
    },
    {
      id: 10,
      user: 'Diana',
      type: 'payment',
      action: 'Payment Email Sent',
      description: '📧 Sent payment link and instructions to applicant via email.',
      timestamp: '2024-05-29T10:10:00Z'
    },
    {
      id: 11,
      user: 'Diana',
      type: 'payment',
      action: 'Payment Status Monitoring',
      description: '👀 Actively monitoring payment status and updating database in real-time.',
      timestamp: '2024-05-29T10:15:00Z'
    },
    {
      id: 12,
      user: 'Ravi Kumar',
      type: 'document',
      action: 'Documents Uploaded',
      description: '📤 Attorney uploaded available client documents for processing.',
      timestamp: '2024-05-29T10:30:00Z'
    },
    {
      id: 13,
      user: 'Diana',
      type: 'document',
      action: 'Document Extraction Started',
      description: '🔍 Initiated data extraction from uploaded documents using AI processing.',
      timestamp: '2024-05-29T10:35:00Z'
    },
    {
      id: 14,
      user: 'Diana',
      type: 'document',
      action: 'Document Validation',
      description: '✔️ Performing comprehensive validation checks on extracted data.',
      timestamp: '2024-05-29T10:40:00Z'
    },
    {
      id: 15,
      user: 'Diana',
      type: 'document',
      action: 'Cross-Verification Complete',
      description: '🔄 Completed cross-referencing of information across all documents.',
      timestamp: '2024-05-29T10:45:00Z'
    },
    {
      id: 16,
      user: 'Diana',
      type: 'document',
      action: 'Analysis Summary Generated',
      description: '📊 Generated detailed summary of valid documents, invalid documents, missing information, and data mismatches.',
      timestamp: '2024-05-29T10:50:00Z'
    },
    {
      id: 17,
      user: 'Diana',
      type: 'document',
      action: 'Validation Report Sent',
      description: '📨 Sent comprehensive email report regarding document validations, verifications, and upload status to all parties.',
      timestamp: '2024-05-29T10:55:00Z'
    },
    {
      id: 18,
      user: 'Diana',
      type: 'document',
      action: 'Questionnaire Auto-fill Initiated',
      description: '🤖 Started automated questionnaire filling process using extracted document data.',
      timestamp: '2024-05-29T11:00:00Z'
    },
    {
      id: 19,
      user: 'Diana',
      type: 'document',
      action: 'Questionnaire Data Population',
      description: '📝 Auto-populated all available fields in questionnaire using validated document data.',
      timestamp: '2024-05-29T11:05:00Z'
    },
    {
      id: 20,
      user: 'Diana',
      type: 'document',
      action: 'Questionnaire Data Stored',
      description: '💾 Successfully stored auto-filled questionnaire data in database for review.',
      timestamp: '2024-05-29T11:10:00Z'
    },
    {
      id: 21,
      user: 'Ravi Kumar',
      type: 'document',
      action: 'Questionnaire Review',
      description: '👁️ Attorney reviewed auto-filled questionnaire for accuracy and completeness.',
      timestamp: '2024-05-29T11:20:00Z'
    },
    {
      id: 22,
      user: 'Ravi Kumar',
      type: 'document',
      action: 'Questionnaire Updates',
      description: '✏️ Made necessary adjustments and filled additional required information in questionnaire.',
      timestamp: '2024-05-29T11:25:00Z'
    },
    {
      id: 23,
      user: 'Diana',
      type: 'document',
      action: 'Final Questionnaire Processing',
      description: '✨ Updated database with final questionnaire data including manual adjustments.',
      timestamp: '2024-05-29T11:30:00Z'
    },
    {
      id: 24,
      user: 'Ravi Kumar',
      type: 'form',
      action: 'N-400 Form Selected',
      description: '📄 Attorney selected N-400 (Application for Naturalization) form for processing.',
      timestamp: '2024-05-29T11:35:00Z'
    },
    {
      id: 25,
      user: 'Diana',
      type: 'form',
      action: 'Form Auto-fill Started',
      description: '🤖 Initiated automated filling of N-400 form using questionnaire data.',
      timestamp: '2024-05-29T11:36:00Z'
    },
    {
      id: 26,
      user: 'Diana',
      type: 'form',
      action: 'Form Data Mapping',
      description: '🔄 Mapping questionnaire responses to corresponding N-400 form fields.',
      timestamp: '2024-05-29T11:37:00Z'
    },
    {
      id: 27,
      user: 'Diana',
      type: 'form',
      action: 'Form Validation',
      description: '✔️ Performing validation checks on auto-filled N-400 form data.',
      timestamp: '2024-05-29T11:38:00Z'
    },
    {
      id: 28,
      user: 'Diana',
      type: 'form',
      action: 'Form Generation Complete',
      description: '✨ Generated completed N-400 form in downloadable format.',
      timestamp: '2024-05-29T11:40:00Z'
    },
    {
      id: 29,
      user: 'Ravi Kumar',
      type: 'letter',
      action: 'Letter Template Selected',
      description: '📝 Attorney selected template for letter generation.',
      timestamp: '2024-05-29T11:45:00Z'
    },
    {
      id: 30,
      user: 'Diana',
      type: 'letter',
      action: 'Requirements Analysis',
      description: '🔍 Analyzing case requirements and context for letter customization.',
      timestamp: '2024-05-29T11:46:00Z'
    },
    {
      id: 31,
      user: 'Diana',
      type: 'letter',
      action: 'Letter Format Creation',
      description: '📋 Crafting the perfect letter format based on template and requirements.',
      timestamp: '2024-05-29T11:47:00Z'
    },
    {
      id: 32,
      user: 'Diana',
      type: 'letter',
      action: 'Professional Enhancement',
      description: '✨ Adding professional touches and formatting improvements.',
      timestamp: '2024-05-29T11:48:00Z'
    },
    {
      id: 33,
      user: 'Diana',
      type: 'letter',
      action: 'Final Review',
      description: '👀 Performing final review and quality checks on the letter.',
      timestamp: '2024-05-29T11:49:00Z'
    },
    {
      id: 34,
      user: 'Diana',
      type: 'letter',
      action: 'Letter Generated',
      description: '📄 Generated final version of the letter and stored in database.',
      timestamp: '2024-05-29T11:50:00Z'
    },
    {
      id: 35,
      user: 'Diana',
      type: 'letter',
      action: 'Change Tracking Enabled',
      description: '🔄 Initialized real-time change tracking system for letter modifications.',
      timestamp: '2024-05-29T11:51:00Z'
    },
    {
      id: 36,
      user: 'Ravi Kumar',
      type: 'receipt',
      action: 'Receipt Upload',
      description: '📤 Attorney uploaded receipt document for processing.',
      timestamp: '2024-05-29T11:55:00Z'
    },
    {
      id: 37,
      user: 'Diana',
      type: 'receipt',
      action: 'Initial Greeting',
      description: '👋 Hi! I\'m Diana, analyzing your document...',
      timestamp: '2024-05-29T11:56:00Z'
    },
    {
      id: 38,
      user: 'Diana',
      type: 'receipt',
      action: 'Data Extraction Started',
      description: '🔍 Extracting important information from your receipt...',
      timestamp: '2024-05-29T11:57:00Z'
    },
    {
      id: 39,
      user: 'Diana',
      type: 'receipt',
      action: 'Processing Details',
      description: '⚙️ Processing dates and details from your document...',
      timestamp: '2024-05-29T11:58:00Z'
    },
    {
      id: 40,
      user: 'Diana',
      type: 'receipt',
      action: 'Final Processing',
      description: '✨ Almost done! Adding final touches to your receipt processing...',
      timestamp: '2024-05-29T11:59:00Z'
    },
    {
      id: 41,
      user: 'Diana',
      type: 'receipt',
      action: 'Receipt Data Display',
      description: '📋 Here\'s what I found in your receipt! Generated detailed summary showing payment date, amount, transaction ID, payment method, and other important information.',
      timestamp: '2024-05-29T11:59:30Z'
    },
    {
      id: 42,
      user: 'Diana',
      type: 'receipt',
      action: 'Confirmation Email Sent',
      description: '📧 All done! I\'ve sent a confirmation email to the applicant with all the processed details.',
      timestamp: '2024-05-29T12:00:00Z'
    }
  ];

  // Get unique users from audit logs
  const uniqueUsers = useMemo(() => {
    const users = new Set(staticAuditLogs.map(log => log.user));
    return Array.from(users);
  }, []);

  const filteredLogs = staticAuditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesUser = selectedUser === 'all' || log.user === selectedUser;
    
    return matchesSearch && matchesType && matchesUser;
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
        {/* <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          Export
        </button> */}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        {/* Search Input */}
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

        {/* User Filter */}
        <div className="relative">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Users</option>
            {uniqueUsers.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
          <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <ArrowDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white relative"
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
      <div className="relative pl-8">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No matching logs found
          </div>
        ) : (
          filteredLogs.map((log, index) => (
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
                          : log.type === 'questionnaire' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : log.type === 'form' 
                              ? 'bg-indigo-100 text-indigo-800'
                              : log.type === 'letter' 
                                ? 'bg-amber-100 text-amber-800'
                                : log.type === 'receipt' 
                                  ? 'bg-cyan-100 text-cyan-800'
                                  : 'bg-gray-100 text-gray-800'}`}>
                    {isAIAgent(log.user) ? 'AI Agent Action' : log.type}
                    </span>
                </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditLogTab;
