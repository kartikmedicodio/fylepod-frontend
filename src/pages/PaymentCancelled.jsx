import React from 'react';
import { X, AlertCircle } from 'lucide-react';

const PaymentCancelled = () => {
  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full border border-gray-100">
        <div className="flex flex-col items-center">
          <div className="bg-red-100 p-4 rounded-full ring-8 ring-red-50">
            <X className="w-10 h-10 text-red-600" />
          </div>
          
          <h1 className="mt-6 text-2xl font-bold text-gray-900 tracking-tight">
            Payment Cancelled
          </h1>
          
          <p className="mt-3 text-center text-gray-600 max-w-sm">
            The payment process was cancelled. Don't worry, no charges have been made to your account.
          </p>

          <div className="mt-8 w-full max-w-sm">
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Payment Status</h3>
                  <p className="mt-1 text-sm text-red-700">
                    Your payment was not processed due to cancellation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 w-full max-w-sm">
            <p className="text-sm text-center text-gray-500">
              Need help? <a href="/support" className="text-indigo-600 hover:text-indigo-700 font-medium">Contact our support team</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled; 