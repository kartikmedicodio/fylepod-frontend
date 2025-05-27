import React, { useState, useEffect } from 'react';
import { Clock, ChevronRight, Edit2, Check, X } from 'lucide-react';
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
import { useAuth } from '../../contexts/AuthContext';

const SortableStep = ({ step, index, isEditable, onUpdateStep, availableKeys }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isEditingTime, setIsEditingTime] = React.useState(false);
  const [isEditingKey, setIsEditingKey] = React.useState(false);
  const [editedName, setEditedName] = React.useState(step.name);
  const [editedTime, setEditedTime] = React.useState(step.estimatedHours);
  const [editedKey, setEditedKey] = React.useState(step.key);
  const inputRef = React.useRef(null);
  const timeInputRef = React.useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `${step._id}-${index}` // Use consistent unique ID
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
    setEditedName(step.name);
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

  const handleTimeEdit = () => {
    setIsEditingTime(true);
    // Focus the input after it becomes visible
    setTimeout(() => timeInputRef.current?.focus(), 0);
  };

  const handleTimeSave = () => {
    const newTime = parseFloat(editedTime);
    if (!isNaN(newTime) && newTime >= 0) {
      onUpdateStep(step.key, {
        ...step,
        estimatedHours: newTime
      });
    }
    setIsEditingTime(false);
  };

  const handleTimeCancel = () => {
    setEditedTime(step.estimatedHours);
    setIsEditingTime(false);
  };

  const handleTimeKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTimeSave();
    } else if (e.key === 'Escape') {
      handleTimeCancel();
    }
  };

  const handleKeyEdit = () => {
    setIsEditingKey(true);
  };

  const handleKeySave = () => {
    onUpdateStep(step.key, {
      ...step,
      key: editedKey
    });
    setIsEditingKey(false);
  };

  const handleKeyCancel = () => {
    setEditedKey(step.key);
    setIsEditingKey(false);
  };

  // In the SortableStep component, add console log for availableKeys
  console.log('Available keys in render:', availableKeys);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-white rounded-lg border border-gray-100 shadow-sm transition-all duration-200 ${
        isDragging ? 'z-50 shadow-xl scale-102' : ''
      }`}
      {...(isEditable ? attributes : {})}
    >
      {/* Drag Handle */}
      {isEditable && (
        <div
          {...listeners}
          className="absolute left-4 top-1/2 -translate-y-1/2 cursor-move p-2 rounded-md hover:bg-gray-50 active:bg-gray-100"
        >
          <div className="flex flex-col gap-1">
            <div className="w-4 h-0.5 bg-gray-300 rounded-full" />
            <div className="w-4 h-0.5 bg-gray-300 rounded-full" />
            <div className="w-4 h-0.5 bg-gray-300 rounded-full" />
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className={`grid grid-cols-12 items-center gap-6 p-4 ${isEditable ? 'pl-16' : 'pl-4'}`}>
        {/* Step Number */}
        <div className="col-span-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-medium">
            {index + 1}
          </div>
        </div>

        {/* Name with Required Badge */}
        <div className="col-span-3">
          <div className="flex items-center gap-2">
            {isEditing ? (
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
                <button
                  onClick={handleSave}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <span className="font-medium text-gray-900">{step.name}</span>
                {isEditable ? (
                  <button
                    onClick={handleEditClick}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                ) : null}
              </div>
            )}
            {isEditable ? (
              <button
                onClick={toggleRequired}
                className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium transition-colors
                  ${step.isRequired 
                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' 
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
              >
                {step.isRequired ? 'Required' : 'Optional'}
              </button>
            ) : step.isRequired ? (
              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                Required
              </span>
            ) : null}
          </div>
        </div>

        {/* Description */}
        <div className="col-span-4 text-sm text-gray-600">
          {step.description}
        </div>

        {/* Time Estimate */}
        <div className="col-span-2 flex items-center">
          {isEditable ? (
            isEditingTime ? (
              <div className="flex items-center gap-2">
                <input
                  ref={timeInputRef}
                  type="number"
                  min="0"
                  step="0.5"
                  value={editedTime}
                  onChange={(e) => setEditedTime(e.target.value)}
                  onKeyDown={handleTimeKeyDown}
                  className="w-20 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Hours..."
                />
                <button
                  onClick={handleTimeSave}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleTimeCancel}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                  <span>{step.estimatedHours} hours</span>
                </div>
                <button
                  onClick={handleTimeEdit}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )
          ) : (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
              <span>{step.estimatedHours} hours</span>
            </div>
          )}
        </div>

        {/* Key */}
        <div className="col-span-2">
          {isEditable ? (
            isEditingKey ? (
              <div className="flex items-center gap-2">
                <select
                  value={editedKey}
                  onChange={(e) => setEditedKey(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a key</option>
                  {availableKeys && availableKeys.length > 0 ? (
                    availableKeys.map((keyOption) => (
                      <option key={keyOption.key} value={keyOption.key}>
                        {keyOption.name || keyOption.key}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading keys...</option>
                  )}
                </select>
                <button
                  onClick={handleKeySave}
                  disabled={!editedKey}
                  className={`p-1 ${editedKey ? 'text-green-600 hover:bg-green-50' : 'text-gray-400'} rounded`}
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
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 text-xs text-gray-600 border border-gray-200">
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
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 text-xs text-gray-600 border border-gray-200">
              {step.key}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const WorkflowSteps = ({ steps: initialSteps, summary, onStepsReorder, isEditable = false, caseId }) => {
  const [steps, setSteps] = useState(initialSteps);
  const [activeId, setActiveId] = useState(null);
  const [availableKeys, setAvailableKeys] = useState([]);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchWorkflowKeys = async () => {
      try {
        const token = localStorage.getItem('auth_token'); // Get token from localStorage
        console.log('Token:', token);
        
        if (!token) {
          console.error('No auth token found');
          return;
        }

        console.log('Fetching workflow keys...');
        const response = await fetch('http://localhost:5001/api/workflow-keys', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Response:', response);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch workflow keys: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Workflow keys data:', data);
        
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

  // Add handler for updating step details
  const handleUpdateStep = (stepKey, updatedStep) => {
    const newSteps = steps.map(step => 
      step.key === stepKey ? updatedStep : step
    );
    setSteps(newSteps);
    onStepsReorder?.(newSteps); // Use the same handler to save updates
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

  // Add a function to generate a unique key for each step
  const getUniqueStepKey = (step, index) => {
    // Use a combination of _id, key, and index to ensure uniqueness
    return step._id 
      ? `${step._id}-${index}` 
      : `step-${step.key}-${index}-${Date.now()}`;
  };

  // If not editable, just render the steps without DnD context
  if (!isEditable) {
    return (
      <div className="space-y-3">
        {steps.map((step, index) => (
          <SortableStep
            key={getUniqueStepKey(step, index)}
            step={step}
            index={index}
            isEditable={false}
            availableKeys={availableKeys}
          />
        ))}
      </div>
    );
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((item) => item.key === active.id);
        const newIndex = items.findIndex((item) => item.key === over.id);

        const newSteps = arrayMove(items, oldIndex, newIndex);
        onStepsReorder?.(newSteps);
        return newSteps;
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

      {/* Steps section */}
      <div className="space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={steps.map(step => getUniqueStepKey(step, steps.indexOf(step)))}
            strategy={verticalListSortingStrategy}
          >
            {steps.map((step, index) => (
              <div key={getUniqueStepKey(step, index)}>
                <SortableStep
                  step={step}
                  index={index}
                  isEditable={isEditable}
                  onUpdateStep={handleUpdateStep}
                  availableKeys={availableKeys}
                />
              </div>
            ))}
          </SortableContext>

          <DragOverlay>
            {activeId ? (
              <div className="bg-white rounded-lg border border-gray-100 shadow-xl">
                <SortableStep
                  step={steps.find((step, idx) => getUniqueStepKey(step, idx) === activeId)}
                  index={steps.findIndex((step, idx) => getUniqueStepKey(step, idx) === activeId)}
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

export default WorkflowSteps; 