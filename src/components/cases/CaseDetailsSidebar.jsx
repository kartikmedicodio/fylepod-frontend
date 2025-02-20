import React from 'react';
import { User, Folder, Calendar, Clock, CheckCircle2, Phone, Mail, Globe, MapPin } from 'lucide-react';

const CaseDetailsSidebar = ({ caseDetails }) => {
  return (
    <div className="w-80 border-r border-gray-200 h-full overflow-y-auto ">
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
              {caseDetails?.applicantName || 'John Michael Doe'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Case Name</label>
            <div className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full inline-block">
              {caseDetails?.caseName || 'H1B'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Case Manager</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <User size={14} className="text-gray-400" />
              {caseDetails?.caseManager || 'Sarah T Harris'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Case Created Date</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              {caseDetails?.createdDate || 'January 10, 2025'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Case Submitted Date</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              {caseDetails?.submittedDate || '-'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Case Approved Date</label>
            <div className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 size={14} className="text-gray-400" />
              {caseDetails?.approvedDate || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div >
        
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
                {caseDetails?.profile?.name || 'John Michael Doe'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
              <div className="text-sm font-medium flex items-center gap-2">
                <Phone size={14} className="text-gray-400" />
                {caseDetails?.profile?.phone || '+1 555-1234'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="text-sm font-medium flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                {caseDetails?.profile?.email || 'Email Address'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Nationality</label>
              <div className="text-sm font-medium flex items-center gap-2">
                <Globe size={14} className="text-gray-400" />
                {caseDetails?.profile?.nationality || 'American'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
              <div className="text-sm font-medium flex items-start gap-2">
                <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{caseDetails?.profile?.address || '123 Main Street, New York, NY, USA'}</span>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-600 font-medium">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsSidebar; 