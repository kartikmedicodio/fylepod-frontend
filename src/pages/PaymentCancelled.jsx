import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft } from 'lucide-react';

const PaymentCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center">
          <div className="bg-red-100 p-3 rounded-full">
            <X className="w-8 h-8 text-red-500" />
          </div>
          
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Payment Cancelled
          </h1>
          
          <p className="mt-2 text-center text-gray-600">
            Your payment was cancelled. You can try again when you're ready.
          </p>

          <button
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled; 