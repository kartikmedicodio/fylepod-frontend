import { useEffect, useState, useRef } from 'react';
import { ChevronDown, X, Loader2, FileText, Users, UserCog, AlertCircle } from 'lucide-react';
import { usePage } from '../contexts/PageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getStoredUser } from '../utils/auth';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import PropTypes from 'prop-types';
import WorkflowSteps from '../components/workflow/WorkflowSteps';

const FionaIcon = () => (
  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
    F
  </div>
);

const DianaIcon = () => (
  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
    D
  </div>
);

const StepIndicator = ({ isActive, isCompleted, icon: Icon, label }) => (
  <div className="flex flex-col items-center gap-2">
    <div 
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
        ${isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}
    >
      <Icon className="w-5 h-5" />
    </div>
    <span className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
      {label}
    </span>
  </div>
);

StepIndicator.propTypes = {
  isActive: PropTypes.bool.isRequired,
  isCompleted: PropTypes.bool.isRequired,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired
};

const ProgressLine = ({ isCompleted }) => (
  <div className="flex-1 h-[2px] bg-gray-200">
    <div 
      className={`h-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`}
      style={{ width: isCompleted ? '100%' : '0%' }}
    />
  </div>
);

ProgressLine.propTypes = {
  isCompleted: PropTypes.bool.isRequired
};

