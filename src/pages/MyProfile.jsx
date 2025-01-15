import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';

const MyProfile = () => {
  const { user } = useAuth();
  const [formData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    joinedDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-lg font-medium text-primary-700">
                    {(user?.name || 'U').charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* Account Information Section */}
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        <div className="flex items-center mb-1">
                          <User className="w-4 h-4 mr-1" />
                          <span>Full Name</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        readOnly
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500"
                      />
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        <div className="flex items-center mb-1">
                          <Mail className="w-4 h-4 mr-1" />
                          <span>Email Address</span>
                        </div>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        readOnly
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Joined Date (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      <div className="flex items-center mb-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Member Since</span>
                      </div>
                    </label>
                    <input
                      type="text"
                      value={formData.joinedDate}
                      readOnly
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyProfile; 