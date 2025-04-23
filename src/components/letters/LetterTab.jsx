import React, { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import LetterGenerator from './LetterGenerator';

const LetterTab = ({ caseData }) => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [letters, setLetters] = useState([]);

  const handleGenerateLetter = () => {
    // Create initial content based on case data
    const initialContent = `This is a business visa invitation letter for ${caseData?.recipientName || '[Name]'}, 
${caseData?.recipientDesignation || '[Designation]'} at ${caseData?.recipientCompany || '[Company]'}. 

The purpose of this letter is to invite them for a business visit to discuss [purpose].

[Additional details about the visit and company background]

We will be responsible for all expenses during the stay.

Best regards,
[Your name]
[Your designation]
[Your company]`;

    setShowGenerator(true);
  };

  const handleLetterGenerated = (letterData) => {
    setLetters([...letters, letterData]);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Generated Letters</h2>
        <button
          onClick={handleGenerateLetter}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate New Letter
        </button>
      </div>

      {/* Letters List */}
      <div className="space-y-3">
        {letters.length > 0 ? (
          letters.map((letter, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Generated Letter #{index + 1}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setShowGenerator(true);
                    // Add preview logic
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Preview
                </button>
                <button
                  onClick={() => {
                    // Add download logic
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Download
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No letters generated yet</h3>
            <p className="text-sm text-gray-500">
              Click the "Generate New Letter" button to create your first letter
            </p>
          </div>
        )}
      </div>

      {/* Letter Generator Modal */}
      <LetterGenerator
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        initialContent={caseData?.letterTemplate}
        onGenerate={handleLetterGenerated}
      />
    </div>
  );
};

export default LetterTab; 