const NewCase = () => {
  const { setPageTitle } = usePage();
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const [categories, setCategories] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isAttorneyDropdownOpen, setIsAttorneyDropdownOpen] = useState(false);
  const [selectedAttorney, setSelectedAttorney] = useState(null);
  const [attorneys, setAttorneys] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelectedDocuments, setTempSelectedDocuments] = useState([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [attorneySearch, setAttorneySearch] = useState('');
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [loggedInUserDetails, setLoggedInUserDetails] = useState(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState(null);
  const [workflowSummary, setWorkflowSummary] = useState(null);
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);

  const dropdownRefs = {
    template: useRef(null),
    customer: useRef(null),
    attorney: useRef(null)
  };

  const timeoutRefs = {
    template: useRef(null),
    customer: useRef(null),
    attorney: useRef(null)
  };

  const searchInputRefs = {
    template: useRef(null),
    customer: useRef(null),
    attorney: useRef(null)
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { 
        replace: true,
        state: { from: '/cases/new' }
      });
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    setPageTitle('New Case');
    setCurrentBreadcrumb([
      { name: 'Home', path: '/dashboard' },
      { name: 'New Case', path: '/cases/new' }
    ]);
    return () => {
      setPageTitle('');
      setCurrentBreadcrumb([]);
    };
  }, [setPageTitle, setCurrentBreadcrumb]);

  useEffect(() => {
    const getUserFromLocalStorage = () => {
      try {
        // Get user from localStorage
        const storedUser = getStoredUser();
        
        if (storedUser) {
          setLoggedInUserDetails(storedUser);
        } else {
          // Fallback to API call if localStorage data is not available
          fetchLoggedInUserDetails();
        }
      } catch (error) {
        setError(error.message);
        // Fallback to API call on error
        fetchLoggedInUserDetails();
      }
    };
    
    const fetchLoggedInUserDetails = async () => {
      try {
        const response = await api.get('/auth/me');
        if (!response.data || !response.data.data || !response.data.data.user) {
          throw new Error('No user data received from /auth/me');
        }
        const userDetails = response.data.data.user;
        setLoggedInUserDetails(userDetails);
      } catch (error) {
        setError(error.message);
        if (error.response?.status === 401) {
          navigate('/login', { 
            replace: true,
            state: { from: '/cases/new' }
          });
        }
      }
    };

    if (isAuthenticated) {
      getUserFromLocalStorage();
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setError(null);
        const response = await api.get('/categories');

        if (!response.data || !response.data.data || !response.data.data.categories) {
          throw new Error('No data received from categories endpoint');
        }

        const categoriesData = response.data.data.categories;
        
        if (!Array.isArray(categoriesData)) {
          throw new Error('Invalid categories data format');
        }

        setCategories(categoriesData);
      } catch (error) {
        setError(error.message);
        
        if (error.response?.status === 401) {
          navigate('/login', { 
            replace: true,
            state: { from: '/cases/new' }
          });
        }
      }
    };

    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        // Set loading state
        setIsLoadingUsers(true);
        setError(null);
        
        // Check for cached users in sessionStorage
        const cachedUsers = sessionStorage.getItem('cachedUsers');
        const cachedTimestamp = sessionStorage.getItem('cachedUsersTimestamp');
        const now = Date.now();
        
        // Use cached data if it's less than 5 minutes old
        if (cachedUsers && cachedTimestamp && (now - parseInt(cachedTimestamp)) < 300000) {
          const parsedUsers = JSON.parse(cachedUsers);
          processUsers(parsedUsers);
          setIsLoadingUsers(false);
          return;
        }

        // Get user data from state or localStorage
        const userDetails = loggedInUserDetails || getStoredUser();
        
        if (!userDetails?.lawfirm_id?._id) {
          console.warn('No lawfirm ID found for current user');
          setIsLoadingUsers(false);
          return;
        }
        
        // Make a single API call
        const response = await api.get('/auth/users');

        if (!response.data || !response.data.data || !response.data.data.users) {
          throw new Error('No users data received');
        }

        const allUsers = response.data.data.users;
        
        // Cache the results
        sessionStorage.setItem('cachedUsers', JSON.stringify(allUsers));
        sessionStorage.setItem('cachedUsersTimestamp', now.toString());
        
        // Process the users
        processUsers(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error.message);
        toast.error('Failed to load users. Please try again.');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    const processUsers = (allUsers) => {
      // Get user data from state or localStorage
      const userDetails = loggedInUserDetails || getStoredUser();
      
      if (!userDetails?.lawfirm_id?._id) {
        console.warn('No lawfirm ID found for current user');
        return;
      }
      
      // Filter for individuals and employees in one pass
      const filteredUsers = allUsers.filter(user => {
        const isCorrectRole = user.role === 'individual' || user.role === 'employee';
        const isSameLawfirm = user.lawfirm_id?._id === userDetails.lawfirm_id?._id;
        return isCorrectRole && isSameLawfirm;
      });
      
      // Filter for attorneys and managers in one pass
      const filteredAttorneys = allUsers.filter(user => {
        const isCorrectRole = user.role === 'attorney' || user.role === 'manager';
        const isSameLawfirm = user.lawfirm_id?._id === userDetails.lawfirm_id?._id;
        return isCorrectRole && isSameLawfirm;
      });
      
      setUsers(filteredUsers);
      setAttorneys(filteredAttorneys);
    };

    // Only fetch if we're authenticated and have lawfirm ID
    if (isAuthenticated && (loggedInUserDetails?.lawfirm_id?._id || getStoredUser()?.lawfirm_id?._id)) {
      fetchAllUsers();
    }
  }, [isAuthenticated, loggedInUserDetails]);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs).forEach(ref => {
        if (ref.current) {
          clearTimeout(ref.current);
        }
      });
    };
  }, []);

  // Handle click outside for all dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdowns = {
        template: { ref: dropdownRefs.template, setter: setIsTemplateDropdownOpen },
        customer: { ref: dropdownRefs.customer, setter: setIsCustomerDropdownOpen },
        attorney: { ref: dropdownRefs.attorney, setter: setIsAttorneyDropdownOpen }
      };

      Object.values(dropdowns).forEach(({ ref, setter }) => {
        if (ref.current && !ref.current.contains(event.target)) {
          setter(false);
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startDropdownTimeout = (type, setter) => {
    if (timeoutRefs[type].current) {
      clearTimeout(timeoutRefs[type].current);
    }
    timeoutRefs[type].current = setTimeout(() => {
      setter(false);
    }, 3000);
  };

  const clearDropdownTimeout = (type) => {
    if (timeoutRefs[type].current) {
      clearTimeout(timeoutRefs[type].current);
    }
  };

  const handleDropdownOpen = (type, isOpen, setter) => {
    // Clear any existing timeouts for all dropdowns
    Object.keys(timeoutRefs).forEach(key => {
      clearDropdownTimeout(key);
    });

    // Close other dropdowns
    if (isOpen) {
      if (type !== 'template') setIsTemplateDropdownOpen(false);
      if (type !== 'customer') setIsCustomerDropdownOpen(false);
      if (type !== 'attorney') setIsAttorneyDropdownOpen(false);
    }

    setter(!isOpen);
    if (!isOpen) {
      startDropdownTimeout(type, setter);
      // Focus the search input after a short delay to ensure the dropdown is rendered
      setTimeout(() => {
        if (searchInputRefs[type]?.current) {
          searchInputRefs[type].current.focus();
        }
      }, 50);
    }
  };

  const handleEditTemplate = () => {
    if (selectedTemplate) {
      // Initialize with current selected documents instead of template documents
      setTempSelectedDocuments([...selectedDocuments]); // Create a new array
      setIsEditModalOpen(true);
    }
  };

  const getUniqueDocuments = () => {
    const uniqueDocs = new Map();
    categories.forEach(category => {
      category.documentTypes.forEach(doc => {
        if (!uniqueDocs.has(doc.name)) {
          uniqueDocs.set(doc.name, doc);
        }
      });
    });
    return Array.from(uniqueDocs.values());
  };

  const getFilteredDocuments = () => {
    const uniqueDocs = getUniqueDocuments();
    if (!searchQuery.trim()) {
      return uniqueDocs;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return uniqueDocs.filter(doc => 
      doc.name.toLowerCase().includes(query)
    );
  };

  const handleAttorneySelect = (attorney) => {
    setSelectedAttorney(attorney);
    handleDropdownOpen('attorney', isAttorneyDropdownOpen, setIsAttorneyDropdownOpen);
  };

  const handleDocumentToggle = (docName) => {
    setTempSelectedDocuments(prev => {
      const isSelected = prev.some(doc => doc.name === docName);
      if (isSelected) {
        // Remove document if it exists
        return prev.filter(doc => doc.name !== docName);
      } else {
        // Add document with original structure
        const docToAdd = getUniqueDocuments().find(doc => doc.name === docName);
        if (docToAdd) {
          return [...prev, docToAdd];
        }
        return prev;
      }
    });
  };

  const handleCreateCase = async () => {
    try {
      if (!selectedTemplate || !selectedCustomer || !selectedAttorney) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-medium">Missing Information</span>
            <span className="text-sm text-gray-500">
              Please select all required fields
            </span>
          </div>,
          {
            duration: 3000,
            position: 'top-right',
            style: {
              background: '#fff',
              color: '#1f2937',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
          }
        );
        return;
      }

      if (!selectedDocuments || selectedDocuments.length === 0) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-medium">No Documents Selected</span>
            <span className="text-sm text-gray-500">
              Please select at least one document
            </span>
          </div>,
          {
            duration: 3000,
            position: 'top-right',
            style: {
              background: '#fff',
              color: '#1f2937',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
          }
        );
        return;
      }

      setIsCreatingCase(true);

      // Show initial toast with Fiona
      const toastId = toast.loading(
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 flex items-center justify-center text-white">
            <FionaIcon />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-medium">Creating your case</span>
            <span className="text-sm text-gray-500">This will only take a moment</span>
          </div>
        </div>,
        {
          position: 'top-center',
          style: {
            background: '#fff',
            color: '#1f2937',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            minWidth: '360px',
          },
        }
      );

      const requestBody = {
        userId: selectedCustomer._id,
        categoryId: selectedTemplate._id,
        createdBy: user.id,
        lawfirmId: selectedAttorney.lawfirm_id._id,
        userName: selectedCustomer.name,
        categoryName: selectedTemplate.name,
        caseManagerId: selectedAttorney._id,
        caseManagerName: selectedAttorney.name,
        documentTypes: selectedDocuments.map(doc => ({
          documentTypeId: doc._id,
          name: doc.name,
          required: doc.required || false,
          status: 'pending'
        }))
      };

      const response = await api.post('/management', requestBody);
      
      if (response.data.status === 'success') {
        const caseId = response.data.data.management._id;
        
        // First success toast with Fiona
        toast.success(
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 flex items-center justify-center text-white flex-shrink-0">
              <FionaIcon />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">Case created successfully</span>
              <span className="text-sm text-gray-500">
                I have set up everything for you. Diana will now take over with the document collection process.
              </span>
            </div>
          </div>,
          {
            id: toastId,
            duration: 2000,
            position: 'top-center',
            style: {
              background: '#fff',
              color: '#1f2937',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              minWidth: '400px',
            },
          }
        );

        // Send management creation email
        try {
          await api.post('/mail/send', {
            subject: `🤖 Fiona: New Case Created - ${selectedTemplate.name}`,
            recipientEmail: selectedCustomer.email,
            recipientName: selectedCustomer.name,
            managementId: caseId,
            categoryName: selectedTemplate.name,
            documentTypes: selectedDocuments,
            caseManagerName: selectedAttorney.name,
            emailType: 'management_creation',
            userId: selectedCustomer._id
          });
        } catch (emailError) {
          console.error('Failed to send case creation email:', emailError);
          // Don't block the case creation process if email fails
        }

        // Second toast with Diana after a short delay
        setTimeout(() => {
          toast.success(
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center text-white flex-shrink-0">
                <DianaIcon />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-medium">Hello, I&apos;m Diana</span>
                <span className="text-sm text-gray-500">
                  I will help you gather and verify all the necessary documents.
                </span>
              </div>
            </div>,
            {
              duration: 4000,
              position: 'top-center',
              style: {
                background: '#fff',
                color: '#1f2937',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minWidth: '400px',
              },
            }
          );
        }, 2500);

        // Navigate to case details after Diana's introduction
        setTimeout(() => {
          navigate(`/cases/${caseId}`);
        }, 4000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create case');
      setIsCreatingCase(false);

      // Show error toast with Fiona
      toast.error(
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-medium">Failed to create case</span>
            <span className="text-sm text-gray-500">
              {error.response?.data?.message || 'Please try again'}
            </span>
          </div>
        </div>,
        {
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1f2937',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            minWidth: '400px',
          },
        }
      );
    }
  };

  const handleModalClose = () => {
    setTempSelectedDocuments([]); // Clear temporary selection
    setSearchQuery(''); // Clear search
    setIsEditModalOpen(false);
  };

  const handleDoneClick = () => {
    setSelectedDocuments([...tempSelectedDocuments]); // Create a new array to ensure state update
    handleModalClose(); // Clean up and close modal
  };

  const getFilteredCategories = () => {
    if (!templateSearch.trim()) return categories;
    const search = templateSearch.toLowerCase();
    return categories.filter(category => 
      category.name.toLowerCase().includes(search)
    );
  };

  const getFilteredUsers = () => {
    if (isLoadingUsers) {
      return [];
    }
    
    if (!customerSearch.trim()) {
      return users;
    }
    
    const searchTerm = customerSearch.toLowerCase().trim();
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm) || 
      user.email.toLowerCase().includes(searchTerm)
    );
  };

  const getFilteredAttorneys = () => {
    if (isLoadingUsers) {
      return [];
    }
    
    if (!attorneySearch.trim()) { 
      return attorneys;
    }
    
    const searchTerm = attorneySearch.toLowerCase().trim();
    return attorneys.filter(attorney => 
      attorney.name.toLowerCase().includes(searchTerm) || 
      attorney.email.toLowerCase().includes(searchTerm)
    );
  };

  const fetchWorkflowSteps = async (categoryId) => {
    try {
      setIsLoadingWorkflow(true);
      const response = await api.get(`/steps/category/${categoryId}`);
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid workflow data received');
      }

      const { steps, summary } = response.data.data;
      
      // Ensure each step has a unique identifier
      const stepsWithIds = steps.map((step, index) => ({
        ...step,
        _id: step._id || `step-${Date.now()}-${index}` // Add unique _id if not present
      }));
      
      setWorkflowSteps(stepsWithIds);
      setWorkflowSummary(summary);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      toast.error('Failed to load workflow steps');
    } finally {
      setIsLoadingWorkflow(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setSelectedDocuments(template.documentTypes);
    handleDropdownOpen('template', isTemplateDropdownOpen, setIsTemplateDropdownOpen);
  };

  const handleWorkflowStepsReorder = (newSteps) => {
    setWorkflowSteps(newSteps);
    // Optionally save the new order to the backend
    // api.put(`/steps/category/${selectedTemplate._id}/reorder`, { steps: newSteps });
  };

  const handleSaveWorkflowChanges = async () => {
    // Create loading toast ID first
    const loadingToastId = toast.loading('Creating case and saving workflow...');

    try {
      if (!selectedTemplate?._id || !selectedCustomer || !selectedAttorney) {
        toast.error('Please fill in all required fields', { id: loadingToastId });
        return;
      }

      // Format steps for the API
      const formattedSteps = workflowSteps.map((step, index) => ({
        name: step.name,
        key: step.key,
        order: index + 1,
        isRequired: step.isRequired || false,
        estimatedHours: step.estimatedHours || 0,
        description: step.agentDescription || '',
        status: 'pending',
        isDefault: true,
        isVisible: true,
        agentName: step.agentName || 'none'
      }));

      // Create case first
      const caseResponse = await api.post('/management', {
        userId: selectedCustomer._id,
        categoryId: selectedTemplate._id,
        createdBy: user.id,
        lawfirmId: selectedAttorney.lawfirm_id._id,
        userName: selectedCustomer.name,
        categoryName: selectedTemplate.name,
        caseManagerId: selectedAttorney._id,
        caseManagerName: selectedAttorney.name,
        documentTypes: selectedDocuments.map(doc => ({
          documentTypeId: doc._id,
          name: doc.name,
          required: doc.required || false,
          status: 'pending'
        }))
      });

      if (caseResponse.data.status === 'success') {
        const caseId = caseResponse.data.data.management._id;

        // Save workflow steps with the new case ID
        await api.post('/case-steps', {
          caseId: caseId,
          steps: formattedSteps
        });

        // Show success toast
        toast.success('Case created and workflow saved successfully', {
          id: loadingToastId
        });

        // Navigate to case details
        setTimeout(() => {
          navigate(`/cases/${caseId}`);
        }, 1500);
      }

    } catch (error) {
      console.error('Error creating case and saving workflow:', error);
      toast.error(
        error.response?.data?.message || 'Failed to create case and save workflow',
        { id: loadingToastId }
      );
    }
  };

  const handleCheckWorkflow = async () => {
    if (!selectedTemplate?._id) {
      toast.error('Please select a template first');
      return;
    }
    
    try {
      setIsLoadingWorkflow(true);
      await fetchWorkflowSteps(selectedTemplate._id);
      setIsWorkflowModalOpen(true);
    } catch (error) {
      console.error('Error loading workflow:', error);
      toast.error('Failed to load workflow steps');
    } finally {
      setIsLoadingWorkflow(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline font-semibold">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[800px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-4">
            Create New Case
          </h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-blue-600 text-lg font-medium">
              Fill in the required information to create a new case
            </p>
            <div className="w-20 h-1 rounded-full bg-gradient-to-r from-blue-500/50 to-blue-600/50"></div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {/* Step 1: Select Template */}
            <StepIndicator
              isActive={!selectedTemplate}
              isCompleted={!!selectedTemplate}
              icon={FileText}
              label="Select Template"
            />

            {/* Connector */}
            <ProgressLine isCompleted={!!selectedTemplate} />

            {/* Step 2: Select Customer */}
            <StepIndicator
              isActive={!!selectedTemplate && !selectedCustomer}
              isCompleted={!!selectedCustomer}
              icon={Users}
              label="Select Customer"
            />

            {/* Connector */}
            <ProgressLine isCompleted={!!selectedCustomer} />

            {/* Step 3: Select Case Manager */}
            <StepIndicator
              isActive={!!selectedCustomer && !selectedAttorney}
              isCompleted={!!selectedAttorney}
              icon={UserCog}
              label="Select Manager"
            />
          </div>
        </div>

        {/* Form Section - Now full width */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-8 space-y-8">
            {/* Template Selection */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4 text-blue-500" />
                Select Template
              </label>
              <div className="relative" ref={dropdownRefs.template}>
                <button
                  type="button"
                  onClick={() => handleDropdownOpen('template', isTemplateDropdownOpen, setIsTemplateDropdownOpen)}
                  className={`w-full h-12 bg-white border ${
                    isTemplateDropdownOpen ? 'border-blue-500 ring-2 ring-blue-50' : 'border-gray-200'
                  } rounded-lg px-4 text-sm text-left flex items-center justify-between hover:border-gray-300 focus:outline-none transition-all duration-200`}
                >
                  <span className={`truncate ${selectedTemplate ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {selectedTemplate?.name || 'Search template name...'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    isTemplateDropdownOpen ? 'transform rotate-180' : ''
                  }`} />
                </button>

                {isTemplateDropdownOpen && (
                  <div 
                    className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden"
                    onMouseEnter={() => clearDropdownTimeout('template')}
                    onMouseLeave={() => startDropdownTimeout('template', setIsTemplateDropdownOpen)}
                  >
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <input
                          ref={searchInputRefs.template}
                          type="text"
                          value={templateSearch}
                          onChange={(e) => {
                            setTemplateSearch(e.target.value);
                            clearDropdownTimeout('template');
                          }}
                          onFocus={() => clearDropdownTimeout('template')}
                          placeholder="Search templates..."
                          className="w-full px-3 py-2 pl-8 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all duration-200"
                        />
                        <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="max-h-[240px] overflow-auto">
                      {categories.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Loader2 className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
                          <p className="text-sm text-gray-500">Loading templates...</p>
                        </div>
                      ) : getFilteredCategories().length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No templates found</p>
                        </div>
                      ) : (
                        getFilteredCategories().map((category) => (
                          <button
                            key={category._id}
                            onClick={() => handleTemplateSelect(category)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-blue-500" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{category.name}</div>
                                {category.description && (
                                  <div className="text-xs text-gray-500 mt-0.5">{category.description}</div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Selection */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Users className="w-4 h-4 text-blue-500" />
                Select Customer
              </label>
              <div className="relative" ref={dropdownRefs.customer}>
                <button
                  type="button"
                  onClick={() => handleDropdownOpen('customer', isCustomerDropdownOpen, setIsCustomerDropdownOpen)}
                  className={`w-full h-12 bg-white border ${
                    isCustomerDropdownOpen ? 'border-blue-500 ring-2 ring-blue-50' : 'border-gray-200'
                  } rounded-lg px-4 text-sm text-left flex items-center justify-between hover:border-gray-300 focus:outline-none transition-all duration-200`}
                >
                  <span className={`truncate ${selectedCustomer ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {selectedCustomer ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-medium">
                            {selectedCustomer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span>{selectedCustomer.name}</span>
                      </div>
                    ) : (
                      'Search customer name...'
                    )}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    isCustomerDropdownOpen ? 'transform rotate-180' : ''
                  }`} />
                </button>

                {isCustomerDropdownOpen && (
                  <div 
                    className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden"
                    onMouseEnter={() => clearDropdownTimeout('customer')}
                    onMouseLeave={() => startDropdownTimeout('customer', setIsCustomerDropdownOpen)}
                  >
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <input
                          ref={searchInputRefs.customer}
                          type="text"
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            clearDropdownTimeout('customer');
                          }}
                          onFocus={() => clearDropdownTimeout('customer')}
                          placeholder="Search customers..."
                          className="w-full px-3 py-2 pl-8 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all duration-200"
                        />
                        <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="max-h-[240px] overflow-auto">
                      {isLoadingUsers ? (
                        <div className="px-4 py-8 text-center">
                          <Loader2 className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
                          <p className="text-sm text-gray-500">Loading customers...</p>
                        </div>
                      ) : getFilteredUsers().length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No customers found</p>
                        </div>
                      ) : (
                        getFilteredUsers().map((user) => (
                          <button
                            key={user._id}
                            onClick={() => {
                              setSelectedCustomer(user);
                              handleDropdownOpen('customer', isCustomerDropdownOpen, setIsCustomerDropdownOpen);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150"
                          >
                            <div className="flex items-justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-600 text-sm font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{user.name}</div>
                                  {user.company_name && (
                                    <div className="text-xs text-gray-500 mt-0.5">{user.company_name}</div>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full">
                                {user.company_name ? 'Corporation' : 'Individual'}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attorney Selection */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <UserCog className="w-4 h-4 text-blue-500" />
                Select Case Manager
              </label>
              <div className="relative" ref={dropdownRefs.attorney}>
                <button
                  type="button"
                  onClick={() => handleDropdownOpen('attorney', isAttorneyDropdownOpen, setIsAttorneyDropdownOpen)}
                  className={`w-full h-12 bg-white border ${
                    isAttorneyDropdownOpen ? 'border-blue-500 ring-2 ring-blue-50' : 'border-gray-200'
                  } rounded-lg px-4 text-sm text-left flex items-center justify-between hover:border-gray-300 focus:outline-none transition-all duration-200`}
                >
                  <span className={`truncate ${selectedAttorney ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {selectedAttorney ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-medium">
                            {selectedAttorney.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span>{selectedAttorney.name}</span>
                      </div>
                    ) : (
                      'Select case manager...'
                    )}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    isAttorneyDropdownOpen ? 'transform rotate-180' : ''
                  }`} />
                </button>

                {isAttorneyDropdownOpen && (
                  <div 
                    className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden"
                    onMouseEnter={() => clearDropdownTimeout('attorney')}
                    onMouseLeave={() => startDropdownTimeout('attorney', setIsAttorneyDropdownOpen)}
                  >
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <input
                          ref={searchInputRefs.attorney}
                          type="text"
                          value={attorneySearch}
                          onChange={(e) => {
                            setAttorneySearch(e.target.value);
                            clearDropdownTimeout('attorney');
                          }}
                          onFocus={() => clearDropdownTimeout('attorney')}
                          placeholder="Search case managers..."
                          className="w-full px-3 py-2 pl-8 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all duration-200"
                        />
                        <UserCog className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="max-h-[240px] overflow-auto">
                      {isLoadingUsers ? (
                        <div className="px-4 py-8 text-center">
                          <Loader2 className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
                          <p className="text-sm text-gray-500">Loading case managers...</p>
                        </div>
                      ) : getFilteredAttorneys().length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No case managers found</p>
                        </div>
                      ) : (
                        getFilteredAttorneys().map((attorney) => {
                          const isSelected = selectedAttorney?._id === attorney._id;
                          return (
                            <button
                              key={attorney._id}
                              onClick={() => handleAttorneySelect(attorney)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-blue-600 text-sm font-medium">
                                      {attorney.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="font-medium text-gray-900">{attorney.name}</div>
                                </div>
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                      <path
                                        d="M10 3L4.5 8.5L2 6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Combined Check Workflow and Create Case Button */}
            <div className="pt-6">
              <button
                type="button"
                onClick={handleCheckWorkflow}
                disabled={!selectedTemplate || !selectedCustomer || !selectedAttorney}
                className={`w-full h-12 rounded-lg text-sm font-medium transition-all duration-300 
                  focus:outline-none focus:ring-offset-2 focus:ring-2 focus:ring-blue-500 
                  disabled:cursor-not-allowed relative overflow-hidden
                  ${!selectedTemplate || !selectedCustomer || !selectedAttorney
                    ? 'bg-gray-100 text-gray-400' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
              >
                <div className="relative flex items-center justify-center gap-3">
                  {isLoadingWorkflow ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading workflow...</span>
                    </>
                  ) : (
                    'Check Workflow & Create Case'
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Edit Template Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl w-[500px] max-h-[80vh] overflow-hidden shadow-xl transform transition-all animate-modal-enter">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Edit document checklist
                  </h2>
                  <button
                    onClick={handleModalClose}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-150"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Search Box */}
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search documents..."
                      className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all duration-200"
                    />
                    <FileText className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Files in progress</h3>
                </div>

                {/* Document List */}
                <div className="space-y-2 mb-6 max-h-[320px] overflow-y-auto pr-2">
                  {getFilteredDocuments().map((doc) => {
                    const isSelected = tempSelectedDocuments.some(d => d.name === doc.name);
                    return (
                      <button
                        key={doc._id}
                        onClick={() => handleDocumentToggle(doc.name)}
                        className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                            ${isSelected 
                              ? 'border-blue-500 bg-blue-500 text-white' 
                              : 'border-gray-300 hover:border-blue-400'
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                <path
                                  d="M10 3L4.5 8.5L2 6"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{doc.name}</span>
                        </div>
                      </button>
                    );
                  })}
                  
                  {getFilteredDocuments().length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertCircle className="w-6 h-6 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        No documents found matching &ldquo;{searchQuery}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* Done Button */}
                <button
                  onClick={handleDoneClick}
                  className="w-full h-11 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workflow Edit Modal */}
        {isWorkflowModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-white w-[95vw] h-[90vh] max-h-[90vh] rounded-xl shadow-2xl flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Review Workflow Steps</h2>
                  <p className="text-base text-gray-600">Review and customize workflow steps before creating the case</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsWorkflowModalOpen(false)}
                    className="inline-flex items-center px-6 py-3 rounded-lg border-2 border-gray-200 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveWorkflowChanges}
                    className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-base font-medium text-white hover:bg-blue-700 transition-all duration-200"
                  >
                    Create Case
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-auto p-8">
                <WorkflowSteps 
                  steps={workflowSteps} 
                  summary={workflowSummary}
                  onStepsReorder={handleWorkflowStepsReorder}
                  isEditable={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewCase; 