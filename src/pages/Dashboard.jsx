import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePage } from '../contexts/PageContext';
import api from '../utils/api';

const Dashboard = () => {
  const [notifications, setNotifications] = useState([
    {
      _id: '1342552',
      userName: 'Maria Rodriguez',
      message: 'Passport has been received and uploaded',
      date: '04 Aug 2022'
    },
    {
      _id: '1342552',
      userName: 'Maria Rodriguez',
      message: 'Passport has been received and uploaded',
      date: '04 Aug 2022'
    },
    {
      _id: '1342552',
      userName: 'Maria Rodriguez',
      message: 'Passport has been received and uploaded',
      date: '04 Aug 2022'
    },
    {
      _id: '1342552',
      userName: 'Maria Rodriguez',
      message: 'Passport has been received and uploaded',
      date: '04 Aug 2022'
    }
  ]);

  const [inboxMessages, setInboxMessages] = useState([
    {
      _id: '1',
      sender: 'Helena Chavez',
      subject: 'Paystub enquiry',
      preview: 'Which paystub has to be documented.......',
      time: '11:52AM'
    },
    {
      _id: '2', 
      sender: 'Sallie Wade',
      subject: 'Paystub enquiry',
      preview: 'Which paystub has to be documented.......',
      time: '10:04AM'
    },
    {
      _id: '3',
      sender: 'Blake Howard',
      subject: 'Paystub enquiry', 
      preview: 'Which paystub has to be documented.......',
      time: '08:31AM'
    },
    {
      _id: '4',
      sender: 'Devin Williams',
      subject: 'Paystub enquiry',
      preview: 'Which paystub has to be documented.......',
      time: '08:01PM'
    }
  ]);

  const [recentCases, setRecentCases] = useState([
    {
      _id: '1342552',
      userName: 'Maria Rodriguez',
      title: 'Proforma 1: Application Form for Indian Business Visa (For Chinese Nationals)',
      status: {
        documentCollection: true,
        aiVerification: true,
        attorneyApproval: false,
        crossVerification: false
      }
    },
    {
      _id: '1342552',
      userName: 'Maria Rodriguez',
      title: 'G-28: Notice of Entry of Appearance as Attorney or Accredited Representative',
      status: {
        documentCollection: true,
        aiVerification: true,
        attorneyApproval: false,
        crossVerification: false
      }
    },
    {
      _id: '1342552',
      userName: 'Maria Rodriguez',
      title: 'I-129',
      status: {
        documentCollection: true,
        aiVerification: true,
        attorneyApproval: false,
        crossVerification: false
      }
    }
  ]);

  const [activeTab, setActiveTab] = useState('Cases');

  return (
    <div className="space-y-6">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications Section */}
        <div className="bg-white rounded-lg">
          <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Notifications</h2>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div 
                  key={notification._id}
                  className="border-b border-gray-100 pb-4 last:border-0"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Case ID - {notification._id}</span>
                        <span className="text-sm">{notification.userName}</span>
                      </div>
                      <p className="text-sm mt-1">{notification.message}</p>
                    </div>
                    <span className="text-sm text-gray-500">{notification.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inbox Section */}
        <div className="bg-white rounded-lg">
          <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Inbox</h2>
            <div className="space-y-4">
              {inboxMessages.map((message) => (
                <div 
                  key={message._id}
                  className="border-b border-gray-100 pb-4 last:border-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex-shrink-0">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender)}&background=random`}
                        alt={message.sender}
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">{message.sender}</h3>
                        <span className="text-sm text-gray-500">{message.time}</span>
                      </div>
                      <p className="text-sm font-medium">{message.subject}</p>
                      <p className="text-sm text-gray-500">{message.preview}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Section */}
      <div className="bg-white rounded-lg">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Recent</h2>
          
          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button 
              className={`text-sm ${activeTab === 'Cases' ? 'text-blue-600 bg-blue-50 px-4 py-2 rounded-lg' : 'text-gray-500'}`}
              onClick={() => setActiveTab('Cases')}
            >
              Cases
            </button>
            <button 
              className={`text-sm ${activeTab === 'Customers' ? 'text-blue-600 bg-blue-50 px-4 py-2 rounded-lg' : 'text-gray-500'}`}
              onClick={() => setActiveTab('Customers')}
            >
              Customers
            </button>
          </div>

          {/* Recent Cases List */}
          <div className="space-y-4">
            {recentCases.map((caseItem) => (
              <div 
                key={caseItem._id}
                className="border-b border-gray-100 pb-4 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Case ID - {caseItem._id}</span>
                      <span className="text-sm">{caseItem.userName}</span>
                    </div>
                    <h3 className="text-sm mt-1">{caseItem.title}</h3>
                  </div>
                  
                  {/* Status Indicators */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span className="text-sm">Document collection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span className="text-sm">AI verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                      <span className="text-sm">Attorney Approval</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                      <span className="text-sm">Cross Verification</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 