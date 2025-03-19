import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(true);
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    // You could add a token validation check here if needed
    if (!token) {
      setValidToken(false);
      setError('Invalid or expired reset link');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      
      // Redirect to login with success message
      navigate('/login', { 
        state: { 
          message: 'Password has been reset successfully. Please login with your new password.' 
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white overflow-hidden">
        <div className="relative min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-[420px]">
            <div className="bg-white/90 backdrop-blur-xl shadow-xl shadow-blue-900/5 ring-1 ring-gray-900/5 sm:rounded-2xl p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
                <p className="text-gray-600 mb-6">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Request New Reset Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 animate-gradient-xy"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.02] bg-[size:20px_20px]"></div>
      
      <div className="relative min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        {/* Floating gradient orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/2 left-1/4 -translate-x-1/2 blur-3xl opacity-20 animate-pulse">
            <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-400 to-indigo-500"></div>
          </div>
          <div className="absolute top-1/2 right-1/4 translate-x-1/2 blur-3xl opacity-20 animate-pulse delay-700">
            <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-indigo-400 to-purple-500"></div>
          </div>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-[420px]">
          {/* Back button */}
          <button
            onClick={() => navigate('/login')}
            className="mb-6 flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </button>

          {/* Card */}
          <div className="bg-white/90 backdrop-blur-xl shadow-xl shadow-blue-900/5 ring-1 ring-gray-900/5 sm:rounded-2xl hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 transform hover:-translate-y-1">
            {/* Logo Section */}
            <div className="px-6 pt-8 pb-6 border-b border-gray-100">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 rotate-3 transform hover:rotate-6 transition-transform duration-300 group">
                  <FileText className="w-10 h-10 text-white transform group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 tracking-tight hover:scale-105 transition-transform duration-300 animate-gradient-x">
                  FylePod
                </h1>
              </div>
            </div>

            {/* Form Section */}
            <div className="px-6 py-8 sm:px-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Set New Password</h2>
              <p className="text-gray-600 text-center mb-8">
                Please enter your new password below.
              </p>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5 group-hover:text-blue-600 transition-colors">
                    New Password
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200 hover:ring-gray-400 group-hover:ring-blue-200"
                      placeholder="••••••••"
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5 group-hover:text-blue-600 transition-colors">
                    Confirm New Password
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200 hover:ring-gray-400 group-hover:ring-blue-200"
                      placeholder="••••••••"
                      minLength={8}
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg animate-shake">
                    {error}
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 