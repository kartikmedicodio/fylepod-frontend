import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Check } from 'lucide-react';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allCases, setAllCases] = useState([]);
  const [currentUserCases, setCurrentUserCases] = useState([]);
  const [otherUserCases, setOtherUserCases] = useState({});

  useEffect(() => {
    setCurrentBreadcrumb([
      { label: 'Home', link: '/' },
      { label: 'FN Dashboard', link: '/fndashboard' }
    ]);
  }, [setCurrentBreadcrumb]);

  // Modified getStepMapping function to properly calculate previous and next steps
  const getStepMapping = (caseItem) => {
    // Default steps for all case types
    const defaultSteps = ['Case Started', 'Docs Collection', 'In Review', 'Preparation', 'Filing'];
    
    // Calculate current step based on documents and status
    // Start with 1 (Document Collection) since Case Started (0) is always completed
    let currentStep = 1;
    
    if (caseItem.documentTypes) {
      const totalDocs = caseItem.documentTypes.length;
      const uploadedDocs = caseItem.documentTypes.filter(doc => 
        doc.status === 'uploaded' || doc.status === 'approved'
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
      if (caseItem.categoryStatus === 'approved') {
        currentStep = 3; // Preparation
      }
    }
    
    // Correctly calculate previous and next steps based on current position
    const previousStep = currentStep > 0 ? defaultSteps[currentStep - 1] : 'Case initiation'; 
    const nextStep = currentStep < defaultSteps.length - 1 ? defaultSteps[currentStep + 1] : 'Completion';
    
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
    setAllCases(cases);
    
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

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-5 w-1/2">
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
          <div className="flex flex-col space-y-2">
            {/* Add user's name above their cases */}
            <div className="text-base font-medium text-gray-800">{user?.name || user?.email || 'My Profile'}</div>
            
            {currentUserCases.map((caseItem) => (
              <div key={caseItem._id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-center mb-6">
                  <div className="font-semibold text-gray-800">{caseItem.categoryName}</div>
                  <div className="text-sm text-green-500 flex items-center border border-green-200 px-2 py-1 rounded-full bg-green-50">
                    • {caseItem.categoryStatus || 'In Progress'}
                  </div>
                </div>
                
                <div className="flex justify-between mb-5 relative">
                  {caseItem.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex flex-col items-center relative w-full">
                      <div className="relative">
                        {/* Show checkmark for completed steps */}
                        {stepIndex < caseItem.currentStep && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-10">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        {/* Current step */}
                        {stepIndex === caseItem.currentStep && (
                          <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center z-10">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                        
                        {/* Future steps */}
                        {stepIndex > caseItem.currentStep && (
                          <div className="w-6 h-6 rounded-full border border-gray-300 z-10">
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500 text-center whitespace-nowrap mt-2">{step}</div>
                      
                      {/* Shorter connecting lines */}
                      {stepIndex < caseItem.steps.length - 1 && (
                        <div className={`absolute top-3 left-[calc(50%+12px)] w-[calc(100%-24px)] h-0.5 
                          ${stepIndex < caseItem.currentStep ? 'bg-blue-500' : 'bg-gray-200'}`}>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between mt-4 text-xs">
                  <div className="bg-gray-100 px-3 py-2 rounded-full">
                    <span className="text-gray-600">Previous step - </span>
                    <span className="font-medium text-gray-900">{caseItem.previousStep}</span>
                  </div>
                  <div className="bg-gray-100 px-3 py-2 rounded-full">
                    <span className="text-gray-600">Next step - </span>
                    <span className="font-medium text-gray-900">{caseItem.nextStep}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Separator - make more compact */}
        {currentUserCases.length > 0 && Object.keys(otherUserCases).length > 0 && (
          <div className="mt-3 border-t pt-3">
            {/* No text content, just spacing and border */}
          </div>
        )}
        
        {/* Other Users' Cases Section */}
        {Object.keys(otherUserCases).length > 0 && (
          <>
            {Object.entries(otherUserCases).map(([userName, userCases]) => (
              <div key={userName} className="flex flex-col space-y-2">
                <div className="text-base font-medium text-gray-800">{userName}</div>
                
                {userCases.map((caseItem) => (
                  <div key={caseItem._id} className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex justify-between items-center mb-6">
                      <div className="font-semibold text-gray-800">{caseItem.categoryName}</div>
                      <div className="text-sm text-green-500 flex items-center border border-green-200 px-2 py-1 rounded-full bg-green-50">
                        • {caseItem.categoryStatus || 'In Progress'}
                      </div>
                    </div>
                    
                    <div className="flex justify-between mb-5 relative">
                      {caseItem.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex flex-col items-center relative w-full">
                          <div className="relative">
                            {/* Show checkmark for completed steps */}
                            {stepIndex < caseItem.currentStep && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-10">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                            
                            {/* Current step */}
                            {stepIndex === caseItem.currentStep && (
                              <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center z-10">
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                              </div>
                            )}
                            
                            {/* Future steps */}
                            {stepIndex > caseItem.currentStep && (
                              <div className="w-6 h-6 rounded-full border border-gray-300 z-10">
                              </div>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-500 text-center whitespace-nowrap mt-2">{step}</div>
                          
                          {/* Shorter connecting lines */}
                          {stepIndex < caseItem.steps.length - 1 && (
                            <div className={`absolute top-3 left-[calc(50%+12px)] w-[calc(100%-24px)] h-0.5 
                              ${stepIndex < caseItem.currentStep ? 'bg-blue-500' : 'bg-gray-200'}`}>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between mt-4 text-xs">
                      <div className="bg-gray-100 px-3 py-2 rounded-full">
                        <span className="text-gray-600">Previous step - </span>
                        <span className="font-medium text-gray-900">{caseItem.previousStep}</span>
                      </div>
                      <div className="bg-gray-100 px-3 py-2 rounded-full">
                        <span className="text-gray-600">Next step - </span>
                        <span className="font-medium text-gray-900">{caseItem.nextStep}</span>
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
  );
};

export default FNDashboard;
