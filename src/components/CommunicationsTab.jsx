import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Mail, Search, ChevronDown, ExternalLink, Loader2, X } from 'lucide-react';
import api from '../utils/api';

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
    <>
      <div className="flex flex-col h-full bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Communications
          </h2>
        </div>

        {/* Search and Filter Bar */}
        <div className="p-4 border-b flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search emails..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Mail className="w-12 h-12 mb-2" />
              <p>No emails found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleEmailClick(email)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{email.subject}</h3>
                      <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                        <p>From: {email.from || 'System'}</p>
                        <p>To: {email.recipient}</p>
                        {email.cc && <p>CC: {email.cc}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        email.status === 'sent' ? 'bg-green-100 text-green-800' : 
                        email.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {email.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(email.date)}
                      </span>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {email.preview}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {isModalOpen && selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 border-b space-y-2">
              <p><span className="font-medium">From:</span> {selectedEmail.from || 'System'}</p>
              <p><span className="font-medium">To:</span> {selectedEmail.recipient}</p>
              {selectedEmail.cc && <p><span className="font-medium">CC:</span> {selectedEmail.cc}</p>}
              <p><span className="font-medium">Date:</span> {formatDate(selectedEmail.date)}</p>
              <p><span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  selectedEmail.status === 'sent' ? 'bg-green-100 text-green-800' : 
                  selectedEmail.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedEmail.status}
                </span>
              </p>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

CommunicationsTab.propTypes = {
  caseId: PropTypes.string.isRequired,
};

export default CommunicationsTab;