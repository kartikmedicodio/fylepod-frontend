import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/dashboard/Layout';
import Corporations from './pages/Corporations';
import CorporationDetails from './pages/CorporationDetails';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <BreadcrumbProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/corporations" element={<Corporations />} />
                  <Route path="/corporations/:corporationId" element={<CorporationDetails />} />
                  {/* Your other routes will go here */}
                </Routes>
              </Layout>
            } />
          </Routes>
        </BreadcrumbProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;