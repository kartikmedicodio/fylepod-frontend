import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/dashboard/Layout';
import NewCase from './pages/cases/NewCase';
import PrivateRoute from './components/auth/PrivateRoute';
import { PageProvider } from './contexts/PageContext';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <PageProvider>
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
                  {/* Your other routes will go here */}
                </Layout>
              </PrivateRoute>
            } />
          </Routes>
        </PageProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;