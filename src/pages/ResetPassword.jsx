import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    passwordsMatch: false
  });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams();

  // Validate password requirements
  useEffect(() => {
    setPasswordRequirements({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      passwordsMatch: password === confirmPassword && password !== ''
    });
  }, [password, confirmPassword]);

  // Check if all password requirements are met
  const isPasswordValid = () => {
    return Object.values(passwordRequirements).every(requirement => requirement);
  };

  useEffect(() => {
    if (!token) {
      setValidToken(false);
      setError('Invalid or expired reset link');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isPasswordValid()) {
      return setError('Please meet all password requirements');
    }

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
      
      navigate('/login', { 
        state: { 
          message: 'Password has been reset successfully. Please login with your new password.' 
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get unfulfilled requirements as a formatted string
  const getUnfulfilledRequirements = () => {
    const requirements = [];
    if (!passwordRequirements.hasMinLength) requirements.push('at least 8 characters');
    if (!passwordRequirements.hasUpperCase) requirements.push('an uppercase letter');
    if (!passwordRequirements.hasLowerCase) requirements.push('a lowercase letter');
    if (!passwordRequirements.hasNumber) requirements.push('a number');
    if (!passwordRequirements.hasSpecialChar) requirements.push('a special character');
    
    if (requirements.length > 0) {
      if (requirements.length === 1) {
        return `Your password needs ${requirements[0]}.`;
      }
      const lastRequirement = requirements.pop();
      return `Your password needs ${requirements.join(', ')} and ${lastRequirement}.`;
    }
    return '';
  };

  if (!validToken) {
    return (
      <div className="min-h-screen w-full flex">
        <div className="w-[40%] bg-gradient-to-br from-blue-50 via-indigo-50 to-white relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 animate-gradient-xy"></div>
            <div className="absolute inset-0 bg-grid-slate-900/[0.02] bg-[size:20px_20px]"></div>
          </div>
        </div>
        <div className="w-[60%] bg-white flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Invalid Reset Link</h2>
            <p className="text-gray-600">
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
    );
  }

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
          <button
            onClick={() => navigate('/login')}
            className="mb-6 flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Login
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <h2 className="text-3xl font-bold text-gray-900">Set New Password</h2>
            <p className="text-gray-500">Create a new password for your account</p>
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className={`block w-full px-4 py-3 rounded-xl border ${
                      password && !isPasswordValid() 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-600'
                    } placeholder-gray-400 focus:ring-2 focus:border-transparent transition-all duration-200`}
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

                {/* Compact Password Requirements - Only show on focus */}
                {isPasswordFocused && password && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2"
                  >
                    {getUnfulfilledRequirements().length > 0 ? (
                      <div className="flex items-start text-sm bg-amber-50 px-3 py-2 rounded-lg">
                        <AlertCircle className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-amber-600">
                          {getUnfulfilledRequirements()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-sm bg-green-50 px-3 py-2 rounded-lg">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                        <span className="text-green-600">Great! Your password meets all requirements.</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setIsConfirmPasswordFocused(true)}
                    onBlur={() => setIsConfirmPasswordFocused(false)}
                    className={`block w-full px-4 py-3 rounded-xl border ${
                      confirmPassword && !passwordRequirements.passwordsMatch
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-600'
                    } placeholder-gray-400 focus:ring-2 focus:border-transparent transition-all duration-200`}
                    placeholder="••••••••"
                  />
                  <div className="absolute right-3 top-3.5 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Password Match Indicator - Only show when confirm password is focused or has value */}
                {(isConfirmPasswordFocused || confirmPassword) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 flex items-center text-sm"
                  >
                    {passwordRequirements.passwordsMatch ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-green-600">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                        <span className="text-amber-600">Passwords do not match</span>
                      </>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !isPasswordValid() || !password || !confirmPassword}
                className={`relative w-full inline-flex items-center justify-center rounded-xl ${
                  loading || !isPasswordValid() || !password || !confirmPassword
                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]'
                } px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all duration-300`}
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              {/* Show helper text when button is disabled */}
              {(!isPasswordValid() || !password || !confirmPassword) && !loading && (
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Please complete all password requirements to enable reset
                </p>
              )}
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;