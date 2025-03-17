import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { toast } from 'react-hot-toast';
import { Check, FileText, Users, ClipboardCheck, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

// Loading skeleton component
const DashboardSkeleton = () => {
  return (
    <div className="animate-pulse p-5 w-1/2">
      <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
      
      {[...Array(3)].map((_, i) => (
        <div key={i} className="mb-6">
          <div className="h-6 w-36 bg-gray-200 rounded mb-3"></div>
          <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
            <div className="flex justify-between mb-6">
              <div className="h-5 w-20 bg-gray-200 rounded"></div>
              <div className="h-5 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="flex justify-between mb-5">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="flex flex-col items-center w-full">
                  <div className="w-4 h-4 rounded-full bg-gray-200 mb-2"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4">
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const getStepIcon = (step) => {
  switch (step) {
    case 'Case Started':
      return <FileText className="w-4 h-4" />;
    case 'Docs Collection':
      return <ClipboardCheck className="w-4 h-4" />;
    case 'In Review':
      return <Users className="w-4 h-4" />;
    case 'Preparation':
      return <Clock className="w-4 h-4" />;
    default:
      return null;
  }
};

const CaseProgressCard = ({ caseItem, onClick }) => {
  return (
    <div 
      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-100/80 group relative overflow-hidden"
      onClick={onClick}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-50/20 via-indigo-50/20 to-transparent rounded-bl-[120px] -z-1" />
      
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="font-semibold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
            {caseItem.categoryName}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-500">Case #{caseItem._id.slice(-6)}</span>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
          ${caseItem.currentStep === caseItem.steps.length ? 
            'bg-green-50 text-green-700 border border-green-100 group-hover:bg-green-100' : 
            'bg-blue-50 text-blue-700 border border-blue-100 group-hover:bg-blue-100'}`}>
          {caseItem.categoryStatus || 'In Progress'}
        </div>
      </div>
      
      {/* Steps Timeline */}
      <div className="flex justify-between relative mb-8">
        {caseItem.steps.map((step, stepIndex) => (
          <div key={stepIndex} className="flex flex-col items-center relative w-full">
            <div className="relative">
              {/* Completed steps */}
              {stepIndex < caseItem.currentStep && (
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center z-10 shadow-sm transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                  <Check className="w-[18px] h-[18px] text-white" />
                </div>
              )}
              
              {/* Current step */}
              {stepIndex === caseItem.currentStep && (
                <div className="w-9 h-9 rounded-full border-2 border-blue-500 flex items-center justify-center z-10 bg-white transform transition-all duration-300 group-hover:scale-110 group-hover:border-blue-600 group-hover:text-blue-600">
                  {getStepIcon(step)}
                </div>
              )}
              
              {/* Future steps */}
              {stepIndex > caseItem.currentStep && (
                <div className="w-9 h-9 rounded-full border border-gray-200 bg-white z-10 flex items-center justify-center text-gray-400 transition-colors group-hover:border-gray-300">
                  {getStepIcon(step)}
                </div>
              )}
            </div>
            
            <div className="text-xs font-medium text-center whitespace-nowrap mt-3 px-1">
              <span className={`transition-colors ${stepIndex <= caseItem.currentStep ? 'text-gray-700' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
            
            {/* Connecting lines with gradient */}
            {stepIndex < caseItem.steps.length - 1 && (
              <div className="absolute top-[18px] left-[calc(50%+18px)] w-[calc(100%-36px)] h-[2px] transition-all duration-300"
                style={{
                  background: `linear-gradient(to right, 
                    ${stepIndex < caseItem.currentStep ? '#3B82F6' : '#E5E7EB'} 50%, 
                    ${stepIndex + 1 <= caseItem.currentStep ? '#3B82F6' : '#E5E7EB'} 50%
                  )`,
                  opacity: stepIndex < caseItem.currentStep ? '1' : '0.7'
                }}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Previous/Next Steps */}
      <div className="flex justify-between gap-4 text-sm">
        <div className="flex-1 bg-gray-50/70 rounded-lg p-3 border border-gray-100 transition-colors group-hover:bg-gray-50">
          <span className="text-gray-500 block mb-1 text-xs">Previous Step</span>
          <span className="font-medium text-gray-800">{caseItem.previousStep}</span>
        </div>
        <div className="flex-1 bg-blue-50/70 rounded-lg p-3 border border-blue-100 transition-colors group-hover:bg-blue-50">
          <span className="text-blue-600/90 block mb-1 text-xs">Next Step</span>
          <span className="font-medium text-blue-800">{caseItem.nextStep}</span>
        </div>
      </div>
    </div>
  );
};

CaseProgressCard.propTypes = {
  caseItem: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    categoryName: PropTypes.string.isRequired,
    categoryStatus: PropTypes.string,
    currentStep: PropTypes.number.isRequired,
    steps: PropTypes.arrayOf(PropTypes.string).isRequired,
    previousStep: PropTypes.string.isRequired,
    nextStep: PropTypes.string.isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

const FNDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const [loading, setLoading] = useState(true);
  const [currentUserCases, setCurrentUserCases] = useState([]);
  const [otherUserCases, setOtherUserCases] = useState({});

  useEffect(() => {
    setCurrentBreadcrumb([
      { label: 'Home', link: '/' },
      { label: 'FN Dashboard', link: '/fndashboard' }
    ]);
  }, [setCurrentBreadcrumb]);

  // Modified getStepMapping function to remove Filing step and show tick for Preparation
  const getStepMapping = (caseItem) => {
    // Updated steps array - removed Filing
    const defaultSteps = ['Case Started', 'Docs Collection', 'In Review', 'Preparation'];
    
    // Calculate current step based on documents and status
    // Start with 1 (Document Collection) since Case Started (0) is always completed
    let currentStep = 1;
    
    if (caseItem.documentTypes) {
      const totalDocs = caseItem.documentTypes.length;
      const uploadedDocs = caseItem.documentTypes.filter(doc => 
        doc.status === 'uploaded'
      ).length;
      const approvedDocs = caseItem.documentTypes.filter(doc => 
         doc.status === 'approved'
      ).length;
      // Simple logic for the remaining steps
      if (uploadedDocs === 0) {
        currentStep = 1; // Starting at Docs Collection
      } else if (uploadedDocs < totalDocs) {
        currentStep = 1; // Still in Docs Collection if partial uploads
      } else if (uploadedDocs === totalDocs) {
        currentStep = 2; // Advance to In Review when all docs uploaded
      }
      
      // Could add more logic based on case status
      if (approvedDocs === totalDocs) {
        currentStep = 4; // Set as 4 to make Preparation (index 3) show as completed
      }
    }
    
    // Correctly calculate previous and next steps based on current position
    const previousStep = currentStep > 0 ? defaultSteps[currentStep - 1] : 'Case initiation'; 
    const nextStep = currentStep < defaultSteps.length ? 'Completion' : 'Completion';
    
    return {
      steps: defaultSteps,
      currentStep: currentStep,
      previousStep: previousStep,
      nextStep: nextStep
    };
  };

  // Fetch related users
  const fetchRelatedUsers = async () => {
    try {
      if (!user?.id) return [];
      
      const response = await api.get(`/auth/user-relationships/${user.id}`);
      
      if (response.data.status === 'success') {
        // Extract related user IDs and include current user
        const relationships = response.data.data.relationships || [];
        const relatedUserIds = relationships.map(rel => rel.user_id._id);
        
        // Include current user's ID
        return [user.id, ...relatedUserIds];
      }
      return [user.id]; // Default to just the current user if no relationships
    } catch (error) {
      console.error('Error fetching user relationships:', error);
      toast.error('Failed to fetch related users');
      return [user.id]; // Default to just the current user
    }
  };

  // Fetch all cases for users
  const fetchAllUsersCases = async (userIds) => {
    try {
      setLoading(true);
      
      if (!userIds.length) {
        console.log('No user IDs available');
        return;
      }

      const response = await api.get('/management/users', {
        params: {
          userIds: userIds.join(',')
        }
      });

      if (response.data.status === 'success') {
        const cases = response.data.data.entries || [];
        
        // Process and separate current user's cases from other users
        processAndSeparateCases(cases);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  // Updated: Process cases and separate current user's cases from others
  const processAndSeparateCases = (cases) => {
    // Get current user information (name, email, etc.) to identify their cases
    // This assumes user has name or email that can be matched with userName in cases
    const currentUserName = user?.name || user?.email || ''; 
    
    // Filter current user's cases
    const userCases = cases
      .filter(caseItem => caseItem.userName === currentUserName)
      .map(caseItem => ({
        ...caseItem,
        ...getStepMapping(caseItem)
      }));
    
    setCurrentUserCases(userCases);
    
    // Group other users' cases
    const otherUsersGrouped = cases
      .filter(caseItem => caseItem.userName !== currentUserName)
      .reduce((acc, caseItem) => {
        const userName = caseItem.userName || 'Unknown User';
        
        if (!acc[userName]) {
          acc[userName] = [];
        }
        
        // Add progress steps information to each case
        const caseWithSteps = {
          ...caseItem,
          ...getStepMapping(caseItem)
        };
        
        acc[userName].push(caseWithSteps);
        return acc;
      }, {});
    
    setOtherUserCases(otherUsersGrouped);
  };

  // Initial load - fetch related users and then their cases
  useEffect(() => {
    if (user?.id) {
      const loadData = async () => {
        const userIds = await fetchRelatedUsers();
        await fetchAllUsersCases(userIds);
      };
      loadData();
    }
  }, [user?.id]);

  // Add this new function to handle navigation
  const handleCaseClick = (caseId) => {
    navigate(`/individuals/case/${caseId}`);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-5 flex">
      {/* Left Section - Progress Cards */}
      <div className="w-1/2 pr-6">
        <div className="sticky top-5">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Case Progress</h1>
            <div className="text-sm text-gray-500">
              {currentUserCases.length + Object.values(otherUserCases).flat().length} Active Cases
            </div>
          </div>
          
          <div className="flex flex-col space-y-6">
            {/* No cases message */}
            {currentUserCases.length === 0 && Object.keys(otherUserCases).length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-800 font-medium mb-2">No Active Cases</h3>
                <p className="text-gray-500 text-sm">Start by creating a new case to track its progress.</p>
              </div>
            )}
            
            {/* Current User's Cases Section */}
            {currentUserCases.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {(user?.name || user?.email || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-lg font-medium text-gray-800">
                    {user?.name || user?.email || 'My Profile'}
                  </h2>
                </div>
                
                <div className="space-y-4">
                  {currentUserCases.map((caseItem) => (
                    <CaseProgressCard
                      key={caseItem._id}
                      caseItem={caseItem}
                      onClick={() => handleCaseClick(caseItem._id)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Separator */}
            {currentUserCases.length > 0 && Object.keys(otherUserCases).length > 0 && (
              <div className="border-t border-gray-200" />
            )}
            
            {/* Other Users' Cases Section */}
            {Object.keys(otherUserCases).length > 0 && (
              <>
                {Object.entries(otherUserCases).map(([userName, userCases]) => (
                  <div key={userName} className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {userName[0].toUpperCase()}
                        </span>
                      </div>
                      <h2 className="text-lg font-medium text-gray-800">{userName}</h2>
                    </div>
                    
                    <div className="space-y-4">
                      {userCases.map((caseItem) => (
                        <CaseProgressCard
                          key={caseItem._id}
                          caseItem={caseItem}
                          onClick={() => handleCaseClick(caseItem._id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Section - DIANA Notifications */}
      <div className="w-1/2 pl-6 border-l">
        <div className="sticky top-5">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-semibold">D</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">DIANA</h1>
              <div className="text-sm text-gray-600">Data & Document Collection Agent</div>
            </div>
          </div>
          
          {/* DIANA Notifications */}
          <div className="space-y-4">
            {[...currentUserCases, ...Object.values(otherUserCases).flat()]
              .flatMap(caseItem => 
                caseItem.documentTypes
                  ?.filter(doc => doc.status === 'pending')
                  .map(doc => ({
                    ...doc,
                    caseId: caseItem._id,
                    caseName: caseItem.categoryName,
                    userName: caseItem.userName
                  })) || []
              )
              .map(doc => (
                <div 
                  key={doc._id} 
                  className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-xl p-4 hover:shadow-lg cursor-pointer transition-all duration-300 group border border-indigo-100/50"
                  onClick={() => handleCaseClick(doc.caseId)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md">
                      <span className="text-white text-xs font-medium">D</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="text-sm font-medium text-gray-800">
                          Document Required: {doc.name}
                        </div>
                        {doc.required && (
                          <span className="text-xs bg-gradient-to-r from-indigo-100/50 to-purple-100/50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200/50 whitespace-nowrap">
                            Required Document
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                        To proceed with your {doc.caseName}, please upload your {doc.name.toLowerCase()}. This document is {doc.required ? 'required' : 'recommended'} for processing your application.
                      </p>
                      <div className="flex items-center text-xs space-x-3 text-gray-500">
                        <div className="flex items-center space-x-1">
                          <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-indigo-600 font-medium">{doc.caseName}</span>
                        </div>
                        <span className="text-gray-300">|</span>
                        <div className="flex items-center space-x-1">
                          <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{doc.userName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            
            {![...currentUserCases, ...Object.values(otherUserCases).flat()]
              .some(caseItem => caseItem.documentTypes?.some(doc => doc.status === 'pending')) && (
              <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white text-xl font-semibold">D</span>
                </div>
                <div className="text-gray-600">All documents are up to date!</div>
                <div className="text-sm text-gray-500 mt-1">I'll notify you when new documents are needed.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FNDashboard;
