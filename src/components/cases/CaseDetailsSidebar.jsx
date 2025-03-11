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
    <div className="w-80">
      {/* AI Agents Section */}
      <div className="p-4 bg-white mb-4 shadow-sm rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">AI Agents</h2>
          <span className="text-xs font-medium bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">2 Active</span>
        </div>
        
        <div className="space-y-3">
          {/* Fiona - Case Creation Agent */}
          <div className="p-3 rounded-lg relative overflow-hidden backdrop-blur-sm border border-emerald-100">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/80 via-emerald-50/50 to-transparent"></div>
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-lg">
                F
              </div>
              <div>
                <h3 className="font-medium text-emerald-700 text-sm">Fiona</h3>
                <p className="text-xs text-gray-600">Case Creation Agent</p>
                <div className="flex items-center gap-2 text-xs text-emerald-600 mt-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Processing Case
                </div>
              </div>
            </div>
          </div>

          {/* Diana - Document Collection Agent */}
          <div className="p-3 rounded-lg relative overflow-hidden backdrop-blur-sm border border-violet-100">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-100/80 via-violet-50/50 to-transparent"></div>
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-violet-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-lg">
                D
              </div>
              <div>
                <h3 className="font-medium text-violet-700 text-sm">Diana</h3>
                <p className="text-xs text-gray-600">Document Collection Agent</p>
                <div className="flex items-center gap-2 text-xs text-violet-600 mt-1">
                  <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse"></span>
                  Collecting Documents
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-lg relative overflow-hidden backdrop-blur-sm border border-slate-100">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100/80 via-slate-50/50 to-transparent"></div>
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-zinc-700 rounded-lg flex items-center justify-center text-white font-semibold shadow-lg">
                S
              </div>
              <div>
                <h3 className="font-medium text-slate-700 text-sm">Sophia</h3>
                <p className="text-xs text-gray-600">Support Agent</p>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse"></span>
                  Available for Support
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Merged Case Details & Profile Section */}
      <div className="p-6 bg-white mb-4 shadow-sm rounded-xl border border-gray-100/50">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800">
          <Folder className="text-blue-600" size={20} />
          Case Details
        </h2>
        
        <div className="space-y-5">
          {/* Case Related Information */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Case</label>
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

          {/* Personal Information */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
            <div className="text-sm font-medium">
              {caseData?.userId?.name || 'Loading...'}
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