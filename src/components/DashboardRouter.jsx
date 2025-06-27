import { useAuth } from '../contexts/AuthContext';
import Dashboard from '../pages/Dashboard';
import FNDashboard from '../pages/FNdashboard';

const DashboardRouter = () => {
  const { user } = useAuth();

  // Check if user role is attorney or admin
  const isAdminOrAttorney = user?.role === 'attorney' || user?.role === 'admin';

  // Render appropriate dashboard based on role
  return isAdminOrAttorney ? (
    <Dashboard />
  ) : (
    <FNDashboard />
  );
};

export default DashboardRouter; 