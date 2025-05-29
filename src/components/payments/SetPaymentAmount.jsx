import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { DollarSign, Mail, ArrowRight } from 'lucide-react';
import api from '../../utils/api';

const SetPaymentAmount = ({ caseId, onAmountSet, customerEmail }) => {
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');

  useEffect(() => {
    if (customerEmail) {
      setEmail(customerEmail);
    }
  }, [customerEmail]);

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
    <div className="flex flex-col items-center max-w-xl mx-auto">
      {/* Icon and Title */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <DollarSign className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Set Up Payment</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          No payment has been configured for this case yet. Please set up the payment details to proceed.
        </p>
      </div>

      {/* Form Card */}
      <div className="w-full bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Set Payment Details</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-lg">$</span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full pl-8 pr-20 py-3 text-lg border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span className="text-gray-500 text-lg">USD</span>
              </div>
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Email
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 text-lg border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="customer@example.com"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mt-8 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing...
              </div>
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
        <div className="w-full mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Link className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Payment Link Generated</h4>
              <p className="text-sm text-blue-700 mb-4">
                Share this link with the customer to complete the payment:
              </p>
              <div className="bg-white p-4 rounded-lg break-all border border-blue-100">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default SetPaymentAmount; 