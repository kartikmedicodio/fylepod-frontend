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
  const [agents, setAgents] = useState(null);
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

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await api.get('/agents');
        if (response.data.success) {
          const agentObject = response.data.data.reduce((acc, agent) => {
            acc[agent.agentId] = agent;
            return acc;
          }, {});
          setAgents(agentObject);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    };

    fetchAgents();
  }, []);

  // First Dashboard Layout Component
  const FirstDashboardLayout = () => (
    <div className="flex gap-6">
      {/* Left Section - Profile - adjusted width and height */}
      <div className="w-[280px]">
        <div className="bg-[linear-gradient(98deg,rgba(167,247,193,0.60)_12.5%,rgba(51,97,255,0.40)_131.61%)] rounded-2xl p-6">
          <div className="flex flex-col items-center">
            <div className="bg-white rounded-full p-1 mb-3">
              <img 
                src="/assets/diana-avatar.png" 
                alt={agents?.["1"]?.name || 'Diana'}
                className="w-24 h-24 rounded-full"
              />
            </div>
            <h3 className="text-lg font-medium mb-1">{agents?.["1"]?.name || 'Diana'}</h3>
            <p className="text-gray-600 text-sm mb-1">{agents?.["1"]?.role || 'Data collector'}</p>
            <p className="text-gray-600 text-sm mb-1">Age: {agents?.["1"]?.age || '1 month'}</p>
            <p className="text-gray-600 text-sm">ID: {agents?.["1"]?.agentId || '1'}</p>
          </div>
        </div>
      </div>

      {/* Middle Section - Main Cards */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Pending Review - Enhanced Card */}
        <div 
          onClick={() => {
            navigate('/cases', { 
              state: { 
                applyFilter: true,
                autoApply: true,
                filterType: 'documentStatus',
                filterValue: 'complete',
                filterType2: 'status',
                filterValue2: 'pending'
              },
              replace: true
            });
          }}
          className="bg-white rounded-lg shadow-sm p-4 cursor-pointer relative group
            transition-all duration-200 ease-in-out
            hover:shadow-lg hover:border-blue-100 hover:scale-[1.02]
            active:scale-[0.98]
            before:content-['Click_to_view_detailed_review_status']
            before:absolute before:-top-10 before:left-1/2 before:-translate-x-1/2
            before:bg-gray-800 before:text-white before:px-3 before:py-1.5
            before:rounded-lg before:text-sm
            before:opacity-0 before:invisible
            hover:before:opacity-100 hover:before:visible
            before:transition-all before:duration-200
            before:whitespace-nowrap"
        >
          <div>
            <h3 className="text-gray-800 font-medium mb-2 group-hover:text-blue-600 transition-colors">
              Pending Review
            </h3>
            <div className="text-xl font-bold text-gray-900">
              {dashboardData?.pendingReviewCount ?? 'Loading...'}
            </div>
            <div className="bg-amber-50 rounded p-2 mt-1 w-1/4">
              <p className="text-sm text-gray-700">Cases requires your attention</p>
            </div>
          </div>

          {/* Permanent View Details text */}
          <div className="absolute bottom-3 right-3">
            <div className="text-s text-blue-500">
              View details
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Statistics */}
      <div className="w-[320px]">
        <div className="bg-white rounded-2xl p-6">
          <div className="mb-8">
            <div className="text-2xl font-bold mb-2">
              {dashboardData?.insights.metrics.documentCompletionRate ?? 0}%
            </div>
            <p className="text-gray-600">of follow-up requests resulted in document submissions</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Second Dashboard Layout Component
  const SecondDashboardLayout = () => (
    <div className="flex gap-6 mt-6">
      {/* Left Section - Profile - adjusted width and height */}
      <div className="w-[280px]">
        <div className="bg-[linear-gradient(96deg,rgba(234,201,246,0.20)_-24.04%,rgba(116,112,255,0.40)_94.87%)] rounded-2xl p-6">
          <div className="flex flex-col items-center">
            <div className="bg-white rounded-full p-1 mb-3">
              <img 
                src="/assets/fiona-avatar.png" 
                alt={agents?.["2"]?.name || 'Fiona'}
                className="w-24 h-24 rounded-full"
              />
            </div>
            <h3 className="text-lg font-medium mb-1">{agents?.["2"]?.name || 'Fiona'}</h3>
            <p className="text-gray-600 text-sm mb-1">{agents?.["2"]?.role || 'Case manager'}</p>
            <p className="text-gray-600 text-sm mb-1">Age: {agents?.["2"]?.age || '1 month'}</p>
            <p className="text-gray-600 text-sm">ID: {agents?.["2"]?.agentId || '2'}</p>
          </div>
        </div>
      </div>

      {/* Middle Section - Case Stats */}
      <div className="flex-1">
        <div className="grid grid-cols-2 gap-4">
          {/* Cases Opened */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-gray-800 font-medium mb-2">Cases Opened</h3>
            <div className="text-xl font-bold text-gray-900">
              {dashboardData ? `${dashboardData.managementCount}/100` : 'Loading...'}
            </div>
            <p className="text-sm text-gray-600">cases requires your attention</p>
          </div>

          {/* Data Collection Completed */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-gray-800 font-medium mb-2">Data Collection Completed</h3>
            <div className="text-xl font-bold text-gray-900">
              {dashboardData ? `${dashboardData.pendingReviewCount}/100` : 'Loading...'}
            </div>
            <p className="text-sm text-gray-600">cases are fully prepared</p>
          </div>

          {/* Pending Review */}
          <div 
            className="bg-white rounded-lg shadow-sm p-4 cursor-pointer relative group
              transition-all duration-200 ease-in-out
              hover:shadow-lg hover:border-blue-100 hover:scale-[1.02]
              active:scale-[0.98]
              before:content-['Click_to_view_detailed_review_status']
              before:absolute before:-top-10 before:left-1/2 before:-translate-x-1/2
              before:bg-gray-800 before:text-white before:px-3 before:py-1.5
              before:rounded-lg before:text-sm
              before:opacity-0 before:invisible
              hover:before:opacity-100 hover:before:visible
              before:transition-all before:duration-200
              before:whitespace-nowrap"
            onClick={() => {
              navigate('/cases', { 
                state: { 
                  applyFilter: true,
                  filterType: 'status',
                  filterValue: 'Reviewed',
                  autoApply: true
                } 
              });
            }}
          >
            <div>
              <h3 className="text-gray-800 font-medium mb-2 group-hover:text-blue-600 flex items-center">
                Pending Review
              </h3>
              <div className="text-xl font-bold text-gray-900">
                {dashboardData ? `${dashboardData.reviewedCount}` : 'Loading...'}
              </div>
              <p className="text-sm text-gray-600">cases have undergone review</p>
            </div>

            {/* Permanent View Details text */}
            <div className="absolute bottom-3 right-3">
              <div className="text-s text-blue-500">
                View details
              </div>
            </div>
          </div>

          {/* Preparation for Filing */}
          <div 
            className="bg-white rounded-lg shadow-sm p-4 cursor-pointer relative group
              transition-all duration-200 ease-in-out
              hover:shadow-lg hover:border-blue-100 hover:scale-[1.02]
              active:scale-[0.98]
              before:content-['Click_to_view_cases_ready_for_filing']
              before:absolute before:-top-10 before:left-1/2 before:-translate-x-1/2
              before:bg-gray-800 before:text-white before:px-3 before:py-1.5
              before:rounded-lg before:text-sm
              before:opacity-0 before:invisible
              hover:before:opacity-100 hover:before:visible
              before:transition-all before:duration-200
              before:whitespace-nowrap"
            onClick={() => {
              navigate('/cases', { 
                state: { 
                  applyFilter: true,
                  autoApply: true,
                  filterType: 'status',
                  filterValue: 'completed'
                } 
              });
            }}
          >
            <div>
              <h3 className="text-gray-800 font-medium mb-2 group-hover:text-blue-600 flex items-center">
                Preparation for Filing
              </h3>
              <div className="text-xl font-bold text-gray-900">
                {dashboardData ? `${dashboardData.completedCount}` : 'Loading...'}
              </div>
              <p className="text-sm text-gray-600">cases have forms ready for submission</p>
            </div>

            {/* Permanent View Details text */}
            <div className="absolute bottom-3 right-3">
              <div className="text-s text-blue-500">
                View details
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Statistics */}
      <div className="w-[320px]">
        <div className="bg-white rounded-2xl p-6">
          <div className="mb-16">
            <div className="text-2xl font-bold mb-2">
              {dashboardData?.insights.metrics.caseCompletionRate ?? 0}%
            </div>
            <p className="text-gray-600">case completion rate this week</p>
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
        <div className="bg-white rounded-full p-1 mb-3">
          <SkeletonBox width="96px" height="96px" className="rounded-full" />
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
        {/* Profile Section */}
        <div className="w-[280px]">
          <SkeletonProfileCard gradient="bg-[linear-gradient(98deg,rgba(167,247,193,0.60)_12.5%,rgba(51,97,255,0.40)_131.61%)]" />
        </div>

        {/* Middle Cards Section */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <SkeletonDashboardCard />
            <SkeletonDashboardCard />
          </div>
          <SkeletonDashboardCard />
        </div>

        {/* Stats Section */}
        <div className="w-[320px]">
          <SkeletonStatsCard />
        </div>
      </div>

      {/* Second Dashboard Layout Skeleton */}
      <div className="flex gap-6">
        {/* Profile Section */}
        <div className="w-[280px]">
          <SkeletonProfileCard gradient="bg-[linear-gradient(96deg,rgba(234,201,246,0.20)_-24.04%,rgba(116,112,255,0.40)_94.87%)]" />
        </div>

        {/* Middle Cards Section */}
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4">
            <SkeletonDashboardCard />
            <SkeletonDashboardCard />
            <SkeletonDashboardCard />
            <SkeletonDashboardCard />
          </div>
        </div>

        {/* Stats Section */}
        <div className="w-[320px]">
          <SkeletonStatsCard />
        </div>
      </div>
    </div>
  );

  // Update the navigation handler for pending review cases
  const handlePendingReviewClick = () => {
    navigate('/cases', { 
      state: { 
        applyFilter: true,
        autoApply: true,
        filterType: 'documentStatus',
        filterValue: 'complete',
        filterType2: 'status',
        filterValue2: 'pending'
      },
      replace: true // Use replace to prevent back button issues
    });
  };

  // Update the navigation handler for pending documents
  const handlePendingDocumentsClick = () => {
    navigate('/cases', {
      state: {
        applyFilter: true,
        autoApply: true,
        filterType: 'documentStatus',
        filterValue: 'pending'
      },
      replace: true
    });
  };

  // Update the navigation handler for completed cases
  const handleCompletedCasesClick = () => {
    navigate('/cases', {
      state: {
        applyFilter: true,
        autoApply: true,
        filterType: 'status',
        filterValue: 'completed'
      },
      replace: true
    });
  };

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