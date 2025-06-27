import { Check } from 'lucide-react';
import PropTypes from 'prop-types';

const checkAllDocumentsApproved = (documentTypes) => {
  return documentTypes.every(doc => doc.status === 'approved');
};

const ProgressSteps = ({ caseData, activeTab, isQuestionnaireCompleted }) => {
  // Add null checks when accessing documentTypes
  const allDocumentsApproved = caseData?.documentTypes ? 
    checkAllDocumentsApproved(caseData.documentTypes) : 
    false;
  
  // Check if preparation is complete (questionnaire completed and in forms tab)
  const isPreparationComplete = activeTab === 'forms' && isQuestionnaireCompleted;

  // Get case status from caseData
  const caseStatus = caseData?.categoryStatus?.toLowerCase() || 'pending';

  // Define steps with dynamic completion status based on case status
  const steps = [
    { 
      name: 'Case Started', 
      completed: true 
    },
    { 
      name: 'Data Collection', 
      completed: ['reviewed', 'completed'].includes(caseStatus) || allDocumentsApproved 
    },
    { 
      name: 'Review', 
      completed: ['reviewed', 'completed'].includes(caseStatus)
    },
    { 
      name: 'Preparation', 
      completed: caseStatus === 'completed'
    }
  ];

  return (
    <div className="flex items-center w-full py-3">
      {/* Removed bg-gradient, changed max-w-4xl to max-w-5xl, removed mx-auto */}
      <div className="flex items-center justify-between max-w-5xl w-full pl-6 relative">
        {/* Progress bar - adjusted for left alignment */}
        <div className="absolute top-[16px] left-6 right-8 h-[2px] bg-gradient-to-r from-blue-600/20 to-blue-600/20">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700"
            style={{
              width: `${Math.min((steps.filter(step => step.completed).length / steps.length) * 100, 100)}%`,
              transition: 'width 1s ease-in-out'
            }}
          />
        </div>

        {steps.map((step, index) => (
          <div key={step.name} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center relative min-w-[120px]"> {/* Increased min-width slightly */}
              {/* Pulse Animation - slightly bigger */}
              {index === steps.findIndex(s => !s.completed) && (
                <div className="absolute z-0 w-[40px] h-[40px] top-4 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="absolute inset-0 rounded-full opacity-20 animate-step-ping-slow bg-blue-400/50" />
                  <div className="absolute inset-0 rounded-full opacity-30 animate-step-ping bg-blue-500/50" />
                  <div className="absolute inset-0 rounded-full opacity-40 animate-step-pulse-fast bg-blue-600/50" />
                  <div className="absolute inset-0 rounded-full animate-step-pulse bg-blue-700/30 blur-[1px]" />
                </div>
              )}

              {/* Circle - slightly bigger */}
              <div 
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center 
                  transition-all duration-500 relative z-10
                  transform hover:scale-110
                  ${step.completed 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-100' 
                    : index === steps.findIndex(s => !s.completed)
                      ? 'bg-white border-2 border-blue-600 text-blue-600 shadow-md'
                      : 'bg-gray-100 text-gray-400'
                  }
                `}
              >
                {step.completed ? (
                  <Check className="w-5 h-5 animate-fadeIn" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Label - slightly bigger */}
              <span 
                className={`
                  mt-2.5 text-sm font-medium whitespace-nowrap
                  transition-all duration-300
                  ${step.completed 
                    ? 'text-blue-700' 
                    : index === steps.findIndex(s => !s.completed)
                      ? 'text-blue-600 font-semibold scale-105'
                      : 'text-gray-400'
                  }
                `}
              >
                {step.name}
              </span>

              {/* Status Indicator - slightly bigger */}
              <span 
                className={`
                  mt-1 text-xs
                  transition-all duration-300
                  ${step.completed 
                    ? 'text-green-600' 
                    : index === steps.findIndex(s => !s.completed)
                      ? 'text-blue-500'
                      : 'text-gray-400'
                  }
                `}
              >
                {step.completed 
                  ? 'Completed' 
                  : index === steps.findIndex(s => !s.completed)
                    ? 'In Progress'
                    : 'Pending'
                }
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

ProgressSteps.propTypes = {
  caseData: PropTypes.object,
  activeTab: PropTypes.string.isRequired,
  isQuestionnaireCompleted: PropTypes.bool.isRequired
};

export default ProgressSteps; 