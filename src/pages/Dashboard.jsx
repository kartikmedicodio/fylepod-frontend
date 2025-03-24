import { useEffect, useState } from 'react';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { usePage } from '../contexts/PageContext';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

// Add this CSS to your global styles or component
const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}
`;

function Dashboard() {
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const { setPageTitle } = usePage();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentBreadcrumb([{ name: 'Dashboard', path: '/dashboard' }]);
    setPageTitle('Dashboard');
  }, [setCurrentBreadcrumb, setPageTitle]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('auth_user'));
        setUserData(userData);
        console.log(userData);
        const userId = userData?.id;

        if (!userId) {
          console.error('User ID not found');
          return;
        }

        const response = await api.post('management/pending-documents-count', {
          caseManagerId: userId
        });
        console.log('API Response:', response);
        if (response.data.success) {
          setDashboardData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // First Dashboard Layout Component
  const FirstDashboardLayout = () => (
    <div className="flex gap-6">
      {/* Left Section - Profile */}
      <div className="w-1/6">
        <div className="bg-[linear-gradient(98deg,rgba(167,247,193,0.60)_12.5%,rgba(51,97,255,0.40)_131.61%)] rounded-2xl p-6">
          <div className="flex flex-col items-center">
            <div className="bg-white rounded-full p-1 mb-4">
              <img 
                src="src\assets\diana-avatar.png" 
                alt="Diana"
                className="w-32 h-32 rounded-full"
              />
            </div>
            <h3 className="text-lg font-medium">Diana</h3>
            <p className="text-gray-600">Data collector</p>
            <p className="text-gray-600">Age: 1 month</p>
            <p className="text-gray-600">ID: 122</p>
          </div>
        </div>
      </div>

      {/* Middle Section - Main Cards */}
      <div className="w-2/4 grid grid-cols-2 gap-4">
        {/* Document Collection Stats */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-gray-800 font-medium mb-2">Document Collected</h3>
          <div className="text-xl font-bold text-gray-900">
            {dashboardData ? `${dashboardData.totalDocuments-dashboardData.totalPendingDocuments}/${dashboardData.totalDocuments}` : 'Loading...'}
          </div>
          <p className="text-sm text-gray-600">Documents collected for cases</p>
        </div>

        {/* Follow Ups Reminders */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-gray-800 font-medium mb-2">Follow Ups Reminders</h3>
          <div className="text-xl font-bold text-gray-900">
            {dashboardData?.pendingEmailReminderCount ?? 'Loading...'}
          </div>
          <p className="text-sm text-gray-600">Cases with document follow-ups</p>
        </div>

        {/* Pending Review - Warning Card */}
        <div 
          className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
          onClick={() => {
            navigate('/cases', { 
              state: { 
                applyFilter: true,
                filterType: 'status',
                filterValue: 'pending'
              } 
            });
          }}
        >
          <h3 className="text-gray-800 font-medium mb-2">Pending Review</h3>
          <div className="text-xl font-bold text-gray-900">
            {dashboardData?.pendingReviewCount ?? 'Loading...'}
          </div>
          <div className="bg-amber-50 rounded p-2 mt-1">
            <p className="text-sm text-gray-700">Cases requires your attention</p>
          </div>
        </div>
      </div>

      {/* Right Section - Statistics */}
      <div className="w-1/4">
        <div className="bg-white rounded-2xl p-6">
          <div className="mb-16">
            <div className="text-2xl font-bold mb-2">
              {dashboardData?.insights.metrics.documentCompletionRate ?? 0}%
            </div>
            <p className="text-gray-600">document completion rate</p>
          </div>
          <div>
            <div className="text-2xl font-bold mb-2">
              {dashboardData?.insights.metrics.reviewRate ?? 0}%
            </div>
            <p className="text-gray-600">review rate</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Second Dashboard Layout Component
  const SecondDashboardLayout = () => (
    <div className="flex gap-6">
      {/* Left Section - Profile */}
      <div className="w-1/6 bg-[linear-gradient(96deg,rgba(234,201,246,0.20)_-24.04%,rgba(116,112,255,0.40)_94.87%)] rounded-2xl p-6">
        <div className="flex flex-col items-center">
          <div className="bg-white rounded-full p-2 mb-4">
            <img 
              src="src\assets\fiona-avatar.png" 
              alt="Fiona"
              className="w-32 h-32 rounded-full"
            />
          </div>
          <h3 className="text-lg font-medium">Fiona</h3>
          <p className="text-gray-600">Case manager</p>
          <p className="text-gray-600">Age: 1 month</p>
          <p className="text-gray-600">ID: {dashboardData?.caseManagerId?.slice(-4) ?? '...'}</p>
        </div>
      </div>

      {/* Middle Section - Case Stats */}
      <div className="w-2/4 grid grid-cols-2 gap-4">
        {/* Cases Opened */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-gray-800 font-medium mb-2">Cases Opened</h3>
          <div className="text-xl font-bold text-gray-900">
            {dashboardData ? `${dashboardData.managementCount}` : 'Loading...'}
          </div>
          <p className="text-sm text-gray-600">cases requires your attention</p>
        </div>

        {/* Data Collection Completed */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-gray-800 font-medium mb-2">Data Collection Completed</h3>
          <div className="text-xl font-bold text-gray-900">
            {dashboardData ? `${dashboardData.pendingReviewCount}` : 'Loading...'}
          </div>
          <p className="text-sm text-gray-600">cases are fully prepared</p>
        </div>

        {/* Pending Review */}
        <div 
          className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
          onClick={() => {
            // Navigate to cases page with state
            navigate('/cases', { 
              state: { 
                applyFilter: true,
                filterType: 'status',
                filterValue: 'Reviewed'
              } 
            });
          }}
        >
          <h3 className="text-gray-800 font-medium mb-2">Pending Review</h3>
          <div className="text-xl font-bold text-gray-900">
            {dashboardData ? `${dashboardData.reviewedCount}` : 'Loading...'}
          </div>
          <p className="text-sm text-gray-600">cases have undergone review</p>
        </div>

        {/* Preparation for Filing */}
        <div 
          className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
          onClick={() => {
            // Navigate to cases page with state
            navigate('/cases', { 
              state: { 
                applyFilter: true,
                filterType: 'status',
                filterValue: 'completed'
              } 
            });
          }}
        >
          <h3 className="text-gray-800 font-medium mb-2">Preparation for Filing</h3>
          <div className="text-xl font-bold text-gray-900">
            {dashboardData ? `${dashboardData.completedCount}` : 'Loading...'}
          </div>
          <p className="text-sm text-gray-600">cases have forms ready for submission</p>
        </div>
      </div>

      {/* Right Section - Weekly Stats */}
      <div className="w-1/4">
        <div className="bg-white rounded-2xl p-6">
          <div className="mb-16">
            <div className="text-2xl font-bold mb-2">
              {dashboardData?.insights.metrics.caseCompletionRate ?? 0}%
            </div>
            <p className="text-gray-600">case completion rate this week</p>
          </div>
          <div>
            <div className="text-2xl font-bold mb-2">
              {dashboardData?.insights.metrics.pendingEmailRate ?? 0}%
            </div>
            <p className="text-gray-600">pending email rate this week</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Add these helper functions at the top of the Dashboard component
  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const SkeletonBox = ({ width, height, className = "" }) => (
    <div 
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%] ${className}`}
      style={{ 
        width, 
        height,
        animation: 'shimmer 2s infinite linear',
        backgroundImage: 'linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%)',
      }}
    />
  );

  const SkeletonDashboardCard = () => (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <SkeletonBox width="120px" height="20px" className="mb-2" />
      <SkeletonBox width="60px" height="28px" />
      <SkeletonBox width="140px" height="16px" className="mt-1" />
    </div>
  );

  const SkeletonStatsCard = () => (
    <div className="bg-white rounded-2xl p-6">
      <div className="mb-16">
        <SkeletonBox width="80px" height="32px" className="mb-2" />
        <SkeletonBox width="160px" height="16px" />
      </div>
      <div>
        <SkeletonBox width="80px" height="32px" className="mb-2" />
        <SkeletonBox width="160px" height="16px" />
      </div>
    </div>
  );

  const SkeletonProfileCard = ({ gradient }) => (
    <div className={`${gradient} rounded-2xl p-6`}>
      <div className="flex flex-col items-center">
        <div className="bg-white rounded-full p-1 mb-4">
          <SkeletonBox width="128px" height="128px" className="rounded-full" />
        </div>
        <SkeletonBox width="80px" height="20px" className="mb-2" />
        <SkeletonBox width="100px" height="16px" className="mb-1" />
        <SkeletonBox width="80px" height="16px" className="mb-1" />
        <SkeletonBox width="60px" height="16px" />
      </div>
    </div>
  );

  const DashboardSkeleton = () => (
    <div className="p-6">
      {/* Welcome Message Skeleton */}
      <div className="mb-6">
        <SkeletonBox width="200px" height="32px" className="mb-1" />
        <SkeletonBox width="250px" height="24px" className="mb-1" />
        <SkeletonBox width="400px" height="20px" />
      </div>

      {/* First Dashboard Layout Skeleton */}
      <div className="flex gap-6 mb-8">
        {/* Left Profile Section */}
        <div className="w-1/6">
          <SkeletonProfileCard gradient="bg-[linear-gradient(98deg,rgba(167,247,193,0.60)_12.5%,rgba(51,97,255,0.40)_131.61%)]" />
        </div>

        {/* Middle Cards Section */}
        <div className="w-2/4 grid grid-cols-2 gap-4">
          <SkeletonDashboardCard />
          <SkeletonDashboardCard />
          <SkeletonDashboardCard />
        </div>

        {/* Right Stats Section */}
        <div className="w-1/4">
          <SkeletonStatsCard />
        </div>
      </div>

      {/* Second Dashboard Layout Skeleton */}
      <div className="flex gap-6">
        {/* Left Profile Section */}
        <div className="w-1/6">
          <SkeletonProfileCard gradient="bg-[linear-gradient(96deg,rgba(234,201,246,0.20)_-24.04%,rgba(116,112,255,0.40)_94.87%)]" />
        </div>

        {/* Middle Cards Section */}
        <div className="w-2/4 grid grid-cols-2 gap-4">
          <SkeletonDashboardCard />
          <SkeletonDashboardCard />
          <SkeletonDashboardCard />
          <SkeletonDashboardCard />
        </div>

        {/* Right Stats Section */}
        <div className="w-1/4">
          <SkeletonStatsCard />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{shimmerKeyframes}</style>
      <div className="p-6">
        {/* Container for both dashboard layouts */}
        <div className="flex flex-col gap-8">
          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* Welcome Message */}
              <div className="mb-2">
                <h1 className="text-3xl font-bold mb-1">Welcome, {userData?.name} !</h1>
                <p className="text-gray-600 text-xl font-semibold leading-6">{getGreeting()}! It's {getCurrentDate()}</p>
                <p className="text-black mt-2 text-md font-semibold leading-6">Here's an update on your {dashboardData?.managementCount}-case workload — everything is progressing smoothly.</p>
              </div>  

              <FirstDashboardLayout />
              <SecondDashboardLayout />
            </>
          )}
        </div>
      </div>
    </>
  );
}

export { Dashboard as default }; 