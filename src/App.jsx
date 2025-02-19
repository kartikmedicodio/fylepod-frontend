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

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <PageProvider>
          <BreadcrumbProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/cases/new" element={
                <PrivateRoute>
                  <Layout>
                    <NewCase />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/*" element={
                <PrivateRoute>
                  <Layout>
                    <Routes>
                      <Route path="/cases" element={<Cases />} />
                      <Route path="/corporations" element={<Corporations />} />
                      <Route path="/corporations/:corporationId" element={<CorporationDetails />} />
                      {/* Your other routes will go here */}
                    </Routes>
                  </Layout>
                </PrivateRoute>
              } />
            </Routes>
          </BreadcrumbProvider>
        </PageProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;