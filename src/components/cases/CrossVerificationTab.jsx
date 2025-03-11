import React from 'react';
import { Loader2 } from 'lucide-react';

const CrossVerificationTab = ({ isLoading, verificationData }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!verificationData) {
    return null;
  }

  return (
    <div>
      {/* Cross Verification Content */}
      <div className="space-y-6">
        {/* Mismatch Errors Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Mismatch errors</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {verificationData?.verificationResults.mismatchErrors.map((error, index) => (
              <div key={index} className="p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">{error.type}</h4>
                  <div className="flex flex-wrap items-center gap-3">
                    {Object.entries(error.details).map(([document, value], idx) => (
                      <div key={idx} className="inline-flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="text-sm font-medium text-gray-500 mr-2">{document}:</span>
                        <span className="text-base text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Errors Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Missing errors</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {verificationData?.verificationResults.missingErrors.map((error, index) => (
              <div key={index} className="p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">{error.type}</h4>
                  <p className="text-base text-gray-700 bg-gray-50 p-3 rounded-lg">{error.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summarization Errors Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Summarization errors</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {verificationData?.verificationResults.summarizationErrors.map((error, index) => (
              <div key={index} className="p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">{error.type}</h4>
                  <p className="text-base text-gray-700 bg-gray-50 p-3 rounded-lg">{error.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrossVerificationTab; 