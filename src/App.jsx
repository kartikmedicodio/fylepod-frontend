import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DocumentProvider } from './contexts/DocumentContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Cases from './pages/Cases';
import Layout from './components/dashboard/Layout';
import Corporations from './pages/Corporations';
import CorporationDetails from './pages/CorporationDetails';
import NewCase from './pages/NewCase';
import PrivateRoute from './components/auth/PrivateRoute';
import { PageProvider } from './contexts/PageContext';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import KnowledgeBase from './pages/KnowledgeBase';
import DocumentChecklist from './pages/DocumentChecklist';
import EmployeeProfile from './pages/EmployeeProfile';
import FNCases from './pages/FNCases';
import CaseDetails from './pages/CaseDetails';
import FNCaseDetails from './pages/FNCaseDetails';
import DashboardRouter from './components/DashboardRouter';
import Profile from './pages/Profile';
import NewCompany from './pages/NewCompany';
import NewEmployee from './pages/NewEmployee';
import NewIndividual from './pages/NewIndividual';
import NewCorpAdmin from './pages/NewCorpAdmin';
import { Toaster } from 'react-hot-toast';
import Individuals from './pages/Individuals';
import IndividualDetails from './pages/IndividualDetails';
import UserDashboard from './pages/UserDashboard';
import Queries from './pages/Queries';
import AiQueries from './pages/AiQueries';
import { useEffect } from 'react';
import { removeStoredToken, removeStoredUser } from './utils/auth';
import FNPayments from './pages/FNPayments';
import PaymentCancelled from './pages/PaymentCancelled';
import CaseManagers from './pages/CaseManagers';

// Update HomeRedirect component to redirect to dashboard
const HomeRedirect = () => {
  // All users should land on dashboard after login
  return <Navigate to="/dashboard" replace />;
};

// Component to handle route changes and clear local storage
const RouteHandler = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/login') {
      // Clear all auth-related data from local storage
      removeStoredToken();
      removeStoredUser();
    }
  }, [location.pathname]);

  return null;
};

const App = () => {
  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            padding: '16px',
          },
        }}
      />
      <BreadcrumbProvider>
        <Router>
          <AuthProvider>
            <DocumentProvider>
              <PageProvider>
                <RouteHandler />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/*" element={
                    <PrivateRoute>
                      <Layout>
                        <Routes>
                          {/* Home Route - Now redirects to dashboard */}
                          <Route path="/" element={<HomeRedirect />} />
                          
                          {/* Dashboard route now uses DashboardRouter */}
                          <Route path="/dashboard" element={<DashboardRouter />} />
                          
                          {/* Profile Route */}
                          <Route path="/profile/:profileId" element={<Profile />} />
                          
                          {/* Other existing routes */}
                          <Route path="/cases" element={<Cases />} />
                          <Route path="/cases/new" element={<NewCase />} />
                          <Route path="/cases/:caseId" element={<CaseDetails />} />
                          <Route path="/queries" element={<Queries />} />
                          <Route path="/ai-queries" element={<AiQueries />} />
                          
                          <Route path="/individual-cases" element={<FNCases />} />
                          <Route path="/individuals/case/:caseId" element={<FNCaseDetails />} />
                          
                          {/* Corporation Routes */}
                          <Route path="/corporations" element={<Corporations />} />
                          <Route path="/corporations/:corporationId" element={<CorporationDetails />} />
                          <Route path="/corporations/:corporationId/employee/:employeeId" element={<EmployeeProfile />} />
                          <Route path="/corporations/:corporationId/employee/:employeeId/case/:caseId" element={<CaseDetails />} />
                          
                          {/* Individual Routes */}
                          <Route path="/individuals" element={<Individuals />} />
                          <Route path="/individuals/:individualId" element={<IndividualDetails />} />
                          
                          {/* User Dashboard Route */}
                          <Route path="/user-dashboard" element={<UserDashboard />} />
                          
                          {/* New Customer Routes */}
                          <Route path="/company/new" element={<NewCompany />} />
                          <Route path="/companies/:companyId/admin/new" element={<NewCorpAdmin />} />
                          <Route path="/employee/new" element={<NewEmployee />} />
                          <Route path="/individual/new" element={<NewIndividual />} />
                          
                          {/* Knowledge Base Routes */}
                          <Route path="/knowledge" element={<KnowledgeBase />} />
                          <Route path="/knowledge/checklist/:id" element={<DocumentChecklist />} />
                          
                          {/* Add this new route inside the PrivateRoute section */}
                          <Route path="/fn-payments" element={<FNPayments />} />
                          <Route path="/payment-cancelled" element={<PaymentCancelled />} />
                          <Route path="/case-managers" element={<CaseManagers />} />
                        </Routes>
                      </Layout>
                    </PrivateRoute>
                  } />
                </Routes>
              </PageProvider>
            </DocumentProvider>
          </AuthProvider>
        </Router>
      </BreadcrumbProvider>
    </>
  );
};

export default App;
