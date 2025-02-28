import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Check } from 'lucide-react';
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

const FNDashboard = ({ setCurrentBreadcrumb }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
        <h1 className="text-xl font-semibold mb-6 text-gray-800">Case Progress</h1>
        
        <div className="flex flex-col space-y-4">
          {/* No cases message */}
          {currentUserCases.length === 0 && Object.keys(otherUserCases).length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-500">
              No cases found. Start by creating a new case.
            </div>
          )}
          
          {/* Current User's Cases Section */}
          {currentUserCases.length > 0 && (
            <div className="flex flex-col space-y-3">
              <div className="text-base font-medium text-gray-800 mb-1">
                {user?.name || user?.email || 'My Profile'}
              </div>
              
              {currentUserCases.map((caseItem) => (
                <div 
                  key={caseItem._id} 
                  className="bg-white rounded-lg shadow-sm p-5 hover:shadow cursor-pointer border border-gray-100"
                  onClick={() => handleCaseClick(caseItem._id)}
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="font-semibold text-gray-800">{caseItem.categoryName}</div>
                    <div className="text-sm px-3 py-1 rounded-full bg-green-50 text-green-600 border border-green-100">
                      {caseItem.categoryStatus || 'In Progress'}
                    </div>
                  </div>
                  
                  {/* Progress Bar Section */}
                  <div>
                    {/* Simplified Progress Bar */}
                    <div className="flex justify-between mb-6 relative">
                      {caseItem.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex flex-col items-center relative w-full">
                          <div className="relative">
                            {/* Show checkmark for completed steps */}
                            {stepIndex < caseItem.currentStep && (
                              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center z-10">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                            
                            {/* Current step */}
                            {stepIndex === caseItem.currentStep && (
                              <div className="w-7 h-7 rounded-full border-2 border-blue-500 flex items-center justify-center z-10 bg-white">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              </div>
                            )}
                            
                            {/* Future steps */}
                            {stepIndex > caseItem.currentStep && (
                              <div className="w-7 h-7 rounded-full border border-gray-200 bg-white z-10">
                              </div>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-600 text-center whitespace-nowrap mt-2" style={{ maxWidth: '90px' }}>
                            {step}
                          </div>
                          
                          {/* Cleaner connecting lines */}
                          {stepIndex < caseItem.steps.length - 1 && (
                            <div className={`absolute top-3.5 left-[calc(50%+15px)] w-[calc(100%-30px)] h-0.5
                                            ${stepIndex < caseItem.currentStep ? 'bg-blue-500' : 'bg-gray-200'}`}>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between mt-4 text-xs gap-3">
                      <div className="bg-gray-50 px-3 py-2 rounded border border-gray-100 flex-1">
                        <span className="text-gray-500">Previous: </span>
                        <span className="font-medium text-gray-800">{caseItem.previousStep}</span>
                      </div>
                      <div className="bg-blue-50 px-3 py-2 rounded border border-blue-100 text-blue-700 flex-1">
                        <span className="text-blue-500">Next: </span>
                        <span className="font-medium">{caseItem.nextStep}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Simple separator */}
          {currentUserCases.length > 0 && Object.keys(otherUserCases).length > 0 && (
            <div className="my-4 border-t border-gray-200"></div>
          )}
          
          {/* Other Users' Cases Section */}
          {Object.keys(otherUserCases).length > 0 && (
            <>
              {Object.entries(otherUserCases).map(([userName, userCases]) => (
                <div key={userName} className="flex flex-col space-y-3">
                  <div className="text-base font-medium text-gray-800 mb-1">
                    {userName}
                  </div>
                  
                  {userCases.map((caseItem) => (
                    <div 
                      key={caseItem._id} 
                      className="bg-white rounded-lg shadow-sm p-5 hover:shadow cursor-pointer border border-gray-100"
                      onClick={() => handleCaseClick(caseItem._id)}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div className="font-semibold text-gray-800">{caseItem.categoryName}</div>
                        <div className="text-sm px-3 py-1 rounded-full bg-green-50 text-green-600 border border-green-100">
                          {caseItem.categoryStatus || 'In Progress'}
                        </div>
                      </div>
                      
                      {/* Progress Bar Section */}
                      <div>
                        {/* Simplified Progress Bar */}
                        <div className="flex justify-between mb-6 relative">
                          {caseItem.steps.map((step, stepIndex) => (
                            <div key={stepIndex} className="flex flex-col items-center relative w-full">
                              <div className="relative">
                                {/* Show checkmark for completed steps */}
                                {stepIndex < caseItem.currentStep && (
                                  <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center z-10">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                
                                {/* Current step */}
                                {stepIndex === caseItem.currentStep && (
                                  <div className="w-7 h-7 rounded-full border-2 border-blue-500 flex items-center justify-center z-10 bg-white">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                  </div>
                                )}
                                
                                {/* Future steps */}
                                {stepIndex > caseItem.currentStep && (
                                  <div className="w-7 h-7 rounded-full border border-gray-200 bg-white z-10">
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-xs text-gray-600 text-center whitespace-nowrap mt-2" style={{ maxWidth: '90px' }}>
                                {step}
                              </div>
                              
                              {/* Cleaner connecting lines */}
                              {stepIndex < caseItem.steps.length - 1 && (
                                <div className={`absolute top-3.5 left-[calc(50%+15px)] w-[calc(100%-30px)] h-0.5
                                                ${stepIndex < caseItem.currentStep ? 'bg-blue-500' : 'bg-gray-200'}`}>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between mt-4 text-xs gap-3">
                          <div className="bg-gray-50 px-3 py-2 rounded border border-gray-100 flex-1">
                            <span className="text-gray-500">Previous: </span>
                            <span className="font-medium text-gray-800">{caseItem.previousStep}</span>
                          </div>
                          <div className="bg-blue-50 px-3 py-2 rounded border border-blue-100 text-blue-700 flex-1">
                            <span className="text-blue-500">Next: </span>
                            <span className="font-medium">{caseItem.nextStep}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
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

// Add PropTypes validation
FNDashboard.propTypes = {
  setCurrentBreadcrumb: PropTypes.func.isRequired
};

export default FNDashboard;
