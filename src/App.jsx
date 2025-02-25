import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Cases from './pages/Cases';
import Layout from './components/dashboard/Layout';
import Corporations from './pages/Corporations';
import CorporationDetails from './pages/CorporationDetails';
import NewCase from './pages/cases/NewCase';
import PrivateRoute from './components/auth/PrivateRoute';
import { PageProvider } from './contexts/PageContext';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import KnowledgeBase from './pages/KnowledgeBase';
import DocumentChecklist from './pages/DocumentChecklist';
import EmployeeProfile from './pages/EmployeeProfile';
import IndividualCases from './pages/IndividualCases';
import CaseDetails from './pages/CaseDetails';
import IndividualCaseDetails from './pages/IndividualCaseDetails';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

const App = () => {
  const [currentBreadcrumb, setCurrentBreadcrumb] = useState([]);

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
      <Router>
        <AuthProvider>
          <PageProvider>
            <BreadcrumbProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={
                  <PrivateRoute>
                    <Layout>
                      <Routes>
                        {/* Dashboard Routes */}
                        <Route path="/cases" element={<Cases setCurrentBreadcrumb={setCurrentBreadcrumb} />} />
                        <Route path="/cases/new" element={<NewCase setCurrentBreadcrumb={setCurrentBreadcrumb} />} />
                        <Route path="/case/:caseId" element={<CaseDetails setCurrentBreadcrumb={setCurrentBreadcrumb} />} />
                        
                        {/* Individual Cases Routes */}
                        <Route path="/individual-cases" element={<IndividualCases setCurrentBreadcrumb={setCurrentBreadcrumb} />} />
                        <Route path="/individuals/case/:caseId" element={<IndividualCaseDetails setCurrentBreadcrumb={setCurrentBreadcrumb} />} />
                        
                        {/* Corporation Routes */}
                        <Route path="/corporations" element={<Corporations setCurrentBreadcrumb={setCurrentBreadcrumb} />} />
                        <Route path="/corporations/:corporationId" element={<CorporationDetails setCurrentBreadcrumb={setCurrentBreadcrumb} />} />
                        <Route path="/corporations/:corporationId/employee/:employeeId" element={<EmployeeProfile setCurrentBreadcrumb={setCurrentBreadcrumb} />} />
                        <Route path="/corporations/:corporationId/employee/:employeeId/case/:caseId" element={<CaseDetails setCurrentBreadcrumb={setCurrentBreadcrumb} />} />
                        
                        {/* Knowledge Base Routes */}
                        <Route path="/knowledge" element={<KnowledgeBase setCurrentBreadcrumb={setCurrentBreadcrumb} />} />
                        <Route path="/knowledge/checklist/:id" element={<DocumentChecklist setCurrentBreadcrumb={setCurrentBreadcrumb} />} />
                      </Routes>
                    </Layout>
                  </PrivateRoute>
                } />
              </Routes>
            </BreadcrumbProvider>
          </PageProvider>
        </AuthProvider>
      </Router>
    </>
  );
};

export default App;