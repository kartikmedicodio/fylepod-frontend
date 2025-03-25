import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Lock, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login({ email, password });
      toast.success('Login successful! Welcome back.');
      navigate('/');
    } catch (_err) {
      setError('Invalid email or password');
      toast.error('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Section (40%) - Background & Content */}
      <div className="w-[40%] bg-gradient-to-br from-blue-50 via-indigo-50 to-white relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 animate-gradient-xy"></div>
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-grid-slate-900/[0.02] bg-[size:20px_20px]"></div>
          
          {/* Floating gradient orbs */}
          <div className="absolute -top-1/2 left-1/4 -translate-x-1/2 blur-3xl opacity-20 animate-pulse">
            <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-400 to-indigo-500"></div>
          </div>
          <div className="absolute top-1/2 right-1/4 translate-x-1/2 blur-3xl opacity-20 animate-pulse delay-700">
            <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-indigo-400 to-purple-500"></div>
          </div>
          
          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center space-y-8 max-w-lg">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-3"
              >
                <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 tracking-tight">
                  FylePod
                </h1>
                <div className="h-1 w-20 mx-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full"></div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                  Streamline Your <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Immigration Process</span>
                </h2>
                
                <div className="space-y-4 text-left">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="flex items-start space-x-3 bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-sm"
                  >
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Smart Document Management</h3>
                      <p className="text-sm text-gray-600 mt-1">AI-powered organization and processing of immigration documents</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="flex items-start space-x-3 bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-sm"
                  >
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Real-time Case Tracking</h3>
                      <p className="text-sm text-gray-600 mt-1">Live updates and comprehensive progress monitoring</p>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="pt-4 text-center"
                >
                  <p className="text-sm font-medium text-gray-500">
                    Trusted by immigration professionals worldwide
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section (60%) - Form */}
      <div className="w-[60%] bg-white flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back!</h2>
            <p className="text-gray-500">Sign in to your account to continue</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 text-red-600 p-4 rounded-lg text-sm flex items-center"
              >
                <Lock className="h-4 w-4 mr-2" />
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-3 rounded-xl border border-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-4 py-3 rounded-xl border border-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <div className="absolute right-3 top-3.5 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="relative w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign in
                    {/* <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /> */}
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => window.location.href = 'mailto:admin@fylepod.com'}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Contact Administrator
                </button>
              </p>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default Login; 