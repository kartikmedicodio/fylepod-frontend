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
        isDragging ? 'z-50 shadow-lg rounded-lg border border-blue-200 bg-blue-50' : ''
      }`}
      {...(isEditable ? attributes : {})}
    >
      {isEditable && (
        <div
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move p-2 rounded-md hover:bg-gray-100 group transition-colors"
          title="Drag to reorder"
        >
          <div className="flex flex-col gap-1 group-hover:gap-1.5 transition-all">
            <div className="w-4 h-0.5 bg-gray-400 group-hover:bg-blue-500 rounded-full transition-colors" />
            <div className="w-4 h-0.5 bg-gray-400 group-hover:bg-blue-500 rounded-full transition-colors" />
            <div className="w-4 h-0.5 bg-gray-400 group-hover:bg-blue-500 rounded-full transition-colors" />
          </div>
        </div>
      )}

      <div className={`flex items-center min-h-[60px] ${isEditable ? 'pl-12' : 'pl-4'} pr-4 border-b border-gray-100 ${
        isDragging ? 'opacity-100' : ''
      }`}>
        {/* Step Number */}
        <div className="w-[80px] flex-shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-medium">
            {step.order || index + 1}
          </div>
        </div>

        {/* Name */}
        <div className="w-[400px] flex-shrink-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Step name..."
                />
                <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={toggleRequired}
                className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer hover:opacity-80 ${
                  step.isRequired 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}
              >
                {step.isRequired ? 'Required' : 'Optional'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{step.name}</span>
              {isEditable && (
                <button onClick={handleEditClick} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
              {isEditable ? (
                <button
                  onClick={toggleRequired}
                  className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer hover:opacity-80 ${
                    step.isRequired 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}
                >
                  {step.isRequired ? 'Required' : 'Optional'}
                </button>
              ) : step.isRequired ? (
                <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  Required
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* Time */}
        <div className="w-[150px] flex-shrink-0">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
            <span>{step.estimatedHours}h</span>
          </div>
        </div>

        {/* Key */}
        <div className="w-[200px] flex-shrink-0">
          {isEditable ? (
            isEditingKey ? (
              <div className="flex items-center gap-2">
                <select
                  ref={keySelectRef}
                  value={editedKey}
                  onChange={(e) => setEditedKey(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleKeyCancel}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="px-2 py-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded">
                  {step.key}
                </span>
                <button 
                  onClick={handleKeyEdit}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )
          ) : (
            <span className="px-2 py-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded">
              {step.key}
            </span>
          )}
        </div>

        {/* Agent */}
        <div className="w-[200px] flex-shrink-0">
          {step.agentName && step.agentName !== 'none' ? (
            <div className="flex items-center gap-2">
              {step.agentName === 'Diana' && (
                <img 
                  src="/assets/diana-avatar.png" 
                  alt="Diana" 
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              {step.agentName === 'Fiona' && (
                <img 
                  src="/assets/fiona-avatar.png" 
                  alt="Fiona" 
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs border ${
                step.agentName === 'Diana' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                step.agentName === 'Fiona' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                step.agentName === 'Sophia' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                {step.agentName}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">Unassigned</span>
          )}
        </div>

        {/* Agent Description */}
        <div className="w-[200px] flex-shrink-0">
          {step.agentDescription ? (
            <span className="text-xs text-gray-600 line-clamp-2">{step.agentDescription}</span>
          ) : (
            <span className="text-xs text-gray-400">No description</span>
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
          const newSteps = arrayMove(items, oldIndex, newIndex);
          onStepsReorder?.(newSteps);
          return newSteps;
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-500">Total Steps</div>
          <div className="text-2xl font-semibold text-gray-900">{summary.totalSteps}</div>
          <div className="text-sm text-gray-500">Estimated Hours</div>
          <div className="text-2xl font-semibold text-gray-900">{summary.totalEstimatedHours}</div>
          <div className="text-sm text-gray-500">Required Steps</div>
          <div className="text-2xl font-semibold text-gray-900">{summary.requiredSteps}</div>
          <div className="text-sm text-gray-500">Optional Steps</div>
          <div className="text-2xl font-semibold text-gray-900">{summary.optionalSteps}</div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Table Headers */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className={`flex items-center min-h-[48px] ${isEditable ? 'pl-12' : 'pl-4'} pr-4 text-sm font-medium text-gray-500`}>
            <div className="w-[80px] flex-shrink-0">Sl.No</div>
            <div className="w-[400px] flex-shrink-0">Name</div>
            <div className="w-[150px] flex-shrink-0">Time</div>
            <div className="w-[200px] flex-shrink-0">Key</div>
            <div className="w-[200px] flex-shrink-0">Agent</div>
            <div className="w-[200px] flex-shrink-0">Description</div>
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
              <div className="rounded-lg shadow-2xl">
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