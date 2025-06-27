import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import PropTypes from 'prop-types';
import api from '../utils/api';
import { Loader2, CreditCard, CheckCircle2, XCircle, Clock, DollarSign, Calendar } from 'lucide-react';

const PaymentStatusIcon = ({ status }) => {
  switch (status?.toLowerCase()) {
    case 'succeeded':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'pending':
      return <Clock className="w-5 h-5 text-yellow-500" />;
    default:
      return <CreditCard className="w-5 h-5 text-gray-500" />;
  }
};

PaymentStatusIcon.propTypes = {
  status: PropTypes.string
};

const PaymentStatus = ({ status }) => {
  const getStatusConfig = () => {
    switch (status?.toLowerCase()) {
      case 'succeeded':
        return {
          text: 'Payment Complete',
          className: 'bg-green-50 text-green-700 border-green-200'
        };
      case 'failed':
        return {
          text: 'Payment Failed',
          className: 'bg-red-50 text-red-700 border-red-200'
        };
      case 'pending':
        return {
          text: 'Payment Pending',
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
        };
      default:
        return {
          text: 'Payment Required',
          className: 'bg-blue-50 text-blue-700 border-blue-200'
        };
    }
  };

  const config = getStatusConfig();
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}>
      {config.text}
    </span>
  );
};

PaymentStatus.propTypes = {
  status: PropTypes.string
};

const FNPayments = ({ stepId }) => {
  const { caseId } = useParams();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [caseId, stepId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const url = stepId 
        ? `/payments/case/${caseId}?stepId=${stepId}`
        : `/payments/case/${caseId}`;
      
      const response = await api.get(url);
      
      if (response.data.status === 'success') {
        const paymentData = response.data.data;
        setPayments(Array.isArray(paymentData) ? paymentData : [paymentData].filter(Boolean));
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Case Payments</h2>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No payments available</h3>
          <p className="mt-2 text-sm text-gray-500">There are no pending payments at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment, index) => (
            <div
              key={payment._id || index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:border-blue-200 transition-colors"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <PaymentStatusIcon status={payment.status} />
                      <PaymentStatus status={payment.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <DollarSign className="w-4 h-4 mr-1" />
                          Payment Amount
                        </div>
                        <div className="text-2xl font-semibold text-gray-900">
                          ${payment.amount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          Due Date
                        </div>
                        <div className="text-base text-gray-900">
                          {formatDate(payment.deadline)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 pt-6">
                    {payment.status?.toLowerCase() !== 'succeeded' && payment.paymentLinkUrl && (
                      <a
                        href={payment.paymentLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay Now
                      </a>
                    )}
                  </div>
                </div>
                {payment.description && (
                  <div className="mt-4 text-sm text-gray-600">
                    {payment.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

FNPayments.propTypes = {
  stepId: PropTypes.string
};

export default FNPayments; 