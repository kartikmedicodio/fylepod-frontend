import React from 'react';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';

const ValidationTab = ({ validationData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!validationData?.mergedValidations?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-gray-600">No validation data available</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="space-y-6">
        {validationData.mergedValidations.map((documentValidation, index) => (
          <div 
            key={index}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            {/* Document Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  documentValidation.passed 
                    ? 'bg-green-50 text-green-600' 
                    : 'bg-red-50 text-red-600'
                }`}>
                  {documentValidation.passed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {documentValidation.documentType}
                  </h3>
                  <p className={`text-sm ${
                    documentValidation.passed 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {documentValidation.passed ? 'Passed' : 'Failed'}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                documentValidation.passed 
                  ? 'bg-green-50 text-green-600' 
                  : 'bg-red-50 text-red-600'
              }`}>
                {documentValidation.validations.length} Validation{documentValidation.validations.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Validation Rules */}
            <div className="divide-y divide-gray-100">
              {documentValidation.validations.map((validation, vIndex) => (
                <div 
                  key={vIndex}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    validation.passed 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {validation.passed ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {validation.rule}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {validation.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ValidationTab; 