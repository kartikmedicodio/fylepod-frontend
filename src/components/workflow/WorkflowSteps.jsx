import React, { useState, useEffect } from 'react';
import { Clock, Edit2, Check, X } from 'lucide-react';
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

const SortableStep = ({ step, index, isEditable, onUpdateStep, availableKeys }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isEditingKey, setIsEditingKey] = React.useState(false);
  const [editedName, setEditedName] = React.useState(step?.name || '');
  const [editedKey, setEditedKey] = React.useState(step?.key || '');
  const inputRef = React.useRef(null);
  const keySelectRef = React.useRef(null);

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
    id: step?._id || `step-${index}` // Fallback to index-based ID if no _id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    // Focus the input after it becomes visible
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = () => {
    if (editedName.trim()) {
      onUpdateStep(step.key, {
        ...step,
        name: editedName.trim()
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(step.name || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const toggleRequired = () => {
    onUpdateStep(step.key, {
      ...step,
      isRequired: !step.isRequired
    });
  };

  const handleKeyEdit = () => {
    setIsEditingKey(true);
    setEditedKey(step.key || '');
    // Focus the select after a short delay to ensure it's rendered
    setTimeout(() => keySelectRef.current?.focus(), 50);
  };

  const handleKeySave = () => {
    if (!editedKey.trim()) {
      toast.error('Key cannot be empty');
      return;
    }

    onUpdateStep(step.key, {
      ...step,
      key: editedKey.trim()
    });
    setIsEditingKey(false);
  };

  const handleKeyCancel = () => {
    setEditedKey(step.key || '');
    setIsEditingKey(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-white hover:bg-gray-50 transition-all duration-200 ${
        isDragging ? 'z-50 shadow-lg rounded-xl border border-blue-200 bg-blue-50' : ''
      }`}
      {...(isEditable ? attributes : {})}
    >
      {isEditable && (
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
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
              <button
                onClick={toggleRequired}
                className={`shrink-0 inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:opacity-80 ${
                  step.isRequired 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}
              >
                {step.isRequired ? 'Required' : 'Optional'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div>
                <span className="font-medium text-gray-900 text-base block">{step.name}</span>
                {step.isRequired && (
                  <span className="text-sm text-green-600 font-medium mt-1">Required</span>
                )}
              </div>
              {isEditable && (
                <button onClick={handleEditClick} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Time */}
        <div className="w-[100px] flex-shrink-0 mr-8">
          <div className="flex items-center text-base text-gray-700">
            <Clock className="h-5 w-5 mr-2 text-gray-400" />
            <span>{step.estimatedHours}h</span>
          </div>
        </div>

        {/* Key */}
        <div className="w-[150px] flex-shrink-0 mr-8">
          {isEditable ? (
            isEditingKey ? (
              <div className="flex items-center gap-2">
                <select
                  ref={keySelectRef}
                  value={editedKey}
                  onChange={(e) => setEditedKey(e.target.value)}
                  className="w-full px-3 py-2 text-base border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={step.key}>{step.key}</option>
                  {availableKeys?.filter(k => k.key !== step.key).map((keyOption) => (
                    <option key={keyOption.key} value={keyOption.key}>
                      {keyOption.name || keyOption.key}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={handleKeySave}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleKeyCancel}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="px-3 py-1.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
                  {step.key}
                </span>
                <button 
                  onClick={handleKeyEdit}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )
          ) : (
            <span className="px-3 py-1.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
              {step.key}
            </span>
          )}
        </div>

        {/* Agent - Made more prominent */}
        <div className="w-[300px] flex-shrink-0 mr-8">
          {step.agentName && step.agentName !== 'none' ? (
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
                  step.agentName === 'Sophia' ? 'text-pink-600' :
                  'text-gray-600'
                }`}>
                  {step.agentName}
                </span>
                <span className={`text-sm ${
                  step.agentName === 'Diana' ? 'text-purple-500' :
                  step.agentName === 'Fiona' ? 'text-blue-500' :
                  step.agentName === 'Sophia' ? 'text-pink-500' :
                  'text-gray-500'
                }`}>
                  AI Agent
                </span>
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

        {/* Description - Made more prominent */}
        <div className="flex-1 min-w-[300px]">
          {step.agentDescription ? (
            <div className="flex flex-col">
              <span className="text-base text-gray-700 line-clamp-2 font-medium">{step.agentDescription}</span>
              <span className="text-sm text-gray-500 mt-1">Task Description</span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-base text-gray-400">No description available</span>
              <span className="text-sm text-gray-400">Task details not specified</span>
            </div>
          )}
        </div>
      </div>
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
    agentDescription: PropTypes.string
  }).isRequired,
  index: PropTypes.number.isRequired,
  isEditable: PropTypes.bool.isRequired,
  onUpdateStep: PropTypes.func.isRequired,
  availableKeys: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    name: PropTypes.string
  }))
};

const WorkflowSteps = ({ steps: initialSteps, summary, onStepsReorder, isEditable = false, caseId }) => {
  const [steps, setSteps] = useState(initialSteps || []);
  const [activeId, setActiveId] = useState(null);
  const [availableKeys, setAvailableKeys] = useState([]);
  
  useEffect(() => {
    const fetchWorkflowKeys = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.error('No auth token found');
          return;
        }

        const response = await fetch('http://localhost:5001/api/workflow-keys', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch workflow keys: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.status === 'success') {
          setAvailableKeys(data.data);
        }
      } catch (error) {
        console.error('Error fetching workflow keys:', error);
      }
    };

    if (isEditable) {
      fetchWorkflowKeys();
    }
  }, [isEditable]);

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

  // Update handler for updating step details to allow duplicate keys
  const handleUpdateStep = (stepKey, updatedStep) => {
    const newSteps = steps.map(step => {
      // Match the step by its unique _id instead of key
      if (step._id === updatedStep._id) {
        return updatedStep;
      }
      return step;
    });

    setSteps(newSteps);
    onStepsReorder?.(newSteps);
  };

  const handleSaveChanges = async () => {
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
          steps: steps.map(step => ({
            name: step.name,
            key: step.key,
            isRequired: step.isRequired,
            estimatedHours: step.estimatedHours,
            description: step.description
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save workflow steps');
      }

      const data = await response.json();
      console.log('Saved workflow steps:', data);
      
      // You might want to show a success message
      // toast.success('Workflow steps saved successfully');
      
    } catch (error) {
      console.error('Error saving workflow steps:', error);
      // Show error message
      // toast.error('Failed to save workflow steps');
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
            <div className="w-[300px] flex-shrink-0 mr-8">Responsible</div>
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
                availableKeys={availableKeys}
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
                  availableKeys={availableKeys}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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