import React, { useState, useEffect } from 'react';
import { Edit2, Check, X, Plus, Trash2, Clock } from 'lucide-react';
import PropTypes from 'prop-types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { toast } from 'react-hot-toast';

// Custom Toast Component for Fiona's Case Setup
const FionaCaseSetupToast = ({ t, message }) => {
  return (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <img
              className="h-10 w-10 rounded-xl ring-2 ring-blue-100"
              src="/assets/fiona-avatar.png"
              alt="Fiona"
            />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
              Fiona
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">AI Agent</span>
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

FionaCaseSetupToast.propTypes = {
  t: PropTypes.object.isRequired,
  message: PropTypes.string.isRequired
};

// Export the toast function for use in other components
export const showCaseSetupToast = () => {
  const messages = [
    "Hi! I'm setting up your case...",
    "Analyzing requirements and configuring workflows...",
    "Setting up document validations...",
    "Preparing AI assistance channels...",
    "Almost done! Just a moment..."
  ];

  let currentIndex = 0;
  const toastId = toast.loading(messages[0], {
    icon: '🤖',
    style: {
      minWidth: '350px',
      background: '#fff',
      color: '#1f2937',
      fontSize: '14px',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }
  });

  const interval = setInterval(() => {
    currentIndex++;
    if (currentIndex < messages.length) {
      toast.loading(messages[currentIndex], {
        id: toastId,
      });
    } else {
      clearInterval(interval);
      toast.success("All set! Your case has been created successfully.", {
        id: toastId,
        duration: 2000,
        icon: '✨',
      });
    }
  }, 2000);

  return toastId;
};

const SortableStep = ({ step, index, isEditable, onUpdateStep, onRemoveStep, availableKeys }) => {
  const [isEditing, setIsEditing] = React.useState(step.name === '');
  const [isEditingKey, setIsEditingKey] = React.useState(step.key === '');
  const [editedName, setEditedName] = React.useState(step?.name || '');
  const [editedKey, setEditedKey] = React.useState(step?.key || '');
  const inputRef = React.useRef(null);
  const keySelectRef = React.useRef(null);
  const isNewStep = !step.name && !step.key;

  // Reset edited values when step changes
  React.useEffect(() => {
    if (step) {
      setEditedName(step.name || '');
      setEditedKey(step.key || '');
    }
  }, [step]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: step?._id || `step-${index}`
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyChange = (e) => {
    setEditedKey(e.target.value);
  };

  const handleSave = () => {
    if (!editedName.trim()) {
      toast.error('Step name cannot be empty');
      return;
    }

    if (!editedKey.trim()) {
      toast.error('Please select a key');
      return;
    }

    onUpdateStep(step.key, {
      ...step,
      name: editedName.trim(),
      key: editedKey.trim()
    });

    setIsEditing(false);
    setIsEditingKey(false);
  };

  const handleCancel = () => {
    if (isNewStep) {
      onRemoveStep(step._id || `step-${index}`);
    } else {
      setEditedName(step.name || '');
      setEditedKey(step.key || '');
      setIsEditing(false);
      setIsEditingKey(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove this step?')) {
      onRemoveStep(step._id || `step-${index}`);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-white transition-all duration-200 ${
        isDragging ? 'z-50 shadow-lg rounded-xl border border-blue-200 bg-blue-50' : ''
      } ${isNewStep ? 'border-2 border-blue-100 rounded-xl shadow-sm' : 'hover:bg-gray-50'}`}
      {...(isEditable ? attributes : {})}
    >
      {isEditable && !isNewStep && (
        <div
          {...listeners}
          className="absolute left-4 top-1/2 -translate-y-1/2 cursor-move p-3 rounded-lg hover:bg-gray-100 group transition-colors"
          title="Drag to reorder"
        >
          <div className="flex flex-col gap-1.5 group-hover:gap-2 transition-all">
            <div className="w-5 h-0.5 bg-gray-400 group-hover:bg-blue-500 rounded-full transition-colors" />
            <div className="w-5 h-0.5 bg-gray-400 group-hover:bg-blue-500 rounded-full transition-colors" />
            <div className="w-5 h-0.5 bg-gray-400 group-hover:bg-blue-500 rounded-full transition-colors" />
          </div>
        </div>
      )}

      {isNewStep ? (
        <div className="p-6">
          <div className="flex items-center gap-8">
            {/* Step Number */}
            <div className="w-[80px] flex-shrink-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600 font-medium text-lg">
                {step.order || index + 1}
              </div>
            </div>

            {/* Name Input */}
            <div className="w-[300px] flex-shrink-0">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Step Name</label>
                <input
                  ref={inputRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 text-base border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter step name..."
                />
              </div>
            </div>

            {/* Key Selection */}
            <div className="w-[250px] flex-shrink-0">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Step Key</label>
                <select
                  ref={keySelectRef}
                  value={editedKey}
                  onChange={handleKeyChange}
                  className="w-full px-3 py-2 text-base border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a key...</option>
                  {availableKeys.map((keyOption) => (
                    <option key={keyOption.key} value={keyOption.key}>
                      {keyOption.key}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save
              </button>
              <button 
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`flex items-center min-h-[80px] ${isEditable ? 'pl-16' : 'pl-6'} pr-6 border-b border-gray-100`}>
          {/* Step Number */}
          <div className="w-[80px] flex-shrink-0 mr-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600 font-medium text-lg">
              {step.order || index + 1}
            </div>
          </div>

          {/* Name */}
          <div className="w-[300px] flex-shrink-0 mr-8">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 text-base border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Step name..."
                />
                <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={handleCancel} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900 text-base block">{step.name}</span>
                <div className="flex items-center gap-1">
                  {isEditable && (
                    <>
                      <button 
                        onClick={handleEditClick} 
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="Edit step"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={handleRemove}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Remove step"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Time */}
          <div className="w-[100px] flex-shrink-0 mr-8">
            <div className="flex items-center text-base text-gray-700">
              <Clock className="h-5 w-5 mr-2 text-gray-400" />
              <span>{step.estimatedHours || 0}h</span>
            </div>
          </div>

          {/* Key */}
          <div className="w-[150px] flex-shrink-0 mr-8">
            {isEditingKey ? (
              <div className="flex items-center gap-2">
                <select
                  ref={keySelectRef}
                  value={editedKey}
                  onChange={handleKeyChange}
                  className="w-full px-3 py-2 text-base border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a key...</option>
                  {availableKeys.map((keyOption) => (
                    <option key={keyOption.key} value={keyOption.key}>
                      {keyOption.key}
                    </option>
                  ))}
                </select>
                <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={handleCancel} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="px-3 py-1.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
                  {step.key}
                </span>
                {isEditable && (
                  <button 
                    onClick={() => setIsEditingKey(true)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Agent */}
          <div className="w-[300px] flex-shrink-0 mr-8">
            {step.agentName === 'none' ? (
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 ring-2 ring-gray-200 group-hover:ring-gray-300 transition-all flex items-center justify-center">
                    <span className="text-gray-600 text-lg font-medium">U</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-gray-600">User</span>
                  <span className="text-sm text-gray-500">Manual Step</span>
                </div>
              </div>
            ) : step.agentName && step.agentName !== 'none' ? (
              <div className="flex items-center gap-4">
                {step.agentName === 'Diana' && (
                  <div className="relative group">
                    <img 
                      src="/assets/diana-avatar.png" 
                      alt="Diana" 
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-purple-100 group-hover:ring-purple-200 transition-all"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">D</span>
                    </div>
                  </div>
                )}
                {step.agentName === 'Fiona' && (
                  <div className="relative group">
                    <img 
                      src="/assets/fiona-avatar.png" 
                      alt="Fiona" 
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">F</span>
                    </div>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className={`text-base font-semibold ${
                    step.agentName === 'Diana' ? 'text-purple-600' :
                    step.agentName === 'Fiona' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {step.agentName}
                  </span>
                  <span className="text-sm text-gray-500">AI Agent</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-lg">?</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-medium text-gray-400">Unassigned</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="flex-1 min-w-[300px]">
            {step.agentName === 'none' ? (
              <div className="flex flex-col">
                <span className="text-base text-gray-700 line-clamp-2">
                  {step.userDescription || step.description || 'Manual step to be completed by the user'}
                </span>
              </div>
            ) : step.agentDescription ? (
              <div className="flex flex-col">
                <span className="text-base text-gray-700 line-clamp-2">{step.agentDescription}</span>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-base text-gray-400">No description available</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

SortableStep.propTypes = {
  step: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    order: PropTypes.number,
    isRequired: PropTypes.bool,
    estimatedHours: PropTypes.number,
    agentName: PropTypes.string,
    agentDescription: PropTypes.string,
    userDescription: PropTypes.string,
    description: PropTypes.string
  }).isRequired,
  index: PropTypes.number.isRequired,
  isEditable: PropTypes.bool.isRequired,
  onUpdateStep: PropTypes.func.isRequired,
  onRemoveStep: PropTypes.func.isRequired,
  availableKeys: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired
};

const AddStep = ({ onAddStep }) => {
  return (
    <div className="mt-4 flex justify-center">
      <button
        onClick={() => onAddStep()}
        className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors gap-2 font-medium"
      >
        <Plus className="w-5 h-5" />
        Add New Step
      </button>
    </div>
  );
};

AddStep.propTypes = {
  onAddStep: PropTypes.func.isRequired,
};

const WorkflowSteps = ({ steps: initialSteps, summary, onStepsReorder, isEditable = false, caseId }) => {
  const [steps, setSteps] = useState(initialSteps || []);
  const [activeId, setActiveId] = useState(null);
  
  // Get unique keys from existing steps
  const getAvailableKeys = () => {
    const uniqueKeys = new Set();
    steps.forEach(step => {
      if (step.key) {
        uniqueKeys.add(step.key);
      }
    });
    return Array.from(uniqueKeys).map(key => ({
      key,
      name: steps.find(step => step.key === key)?.name || key
    }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update handler for updating step details
  const handleUpdateStep = (stepKey, updatedStep) => {
    const newSteps = steps.map(step => {
      if (step._id === updatedStep._id) {
        return {
          ...updatedStep,
          status: 'pending', // Ensure status is set
          isDefault: true,
          isVisible: true
        };
      }
      return step;
    });

    setSteps(newSteps);
    onStepsReorder?.(newSteps);
  };

  const handleSaveWorkflowChanges = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5001/api/case-steps', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          caseId,
          steps: steps.map((step, index) => ({
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
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save workflow steps');
      }

      const data = await response.json();
      console.log('Saved workflow steps:', data);
      
    } catch (error) {
      console.error('Error saving workflow steps:', error);
    }
  };

  // Update the getUniqueStepKey function to use _id as primary identifier
  const getUniqueStepKey = (step, index) => {
    // Use _id as the primary unique identifier, fallback to timestamp+index if no _id
    return step._id || `step-${index}-${Date.now()}`;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((item) => (item._id || `step-${items.indexOf(item)}`) === active.id);
        const newIndex = items.findIndex((item) => (item._id || `step-${items.indexOf(item)}`) === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          // First move the item to its new position
          const newSteps = arrayMove(items, oldIndex, newIndex);
          
          // Then update the order numbers for all steps
          const updatedSteps = newSteps.map((step, index) => ({
            ...step,
            order: index + 1 // Update order to be 1-based index
          }));
          
          onStepsReorder?.(updatedSteps);
          return updatedSteps;
        }
        return items;
      });
    }

    setActiveId(null);
  };

  const handleAddStep = () => {
    const newStep = {
      _id: `new-step-${Date.now()}`,
      name: '',
      key: '',
      order: steps.length + 1,
      isRequired: false,
      estimatedHours: 1,
      agentName: 'none',
      agentDescription: '',
      status: 'pending',
      isDefault: true,
      isVisible: true
    };

    const newSteps = [...steps, newStep];
    setSteps(newSteps);
    onStepsReorder?.(newSteps);
  };

  const handleRemoveStep = (stepId) => {
    const newSteps = steps.filter(step => (step._id || `step-${steps.indexOf(step)}`) !== stepId);
    setSteps(newSteps);
    onStepsReorder?.(newSteps);
  };

  if (!steps || steps.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No workflow steps defined for this category.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      {summary && (
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-base text-gray-600 mb-2">Total Steps</div>
            <div className="text-3xl font-semibold text-gray-900">{summary.totalSteps}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-base text-gray-600 mb-2">Estimated Hours</div>
            <div className="text-3xl font-semibold text-gray-900">{summary.totalEstimatedHours}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-base text-gray-600 mb-2">Required Steps</div>
            <div className="text-3xl font-semibold text-gray-900">{summary.requiredSteps}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-base text-gray-600 mb-2">Optional Steps</div>
            <div className="text-3xl font-semibold text-gray-900">{summary.optionalSteps}</div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Table Headers - Updated to match new layout */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className={`flex items-center h-16 ${isEditable ? 'pl-16' : 'pl-6'} pr-6 text-base font-medium text-gray-600`}>
            <div className="w-[80px] flex-shrink-0 mr-8">Sl.No</div>
            <div className="w-[300px] flex-shrink-0 mr-8">Name</div>
            <div className="w-[100px] flex-shrink-0 mr-8">Time</div>
            <div className="w-[150px] flex-shrink-0 mr-8">Key</div>
            <div className="w-[300px] flex-shrink-0 mr-8">Accountable Entity</div>
            <div className="flex-1 min-w-[300px]">Description</div>
          </div>
        </div>

        {/* Steps */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={steps.map((step, idx) => step._id || `step-${idx}`)}
            strategy={verticalListSortingStrategy}
          >
            {steps.map((step, index) => (
              <SortableStep
                key={step._id || `step-${index}`}
                step={step}
                index={index}
                isEditable={isEditable}
                onUpdateStep={handleUpdateStep}
                onRemoveStep={handleRemoveStep}
                availableKeys={getAvailableKeys()}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeId ? (
              <div className="rounded-xl shadow-2xl">
                <SortableStep
                  step={steps.find((step, idx) => (step._id || `step-${idx}`) === activeId)}
                  index={steps.findIndex((step, idx) => (step._id || `step-${idx}`) === activeId)}
                  isEditable={isEditable}
                  onUpdateStep={handleUpdateStep}
                  onRemoveStep={handleRemoveStep}
                  availableKeys={getAvailableKeys()}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {isEditable && <AddStep onAddStep={handleAddStep} />}
      </div>
    </div>
  );
};

WorkflowSteps.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    isRequired: PropTypes.bool,
    estimatedHours: PropTypes.number,
    description: PropTypes.string
  })).isRequired,
  summary: PropTypes.shape({
    totalSteps: PropTypes.number,
    totalEstimatedHours: PropTypes.number,
    requiredSteps: PropTypes.number,
    optionalSteps: PropTypes.number
  }),
  onStepsReorder: PropTypes.func,
  isEditable: PropTypes.bool,
  caseId: PropTypes.string
};

export default WorkflowSteps; 