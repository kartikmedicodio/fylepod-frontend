import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        await api.post('/payments/update-payment-status', {
          paymentIntentId: sessionId,
          status: 'succeeded'
        });
        setLoading(false);
      } catch (error) {
        console.error('Error verifying payment:', error);
      }
    };

    if (sessionId) {
      verifyPayment();
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center">
          <div className="bg-green-100 p-3 rounded-full">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Payment Successful!
          </h1>
          
          <p className="mt-2 text-center text-gray-600">
            Your payment has been processed successfully. You can now return to your case.
          </p>

          <button
            onClick={() => navigate('/cases')}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Cases
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 