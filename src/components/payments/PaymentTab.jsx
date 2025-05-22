import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from './PaymentForm';
import PaymentStatus from './PaymentStatus';
import SetPaymentAmount from './SetPaymentAmount';
import api from '../../utils/api';
import { Check, X, Clock, Link } from 'lucide-react';

// Initialize Stripe using environment variable
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PaymentTab = ({ caseId }) => {
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (caseId) {
      fetchPaymentDetails();
    }
  }, [caseId]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/payments/case/${caseId}`);
      
      if (response.data.status === 'no_payment') {
        setPaymentDetails(null);
      } else {
        setPaymentDetails(response.data.data);
      }
      setError(null);
    } catch (error) {
      setError('Failed to load payment details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchPaymentDetails}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Payment</h2>
      
      {!paymentDetails?.amount ? (
        <div>
          <p className="text-gray-600 mb-4">No payment has been set up for this case yet.</p>
          <SetPaymentAmount 
            caseId={caseId} 
            onAmountSet={fetchPaymentDetails} 
          />
        </div>
      ) : (
        <PaymentStatus 
          status={paymentDetails.status}
          amount={paymentDetails.amount}
          paymentUrl={paymentDetails.paymentLinkUrl}
        />
      )}
    </div>
  );
};

export default PaymentTab; 