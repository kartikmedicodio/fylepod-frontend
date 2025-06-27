import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  Activity, 
  Search, 
  Filter,
  Loader2,
  TrendingUp,
  Calendar,
  Building
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import DashboardLayout from '../layouts/DashboardLayout';

const AnimatedDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchDashboardData();
  }, [currentPage, searchTerm, roleFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/users', {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm,
          role: roleFilter
        }
      });
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const cardHoverVariants = {
    hover: {
      y: -5,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );

  const SummaryCard = ({ title, value, change, icon: Icon, color, delay }) => (
    <motion.div
      variants={itemVariants}
      whileHover="hover"
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer"
      initial="hidden"
      animate="visible"
      transition={{ delay }}
    >
      <motion.div variants={cardHoverVariants} className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value?.toLocaleString() || 0}</p>
          {change && (
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm font-medium text-green-600">{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </motion.div>
    </motion.div>
  );

  const UserRow = ({ user, index }) => (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ 
        backgroundColor: "#f8fafc",
        transition: { duration: 0.2 }
      }}
      className="border-b border-gray-100 hover:shadow-sm"
    >
      <td className="px-6 py-4">
        <div className="flex items-center">
          <motion.div 
            className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </motion.div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize
          ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
            user.role === 'attorney' ? 'bg-blue-100 text-blue-800' : 
            'bg-gray-100 text-gray-800'}`}>
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize
          ${user.status === 'active' ? 'bg-green-100 text-green-800' : 
            user.status === 'idle' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'}`}>
          {user.status}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        <div className="flex items-center">
          <Building className="h-4 w-4 text-gray-400 mr-2" />
          {user.company || 'Individual'}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          {new Date(user.lastActive).toLocaleDateString()}
        </div>
      </td>
    </motion.tr>
  );

  if (loading && !dashboardData) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <LoadingSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
          >
            <p>Error loading dashboard: {error}</p>
            <button 
              onClick={fetchDashboardData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  const summaryCards = [
    {
      title: 'Total Users',
      value: dashboardData?.summary?.totalUsers,
      icon: Users,
      color: 'blue',
      delay: 0
    },
    {
      title: 'Active Today',
      value: dashboardData?.summary?.activeToday,
      icon: UserCheck,
      color: 'green',
      delay: 0.1
    },
    {
      title: 'Active This Week',
      value: dashboardData?.summary?.activeThisWeek,
      icon: Activity,
      color: 'purple',
      delay: 0.2
    },
    {
      title: 'New This Month',
      value: dashboardData?.summary?.newUsersThisMonth,
      icon: TrendingUp,
      color: 'orange',
      delay: 0.3
    }
  ];

  return (
    <DashboardLayout>
      <motion.div 
        className="p-6 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Dashboard</h1>
          <p className="text-gray-600">Monitor user activity and manage your community</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryCards.map((card, index) => (
            <SummaryCard key={card.title} {...card} />
          ))}
        </div>

        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">User Activity Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData?.activityChart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="newUsers" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Users</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="attorney">Attorney</option>
                    <option value="user">User</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <AnimatePresence>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan="5" className="px-6 py-4">
                          <div className="animate-pulse flex items-center">
                            <div className="h-10 w-10 bg-gray-200 rounded-full mr-4"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    dashboardData?.users?.map((user, index) => (
                      <UserRow key={user.id} user={user} index={index} />
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {dashboardData?.pagination && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((dashboardData.pagination.currentPage - 1) * 10) + 1} to{' '}
                {Math.min(dashboardData.pagination.currentPage * 10, dashboardData.pagination.totalUsers)} of{' '}
                {dashboardData.pagination.totalUsers} users
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={!dashboardData.pagination.hasPrev}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!dashboardData.pagination.hasNext}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default AnimatedDashboard;
