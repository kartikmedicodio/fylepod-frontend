import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { DollarSign, Mail, ArrowRight } from 'lucide-react';
import api from '../../utils/api';

const SetPaymentAmount = ({ caseId, onAmountSet }) => {
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/payments/set-amount', {
        caseId,
        amount: parseFloat(amount),
        customerEmail: email
      });
      
      if (response.data.emailStatus === 'failed') {
        toast.warning('Payment link created but email delivery failed. You can still use the payment link below.');
      } else {
        toast.success('Payment amount set and email sent successfully');
      }

      setPaymentLink(response.data.paymentUrl);
      onAmountSet();
    } catch (error) {
      toast.error('Failed to set payment amount');
      console.error('Set amount error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Set Payment Details</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">USD</span>
              </div>
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Email
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 sm:text-sm border-gray-300 rounded-md"
                placeholder="customer@example.com"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              'Processing...'
            ) : (
              <>
                Set Payment Amount
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Payment Link Display */}
      {paymentLink && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-sm font-medium text-blue-900 mb-3">Payment Link Generated</h4>
          <p className="text-sm text-blue-700 mb-4">
            Share this link with the customer to complete the payment:
          </p>
          <div className="bg-white p-3 rounded-md break-all border border-blue-200">
            <a 
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {paymentLink}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetPaymentAmount; 