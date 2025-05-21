import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Mail, Search, ChevronDown, ExternalLink, Loader2, X } from 'lucide-react';
import api from '../utils/api';

// Update the formatDate function to separate date and time
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return { dateStr, timeStr };
};

const EmailListItem = ({ email, onClick, isSelected }) => {
  const { dateStr, timeStr } = formatDate(email.date);
  
  return (
    <div
      className={`flex flex-col px-4 py-2 hover:bg-gray-50 cursor-pointer ${
        isSelected ? 'bg-blue-50' : ''
      }`}
      onClick={() => onClick(email)}
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          email.status === 'sent' ? 'bg-green-500' : 
          email.status === 'failed' ? 'bg-red-500' : 
          'bg-gray-400'
        }`} />
        <p className="text-sm font-medium text-gray-900 truncate flex-1">
          {email.type === 'received' ? email.from : email.recipient}
        </p>
        <span className="text-xs text-gray-500">{dateStr}</span>
      </div>
      <p className="text-sm text-gray-600 truncate pl-4">
        {email.subject}
      </p>
    </div>
  );
};

const EmailContent = ({ email, onClose }) => {
  const { dateStr, timeStr } = formatDate(email.date);
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">{email.subject}</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 md:hidden"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-4 border-b space-y-2">
        <p><span className="font-medium">From:</span> {email.from || 'System'}</p>
        <p><span className="font-medium">To:</span> {email.recipient}</p>
        {email.cc && <p><span className="font-medium">CC:</span> {email.cc}</p>}
        <p><span className="font-medium">Date:</span> {dateStr} {timeStr}</p>
        <p>
          <span className="font-medium">Status:</span> 
          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
            email.status === 'sent' ? 'bg-green-100 text-green-800' : 
            email.status === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {email.status}
          </span>
        </p>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: email.htmlContent }}
        />
      </div>
    </div>
  );
};

const CommunicationsTab = ({ caseId }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, sent, received
  const [error, setError] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, [caseId]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/email-logs/logs', {
        params: {
          managementId: caseId,
          limit: 100 // Fetch up to 100 emails
        }
      });

      // Transform the email logs into our expected format
      const transformedEmails = response.data.data.emails.map(email => ({
        id: email._id,
        subject: email.subject,
        recipient: email.to,
        type: email.emailType || 'sent',
        date: email.createdAt,
        preview: email.htmlContent ? stripHtmlTags(email.htmlContent).slice(0, 150) + '...' : '',
        status: email.status,
        from: email.from,
        cc: email.cc,
        metadata: email.metadata,
        htmlContent: email.htmlContent
      }));

      setEmails(transformedEmails);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError('Failed to load communications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
    setIsModalOpen(true);
  };

  // Helper function to strip HTML tags from content
  const stripHtmlTags = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const filteredEmails = emails
    .filter(email => {
      if (filter === 'sent') return email.type === 'sent';
      if (filter === 'received') return email.type === 'received';
      return true;
    })
    .filter(email =>
      searchTerm
        ? email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (email.from && email.from.toLowerCase().includes(searchTerm.toLowerCase()))
        : true
    );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
        <Mail className="w-12 h-12 mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">Oops! Something went wrong</p>
        <p className="text-sm text-center mb-4">{error}</p>
        <button
          onClick={fetchEmails}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          <h2 className="text-lg font-medium">Communications</h2>
        </div>
        <button 
          onClick={fetchEmails}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Refresh
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Email List Panel */}
        <div className={`flex flex-col border-r ${selectedEmail ? 'w-[350px]' : 'w-full'}`}>
          {/* Search and Filter */}
          <div className="p-3 border-b bg-white">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search communications..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="text-sm border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
              </select>
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto divide-y">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Mail className="w-8 h-8 mb-2" />
                <p className="text-sm font-medium">No communications found</p>
                <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <EmailListItem
                  key={email.id}
                  email={email}
                  onClick={handleEmailClick}
                  isSelected={selectedEmail?.id === email.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Email Content Panel */}
        {selectedEmail && (
          <div className="flex-1 flex flex-col">
            <EmailContent 
              email={selectedEmail} 
              onClose={() => setSelectedEmail(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

CommunicationsTab.propTypes = {
  caseId: PropTypes.string.isRequired,
};

export default CommunicationsTab;