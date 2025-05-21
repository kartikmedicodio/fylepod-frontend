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
      className={`flex flex-col px-6 py-3.5 cursor-pointer transition-all duration-200 border-l-4 ${
        isSelected ? 'bg-blue-50/80 border-l-blue-500' : 'hover:bg-gray-50/90 border-l-transparent'
      }`}
      onClick={() => onClick(email)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${
          email.status === 'sent' ? 'bg-emerald-500' : 
          email.status === 'failed' ? 'bg-rose-500' : 
          'bg-gray-400'
        }`} />
        <p className="text-sm font-medium text-gray-800 truncate flex-1">
          {email.type === 'received' ? email.from : email.recipient}
        </p>
        <span className="text-xs font-medium text-gray-500">{dateStr}</span>
      </div>
      <p className="text-sm text-gray-600 truncate pl-5.5 mt-1">
        {email.subject}
      </p>
    </div>
  );
};

const EmailContent = ({ email, onClose }) => {
  const { dateStr, timeStr } = formatDate(email.date);
  
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <h2 className="text-xl font-semibold text-gray-800">{email.subject}</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors md:hidden"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="px-6 py-4 border-b border-gray-100 space-y-2.5 bg-gray-50/50">
        <p className="flex items-baseline">
          <span className="font-medium text-gray-700 w-16">From:</span> 
          <span className="text-gray-600">{email.from || 'System'}</span>
        </p>
        <p className="flex items-baseline">
          <span className="font-medium text-gray-700 w-16">To:</span>
          <span className="text-gray-600">{email.recipient}</span>
        </p>
        {email.cc && (
          <p className="flex items-baseline">
            <span className="font-medium text-gray-700 w-16">CC:</span>
            <span className="text-gray-600">{email.cc}</span>
          </p>
        )}
        <p className="flex items-baseline">
          <span className="font-medium text-gray-700 w-16">Date:</span>
          <span className="text-gray-600">{dateStr} {timeStr}</span>
        </p>
        <p className="flex items-center">
          <span className="font-medium text-gray-700 w-16">Status:</span> 
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            email.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 
            email.status === 'failed' ? 'bg-rose-100 text-rose-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {email.status}
          </span>
        </p>
      </div>
      <div className="flex-1 p-6 overflow-y-auto bg-white">
        <div 
          className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-a:text-blue-600 hover:prose-a:text-blue-500"
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
    <div className="flex flex-col h-full bg-white shadow-sm rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-800">Communications</h2>
        </div>
        <button 
          onClick={fetchEmails}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Email List Panel */}
        <div className={`flex flex-col border-r border-gray-100 ${selectedEmail ? 'w-[400px]' : 'w-full'}`}>
          {/* Search */}
          <div className="p-4 border-b border-gray-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search communications..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Mail className="w-10 h-10 mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-600">No communications found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
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