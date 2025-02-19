import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Cases from './pages/Cases';
import Layout from './components/dashboard/Layout';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/cases" element={<Cases />} />
                {/* Add other routes here */}
              </Routes>
            </Layout>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;