import React from 'react';
import { X, AlertCircle, ArrowLeft, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const PaymentCancelled = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full border border-gray-200"
      >
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="bg-red-100 p-5 rounded-full ring-8 ring-red-50 mb-6"
          >
            <X className="w-12 h-12 text-red-600" strokeWidth={2} />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight text-center">
            Payment Cancelled
          </h1>
          
          <p className="mt-4 text-center text-gray-600 text-lg">
            No worries! Your payment was not processed and no charges have been made to your account.
          </p>

          <div className="mt-8 w-full space-y-4">
            <div className="bg-red-50 rounded-xl p-5 border border-red-100">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="ml-4">
                  <h3 className="text-base font-semibold text-red-800">Transaction Details</h3>
                  <ul className="mt-2 space-y-2 text-sm text-red-700">
                    <li>• Payment was cancelled before processing</li>
                    <li>• No funds were deducted from your account</li>
                    <li>• You can try the payment again whenever you're ready</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={handleBackToHome}
                className="flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors duration-200 w-full sm:w-1/2"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </button>
              <button
                className="flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors duration-200 w-full sm:w-1/2"
              >
                <RefreshCcw className="w-5 h-5 mr-2" />
                Try Again
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 w-full">
            <div className="text-center space-y-4">
              <p className="text-gray-500">
                Need assistance with your payment?
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                <a href="/support" className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                  Contact Support
                </a>
                <span className="hidden sm:inline text-gray-300">|</span>
                <a href="/faq" className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                  View FAQs
                </a>
                <span className="hidden sm:inline text-gray-300">|</span>
                <a href="/payment-guide" className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                  Payment Guide
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentCancelled; 