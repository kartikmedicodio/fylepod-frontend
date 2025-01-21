import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import ExtractedData from './pages/ExtractedData';
import AIChat from './pages/AIChat';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import UploadDocuments from './pages/UploadDocuments';
import UploadForm from './pages/UploadForm';
import PendingForms from './pages/PendingForms';
import CompletedForms from './pages/CompletedForms';
import MyProfile from './pages/MyProfile';
import CRM from './pages/CRM';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/pending-forms" replace />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <PrivateRoute>
                <Documents />
              </PrivateRoute>
            }
          />
          <Route
            path="/extracted"
            element={
              <PrivateRoute>
                <ExtractedData />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <AIChat />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Users />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <PrivateRoute>
                <Categories />
              </PrivateRoute>
            }
          />
          <Route
            path="/upload/:categoryId"
            element={
              <PrivateRoute>
                <UploadDocuments />
              </PrivateRoute>
            }
          />
          <Route
            path="/upload-form/:categoryId"
            element={
              <PrivateRoute>
                <UploadForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/pending-forms"
            element={
              <PrivateRoute>
                <PendingForms />
              </PrivateRoute>
            }
          />
          <Route
            path="/completed-forms"
            element={
              <PrivateRoute>
                <CompletedForms />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <MyProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/crm"
            element={
              <PrivateRoute>
                <CRM />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
