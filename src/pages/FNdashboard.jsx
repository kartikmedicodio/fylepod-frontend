import React, { useState, useEffect, Fragment, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { toast } from 'react-hot-toast';
import { Check, FileText, Users, ClipboardCheck, Clock, Sun, Moon, Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
// import DianaAvatar from '../assets/diana-avatar.png';
// import FionaAvatar from '../assets/fiona-avatar.png';

// Loading skeleton component
const DashboardSkeleton = () => {
  return (
    <div className="w-full">
      <div className="px-6 py-4">
        <div className="max-w-[2000px] mx-auto">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2.5 rounded-lg">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Profile Cards Grid Skeleton */}
          <div className="grid grid-cols-2 gap-6">
            {/* Diana's Card Skeleton */}
            <div className="flex flex-col rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm h-full">
              {/* Profile Section */}
              <div className="relative px-8 py-6 bg-white min-h-[180px]">
                <div className="flex items-center">
                  <div className="w-40 h-40 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="flex-1 ml-8">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description Section */}
              <div className="border-b border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse"></div>
                  <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Pending Documents Section */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-center">
                  <div className="h-10 w-32 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Fiona's Card Skeleton */}
            <div className="flex flex-col rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm h-full">
              {/* Profile Section */}
              <div className="relative px-8 py-6 bg-white min-h-[180px]">
                <div className="flex items-center">
                  <div className="w-40 h-40 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="flex-1 ml-8">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description Section */}
              <div className="border-b border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse"></div>
                  <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Cases Section */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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

const ProfileCard = ({ cases, pendingCase, onCaseClick, setCurrentBreadcrumb, navigate }) => {
  const { user } = useAuth();
  const [agents, setAgents] = useState(null);

  const fetchAgents = async () => {
    try {
      const response = await api.get('/agents');
      if (response.data.success) {
        const agentObject = response.data.data.reduce((acc, agent) => {
          acc[agent.agentId] = agent;
          return acc;
        }, {});
        setAgents(agentObject);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCaseClick = (caseId) => {
    navigate(`/individuals/case/${caseId}`);
  };

  return (
    <div className="grid grid-cols-2 gap-6 mt-4">
      {/* Diana's Card */}
      <div className="flex flex-col rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm h-full">
        {/* Profile Section */}
        <div className="relative px-8 py-2 bg-white min-h-[180px]">
          {/* Gradient Rectangle */}
          <div 
            className="absolute top-1/2 left-[20px] -translate-y-1/2 w-[95%] h-[140px] rounded-2xl"
            style={{ 
              background: 'linear-gradient(98.3deg, rgba(167, 247, 193, 0.6) 12.5%, rgba(51, 97, 255, 0.4) 131.61%)',
              boxShadow: '0 8px 32px rgba(0, 13, 59, 0.05)'
            }}
          />
          
          <div className="relative flex items-center">
            {/* Profile Image - Overlapping */}
            <div className="w-40 h-40 rounded-full overflow-hidden bg-white flex-shrink-0 transform hover:scale-105 transition-transform duration-300 relative z-10">
              <img 
                src="/assets/diana-avatar.png"
                alt={`${agents?.["1"]?.name || 'Diana'} - ${agents?.["1"]?.role || 'Agent'}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 ml-8 py-4">
              <div>
                <h2 className="text-xl font-semibold text-[#000D3B]">
                  Hello {user?.name || 'there'}, I am {agents?.["1"]?.name || 'Diana'}
                </h2>
                <p className="text-[#000D3B] opacity-90 font-medium text-base">
                  {agents?.["1"]?.role || 'Your Data Collector'}
                </p>
                <div >
                  <p className="text-[#000D3B] opacity-70 text-sm flex items-center gap-2">
                    <span className="font-medium">Status:</span> {agents?.["1"]?.status || 'Active Since 1 month'}
                  </p>
                  <p className="text-[#000D3B] opacity-70 text-sm flex items-center gap-2">
                    <span className="font-medium">Age:</span> {agents?.["1"]?.age || '1 month'}
                  </p>
                  <p className="text-[#000D3B] opacity-70 text-sm flex items-center gap-2">
                    <span className="font-medium">ID:</span> {agents?.["1"]?.agentId || '1'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Description Section */}
        <div className="border-b border-gray-100">
          <div className="px-4 py-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-[#000D3B] font-medium text-md">
              {agents?.["1"]?.description || "I'm here to help you organize and manage your case documents efficiently."}
            </p>
          </div>
        </div>
        
        {/* Pending Documents Section */}
        <div className="relative bg-white flex-1"> 
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#000D3B] font-medium text-base">
                What You Need to Do today...
              </h3>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                {pendingCase?.documentTypes?.filter(doc => doc.status === 'pending').length || 0} Pending
              </span>
            </div>
            
            {pendingCase ? (
              <div className="text-[#000D3B] flex-1 flex flex-col">
                <div className="bg-blue-50/50 rounded-lg p-3 mb-4">
                  <p className="text-sm">
                    <span className="font-medium">{pendingCase.categoryName}</span> requires your attention
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300" style={{ maxHeight: "250px" }}>
                  <div className="grid grid-cols-2 gap-3">
                    {pendingCase.documentTypes
                      .filter(doc => doc.status === 'pending')
                      .map(doc => (
                        <div 
                          key={doc._id} 
                          className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-100 hover:border-blue-100 transition-colors cursor-pointer hover:bg-blue-50/5"
                          onClick={() => handleCaseClick(pendingCase._id)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="text-sm font-medium">{doc.name}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                <div className="mt-auto flex justify-center">
                  <button
                    onClick={onCaseClick}
                    className="w-[200px] px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-full transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow"
                  >
                    Get Started!
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[#000D3B] opacity-60 text-sm">
                  No pending documents at the moment. Great job staying on top of things!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fiona's Card */}
      <div className="flex flex-col rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm h-full">
        {/* Profile Section */}
        <div className="relative px-8 py-2 bg-white min-h-[180px]">
          {/* Gradient Rectangle */}
          <div 
            className="absolute top-1/2 left-[20px] -translate-y-1/2 w-[95%] h-[140px] rounded-2xl"
            style={{ 
              background: 'linear-gradient(to right, rgba(239, 98, 159, 0.4), rgba(238, 205, 163, 0.4))',
              boxShadow: '0 8px 32px rgba(0, 13, 59, 0.05)'
            }}
          />
          
          <div className="relative flex items-center">
            {/* Profile Image - Overlapping */}
            <div className="w-40 h-40 rounded-full overflow-hidden bg-white flex-shrink-0 transform hover:scale-105 transition-transform duration-300 relative z-10">
              <img 
                src="/assets/fiona-avatar.png"
                alt={`${agents?.["2"]?.name || 'Fiona'} - ${agents?.["2"]?.role || 'Case Manager'}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 ml-8 py-4">
              <div >
                <h2 className="text-xl font-semibold text-[#000D3B]">
                  Hello {user?.name || 'there'}, I am {agents?.["2"]?.name || 'Fiona'}
                </h2>
                <p className="text-[#000D3B] opacity-90 font-medium text-base">
                  {agents?.["2"]?.role || 'Your Case Manager'}
                </p>
                <div >
                  <p className="text-[#000D3B] opacity-70 text-sm flex items-center gap-2">
                    <span className="font-medium">Status:</span> {agents?.["2"]?.status || 'Active Since 1 month'}
                  </p>
                  <p className="text-[#000D3B] opacity-70 text-sm flex items-center gap-2">
                    <span className="font-medium">Age:</span> {agents?.["2"]?.age || '1 month'}
                  </p>
                  <p className="text-[#000D3B] opacity-70 text-sm flex items-center gap-2">
                    <span className="font-medium">ID:</span> {agents?.["2"]?.agentId || '2'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Description Section */}
        <div className="border-b border-gray-100">
          <div className="px-4 py-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-pink-500" />
            </div>
            <p className="text-[#000D3B] font-medium text-md">
              {agents?.["2"]?.description || "I'm here to guide you through your case and keep everything on track."}
            </p>
          </div>
        </div>
        
        {/* Cases Section */}
        <div className="p-4 flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#000D3B] font-medium text-base">
              Case Overview
            </h3>
            <span className="px-2.5 py-1 bg-pink-50 text-pink-600 text-xs font-medium rounded-full">
              {cases?.length || 0} Active
            </span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300" style={{ maxHeight: "300px" }}>
            <div className="space-y-3 pr-2">
              {cases?.map((caseItem) => (
                <div 
                  key={caseItem._id} 
                  className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-100 hover:border-pink-100 transition-colors cursor-pointer hover:bg-pink-50/5"
                  onClick={() => handleCaseClick(caseItem._id)}
                >
                  <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-pink-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#000D3B]">{caseItem.categoryName}</span>
                      <span className="text-xs text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                        {caseItem.categoryStatus === 'pending' ? 'In Progress' : 'Active'}
                      </span>
                    </div>
                    <div className="text-sm text-[#000D3B] opacity-70">
                      <span className="font-medium">{caseItem.userName}</span> • Last updated{' '}
                      {new Date(caseItem.updatedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {(!cases || cases.length === 0) && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No active cases at the moment
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProcessState = ({ state, status, validationErrors }) => {
  const [showErrors, setShowErrors] = useState(false);
  const popupRef = useRef(null);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [showErrors]);

  const handleMouseEnter = () => {
    if (status === 'error' && validationErrors?.length > 0) {
      setShowErrors(true);
    }
  };

  const handleMouseLeave = () => {
    setShowErrors(false);
  };

  const getStateStyles = () => {
    switch (status) {
      case 'success':
        return 'bg-emerald-50/30 border-emerald-100';
      case 'error':
        return 'bg-rose-50/30 border-rose-100';
      default:
        return 'bg-slate-50/30 border-slate-200';
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'success':
        return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
      case 'error':
        return 'bg-gradient-to-r from-rose-400 to-rose-500';
      default:
        return 'bg-slate-200';
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative flex flex-col items-center gap-1.5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* State Label */}
      <div 
        className={`text-[11px] font-medium whitespace-nowrap transition-colors ${
          status === 'error' ? 'text-rose-600' : 'text-slate-600'
        }`}
      >
        {state}
      </div>
      
      {/* Progress Bar Container */}
      <div 
        className={`w-16 h-2 rounded-full border ${getStateStyles()} group-hover:brightness-95 transition-all`}
      >
        {/* Progress Bar Fill */}
        <div 
          className={`h-full rounded-full ${getProgressBarColor()} transition-all duration-300 backdrop-blur-sm`}
          style={{ 
            width: status === 'pending' ? '0%' : '100%',
            opacity: status === 'pending' ? 0.3 : 1
          }}
        />
      </div>

      {/* Verification Errors Popup */}
      {showErrors && validationErrors?.length > 0 && (
        <div 
          ref={popupRef}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10"
        >
          <div className="text-xs font-medium text-rose-700 mb-2">Verification Errors:</div>
          <div className="space-y-1.5">
            {validationErrors.map((error, index) => (
              <div key={index} className="text-xs text-gray-600">
                {error.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentStatusCards = ({ cases }) => {
  const navigate = useNavigate();

  const handleCaseClick = (caseId) => {
    navigate(`/individuals/case/${caseId}`);
  };

  const getDocumentStatus = (doc, caseItem) => {
    const hasVerificationResults = caseItem.verificationResults !== undefined;
    const validationErrors = doc.document?.validationResults?.validations?.filter(v => !v.passed) || [];
    
    switch (doc.status) {
      case 'approved':
        return {
          states: [
            { name: 'Document Uploaded', status: 'success' },
            { name: 'Verified', status: validationErrors.length > 0 ? 'error' : 'success', validationErrors },
            { name: 'Approved', status: 'success' }
          ],
          message: validationErrors.length > 0 ? 'Approved with Warnings' : 'Document Successfully Verified',
          messageClass: validationErrors.length > 0 ? 
            'text-amber-600 bg-amber-50/50 border-amber-100 ring-1 ring-amber-100/50' :
            'text-emerald-600 bg-emerald-50/50 border-emerald-100 ring-1 ring-emerald-100/50'
        };
      case 'rejected':
        return {
          states: [
            { name: 'Document Uploaded', status: 'success' },
            { name: 'Verified', status: hasVerificationResults ? 'error' : 'error', validationErrors },
            { name: 'Approved', status: 'pending' }
          ],
          message: validationErrors.length > 0 ? 'Verification Failed' : 'Document Rejected',
          messageClass: 'text-rose-600 bg-rose-50/50 border-rose-100 ring-1 ring-rose-100/50'
        };
      case 'uploaded':
        return {
          states: [
            { name: 'Document Uploaded', status: 'success' },
            { name: 'Verified', status: hasVerificationResults ? (validationErrors.length > 0 ? 'error' : 'success') : 'pending', validationErrors },
            { name: 'Approved', status: 'pending' }
          ],
          message: !hasVerificationResults ? 'Document Under Review' :
            validationErrors.length > 0 ? 'Verification Issues Found' : 'Ready for Approval',
          messageClass: !hasVerificationResults
            ? 'text-indigo-700 bg-indigo-50 border-indigo-200 ring-1 ring-indigo-100/50'
            : validationErrors.length > 0
              ? 'text-amber-600 bg-amber-50/50 border-amber-100 ring-1 ring-amber-100/50'
              : 'text-blue-600 bg-blue-50/50 border-blue-100 ring-1 ring-blue-100/50'
        };
      default:
        return {
          states: [
            { name: 'Document Uploaded', status: 'pending' },
            { name: 'Verified', status: 'pending' },
            { name: 'Approved', status: 'pending' }
          ],
          message: 'Awaiting Upload',
          messageClass: 'text-gray-700 bg-gray-100 border-gray-200 ring-1 ring-gray-200/50'
        };
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {cases.map((caseItem) => (
        <div 
          key={caseItem._id} 
          onClick={() => handleCaseClick(caseItem._id)}
          className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md 
            hover:border-blue-200 transition-all duration-200 cursor-pointer group"
        >
          {/* Case Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white
            group-hover:from-blue-50/30 group-hover:to-white transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 
                  border border-slate-200 flex items-center justify-center
                  group-hover:border-blue-200 group-hover:from-blue-50 group-hover:to-blue-100/50 
                  transition-colors">
                  <FileText className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {caseItem.categoryName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-500">Case #{caseItem._id.slice(-6)}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span className="text-sm text-slate-500">{caseItem.documentTypes.length} Documents</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div className="p-6">
            <div className="space-y-4">
              {caseItem.documentTypes.map((doc, index) => {
                const status = getDocumentStatus(doc, caseItem);
                return (
                  <div 
                    key={`${caseItem._id}-${index}`}
                    className="bg-white rounded-xl border border-slate-100 p-6 
                      group-hover:border-blue-100 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      {/* Document Icon */}
                      <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 
                        border border-slate-200 flex items-center justify-center
                        group-hover:border-blue-100 transition-colors">
                        <FileText className="w-5 h-5 text-slate-600" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          {/* Document Name */}
                          <h3 className="text-base font-medium text-slate-900 w-48">
                            {doc.name}
                          </h3>

                          {/* Progress States */}
                          <div className="flex items-center gap-20 flex-1 justify-center">
                            {status.states.map((state) => (
                              <ProcessState 
                                key={state.name}
                                state={state.name}
                                status={state.status}
                                validationErrors={state.validationErrors}
                              />
                            ))}
                          </div>

                          {/* Status Badge */}
                          {status.message && (
                            <span className={`text-sm font-medium px-3 py-1 rounded-full border 
                              shadow-sm backdrop-blur-sm whitespace-nowrap transition-colors
                              ${status.messageClass}`}>
                              {status.message}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const FNDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [pendingCase, setPendingCase] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState('');

  useEffect(() => {
    const fetchPendingDocuments = async () => {
      try {
        if (!user?.id) return;
        
        const response = await api.get('/management/users-with-documents', {
          params: {
            userIds: user.id
          }
        });

        if (response.data.status === 'success') {
          const allCases = response.data.data.entries || [];
          setCases(allCases);
          
          // Sort by updatedAt to get the most recent case
          const sortedCases = allCases.sort((a, b) => 
            new Date(b.updatedAt) - new Date(a.updatedAt)
          );

          // Find the first case that has any pending documents
          const caseWithPendingDocs = sortedCases.find(caseItem => 
            caseItem.documentTypes?.some(doc => doc.status === 'pending')
          );

          if (caseWithPendingDocs) {
            setPendingCase(caseWithPendingDocs);
          }
        }
      } catch (error) {
        console.error('Error fetching pending documents:', error);
        toast.error('Failed to fetch pending documents');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingDocuments();
  }, [user?.id]);

  const handleCaseClick = () => {
    if (pendingCase?._id) {
      setCurrentBreadcrumb([
        { label: 'All Cases', link: '/individual-cases' },
        { label: pendingCase.categoryName, link: `/individuals/case/${pendingCase._id}` }
      ]);
      navigate(`/individuals/case/${pendingCase._id}`);
    }
  };

  const getTimeIcon = () => {
    switch (timeOfDay) {
      case 'morning':
        return <Sun className="w-6 h-6 text-yellow-500" />;
      case 'afternoon':
        return <Sun className="w-6 h-6 text-orange-500" />;
      case 'evening':
        return <Cloud className="w-6 h-6 text-indigo-500" />;
      case 'night':
        return <Moon className="w-6 h-6 text-blue-500" />;
      default:
        return <Sun className="w-6 h-6 text-yellow-500" />;
    }
  };

  useEffect(() => {
    setCurrentBreadcrumb([
      { label: 'Dashboard', link: '/dashboard' }
    ]);
  }, [setCurrentBreadcrumb]);

  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      let newTimeOfDay = '';

      if (hour >= 5 && hour < 12) {
        newTimeOfDay = 'morning';
      } else if (hour >= 12 && hour < 17) {
        newTimeOfDay = 'afternoon';
      } else if (hour >= 17 && hour < 21) {
        newTimeOfDay = 'evening';
      } else {
        newTimeOfDay = 'night';
      }

      setTimeOfDay(newTimeOfDay);
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000);
    return () => clearInterval(interval);
  }, []);

  // Modified getStepMapping function to remove Filing step and show tick for Preparation
  const getStepMapping = (caseItem) => {
    const defaultSteps = ['Case Started', 'Docs Collection', 'In Review', 'Preparation'];
    let currentStep = 1;
    
    if (caseItem.documentTypes) {
      const totalDocs = caseItem.documentTypes.length;
      const uploadedDocs = caseItem.documentTypes.filter(doc => 
        doc.status === 'uploaded'
      ).length;
      const approvedDocs = caseItem.documentTypes.filter(doc => 
         doc.status === 'approved'
      ).length;

      if (uploadedDocs === 0) {
        currentStep = 1;
      } else if (uploadedDocs < totalDocs) {
        currentStep = 1;
      } else if (uploadedDocs === totalDocs) {
        currentStep = 2;
      }
      
      if (approvedDocs === totalDocs) {
        currentStep = 4;
      }
    }
    
    const previousStep = currentStep > 0 ? defaultSteps[currentStep - 1] : 'Case initiation';
    const nextStep = currentStep < defaultSteps.length ? 'Completion' : 'Completion';
    
    return {
      steps: defaultSteps,
      currentStep: currentStep,
      previousStep: previousStep,
      nextStep: nextStep
    };
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="w-full">
      <div className="px-6 py-4">
        <div className="max-w-[2000px] mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2.5 rounded-lg">
                {getTimeIcon()}
              </div>
              <div>
                <h1 
                  className="font-['Roboto_Flex'] text-[30px] leading-[21px] tracking-[0px] font-bold" 
                  style={{ color: '#000D3BCC' }}
                >
                  Good {timeOfDay}, {user?.name || 'there'}
                </h1>
                <p 
                  className="text-sm mt-2.5" 
                  style={{ color: '#000D3BCC', opacity: 0.7 }}
                >
                  We&apos;re here to help you stay on track. Here&apos;s what you can do today...
                </p>
              </div>
            </div>
          </div>
          
          <ProfileCard 
            cases={cases}
            pendingCase={pendingCase}
            onCaseClick={handleCaseClick}
            setCurrentBreadcrumb={setCurrentBreadcrumb}
            navigate={navigate}
          />
          
          {cases.length > 0 && (
            <DocumentStatusCards cases={cases} />
          )}
        </div>
      </div>
    </div>
  );
};

// Add this after your DocumentStatusCards component
DocumentStatusCards.propTypes = {
  cases: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      categoryName: PropTypes.string.isRequired,
      documentTypes: PropTypes.arrayOf(
        PropTypes.shape({
          _id: PropTypes.string.isRequired,
          documentTypeId: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          status: PropTypes.string.isRequired,
          errors: PropTypes.arrayOf(PropTypes.string),
          document: PropTypes.shape({
            validationResults: PropTypes.shape({
              validations: PropTypes.arrayOf(
                PropTypes.shape({
                  passed: PropTypes.bool,
                  message: PropTypes.string
                })
              )
            })
          })
        })
      ).isRequired,
      verificationResults: PropTypes.shape({
        mismatchErrors: PropTypes.arrayOf(PropTypes.object),
        missingErrors: PropTypes.arrayOf(PropTypes.object),
        summarizationErrors: PropTypes.arrayOf(PropTypes.object),
        verifiedAt: PropTypes.string
      }),
      updatedAt: PropTypes.string.isRequired,
      categoryStatus: PropTypes.string.isRequired
    })
  ).isRequired
};

export default FNDashboard;
