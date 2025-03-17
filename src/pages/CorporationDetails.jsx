import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import corporationService from '../services/corporationService';
import { Pencil, Save, Plus } from 'lucide-react';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import EmployeeList from '../components/employees/EmployeeList';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

const CorporationDetailsSkeleton = () => (
  <div className="p-4">
    {/* Tabs Skeleton */}
    <div className="flex gap-2 mb-6 bg-gray-100/80 p-1 w-fit rounded-lg">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="w-28 h-9 bg-gradient-to-r from-gray-100 to-gray-200 rounded-md animate-pulse"></div>
      ))}
    </div>

    {/* Main Content Skeleton */}
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start mb-8">
        <div className="h-7 w-40 bg-[#f9fafb] rounded animate-shimmer"></div>
        <div className="h-7 w-20 bg-[#f9fafb] rounded animate-shimmer"></div>
      </div>

      {/* Company Logo and Basic Info Skeleton */}
      <div className="mb-8">
        <div className="w-16 h-16 bg-[#f9fafb] rounded-lg mb-4 animate-shimmer"></div>
        <div className="grid grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i}>
              <div className="h-4 w-24 bg-[#fbfbfc] rounded mb-1 animate-shimmer"></div>
              <div className="h-10 bg-[#f9fafb] rounded-lg animate-shimmer"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information Skeleton */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {[...Array(2)].map((_, i) => (
          <div key={i}>
            <div className="h-4 w-24 bg-[#fbfbfc] rounded mb-1 animate-shimmer"></div>
            <div className="h-10 bg-[#f9fafb] rounded-lg animate-shimmer"></div>
          </div>
        ))}
      </div>

      {/* Additional Information Skeleton */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {[...Array(2)].map((_, i) => (
          <div key={i}>
            <div className="h-4 w-24 bg-[#fbfbfc] rounded mb-1 animate-shimmer"></div>
            <div className="h-10 bg-[#f9fafb] rounded-lg animate-shimmer"></div>
          </div>
        ))}
      </div>

      {/* Tax Information Skeleton */}
      <div>
        <div className="h-4 w-32 bg-[#fbfbfc] rounded mb-1 animate-shimmer"></div>
        <div className="h-10 bg-[#f9fafb] rounded-lg animate-shimmer"></div>
      </div>
    </div>

    {/* Additional Information Section Skeleton */}
    <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
      <div className="h-6 w-48 bg-[#f9fafb] rounded mb-6 animate-shimmer"></div>
      <div className="grid grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i}>
            <div className="h-4 w-24 bg-[#fbfbfc] rounded mb-1 animate-shimmer"></div>
            <div className="h-6 w-32 bg-[#f9fafb] rounded animate-shimmer"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CorporationDetails = () => {
  const { corporationId } = useParams();
  const navigate = useNavigate();
  const [corporation, setCorporation] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCorporation, setEditedCorporation] = useState(null);
  const [tabWidths, setTabWidths] = useState({});
  const [activeTabWidth, setActiveTabWidth] = useState(0);
  
  // Add ref for tab buttons
  const tabRefs = useRef([]);

  // First, let's define the tabs array at the component level
  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'employees', label: 'View Employees' },
    { id: 'documents', label: 'Documents', disabled: true }
  ];

  useEffect(() => {
    // Make sure this is inside a useEffect to avoid infinite renders
    setCurrentBreadcrumb([
      { name: 'Home', path: '/dashboard' },
      { name: 'Corporations', path: '/corporations' },
      { name: corporation?.company_name || 'Corporation Details', path: '#' }
    ]);
    return () => {
      setCurrentBreadcrumb([]);
    };
  }, [setCurrentBreadcrumb, corporation?.company_name]); // Add dependencies if needed

  useEffect(() => {
    fetchCorporationDetails();
  }, [corporationId]);

  useEffect(() => {
    if (corporation) {
      setEditedCorporation(corporation);
    }
  }, [corporation]);

  // Update active tab width when tab changes
  useEffect(() => {
    const activeTabElement = tabRefs.current[tabs.findIndex(tab => tab.id === activeTab)];
    if (activeTabElement) {
      const width = activeTabElement.offsetWidth;
      setActiveTabWidth(width);
    }
  }, [activeTab, tabs]);

  const fetchCorporationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await corporationService.getCorporationById(corporationId);
      if (response.success && response.data) {
        setCorporation(response.data);
        console.log(response.data);
      } else {
        setError('Failed to fetch corporation details');
      }
    } catch (error) {
      console.error('Error fetching corporation details:', error);
      setError(error.response?.data?.message || 'Failed to fetch corporation details');
    } finally {
      setLoading(false);
    }
  };

  const getFirstLetter = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await corporationService.updateCorporation(corporationId, editedCorporation);
      if (response.success) {
        setCorporation(response.data);
        setIsEditing(false);
      } else {
        setError('Failed to update corporation');
      }
    } catch (error) {
      console.error('Error updating corporation:', error);
      setError(error.response?.data?.message || 'Failed to update corporation');
    }
  };

  const handleInputChange = (field, value) => {
    setEditedCorporation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    setEditedCorporation(corporation);
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return <CorporationDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => navigate('/corporations')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Corporations
        </button>
      </div>
    );
  }

  if (!corporation) {
    return (
      <div className="p-6">
        <div className="text-gray-500 mb-4">Corporation not found</div>
        <button 
          onClick={() => navigate('/corporations')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Corporations
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4"
    >
      {/* Enhanced Tabs */}
      <div className="relative mb-6 w-fit">
        <div className="relative flex rounded-lg bg-gray-100/80 p-1">
          {/* Moving background */}
          <div
            className="absolute inset-y-1 transition-all duration-300 ease-out bg-blue-600 rounded-md"
            style={{
              left: '4px',
              width: `${activeTabWidth}px`,
              transform: `translateX(${
                tabRefs.current
                  .slice(0, tabs.findIndex(tab => tab.id === activeTab))
                  .reduce((acc, curr) => acc + (curr?.offsetWidth || 0), 0)
              }px)`
            }}
          />
          
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={el => tabRefs.current[index] = el}
              className={`
                relative flex items-center justify-center px-4 py-2 rounded-md text-sm
                transition-colors duration-200 z-10 whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'text-white'
                  : tab.disabled 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:text-gray-800'
                }
              `}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              title={tab.disabled ? "Coming soon" : ""}
            >
              {tab.label}
              {tab.disabled && (
                <span className="ml-1 text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'profile' ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex justify-between items-start mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Company Profile</h1>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        className="flex items-center gap-2 text-green-600 text-sm font-medium hover:text-green-700 
                                 border border-green-200 px-4 py-2 rounded-lg hover:bg-green-50 
                                 transition-colors duration-200"
                      >
                        <Save size={16} />
                        Save
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCancel}
                        className="flex items-center gap-2 text-gray-600 text-sm font-medium hover:text-gray-700 
                                 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 
                                 transition-colors duration-200"
                      >
                        Cancel
                      </motion.button>
                    </>
                  ) : (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEdit}
                      className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-700 
                               border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 
                               transition-colors duration-200"
                    >
                      <Pencil size={16} />
                      Edit
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Enhanced Company Logo and Basic Info */}
              <div className="mb-8">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-16 h-16 bg-blue-100 rounded-xl mb-4 flex items-center justify-center 
                           shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="text-2xl font-semibold text-blue-600">
                    {getFirstLetter(corporation?.company_name)}
                  </span>
                </motion.div>

                {/* Enhanced form fields */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 
                                 focus:border-blue-500 transition-all duration-200"
                        value={editedCorporation?.company_name || ''}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                      />
                    ) : (
                      <div className="text-sm font-medium p-2.5 border border-gray-200 rounded-lg 
                                    bg-gray-50/50 transition-colors hover:bg-gray-50">
                        {corporation?.company_name}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 
                                 focus:border-blue-500 transition-all duration-200"
                        value={editedCorporation?.contact_name || ''}
                        onChange={(e) => handleInputChange('contact_name', e.target.value)}
                      />
                    ) : (
                      <div className="text-sm font-medium p-2.5 border border-gray-200 rounded-lg 
                                    bg-gray-50/50 transition-colors hover:bg-gray-50">
                        {corporation?.contact_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 
                               focus:border-blue-500 transition-all duration-200"
                      value={editedCorporation?.phone_number || ''}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    />
                  ) : (
                    <div className="text-sm font-medium p-2.5 border border-gray-200 rounded-lg 
                                  bg-gray-50/50 transition-colors hover:bg-gray-50">
                      {corporation?.phone_number}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 
                               focus:border-blue-500 transition-all duration-200"
                      value={editedCorporation?.title || ''}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                    />
                  ) : (
                    <div className="text-sm font-medium p-2.5 border border-gray-200 rounded-lg 
                                  bg-gray-50/50 transition-colors hover:bg-gray-50">
                      {corporation?.title}
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 
                               focus:border-blue-500 transition-all duration-200"
                      value={editedCorporation?.company_address || ''}
                      onChange={(e) => handleInputChange('company_address', e.target.value)}
                    />
                  ) : (
                    <div className="text-sm font-medium p-2.5 border border-gray-200 rounded-lg 
                                  bg-gray-50/50 transition-colors hover:bg-gray-50">
                      {corporation?.company_address}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Attorney</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 
                               focus:border-blue-500 transition-all duration-200"
                      value={editedCorporation?.attorney_name || ''}
                      onChange={(e) => handleInputChange('attorney_name', e.target.value)}
                    />
                  ) : (
                    <div className="text-sm font-medium p-2.5 border border-gray-200 rounded-lg 
                                  bg-gray-50/50 transition-colors hover:bg-gray-50">
                      {corporation?.attorney_name}
                    </div>
                  )}
                </div>
              </div>

              {/* Tax Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax/Registration Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 
                             focus:border-blue-500 transition-all duration-200"
                    value={editedCorporation?.tax_registration_number || ''}
                    onChange={(e) => handleInputChange('tax_registration_number', e.target.value)}
                  />
                ) : (
                  <div className="text-sm font-medium p-2.5 border border-gray-200 rounded-lg 
                                bg-gray-50/50 transition-colors hover:bg-gray-50">
                    {corporation?.tax_registration_number}
                  </div>
                )}
              </div>

              {/* Employee Information */}
              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Employees</label>
                <div className="text-sm font-medium p-2.5 border border-gray-200 rounded-lg 
                              bg-gray-50/50 transition-colors hover:bg-gray-50">
                  {corporation?.user_id?.length || 0}
                </div>
              </div>
            </div>

            {/* Enhanced Additional Information Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-gray-200 p-6 mt-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Additional Information</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                  <div className="text-sm font-medium">
                    {new Date(corporation?.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <div className="text-sm font-medium">
                    {new Date(corporation?.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : activeTab === 'employees' ? (
          <motion.div
            key="employees"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <EmployeeList 
              employees={corporation?.user_id?.map(user => ({
                id: user._id,
                name: user.name || 'John Doe',
              })) || []}
            />
          </motion.div>
        ) : (
          <motion.div
            key="documents"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
          >
            <h2 className="text-2xl font-semibold text-gray-900">Documents</h2>
            {/* Documents tab content here */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 bg-red-100 border border-red-200 text-red-600 px-4 py-2 rounded-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

CorporationDetails.propTypes = {
  setCurrentBreadcrumb: PropTypes.func.isRequired
};

export default CorporationDetails; 