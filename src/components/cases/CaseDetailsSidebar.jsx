import React from 'react';
import { User, Folder, Calendar, Clock, CheckCircle2, Phone, Mail, Globe, MapPin } from 'lucide-react';

const CaseDetailsSidebar = ({ caseData, loading, error, onEmailChange }) => {
  React.useEffect(() => {
    if (onEmailChange && caseData?.userId?.email) {
      onEmailChange(caseData.userId.email);
    }
  }, [caseData?.userId?.email, onEmailChange]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!caseData) return null;

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-50 text-green-700';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700';
      case 'reviewed':
        return 'bg-blue-50 text-blue-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not Set';
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Merged Case Details & Profile Section */}
      <div className="p-6 bg-white mb-4 shadow-sm rounded-xl border border-gray-100/50">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800">
          <Folder className="text-blue-600" size={20} />
          Case Details
        </h2>
        
        <div className="space-y-5">
          {/* Highlighted Fields */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Applicant Name</label>
            <div className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full inline-block">
              {caseData?.userId?.name || 'Loading...'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Case Name</label>
            <div className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full inline-block">
              {caseData?.categoryName || 'Loading...'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Case Status</label>
            <div className={`text-sm font-medium px-3 py-1.5 rounded-full inline-block ${getStatusStyles(caseData?.categoryStatus)}`}>
              {caseData?.categoryStatus || 'Pending'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Case Manager</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <User size={14} className="text-gray-400" />
              {caseData?.caseManagerName || 'Not Assigned'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Case Deadline</label>
            <div className="text-sm font-medium bg-blue-50 text-blue-700 w-full px-4 py-2 rounded-lg flex items-center gap-2">
              <Calendar size={14} className="text-blue-600 flex-shrink-0" />
              {formatDate(caseData?.deadline)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Created Date</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              {formatDate(caseData?.createdAt)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Last Updated</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              {formatDate(caseData?.updatedAt)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Nationality</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <Globe size={14} className="text-gray-400" />
              {caseData?.userId?.address?.country || 'Not Specified'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <Mail size={14} className="text-gray-400" />
              {caseData?.userId?.email || 'Loading...'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <Phone size={14} className="text-gray-400" />
              {caseData?.userId?.contact?.mobileNumber || 'Not Provided'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

CaseDetailsSidebar.defaultProps = {
  onEmailChange: () => {}
};

export default CaseDetailsSidebar; 