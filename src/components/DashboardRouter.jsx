import { useAuth } from '../contexts/AuthContext';
import Dashboard from '../pages/Dashboard';
import FNDashboard from '../pages/FNdashboard';
import PropTypes from 'prop-types';

const DashboardRouter = ({ setCurrentBreadcrumb }) => {
  const { user } = useAuth();

  // Check if user role is attorney or admin
  const isAdminOrAttorney = user?.role === 'attorney' || user?.role === 'admin';

  // Render appropriate dashboard based on role
  return isAdminOrAttorney ? (
    <Dashboard />
  ) : (
    <FNDashboard setCurrentBreadcrumb={setCurrentBreadcrumb} />
  );
};

// Add PropTypes validation
DashboardRouter.propTypes = {
  setCurrentBreadcrumb: PropTypes.func.isRequired
};

export default DashboardRouter; 