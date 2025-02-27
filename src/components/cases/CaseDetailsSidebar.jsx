import React from 'react';
import { User, Folder, Calendar, Clock, CheckCircle2, Phone, Mail, Globe, MapPin } from 'lucide-react';

const CaseDetailsSidebar = ({ caseData, loading, error }) => {
  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!caseData) return null;

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-50 text-green-700';
      case 'pending':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="w-80 border-r border-gray-200 h-full overflow-y-auto">
      {/* Case Details Section */}
      <div className="p-6 bg-white mb-2 shadow-sm rounded-xl">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800">
          <Folder className="text-blue-600" size={20} />
          Case Details
        </h2>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Case Applicant</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <User size={14} className="text-gray-400" />
              {caseData?.userName || 'Loading...'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Case Name</label>
            <div className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full inline-block">
              {caseData?.categoryName || 'Loading...'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <div className={`text-sm font-medium px-3 py-1.5 rounded-full inline-block ${getStatusStyles(caseData?.categoryStatus)}`}>
              {caseData?.categoryStatus || 'pending'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Created Date</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              {new Date(caseData?.createdAt).toLocaleDateString() || 'Loading...'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Last Updated</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              {new Date(caseData?.updatedAt).toLocaleDateString() || 'Loading...'}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="p-6 rounded-xl bg-white shadow-sm border border-gray-100/50">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800">
          <User className="text-blue-600" size={20} />
          Profile
        </h2>
        <div className="space-y-5">
          <div className="flex justify-center mb-6">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-50 to-gray-100 border-4 border-white shadow-xl flex items-center justify-center relative">
              <User size={32} className="text-gray-500" />
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <User size={14} className="text-gray-400" />
              {caseData?.userId?.name || 'Loading...'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <Mail size={14} className="text-gray-400" />
              {caseData?.userId?.email || 'Loading...'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <Phone size={14} className="text-gray-400" />
              {caseData?.userId?.contact?.mobileNumber || '+1 555-1234'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Nationality</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <Globe size={14} className="text-gray-400" />
              {caseData?.userId?.address?.country || 'American'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
            <div className="text-sm font-medium flex items-start gap-2">
              <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{caseData?.userId?.address || '123 Main Street, New York, NY, USA'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsSidebar; 