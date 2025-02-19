import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/dashboard/Layout';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <Layout>
              {/* Your other routes will go here */}
            </Layout>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;