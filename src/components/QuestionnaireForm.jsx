import React, { useState, useEffect } from 'react';
import { AlertCircle, ChevronLeft, Eye, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

// Reusable component for questionnaire form
const QuestionnaireForm = ({
  questionnaire,
  onBack,
  formData,
  setFormData,
  caseId,
  onComplete,
  savedFields = {},
  questionnaireStatus,
  setQuestionnaireStatus,
  setSavedFields,
  // Whether to track editing state (FN version) or not (regular version)
  trackEditing = false,
  // How many fields for educationalQualification (3 for regular, 4 for FN)
  eduFieldCount = 3,
  // Define education field names based on version
  eduFieldNames = ['degree', 'institution', 'years'],
  // Specify template ID access path (selectedQuestionnaire._id vs questionnaire._id)
  getTemplateId = (questionnaire) => questionnaire._id,
  // Optional external isSaving state
  isSaving: externalIsSaving
}) => {
  const [showOnlyEmpty, setShowOnlyEmpty] = useState(false);
  const [localFormData, setLocalFormData] = useState(formData);
  const [localIsSaving, setLocalIsSaving] = useState(false);
  const [editingFields, setEditingFields] = useState({});

  // Use external isSaving state if provided, otherwise use local
  const isSaving = externalIsSaving !== undefined ? externalIsSaving : localIsSaving;

  // Update local form data when parent form data changes
  useEffect(() => {
    setLocalFormData(formData);
  }, [formData]);

  // Add a new effect to track actively edited fields
  // This helps both the attorney and foreign national portals
  const [activeInputFields, setActiveInputFields] = useState({});
  
  // Mark a field as active when it receives focus
  const handleFieldFocus = (section, field, nestedField = null) => {
    const fieldKey = nestedField 
      ? `${section}.${field}.${nestedField}` 
      : `${section}.${field}`;
      
    setActiveInputFields(prev => ({
      ...prev,
      [fieldKey]: true
    }));
  };
  
  // Unmark a field when it loses focus, but only after a delay
  // This ensures the field stays visible while making edits
  const handleFieldBlur = (section, field, nestedField = null) => {
    const fieldKey = nestedField 
      ? `${section}.${field}.${nestedField}` 
      : `${section}.${field}`;
      
    // Use setTimeout to keep the field active briefly
    // This prevents fields from disappearing immediately when clicking elsewhere
    setTimeout(() => {
      setActiveInputFields(prev => {
        const newState = { ...prev };
        delete newState[fieldKey];
        return newState;
      });
    }, 500);
  };

  // Add function to mark a field as being edited (used in FN version)
  const startEditing = (section, field, nestedField = null) => {
    // For both tracking and non-tracking modes
    const fieldKey = nestedField 
      ? `${section}.${field}.${nestedField}` 
      : `${section}.${field}`;
    
    setEditingFields(prev => ({
      ...prev,
      [fieldKey]: true
    }));
  };

  // Check if a field is being edited (used in FN version)
  const isEditing = (section, field, nestedField = null) => {
    const fieldKey = nestedField 
      ? `${section}.${field}.${nestedField}` 
      : `${section}.${field}`;
    
    return editingFields[fieldKey];
  };

  // Function to check if a field is empty
  const isFieldEmpty = (section, field, nestedField = null) => {
    // For FN version with nested fields
    if (nestedField && trackEditing) {
      const value = localFormData?.[section]?.[field];
      if (field === 'educationalQualification') {
        return !value?.[nestedField] || (typeof value?.[nestedField] === 'string' && value[nestedField].trim() === '');
      }
      return !value || (typeof value === 'string' && value.trim() === '');
    }
    
    // For regular version
    if (field === 'educationalQualification') {
      const eduData = localFormData?.[section]?.[field] || [];
      if (!Array.isArray(eduData) || eduData.length === 0) return true;
      return eduData.some(edu => {
        if (typeof edu === 'string') return !edu;
        return !edu.degree || !edu.institution || !edu.years;
      });
    }
    
    return !localFormData?.[section]?.[field];
  };

  // Function to handle input changes
  const handleLocalInputChange = (section, field, value) => {
    // Always mark the field as being edited when it changes
    if (field === 'educationalQualification' && typeof value === 'object') {
      // For nested fields, determine which nested field changed
      const previousValue = localFormData?.[section]?.educationalQualification || {};
      
      // Find which specific subfield changed
      Object.keys(value).forEach(key => {
        if (value[key] !== previousValue[key]) {
          // Mark this specific subfield as being edited
          startEditing(section, field, key);
        }
      });
    } else {
      // For regular fields, mark the entire field as being edited
      startEditing(section, field);
    }
    
    // Update form data 
    setLocalFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value
      }
    }));
  };

  // Function to get field styling class
  const getFieldClassName = (section, field, nestedField = null) => {
    // For FN version with tracking
    if (trackEditing) {
      if (field === 'educationalQualification' && nestedField) {
        // Current value in the input field
        const value = localFormData?.[section]?.educationalQualification?.[nestedField];
        // Saved value from the database
        const savedValue = savedFields?.[section]?.educationalQualification?.[nestedField];
        
        // If field is empty, show red
        if (!value || value.trim() === '') {
          return 'border-red-300 bg-red-50/50';
        }
        
        // If field value differs from saved value, show blue (edited)
        if (value !== savedValue) {
          return 'border-blue-300 bg-blue-50/50';
        }
        
        // Otherwise show gray (saved and filled)
        return 'border-gray-200 bg-gray-50';
      }
      
      // Current value in the input field
      const value = localFormData?.[section]?.[field];
      // Saved value from the database
      const savedValue = savedFields?.[section]?.[field];
      
      // If field is empty, show red
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return 'border-red-300 bg-red-50/50';
      }
      
      // If field value differs from saved value, show blue (edited)
      if (value !== savedValue) {
        return 'border-blue-300 bg-blue-50/50';
      }
      
      // Otherwise show gray (saved and filled)
      return 'border-gray-200 bg-gray-50';
    }
    
    // For regular version
    // If field is empty, highlight in red
    if (isFieldEmpty(section, field, nestedField)) {
      return 'border-red-300 bg-red-50/50 focus:border-red-400';
    }
    return 'border-gray-200 focus:border-blue-400';
  };

  // Function to handle form save
  const handleLocalSave = async () => {
    try {
      setLocalIsSaving(true);
      
      // Update parent state
      setFormData(localFormData);
      
      // If we have an external save handler, use it
      if (onComplete) {
        // For CaseDetails.jsx or FNCaseDetails.jsx that handle their own saving
        onComplete(localFormData);
        return; // Exit early since external component will handle the save
      }
      
      // Otherwise, perform local save
      const response = await api.put(`/questionnaire-responses/management/${caseId}`, {
        templateId: getTemplateId(questionnaire),
        processedInformation: localFormData
      });

      if (response.data.status === 'success') {
        toast.success('Changes saved successfully');
        
        // Handle post-save actions
        if (trackEditing) {
          // FN version
          if (setSavedFields) {
            // Deep copy the localFormData to ensure it's completely updated
            const updatedData = JSON.parse(JSON.stringify(localFormData));
            setSavedFields(updatedData);
            // Update local form data to reflect the saved state
            setLocalFormData(updatedData);
          }
          
          if (setQuestionnaireStatus) setQuestionnaireStatus('saved');
          // Clear editing state since all fields are now saved
          setEditingFields({});
        } else {
          // Regular version
          if (onComplete) onComplete();
        }
      }
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      toast.error('Failed to save changes');
    } finally {
      setLocalIsSaving(false);
    }
  };

  // Function to count filled fields
  const getFilledFieldsCount = () => {
    let totalFields = 0;
    let filledFields = 0;

    // Count Passport fields
    const passportFields = questionnaire.field_mappings.filter(field => field.sourceDocument === 'Passport');
    totalFields += passportFields.length;
    passportFields.forEach(field => {
      if (localFormData?.Passport?.[field.fieldName]) {
        filledFields++;
      }
    });

    // Count Resume fields
    const resumeFields = questionnaire.field_mappings.filter(field => field.sourceDocument === 'Resume');
    resumeFields.forEach(field => {
      if (field.fieldName === 'educationalQualification') {
        // Count each subfield of educationalQualification as separate fields
        totalFields += eduFieldCount;
        
        if (trackEditing) {
          // FN version (with named fields)
          eduFieldNames.forEach(subfield => {
            if (localFormData?.Resume?.educationalQualification?.[subfield]) {
              filledFields++;
            }
          });
        } else {
          // Regular version (with array/object format)
          if (Array.isArray(localFormData?.Resume?.educationalQualification)) {
            // For array format
            const edu = localFormData?.Resume?.educationalQualification[0] || {};
            if (typeof edu === 'string' || edu.degree) filledFields++; // Degree
            if (typeof edu !== 'string' && edu.institution) filledFields++; // Institution
            if (typeof edu !== 'string' && (edu.years || edu.duration)) filledFields++; // Years
          } else if (localFormData?.Resume?.educationalQualification) {
            // For object format
            const edu = localFormData?.Resume?.educationalQualification;
            if (edu.degree) filledFields++; // Degree
            if (edu.institution) filledFields++; // Institution
            if (edu.years) filledFields++; // Years
          }
        }
      } else {
        totalFields += 1;
        if (localFormData?.Resume?.[field.fieldName]) {
          filledFields++;
        }
      }
    });

    return { filledFields, totalFields };
  };

  // Function to check if a field should be visible
  const shouldShowField = (section, field, nestedField = null) => {
    // If not showing only empty fields, show all fields
    if (!showOnlyEmpty) {
      return true;
    }
    
    // If the field is currently being edited, always show it
    const fieldKey = nestedField 
      ? `${section}.${field.fieldName}.${nestedField}` 
      : `${section}.${field.fieldName}`;
      
    // Check if the field is being actively edited (has focus)
    if (activeInputFields[fieldKey]) {
      return true;
    }
    
    // Check if it's marked as being edited in tracking mode
    if (editingFields[fieldKey]) {
      return true;
    }
    
    // Special handling for educationalQualification
    if (field.fieldName === 'educationalQualification') {
      if (nestedField) {
        // For nested fields (like degree, institution, years)
        let isEmpty = false;
        let isUnsaved = false;
        
        if (trackEditing) {
          // FN version - direct property access
          const value = localFormData?.[section]?.educationalQualification?.[nestedField];
          isEmpty = !value || value.trim() === '';
          
          // Check if the field is unsaved (edited but not saved)
          const savedValue = savedFields?.[section]?.educationalQualification?.[nestedField];
          isUnsaved = value !== savedValue;
        } else {
          // Regular version - array or object based format
          const eduData = localFormData?.[section]?.educationalQualification;
          
          if (Array.isArray(eduData) && eduData.length > 0) {
            const firstEdu = eduData[0];
            
            if (nestedField === 'degree') {
              isEmpty = !firstEdu || (typeof firstEdu === 'string' ? !firstEdu : !firstEdu.degree);
              
              // Check if degree is unsaved
              if (trackEditing && typeof firstEdu !== 'string' && firstEdu?.degree && 
                  Array.isArray(savedFields?.[section]?.educationalQualification)) {
                const savedEdu = savedFields?.[section]?.educationalQualification[0];
                isUnsaved = firstEdu.degree !== (savedEdu?.degree || '');
              }
            } else if (nestedField === 'institution') {
              isEmpty = !firstEdu || (typeof firstEdu === 'string' ? true : !firstEdu.institution);
              
              // Check if institution is unsaved
              if (trackEditing && typeof firstEdu !== 'string' && firstEdu?.institution && 
                  Array.isArray(savedFields?.[section]?.educationalQualification)) {
                const savedEdu = savedFields?.[section]?.educationalQualification[0];
                isUnsaved = firstEdu.institution !== (savedEdu?.institution || '');
              }
            } else if (nestedField === 'years') {
              isEmpty = !firstEdu || (typeof firstEdu === 'string' ? true : (!firstEdu.years && !firstEdu.duration));
              
              // Check if years is unsaved
              if (trackEditing && typeof firstEdu !== 'string' && firstEdu?.years && 
                  Array.isArray(savedFields?.[section]?.educationalQualification)) {
                const savedEdu = savedFields?.[section]?.educationalQualification[0];
                isUnsaved = firstEdu.years !== (savedEdu?.years || '');
              }
            }
          } else if (typeof eduData === 'object' && eduData) {
            if (nestedField === 'degree') {
              isEmpty = !eduData.degree;
              // Check if degree is unsaved
              if (trackEditing && eduData.degree && typeof savedFields?.[section]?.educationalQualification === 'object') {
                isUnsaved = eduData.degree !== (savedFields?.[section]?.educationalQualification?.degree || '');
              }
            }
            if (nestedField === 'institution') {
              isEmpty = !eduData.institution;
              // Check if institution is unsaved
              if (trackEditing && eduData.institution && typeof savedFields?.[section]?.educationalQualification === 'object') {
                isUnsaved = eduData.institution !== (savedFields?.[section]?.educationalQualification?.institution || '');
              }
            }
            if (nestedField === 'years') {
              isEmpty = !eduData.years;
              // Check if years is unsaved
              if (trackEditing && eduData.years && typeof savedFields?.[section]?.educationalQualification === 'object') {
                isUnsaved = eduData.years !== (savedFields?.[section]?.educationalQualification?.years || '');
              }
            }
          } else {
            isEmpty = true;
          }
        }
        
        // Show field if it's either empty or unsaved
        return isEmpty || isUnsaved;
      }
      
      // Also check if any sub-field is active
      if (eduFieldNames.some(subfield => 
        activeInputFields[`${section}.${field.fieldName}.${subfield}`])) {
        return true;
      }
      
      // For the parent field, show if any nested field is empty
      let hasEmptyField = false;
      let hasUnsavedField = false;
      
      if (trackEditing) {
        // FN version
        eduFieldNames.forEach(subfield => {
          const value = localFormData?.[section]?.educationalQualification?.[subfield];
          const savedValue = savedFields?.[section]?.educationalQualification?.[subfield];
          
          if (!value || value.trim() === '') {
            hasEmptyField = true;
          }
          
          if (value !== savedValue) {
            hasUnsavedField = true;
          }
        });
      } else {
        // Regular version
        const eduData = localFormData?.[section]?.educationalQualification;
        
        if (!eduData) {
          hasEmptyField = true;
        } else if (Array.isArray(eduData) && eduData.length > 0) {
          const firstEdu = eduData[0];
          hasEmptyField = !firstEdu || 
                          (typeof firstEdu === 'string' ? true : 
                           (!firstEdu.degree || !firstEdu.institution || !firstEdu.years));
                           
          // Check if any field is unsaved
          if (trackEditing && typeof firstEdu !== 'string' && 
              Array.isArray(savedFields?.[section]?.educationalQualification)) {
            const savedEdu = savedFields?.[section]?.educationalQualification[0] || {};
            
            if (firstEdu.degree !== (savedEdu.degree || '')) hasUnsavedField = true;
            if (firstEdu.institution !== (savedEdu.institution || '')) hasUnsavedField = true;
            if (firstEdu.years !== (savedEdu.years || '')) hasUnsavedField = true;
          }
        } else if (typeof eduData === 'object') {
          hasEmptyField = !eduData.degree || !eduData.institution || !eduData.years;
          
          // Check if any field is unsaved
          if (trackEditing && typeof savedFields?.[section]?.educationalQualification === 'object') {
            const savedEdu = savedFields[section].educationalQualification || {};
            
            if (eduData.degree !== (savedEdu.degree || '')) hasUnsavedField = true;
            if (eduData.institution !== (savedEdu.institution || '')) hasUnsavedField = true;
            if (eduData.years !== (savedEdu.years || '')) hasUnsavedField = true;
          }
        }
      }
      
      // Show if any subfield is either empty or unsaved
      return hasEmptyField || hasUnsavedField;
    }
    
    // For regular fields, also check if they're unsaved
    const value = localFormData?.[section]?.[field.fieldName];
    const savedValue = savedFields?.[section]?.[field.fieldName];
    const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
    const isUnsaved = trackEditing && value !== savedValue;
    
    return isEmpty || isUnsaved;
  };

  const { filledFields, totalFields } = getFilledFieldsCount();

  return (
    <div className="p-6">
      {/* Header with Back Button */}
      <div className="mb-6 flex justify-between">
        <div className="flex items-center gap-8">
          <button 
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-8">
              <h2 className="text-lg font-medium text-gray-900">Questionnaire</h2>
            </div>
            <p className="text-sm text-gray-600">{questionnaire.questionnaire_name}</p>
          </div>
        </div>
        <div className='flex items-center gap-4'>
          {/* Empty Fields Toggle Button */}
          <button
            onClick={() => setShowOnlyEmpty(!showOnlyEmpty)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2
              ${showOnlyEmpty 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {showOnlyEmpty ? (
              <>
                <Eye className="w-4 h-4" />
                Show All Fields
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                Show Empty Fields
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              {filledFields} out of {totalFields} fields completed
            </div>
            {/* Progress bar with animated dots */}
            <div className="relative w-32">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${(filledFields / totalFields) * 100}%` }}
                />
              </div>
              {/* Animated dots for remaining fields */}
              {filledFields < totalFields && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-end pr-2">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-gray-400/50 animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 rounded-full bg-gray-400/50 animate-pulse" style={{ animationDelay: '200ms' }} />
                    <div className="w-1 h-1 rounded-full bg-gray-400/50 animate-pulse" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleLocalSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-6">
        {/* Passport Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Passport Information</h3>
          <div className="grid grid-cols-3 gap-4">
            {questionnaire.field_mappings
              .filter(field => field.sourceDocument === 'Passport')
              .map(field => (
                shouldShowField('Passport', field) && (
                  <div key={field._id}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {field.fieldName}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      value={localFormData?.Passport?.[field.fieldName] || ''}
                      onChange={(e) => handleLocalInputChange('Passport', field.fieldName, e.target.value)}
                      onFocus={() => handleFieldFocus('Passport', field.fieldName)}
                      onBlur={() => handleFieldBlur('Passport', field.fieldName)}
                      className={`w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 
                        ${getFieldClassName('Passport', field.fieldName)}`}
                    />
                  </div>
                )
              ))}
          </div>
        </div>

        {/* Resume Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Professional Information</h3>
          <div className="grid grid-cols-2 gap-4">
            {questionnaire.field_mappings
              .filter(field => field.sourceDocument === 'Resume')
              .map(field => {
                if (field.fieldName === 'educationalQualification') {
                  return shouldShowField('Resume', field) && (
                    <div key={field._id} className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">
                        {field.fieldName}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <div className="space-y-2">
                        {trackEditing ? (
                          // FN version (structured fields)
                          <div className="grid grid-cols-2 gap-4">
                            {eduFieldNames.map(subfield => {
                              // Only show fields that are empty when "Show Empty Fields" is toggled
                              const shouldShow = !showOnlyEmpty || subfield === 'gpa' || 
                                !localFormData?.Resume?.educationalQualification?.[subfield] || 
                                localFormData.Resume.educationalQualification[subfield].trim() === '' ||
                                activeInputFields[`Resume.educationalQualification.${subfield}`] ||
                                editingFields[`Resume.educationalQualification.${subfield}`];
                                
                              return shouldShow && (
                                <div key={subfield}>
                                  <label className="block text-xs text-gray-500 mb-1">
                                    {subfield.charAt(0).toUpperCase() + subfield.slice(1)}
                                  </label>
                                  <input
                                    type="text"
                                    value={localFormData?.Resume?.educationalQualification?.[subfield] || ''}
                                    onChange={(e) => {
                                      const newEdu = { 
                                        ...(localFormData?.Resume?.educationalQualification || {}),
                                        [subfield]: e.target.value 
                                      };
                                      
                                      // Only mark this specific field as being edited
                                      startEditing('Resume', 'educationalQualification', subfield);
                                      
                                      // Special case for GPA field to keep it visible
                                      if (subfield === 'gpa') {
                                        startEditing('Resume', 'educationalQualification', 'gpa');
                                      }
                                      
                                      handleLocalInputChange('Resume', 'educationalQualification', newEdu);
                                    }}
                                    onFocus={() => {
                                      handleFieldFocus('Resume', 'educationalQualification', subfield);
                                    }}
                                    onBlur={() => {
                                      // Special handling for GPA field to keep it in editing state
                                      if (subfield !== 'gpa') {
                                        handleFieldBlur('Resume', 'educationalQualification', subfield);
                                      }
                                    }}
                                    className={`w-full px-3 py-1.5 border rounded text-sm
                                      ${getFieldClassName('Resume', 'educationalQualification', subfield)}`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          // Regular version (array or object format)
                          Array.isArray(localFormData?.Resume?.educationalQualification)
                            ? localFormData.Resume.educationalQualification.map((edu, index) => (
                              <div key={index} className="grid grid-cols-3 gap-2">
                                {(!showOnlyEmpty || shouldShowField('Resume', field, 'degree')) && (
                                  <input
                                    type="text"
                                    value={typeof edu === 'string' ? edu : edu.degree || ''}
                                    placeholder="Degree"
                                    onChange={(e) => {
                                      const newEdu = [...localFormData.Resume.educationalQualification];
                                      newEdu[index] = typeof edu === 'string' 
                                        ? e.target.value
                                        : { ...newEdu[index], degree: e.target.value };
                                      
                                      // Always mark field as editing so it stays visible
                                      startEditing('Resume', 'educationalQualification', 'degree');
                                      
                                      handleLocalInputChange('Resume', 'educationalQualification', newEdu);
                                    }}
                                    onFocus={() => handleFieldFocus('Resume', 'educationalQualification', 'degree')}
                                    onBlur={() => handleFieldBlur('Resume', 'educationalQualification', 'degree')}
                                    className={`w-full px-3 py-1.5 border rounded text-sm
                                      ${!edu || (typeof edu !== 'string' && !edu.degree)
                                        ? 'border-red-300 bg-red-50/50 focus:border-red-400'
                                        : (
                                          trackEditing && 
                                          savedFields?.Resume?.educationalQualification && 
                                          Array.isArray(savedFields.Resume.educationalQualification) && 
                                          typeof edu !== 'string' && 
                                          edu.degree !== (savedFields.Resume.educationalQualification[index]?.degree || '')
                                        ) 
                                        ? 'border-blue-300 bg-blue-50/50 focus:border-blue-400'
                                        : 'border-gray-200 focus:border-blue-400'
                                      }`}
                                  />
                                )}
                                {(!showOnlyEmpty || shouldShowField('Resume', field, 'institution')) && (
                                  <input
                                    type="text"
                                    value={typeof edu === 'string' ? '' : edu.institution || ''}
                                    placeholder="Institution"
                                    onChange={(e) => {
                                      const newEdu = [...localFormData.Resume.educationalQualification];
                                      newEdu[index] = { 
                                        ...(typeof edu === 'string' ? { degree: edu } : newEdu[index]), 
                                        institution: e.target.value 
                                      };
                                      
                                      // Always mark field as editing so it stays visible
                                      startEditing('Resume', 'educationalQualification', 'institution');
                                      
                                      handleLocalInputChange('Resume', 'educationalQualification', newEdu);
                                    }}
                                    onFocus={() => handleFieldFocus('Resume', 'educationalQualification', 'institution')}
                                    onBlur={() => handleFieldBlur('Resume', 'educationalQualification', 'institution')}
                                    className={`w-full px-3 py-1.5 border rounded text-sm
                                      ${!edu || (typeof edu !== 'string' && !edu.institution)
                                        ? 'border-red-300 bg-red-50/50 focus:border-red-400'
                                        : (
                                          trackEditing && 
                                          savedFields?.Resume?.educationalQualification && 
                                          Array.isArray(savedFields.Resume.educationalQualification) && 
                                          typeof edu !== 'string' && 
                                          edu.institution !== (savedFields.Resume.educationalQualification[index]?.institution || '')
                                        ) 
                                        ? 'border-blue-300 bg-blue-50/50 focus:border-blue-400'
                                        : 'border-gray-200 focus:border-blue-400'
                                      }`}
                                  />
                                )}
                                {(!showOnlyEmpty || shouldShowField('Resume', field, 'years')) && (
                                  <input
                                    type="text"
                                    value={typeof edu === 'string' ? '' : (edu.years || edu.duration || '')}
                                    placeholder="Years"
                                    onChange={(e) => {
                                      const newEdu = [...localFormData.Resume.educationalQualification];
                                      newEdu[index] = { 
                                        ...(typeof edu === 'string' ? { degree: edu } : newEdu[index]), 
                                        years: e.target.value 
                                      };
                                      
                                      // Always mark field as editing so it stays visible
                                      startEditing('Resume', 'educationalQualification', 'years');
                                      
                                      handleLocalInputChange('Resume', 'educationalQualification', newEdu);
                                    }}
                                    onFocus={() => handleFieldFocus('Resume', 'educationalQualification', 'years')}
                                    onBlur={() => handleFieldBlur('Resume', 'educationalQualification', 'years')}
                                    className={`w-full px-3 py-1.5 border rounded text-sm
                                      ${!edu || (typeof edu !== 'string' && !edu.years && !edu.duration)
                                        ? 'border-red-300 bg-red-50/50 focus:border-red-400'
                                        : (
                                          trackEditing && 
                                          savedFields?.Resume?.educationalQualification && 
                                          Array.isArray(savedFields.Resume.educationalQualification) && 
                                          typeof edu !== 'string' && 
                                          edu.years !== (savedFields.Resume.educationalQualification[index]?.years || '')
                                        ) 
                                        ? 'border-blue-300 bg-blue-50/50 focus:border-blue-400'
                                        : 'border-gray-200 focus:border-blue-400'
                                      }`}
                                  />
                                )}
                              </div>
                            )) : (
                              <div className="grid grid-cols-3 gap-2">
                                {(!showOnlyEmpty || shouldShowField('Resume', field, 'degree')) && (
                                  <input
                                    type="text"
                                    value={localFormData?.Resume?.educationalQualification?.degree || ''}
                                    placeholder="Degree"
                                    onChange={(e) => {
                                      const newEdu = { ...localFormData.Resume.educationalQualification };
                                      newEdu.degree = e.target.value;
                                      
                                      // Always mark field as editing so it stays visible
                                      startEditing('Resume', 'educationalQualification', 'degree');
                                      
                                      handleLocalInputChange('Resume', 'educationalQualification', newEdu);
                                    }}
                                    onFocus={() => handleFieldFocus('Resume', 'educationalQualification', 'degree')}
                                    onBlur={() => handleFieldBlur('Resume', 'educationalQualification', 'degree')}
                                    className={`w-full px-3 py-1.5 border rounded text-sm
                                      ${!localFormData?.Resume?.educationalQualification?.degree
                                        ? 'border-red-300 bg-red-50/50 focus:border-red-400'
                                        : (
                                          trackEditing && 
                                          savedFields?.Resume?.educationalQualification && 
                                          typeof savedFields.Resume.educationalQualification === 'object' &&
                                          localFormData.Resume.educationalQualification.degree !== savedFields.Resume.educationalQualification.degree
                                        ) 
                                        ? 'border-blue-300 bg-blue-50/50 focus:border-blue-400'
                                        : 'border-gray-200 focus:border-blue-400'
                                      }`}
                                  />
                                )}
                                {(!showOnlyEmpty || shouldShowField('Resume', field, 'institution')) && (
                                  <input
                                    type="text"
                                    value={localFormData?.Resume?.educationalQualification?.institution || ''}
                                    placeholder="Institution"
                                    onChange={(e) => {
                                      const newEdu = { ...localFormData.Resume.educationalQualification };
                                      newEdu.institution = e.target.value;
                                      
                                      // Always mark field as editing so it stays visible
                                      startEditing('Resume', 'educationalQualification', 'institution');
                                      
                                      handleLocalInputChange('Resume', 'educationalQualification', newEdu);
                                    }}
                                    onFocus={() => handleFieldFocus('Resume', 'educationalQualification', 'institution')}
                                    onBlur={() => handleFieldBlur('Resume', 'educationalQualification', 'institution')}
                                    className={`w-full px-3 py-1.5 border rounded text-sm
                                      ${!localFormData?.Resume?.educationalQualification?.institution
                                        ? 'border-red-300 bg-red-50/50 focus:border-red-400'
                                        : (
                                          trackEditing && 
                                          savedFields?.Resume?.educationalQualification && 
                                          typeof savedFields.Resume.educationalQualification === 'object' &&
                                          localFormData.Resume.educationalQualification.institution !== savedFields.Resume.educationalQualification.institution
                                        ) 
                                        ? 'border-blue-300 bg-blue-50/50 focus:border-blue-400'
                                        : 'border-gray-200 focus:border-blue-400'
                                      }`}
                                  />
                                )}
                                {(!showOnlyEmpty || shouldShowField('Resume', field, 'years')) && (
                                  <input
                                    type="text"
                                    value={localFormData?.Resume?.educationalQualification?.years || ''}
                                    placeholder="Years"
                                    onChange={(e) => {
                                      const newEdu = { ...localFormData.Resume.educationalQualification };
                                      newEdu.years = e.target.value;
                                      
                                      // Always mark field as editing so it stays visible
                                      startEditing('Resume', 'educationalQualification', 'years');
                                      
                                      handleLocalInputChange('Resume', 'educationalQualification', newEdu);
                                    }}
                                    onFocus={() => handleFieldFocus('Resume', 'educationalQualification', 'years')}
                                    onBlur={() => handleFieldBlur('Resume', 'educationalQualification', 'years')}
                                    className={`w-full px-3 py-1.5 border rounded text-sm
                                      ${!localFormData?.Resume?.educationalQualification?.years
                                        ? 'border-red-300 bg-red-50/50 focus:border-red-400'
                                        : (
                                          trackEditing && 
                                          savedFields?.Resume?.educationalQualification && 
                                          typeof savedFields.Resume.educationalQualification === 'object' &&
                                          localFormData.Resume.educationalQualification.years !== savedFields.Resume.educationalQualification.years
                                        ) 
                                        ? 'border-blue-300 bg-blue-50/50 focus:border-blue-400'
                                        : 'border-gray-200 focus:border-blue-400'
                                      }`}
                                  />
                                )}
                              </div>
                            )
                        )}
                      </div>
                    </div>
                  );
                }

                return shouldShowField('Resume', field) && (
                  <div key={field._id}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {field.fieldName}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type={field.fieldName.toLowerCase().includes('email') ? 'email' : 'text'}
                      value={localFormData?.Resume?.[field.fieldName] || ''}
                      onChange={(e) => handleLocalInputChange('Resume', field.fieldName, e.target.value)}
                      onFocus={() => handleFieldFocus('Resume', field.fieldName)}
                      onBlur={() => handleFieldBlur('Resume', field.fieldName)}
                      className={`w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 
                        ${getFieldClassName('Resume', field.fieldName)}`}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Show message when no empty fields are found */}
      {showOnlyEmpty && 
       !questionnaire.field_mappings.some(field => 
         shouldShowField(field.sourceDocument, field)
       ) && (
        <div className="text-center py-8 text-gray-500">
          No empty required fields found!
        </div>
      )}
    </div>
  );
};

export default QuestionnaireForm; 