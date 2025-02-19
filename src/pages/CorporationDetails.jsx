import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import corporationService from '../services/corporationService';
import { Pencil, Save } from 'lucide-react';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

const CorporationDetailsSkeleton = () => (
  <div className="p-4">
    {/* Tabs Skeleton */}
    <div className="flex gap-2 mb-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="w-24 h-9 bg-[#f9fafb] rounded-lg animate-shimmer"></div>
      ))}
    </div>

    {/* Main Content Skeleton */}
    <div className="bg-white rounded-lg border border-gray-200 p-6">
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

  useEffect(() => {
    fetchCorporationDetails();
  }, [corporationId]);

  useEffect(() => {
    if (corporation) {
      setEditedCorporation(corporation);
    }
  }, [corporation]);

  const fetchCorporationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await corporationService.getCorporationById(corporationId);
      if (response.success && response.data) {
        setCorporation(response.data);
        setCurrentBreadcrumb({
          name: response.data.company_name,
          path: `/corporations/${corporationId}`
        });
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
    <div className="p-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-lg text-sm ${
            activeTab === 'profile' ? 'bg-white text-gray-800' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm ${
            activeTab === 'employees' ? 'bg-white text-gray-800' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('employees')}
        >
          View Employees
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm ${
            activeTab === 'documents' ? 'bg-white text-gray-800' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
      </div>

      {/* Company Profile Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-8">
          <h1 className="text-xl font-semibold text-gray-800">Company Profile</h1>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 text-green-600 text-sm font-medium hover:text-green-700 border border-green-200 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors duration-200"
                >
                  <Save size={16} />
                  Save
                </button>
                <button 
                  onClick={handleCancel}
                  className="flex items-center gap-2 text-gray-600 text-sm font-medium hover:text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                onClick={handleEdit}
                className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-700 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
              >
                <Pencil size={16} />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Company Logo and Basic Info */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-lg mb-4 flex items-center justify-center">
            <span className="text-2xl font-semibold text-blue-600">
              {getFirstLetter(corporation?.company_name)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Company Name</label>
              {isEditing ? (
                <input
                  type="text"
                  className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editedCorporation?.company_name || ''}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                />
              ) : (
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {corporation?.company_name}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Contact Name</label>
              {isEditing ? (
                <input
                  type="text"
                  className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editedCorporation?.contact_name || ''}
                  onChange={(e) => handleInputChange('contact_name', e.target.value)}
                />
              ) : (
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {corporation?.contact_name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone number</label>
            {isEditing ? (
              <input
                type="text"
                className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editedCorporation?.phone_number || ''}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
              />
            ) : (
              <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                {corporation?.phone_number}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Title</label>
            {isEditing ? (
              <input
                type="text"
                className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editedCorporation?.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            ) : (
              <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                {corporation?.title}
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Company Address</label>
            {isEditing ? (
              <input
                type="text"
                className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editedCorporation?.company_address || ''}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
              />
            ) : (
              <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                {corporation?.company_address}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Assigned Attorney</label>
            {isEditing ? (
              <input
                type="text"
                className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editedCorporation?.assigned_attorney || ''}
                onChange={(e) => handleInputChange('assigned_attorney', e.target.value)}
              />
            ) : (
              <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                {corporation?.assigned_attorney}
              </div>
            )}
          </div>
        </div>

        {/* Tax Information */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Tax/Registration Number</label>
          {isEditing ? (
            <input
              type="text"
              className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={editedCorporation?.tax_registration_number || ''}
              onChange={(e) => handleInputChange('tax_registration_number', e.target.value)}
            />
          ) : (
            <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
              {corporation?.tax_registration_number}
            </div>
          )}
        </div>

        {/* Employee Information */}
        <div className="mt-8">
          <label className="block text-sm text-gray-600 mb-1">Number of Employees</label>
          <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
            {corporation?.user_id?.length || 0}
          </div>
        </div>
      </div>

      {/* Creation Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Additional Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Created At</label>
            <div className="text-sm font-medium">
              {new Date(corporation?.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Last Updated</label>
            <div className="text-sm font-medium">
              {new Date(corporation?.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporationDetails; 