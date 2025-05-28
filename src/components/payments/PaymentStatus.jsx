import React from 'react';
import { Check, X, Clock, Link, DollarSign } from 'lucide-react';

const PaymentStatus = ({ status, amount, paymentUrl }) => {
  const statusConfig = {
    succeeded: {
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: <Check className="w-6 h-6 text-green-500" />,
      text: 'Payment Successful',
      description: 'Your payment has been processed successfully.'
    },
    failed: {
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: <X className="w-6 h-6 text-red-500" />,
      text: 'Payment Failed',
      description: 'There was an issue processing your payment. Please try again.'
    },
    pending: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: <Clock className="w-6 h-6 text-yellow-500" />,
      text: 'Payment Pending',
      description: 'Your payment is being processed.'
    },
    link_sent: {
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: <Link className="w-6 h-6 text-blue-500" />,
      text: 'Payment Link Ready',
      description: 'Click the button below to complete your payment.'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-6`}>
        <div className="flex items-center space-x-3">
          {config.icon}
          <div>
            <h3 className={`font-semibold ${config.color}`}>
              {config.text}
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              {config.description}
            </p>
          </div>
        </div>
      </div>

     

      {/* Payment Link Button */}
      {status === 'link_sent' && (
        <div className="flex justify-center">
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Complete Payment
          </a>
        </div>
      )}
    </div>
  );
};

export default PaymentStatus; 