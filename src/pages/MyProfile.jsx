import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Building, Shield } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion } from 'framer-motion';
import api from '../utils/api';

const MyProfile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      setProfileData(response.data.data.user);
      setError(null);
    } catch (err) {
      setError('Failed to fetch profile data');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const ProfileSection = ({ icon: Icon, label, value }) => (
    <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-all duration-200">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="w-5 h-5 text-blue-500" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-base font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header Section */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-1">View your account information</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {profileData?.role?.toUpperCase()}
              </span>
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl font-semibold text-blue-600">
                  {(profileData?.name || 'U').charAt(0)}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProfileSection 
                icon={User} 
                label="Full Name" 
                value={profileData?.name || 'N/A'} 
              />
              <ProfileSection 
                icon={Mail} 
                label="Email Address" 
                value={profileData?.email || 'N/A'} 
              />
              <ProfileSection 
                icon={Building} 
                label="Company Name" 
                value={profileData?.company_name || 'N/A'} 
              />
              <ProfileSection 
                icon={Shield} 
                label="Role" 
                value={profileData?.role?.toUpperCase() || 'N/A'} 
              />
              <ProfileSection 
                icon={Calendar} 
                label="Member Since" 
                value={profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'} 
              />
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default MyProfile; 