import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from './PaymentForm';
import PaymentStatus from './PaymentStatus';
import SetPaymentAmount from './SetPaymentAmount';
import api from '../../utils/api';
import { Check, X, Clock, Link, DollarSign, CreditCard, AlertCircle } from 'lucide-react';

// Initialize Stripe using environment variable
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const formatStatus = (status) => {
  const statusMap = {
    'amount_set': 'Amount Set',
    'link_sent': 'Link Sent',
    'pending': 'Pending',
    'succeeded': 'Succeeded',
    'failed': 'Failed',
    'refunded': 'Refunded'
  };
  return statusMap[status] || status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getStatusStyles = (status) => {
  const styleMap = {
    succeeded: 'bg-green-50 text-green-700 border-green-100',
    failed: 'bg-red-50 text-red-700 border-red-100',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    link_sent: 'bg-blue-50 text-blue-700 border-blue-100',
    amount_set: 'bg-gray-50 text-gray-700 border-gray-100',
    refunded: 'bg-purple-50 text-purple-700 border-purple-100'
  };
  return styleMap[status] || styleMap.pending;
};

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
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-500">Loading payment details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 max-w-md w-full">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-red-800 font-medium mb-1">Error Loading Payment Details</h3>
              <p className="text-red-600 text-sm mb-3">{error}</p>
              <button 
                onClick={fetchPaymentDetails}
                className="text-sm px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main Content */}
      <div className="px-6 py-4">
        <div className="max-w-[2000px] mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#000D3B] mb-2">Payment</h1>
            <p className="text-[#000D3B] opacity-70">
              Manage payment details and transaction information for this case
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {!paymentDetails?.amount ? (
              <div className="p-8">
                <SetPaymentAmount 
                  caseId={caseId} 
                  onAmountSet={fetchPaymentDetails} 
                />
              </div>
            ) : (
              <div>
                {/* Payment Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b border-gray-100">
                  {/* Amount Card */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Amount</p>
                      <p className="text-2xl font-semibold text-gray-900">${paymentDetails.amount}</p>
                      <p className="text-sm text-gray-500 mt-1">Total amount to be paid</p>
                    </div>
                  </div>

                  {/* Status Card */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusStyles(paymentDetails.status)}`}>
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Status</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-gray-900">{formatStatus(paymentDetails.status)}</p>
                        
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Last updated {new Date(paymentDetails.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Status Details */}
                <div className="p-6">
                  <PaymentStatus 
                    status={paymentDetails.status}
                    paymentUrl={paymentDetails.paymentLinkUrl}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTab; 