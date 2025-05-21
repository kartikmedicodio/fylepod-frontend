import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Mail, Search, Loader2, RefreshCw, ChevronLeft, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import api from '../utils/api';

const hideScrollbarClass = `
  [&::-webkit-scrollbar]:hidden
  [-ms-overflow-style:none]
  [scrollbar-width:none]
`;

// Enhanced Dialog component with animations
const Dialog = ({ isOpen, onClose, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 w-full md:top-1/2 md:bottom-auto md:left-1/2 md:w-[95%] md:max-w-4xl md:-translate-x-1/2 md:-translate-y-1/2"
          >
            <div className="relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

Dialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

// Enhanced date formatting
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return {
    dateStr: format(date, 'MMM d, yyyy'),
    timeStr: format(date, 'h:mm a'),
    relativeTime: format(date, 'PP')
  };
};

const EmailListItem = ({ email, onClick, isSelected }) => {
  const { dateStr } = formatDate(email.date);
  
  return (
    <motion.div
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`group flex flex-col px-6 py-4 cursor-pointer transition-all duration-200 border-l-4 ${
        isSelected ? 'bg-blue-50/80 border-l-blue-500' : 'hover:bg-gray-50/90 border-l-transparent hover:border-l-blue-300'
      }`}
      onClick={() => onClick(email)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
          email.status === 'sent' ? 'bg-emerald-500 animate-pulse' : 
          email.status === 'failed' ? 'bg-rose-500' : 
          'bg-gray-400'
        }`} />
        <p className="text-sm font-medium text-gray-800 truncate flex-1 group-hover:text-blue-600 transition-colors">
          {email.type === 'received' ? email.from : email.recipient}
        </p>
        <span className="text-xs font-medium text-gray-500 opacity-60 group-hover:opacity-100 transition-opacity">
          {dateStr}
        </span>
      </div>
      <p className="text-sm text-gray-600 truncate pl-5.5 mt-1.5">
        {email.subject}
      </p>
    </motion.div>
  );
};

EmailListItem.propTypes = {
  email: PropTypes.shape({
    id: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    from: PropTypes.string,
    recipient: PropTypes.string.isRequired,
    subject: PropTypes.string.isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
};

const EmailContent = ({ email, onClose }) => {
  const { dateStr, timeStr } = formatDate(email.date);
  
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="sticky top-0 px-6 py-4 border-b border-gray-100 flex items-center gap-4 bg-white/80 backdrop-blur-md z-10">
        <button 
          onClick={onClose}
          className="md:hidden -ml-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-gray-800 truncate">{email.subject}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {email.type === 'received' ? 'From' : 'To'}: {email.type === 'received' ? email.from : email.recipient}
          </p>
        </div>
        <div className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center gap-2 ${
          email.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 
          email.status === 'failed' ? 'bg-rose-100 text-rose-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            email.status === 'sent' ? 'bg-emerald-500' : 
            email.status === 'failed' ? 'bg-rose-500' :
            'bg-gray-500'
          }`} />
          {email.status}
        </div>
      </div>
      
      <div className="px-6 py-4 border-b border-gray-100 space-y-3 bg-gray-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-3">
            <p className="flex items-baseline">
              <span className="text-sm font-medium text-gray-700 w-16">From:</span> 
              <span className="text-sm text-gray-600">{email.from || 'System'}</span>
            </p>
            <p className="flex items-baseline">
              <span className="text-sm font-medium text-gray-700 w-16">To:</span>
              <span className="text-sm text-gray-600">{email.recipient}</span>
            </p>
            {email.cc && (
              <p className="flex items-baseline">
                <span className="text-sm font-medium text-gray-700 w-16">CC:</span>
                <span className="text-sm text-gray-600">{email.cc}</span>
              </p>
            )}
          </div>
          <div className="space-y-3">
            <p className="flex items-baseline">
              <span className="text-sm font-medium text-gray-700 w-16">Date:</span>
              <span className="text-sm text-gray-600">{dateStr}</span>
            </p>
            <p className="flex items-baseline">
              <span className="text-sm font-medium text-gray-700 w-16">Time:</span>
              <span className="text-sm text-gray-600">{timeStr}</span>
            </p>
          </div>
        </div>
      </div>

      <div className={`flex-1 p-6 overflow-y-auto bg-white ${hideScrollbarClass}`}>
        <div 
          className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-img:rounded-lg prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-100"
          dangerouslySetInnerHTML={{ __html: email.htmlContent }}
        />
      </div>
    </div>
  );
};

EmailContent.propTypes = {
  email: PropTypes.shape({
    date: PropTypes.string.isRequired,
    subject: PropTypes.string.isRequired,
    from: PropTypes.string,
    recipient: PropTypes.string.isRequired,
    cc: PropTypes.string,
    status: PropTypes.string.isRequired,
    htmlContent: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

const CommunicationsTab = ({ caseId }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchEmails();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [caseId]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsRefreshing(true);
      
      const response = await api.get('/email-logs/logs', {
        params: {
          managementId: caseId,
          limit: 100
        }
      });

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
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
    if (isMobile) {
      setIsModalOpen(true);
    }
  };

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
        <AlertCircle className="w-12 h-12 mb-4 text-rose-500" />
        <p className="text-lg font-medium mb-2 text-gray-900">Oops! Something went wrong</p>
        <p className="text-sm text-center mb-6 text-gray-500">{error}</p>
        <button
          onClick={fetchEmails}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 group"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white shadow-sm rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Communications</h2>
            <p className="text-sm text-gray-500">
              {filteredEmails.length} message{filteredEmails.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button 
          onClick={fetchEmails}
          disabled={isRefreshing}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Email List Panel */}
        <div className={`flex flex-col border-r border-gray-100 ${selectedEmail && !isMobile ? 'w-[440px]' : 'w-full'}`}>
          {/* Search */}
          <div className="p-4 border-b border-gray-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search communications..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Email List */}
          <div className={`flex-1 overflow-y-auto divide-y divide-gray-100 ${hideScrollbarClass}`}>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-32"
                >
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </motion.div>
              ) : filteredEmails.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex flex-col items-center justify-center py-16 text-gray-500"
                >
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <Mail className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-base font-medium text-gray-900">No communications found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {filteredEmails.map((email, index) => (
                    <motion.div
                      key={email.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <EmailListItem
                        email={email}
                        onClick={() => handleEmailClick(email)}
                        isSelected={selectedEmail?.id === email.id}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Email Content Panel - Desktop */}
        {selectedEmail && !isMobile && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 hidden md:block"
          >
            <EmailContent email={selectedEmail} onClose={() => setSelectedEmail(null)} />
          </motion.div>
        )}
      </div>

      {/* Mobile Email Content Modal */}
      {isMobile && (
        <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          {selectedEmail && <EmailContent email={selectedEmail} onClose={() => setIsModalOpen(false)} />}
        </Dialog>
      )}
    </div>
  );
};

CommunicationsTab.propTypes = {
  caseId: PropTypes.string.isRequired,
};

export default CommunicationsTab;