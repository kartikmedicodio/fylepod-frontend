import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  Activity, 
  TrendingUp, 
  Search, 
  Mail, 
  Calendar,
  BarChart3,
  Filter
} from 'lucide-react';
import { getStoredUser } from '../utils/auth';
import api from '../utils/api';
import { usePage } from '../contexts/PageContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
const LineChart = ({ data, options }) => {
  if (!data?.labels?.length || !data?.datasets?.[0]?.data?.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <div className="text-sm">No data available</div>
        </div>
      </div>
    );
  }

  const chartData = data.datasets[0].data;
  const labels = data.labels;
  const maxValue = Math.max(...chartData, 1);
  const minValue = Math.min(...chartData, 0);
  const range = maxValue - minValue || 1;

  const width = 100;
  const height = 60;
  const padding = 10;

  const points = chartData.map((value, index) => {
    const x = (index / (chartData.length - 1)) * (width - 2 * padding) + padding;
    const y = height - padding - ((value - minValue) / range) * (height - 2 * padding);
    return { x, y, value, label: labels[index] };
  });

  const pathData = points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path} ${command} ${point.x} ${point.y}`;
  }, '');

  const areaPath = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="relative h-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        style={{ minHeight: '200px' }}
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.2)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.02)" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[...Array(5)].map((_, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + (i * (height - 2 * padding)) / 4}
            x2={width - padding}
            y2={padding + (i * (height - 2 * padding)) / 4}
            stroke="rgba(0, 0, 0, 0.05)"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Area fill */}
        <motion.path
          d={areaPath}
          fill="url(#chartGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        
        {/* Line */}
        <motion.path
          d={pathData}
          fill="none"
          stroke="#6366F1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        
        {/* Points */}
        {points.map((point, index) => (
          <motion.circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="#6366F1"
            stroke="white"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
            className="cursor-pointer hover:r-4 transition-all"
          >
            <title>{`${point.label}: ${point.value} users`}</title>
          </motion.circle>
        ))}
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-2 px-4 text-xs text-gray-500">
        {labels.filter((_, i) => i % Math.ceil(labels.length / 6) === 0).map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
    </div>
  );
};

const UserDashboardSkeleton = () => (
  <div className="p-6 max-w-[1400px] mx-auto">
    <div className="mb-8">
      <div className="h-8 w-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse mb-2"></div>
      <div className="h-5 w-64 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
            <div className="w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-8 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-6 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse mb-6"></div>
          <div className="h-64 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-6 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-12 h-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const UserDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { setPageTitle } = usePage();
  const { setCurrentBreadcrumb } = useBreadcrumb();

  useEffect(() => {
    setCurrentBreadcrumb([
      { name: 'Home', path: '/' },
      { name: 'User Dashboard', path: '/user-dashboard' }
    ]);
    return () => setCurrentBreadcrumb([]);
  }, [setCurrentBreadcrumb]);

  useEffect(() => {
    setPageTitle('User Dashboard');
    return () => setPageTitle('');
  }, [setPageTitle]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const user = getStoredUser();
      
      if (!user) {
        setError('User data not found. Please login again.');
        return;
      }

      const response = await api.post('/dashboard/users', {
        lawfirmId: user.lawfirm_id?._id
      });

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    if (!dashboardData?.users) return [];
    
    let filtered = [...dashboardData.users];

    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'recent':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Active Today';
      case 'recent':
        return 'Active This Week';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Unknown';
    }
  };

  const chartData = {
    labels: dashboardData?.activityChart?.map(d => d.label) || [],
    datasets: [
      {
        data: dashboardData?.activityChart?.map(d => d.users) || [],
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
      }
    ]
  };

  if (loading) {
    return <UserDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">{error}</div>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = getFilteredUsers();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-[1400px] mx-auto"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            User Dashboard
          </h1>
        </div>
        <p className="text-gray-600">Monitor user activity and engagement across your platform</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {dashboardData?.summary?.totalUsers || 0}
          </div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {dashboardData?.summary?.activeToday || 0}
          </div>
          <div className="text-sm text-gray-600">Active Today</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Activity className="w-6 h-6 text-yellow-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {dashboardData?.summary?.activeThisWeek || 0}
          </div>
          <div className="text-sm text-gray-600">Active This Week</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {dashboardData?.summary?.averageCasesPerUser || '0.0'}
          </div>
          <div className="text-sm text-gray-600">Avg Cases/User</div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">User Activity (Last 30 Days)</h2>
              <div className="text-sm text-gray-500">New user registrations</div>
            </div>
            <div className="h-64">
              <LineChart data={chartData} />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">User Search</h2>
              <Filter className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm
                           focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
                           transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
                         transition-all duration-200"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active Today</option>
                <option value="recent">Active This Week</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {filteredUsers.slice(0, 10).map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 
                             transition-all duration-200 cursor-pointer group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 
                                  rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                        {getStatusLabel(user.status)}
                      </span>
                      <div className="text-xs text-gray-400">
                        {user.activity.totalCases} cases
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <div className="text-sm">No users found</div>
                  {searchQuery && (
                    <div className="text-xs mt-1">Try adjusting your search terms</div>
                  )}
                </div>
              )}
              
              {filteredUsers.length > 10 && (
                <div className="text-center py-2 text-sm text-gray-500">
                  Showing 10 of {filteredUsers.length} users
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserDashboard;
