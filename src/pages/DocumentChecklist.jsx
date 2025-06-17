import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Edit2, Clock, ChevronDown, Plus, X, Trash, ChevronUp, ChevronRight, User } from 'lucide-react';
import api from '../utils/api';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/KBSidebar';
import EditChecklistModal from '../components/modals/EditChecklistModal';
import WorkflowSteps from '../components/workflow/WorkflowSteps';

const DocumentChecklist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Document Checklist');
  const { setCurrentBreadcrumb } = useBreadcrumb();
  // State for inline validation dropdown
  const [openValidationDocId, setOpenValidationDocId] = useState(null);
  // State for edit process modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditDocChecklistModalOpen, setIsEditDocChecklistModalOpen] = useState(false);
  const [isAddFormModalOpen, setIsAddFormModalOpen] = useState(false);
  const [allForms, setAllForms] = useState([]);
  const [selectedFormIds, setSelectedFormIds] = useState([]);
  const [formSearch, setFormSearch] = useState("");
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [isFormSelected, setIsFormSelected] = useState({});
  const [isAddingForms, setIsAddingForms] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false);
  const [workflowSummary, setWorkflowSummary] = useState("");
  const [currentCaseId, setCurrentCaseId] = useState(null);
  const [expandedMilestones, setExpandedMilestones] = useState({});

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    // Update breadcrumb before navigation
    setCurrentBreadcrumb([
      { label: 'Dashboard', link: '/' },
      { label: 'Knowledge Base', link: '/knowledge' },
      { label: category, link: '#' }
    ]);
    navigate('/knowledge');
  };

  // Tabs configuration
  const tabs = [
    'Document Checklist',
    'Workflow',
    'Forms'
  ];

  useEffect(() => {
    if (id) {
      fetchCategoryDetails();
      fetchWorkflowSteps();
    }
  }, [id]);

  const fetchCategoryDetails = async (refresh = true) => {
    try {
      setLoading(true);
      
      // Fetch category details
      const categoryResponse = await api.get(`/categories/${id}`);
      if (categoryResponse.data.status === 'success') {
        const categoryData = categoryResponse.data.data.category;
        setCategory(categoryData);
        
        // Set documents from the category data
        if (categoryData.documentTypes) {
          setDocuments(categoryData.documentTypes);
        }

        // Update breadcrumb
        setCurrentBreadcrumb([
          { label: 'Dashboard', link: '/' },
          { label: 'Knowledge Base', link: '/knowledge' },
          { label: categoryData.name, link: '#' }
        ]);

        // Use forms from category data
        setForms(categoryData.forms || []);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch category details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflowSteps = async () => {
    try {
      setIsLoadingWorkflow(true);
      const response = await api.get(`/steps/category/${id}/details`);
      if (response.data.status === 'success') {
        // Update to handle the new response structure
        const { steps = [], summary } = response.data.data;
        setWorkflowSteps(steps);
        setWorkflowSummary(summary);
        
        // You can also store additional category info if needed
        const { categoryName, categoryDescription, summary: workflowSummary } = response.data.data;
        // Update category info if needed
        setCategory(prev => ({
          ...prev,
          name: categoryName || prev.name,
          description: categoryDescription || prev.description,
          workflowSummary: workflowSummary
        }));
      }
    } catch (error) {
      console.error('Error fetching workflow steps:', error);
      // Show more specific error message
      const errorMessage = error.response?.data?.message || 'Failed to load workflow steps';
      toast.error(errorMessage);
      setWorkflowSteps([]); // Set empty array on error
    } finally {
      setIsLoadingWorkflow(false);
    }
  };

  const handleRemoveForm = async (formId) => {
    try {
      // Update UI immediately for better user experience
      setForms(prevForms => prevForms.filter(form => form._id !== formId));
      setCategory(prevCategory => ({
        ...prevCategory,
        forms: prevCategory.forms.filter(form => form._id !== formId)
      }));

      // Get the current category data from state
      const updatedForms = category.forms
        .filter(form => form._id !== formId)
        .map(form => form._id);

      // API call - Update the category with the new forms array
      const response = await api.put(`/categories/${id}`, {
        forms: updatedForms
      });

      if (response.data.success) {
        toast.success('Form removed successfully');
      } else {
        // If the API call fails, revert the UI changes
        await fetchCategoryDetails();
        toast.error(response.data.message || 'Failed to remove form');
      }
    } catch (err) {
      console.error('Error removing form:', err);
      // Revert the UI changes if the API call fails
      await fetchCategoryDetails();
      toast.error(err.response?.data?.message || 'Failed to remove form');
    }
  };

  const handleStepsReorder = async (reorderedSteps) => {
    try {
      const response = await api.post('/case-steps', {
        caseId: currentCaseId,
        steps: reorderedSteps
      });

      if (response.data.status === 'success') {
        setWorkflowSteps(reorderedSteps);
        toast.success('Workflow steps reordered successfully');
      } else {
        toast.error(response.data.message || 'Failed to reorder workflow steps');
      }
    } catch (error) {
      console.error('Error reordering workflow steps:', error);
      toast.error('Failed to reorder workflow steps');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full gap-4 mt-8">
        <Sidebar onCategorySelect={handleCategorySelect} selectedCategory={category?.name} />
        <div className="flex-1 bg-[#f8fafc] rounded-lg shadow-sm h-fit">
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full gap-4 mt-8">
        <Sidebar onCategorySelect={handleCategorySelect} selectedCategory={category?.name} />
        <div className="flex-1 bg-[#f8fafc] rounded-lg shadow-sm h-fit p-6">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  const renderWorkflowTab = () => {
    // Group steps by milestone
    const groupStepsByMilestone = () => {
      const milestoneGroups = {};
      const orphanSteps = [];

      workflowSteps.forEach(step => {
        if (step.milestone) {
          if (!milestoneGroups[step.milestone]) {
            milestoneGroups[step.milestone] = [];
          }
          milestoneGroups[step.milestone].push(step);
        } else {
          orphanSteps.push(step);
        }
      });

      // Sort steps within each milestone by order
      Object.keys(milestoneGroups).forEach(milestone => {
        milestoneGroups[milestone].sort((a, b) => a.order - b.order);
      });

      orphanSteps.sort((a, b) => a.order - b.order);

      return { milestoneGroups, orphanSteps };
    };

    const { milestoneGroups, orphanSteps } = groupStepsByMilestone();

    const toggleMilestone = (milestone) => {
      setExpandedMilestones(prev => ({
        ...prev,
        [milestone]: !prev[milestone]
      }));
    };

    const renderStep = (step, isLast = false, isNested = false) => {
      // Agent badge styles - updated for lighter background and more rounded corners
      const agentBadgeStyles = {
        'Diana': 'text-purple-600 bg-purple-50/70 px-4',
        'Fiona': 'text-blue-600 bg-blue-50/70 px-4',
        'Sophia': 'text-green-600 bg-green-50/70 px-4',
        'none': 'text-gray-600 bg-gray-50/70 px-4'
      };

      const getAgentAvatar = (agentName) => {
        switch (agentName) {
          case 'Diana':
            return '/assets/diana-avatar.png';
          case 'Fiona':
            return '/assets/fiona-avatar.png';
          case 'Sophia':
            return '/assets/sophia-avatar.png';
          default:
            return null;
        }
      };

      return (
        <div key={step._id} className="relative pl-8 mb-8 last:mb-0">
          {/* Vertical line - thinner and lighter */}
          <div className="absolute left-[5px] top-0 bottom-0 w-[1px] bg-gray-200/80" />
          
          {/* Horizontal line and dot - adjusted positioning */}
          <div className="absolute left-0 top-[22px] flex items-center">
            <div className="w-[14px] h-[1px] bg-gray-200/80" />
            <div className={`w-[8px] h-[8px] rounded-full ${step.isRequired ? 'bg-blue-500' : 'bg-gray-300'}`} />
          </div>

          {/* Content */}
          <div className="pt-3">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-[15px] font-medium text-gray-900">{step.name}</h4>
              <span className="text-sm text-gray-500">({step.estimatedHours}h)</span>
              {step.agentName && step.agentName !== 'none' && (
                <span className={`py-1 text-sm font-medium rounded-full ${agentBadgeStyles[step.agentName]}`}>
                  {step.agentName}
                </span>
              )}
              {step.isRequired && (
                <span className="px-4 py-1 text-sm font-medium rounded-full bg-red-50/70 text-red-600">
                  Required
                </span>
              )}
            </div>

            {/* Description */}
            {step.description && (
              <p className="text-[15px] text-gray-600 mb-5">{step.description}</p>
            )}

            {/* User and Agent sections */}
            <div className="space-y-5">
              {step.userDescription && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100/70 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="text-[15px]">
                      <span className="text-blue-600 font-medium">User: </span>
                      <span className="text-blue-600">{step.userDescription}</span>
                    </div>
                  </div>
                </div>
              )}

              {step.agentDescription && step.agentName && step.agentName !== 'none' && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {getAgentAvatar(step.agentName) ? (
                      <img 
                        src={getAgentAvatar(step.agentName)} 
                        alt={`${step.agentName} avatar`}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-purple-100/70 flex items-center justify-center">
                        <span className="text-xs font-medium text-purple-600">
                          {step.agentName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="text-[15px]">
                      <span className="text-purple-600 font-medium">{step.agentName}: </span>
                      <span className="text-purple-600">{step.agentDescription}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };

    return (
      <>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Process Workflow</h2>
            <p className="text-gray-500 mb-6">
              Below is the step-by-step workflow organized by milestones. Click on milestones to expand/collapse steps.
            </p>
          </div>
        </div>

        {isLoadingWorkflow ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Main vertical blue line */}
            <div className="relative">
              <div className="absolute left-[1.35rem] top-0 bottom-0 w-[2px] bg-blue-500"></div>

              {/* Render milestone groups */}
              {Object.entries(milestoneGroups).map(([milestone, steps], milestoneIndex) => (
                <div key={milestone} className="relative mb-6 last:mb-0">
                  {/* White connecting line */}
                  <div className="absolute left-[1.35rem] top-[1.15rem] w-4 h-[2px] bg-white"></div>
                  
                  {/* Milestone header */}
                  <button
                    onClick={() => toggleMilestone(milestone)}
                    className="relative flex items-start gap-4 w-full text-left p-3 pl-8 bg-transparent hover:bg-gray-50/80 transition-colors rounded-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative z-10 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium shrink-0">
                        {(milestoneIndex + 1 <= 6) ? milestoneIndex + 1 : 6}
                      </div>
                      <div>
                        <h3 className="text-[15px] font-medium text-gray-900">{milestone}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {steps.length} step{steps.length !== 1 ? 's' : ''} • {steps.reduce((total, step) => total + step.estimatedHours, 0)}h total
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-auto shrink-0" />
                  </button>

                  {/* Steps content */}
                  {expandedMilestones[milestone] && (
                    <div className="mt-4 space-y-4 ml-[3.75rem]">
                      {steps.map((step, index) => 
                        renderStep(step, index === steps.length - 1, true)
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Render orphan steps */}
              {orphanSteps.length > 0 && (
                <div className="relative mb-6 last:mb-0">
                  {/* White connecting line */}
                  <div className="absolute left-[1.35rem] top-[1.15rem] w-4 h-[2px] bg-white"></div>
                  
                  <div className="flex items-start gap-4 p-3 pl-8">
                    <div className="relative z-10 w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium shrink-0">
                      {Math.min(Object.keys(milestoneGroups).length + 1, 6)}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-medium text-gray-900">Other Steps</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {orphanSteps.length} step{orphanSteps.length !== 1 ? 's' : ''} • 
                        {orphanSteps.reduce((total, step) => total + step.estimatedHours, 0)}h total
                      </p>
                    </div>
                  </div>
                  <div className="space-y-0">
                    {orphanSteps.map((step, index) => 
                      renderStep(step, index === orphanSteps.length - 1, true)
                    )}
                  </div>
                </div>
              )}

              {/* Summary section */}
              {workflowSummary && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">{workflowSummary.totalSteps}</div>
                      <div className="text-sm text-blue-600">Total Steps</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">{workflowSummary.totalEstimatedHours}h</div>
                      <div className="text-sm text-green-600">Estimated Hours</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-red-600">{workflowSummary.requiredSteps}</div>
                      <div className="text-sm text-red-600">Required Steps</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-600">{workflowSummary.optionalSteps}</div>
                      <div className="text-sm text-gray-600">Optional Steps</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex h-full gap-4 mt-8">
      <Sidebar onCategorySelect={handleCategorySelect} selectedCategory={category?.name} />

      {/* Main Content */}
      <div className="flex-1 bg-[#f8fafc] rounded-lg p-6">
        {/* Category Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/knowledge')}
                  className="text-gray-600 hover:text-gray-900"
                  title="Go back to process template"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  {category?.name}
                </h1>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {category?.description}
              </p>
              {category?.deadline > 0 && (
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1 text-gray-400" />
                  <span>Expected completion time: {category.deadline} days</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:text-blue-600'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'Document Checklist' && (
          <>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Document Checklist</h2>
                <p className="text-gray-500 mb-6">Below is the list of required and optional documents for this process.</p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'Document Checklist' && (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc._id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <h3 className="text-sm font-medium text-gray-900 mr-2">{doc.name}</h3>
                    {doc.required && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Required
                      </span>
                    )}
                  </div>
                  <button
                    className="px-3 py-1 rounded border border-blue-200 text-blue-600 text-xs font-medium hover:bg-blue-50 transition-colors"
                    onClick={() => setOpenValidationDocId(openValidationDocId === doc._id ? null : doc._id)}
                  >
                    {openValidationDocId === doc._id ? 'Hide Validations' : 'View Validations'}
                  </button>
                </div>
                {openValidationDocId === doc._id && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-100">
                    <div className="mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Validations</h4>
                    </div>
                    {doc.validations && doc.validations.length > 0 ? (
                      <ul className="space-y-2">
                        {doc.validations.map((val, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="mt-1 text-blue-500">•</span>
                            <span>{val}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-500">No validations found for this document.</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Workflow' && renderWorkflowTab()}

        {activeTab === 'Forms' && (
          <>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Forms</h2>
                <p className="text-gray-500 mb-6">Below is the list of forms associated with this process. Please review and use the relevant forms as needed.</p>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                onClick={async () => {
                  setIsAddFormModalOpen(true);
                  setIsLoadingForms(true);
                  // Fetch all forms from backend
                  try {
                    const response = await api.get('/forms');
                    if (response.data.status === 'success') {
                      setAllForms(response.data.data.forms);
                    }
                  } catch (err) {
                    setAllForms([]);
                  } finally {
                    setIsLoadingForms(false);
                  }
                }}
              >
                <Plus className="h-4 w-4 inline" />
                Add Form
              </button>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {forms.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-gray-500 text-center py-8">No forms available.</td>
                    </tr>
                  ) : (
                    forms.map(form => (
                      <tr key={form._id} className="bg-white">
                        <td className="px-6 py-4 text-sm font-mono text-gray-900">{form._id?.substring(0, 8)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{form.form_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{form.description || 'No description available'}</td>
                        <td className="px-6 py-4 text-sm">
                          {form.form_links ? (
                            <a href={form.form_links} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{form.form_name}</a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{form.createdAt ? new Date(form.createdAt).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleRemoveForm(form._id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove form"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Add Form Modal */}
            {isAddFormModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-0 max-w-lg w-full shadow-lg">
                  <div className="px-6 pt-6 pb-2 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Add Forms to Process</h2>
                    <button className="text-gray-400 hover:text-gray-600 p-1" onClick={() => setIsAddFormModalOpen(false)}>
                      <span className="sr-only">Close</span>
                      &times;
                    </button>
                  </div>
                  <div className="px-6 pt-4">
                    <input
                      type="text"
                      placeholder="Search forms by name or description..."
                      className="w-full mb-4 px-3 py-2 border border-gray-200 rounded text-sm"
                      value={formSearch}
                      onChange={e => setFormSearch(e.target.value)}
                    />
                    <div className="max-h-64 overflow-y-auto">
                      {isLoadingForms ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      ) : allForms.length === 0 ? (
                        <div className="text-gray-500">No forms available.</div>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {allForms
                            .filter(form =>
                              form.form_name.toLowerCase().includes(formSearch.toLowerCase()) ||
                              (form.description || '').toLowerCase().includes(formSearch.toLowerCase())
                            )
                            .map(form => {
                              const alreadyAdded = forms.some(f => f._id === form._id);
                              return (
                                <li
                                  key={form._id}
                                  className={`flex items-center gap-3 py-3 rounded-lg px-2
                                    ${selectedFormIds.includes(form._id) && !alreadyAdded ? 'bg-blue-50' : ''}
                                    ${alreadyAdded ? 'group' : 'cursor-pointer hover:bg-gray-50'}
                                  `}
                                  onClick={() => {
                                    if (alreadyAdded) return;
                                    setSelectedFormIds(ids =>
                                      ids.includes(form._id)
                                        ? ids.filter(id => id !== form._id)
                                        : [...ids, form._id]
                                    );
                                  }}
                                  style={alreadyAdded ? {} : {}}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{form.form_name}</div>
                                    <div className="text-xs text-gray-500 truncate">{form.description || 'No description'}</div>
                                  </div>
                                  {alreadyAdded && (
                                    <div className="text-blue-600">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                  {selectedFormIds.includes(form._id) && !alreadyAdded && (
                                    <div className="text-blue-600">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                  {/* Custom style for not-allowed cursor on hover if already added */}
                                  <style jsx>{`
                                    li.group:hover {
                                      cursor: not-allowed !important;
                                      background: #fff !important;
                                    }
                                  `}</style>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="px-6 py-4 flex justify-end gap-2 border-t border-gray-100">
                    <button
                      className="px-4 py-2 bg-gray-200 rounded"
                      onClick={() => setIsAddFormModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={async () => {
                        // Only add forms that are not already in the category
                        const newFormIds = selectedFormIds.filter(
                          id => !forms.some(f => f._id === id)
                        );
                        if (newFormIds.length === 0) {
                          setIsAddFormModalOpen(false);
                          setSelectedFormIds([]);
                          return;
                        }
                        try {
                          setIsAddingForms(true);
                          await api.put(`/categories/${id}`, {
                            forms: [...(category.forms || []), ...newFormIds]
                          });
                          
                          // Update forms state with the new forms
                          const newForms = allForms.filter(form => newFormIds.includes(form._id));
                          setForms(prevForms => [...prevForms, ...newForms]);
                          setCategory(prevCategory => ({
                            ...prevCategory,
                            forms: [...(prevCategory.forms || []), ...newFormIds]
                          }));
                          
                          setIsAddFormModalOpen(false);
                          setSelectedFormIds([]);
                        } catch (err) {
                          setIsAddFormModalOpen(false);
                          setSelectedFormIds([]);
                          toast.error('Failed to add forms');
                        } finally {
                          setIsAddingForms(false);
                        }
                      }}
                      disabled={isAddingForms}
                    >
                      {isAddingForms ? 'Adding...' : 'Add Selected'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Process Modal */}
      <EditChecklistModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        category={category}
        onSave={async (updatedCategory) => {
          try {
            const response = await api.put(`/categories/${id}`, updatedCategory);
            if (response.data.status === 'success' || response.data.success) {
              setIsEditModalOpen(false);
              await fetchCategoryDetails(false);
            }
          } catch (error) {
            toast.error('Failed to update process');
            setIsEditModalOpen(false);
          }
        }}
      />

      {/* Edit Document Checklist Modal */}
      {isEditDocChecklistModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 min-w-[350px] max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Edit Document Checklist</h2>
            {/* Add your document checklist editing UI here */}
            <div className="mb-4 text-gray-500">
              Document checklist editing UI goes here.
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setIsEditDocChecklistModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => {
                  // Placeholder save action
                  setIsEditDocChecklistModalOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentChecklist; 