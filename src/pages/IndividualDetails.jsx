import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, Save } from 'lucide-react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

// Add CaseRow PropTypes
const CaseRowPropTypes = {
  caseItem: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    caseManagerName: PropTypes.string.isRequired,
    categoryName: PropTypes.string.isRequired,
    deadline: PropTypes.string,
    categoryStatus: PropTypes.string.isRequired,
    documentTypes: PropTypes.arrayOf(PropTypes.shape({
      required: PropTypes.bool.isRequired,
      status: PropTypes.string.isRequired
    }))
  }).isRequired
};

const IndividualDetailsSkeleton = () => (
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

      {/* Basic Info Skeleton */}
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
    </div>
  </div>
);

const IndividualDetails = () => {
  const { individualId } = useParams();
  const navigate = useNavigate();
  const [individual, setIndividual] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedIndividual, setEditedIndividual] = useState(null);
  const [activeTabWidth, setActiveTabWidth] = useState(0);
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const tabRefs = useRef([]);
  const { setCurrentBreadcrumb } = useBreadcrumb();

  // Define tabs
  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'cases', label: 'Cases' }
  ];

  useEffect(() => {
    setCurrentBreadcrumb([
      { name: 'Home', path: '/dashboard' },
      { name: 'Individuals', path: '/individuals' },
      { name: individual?.name || 'Individual Details', path: '#' }
    ]);
    return () => {
      setCurrentBreadcrumb([]);
    };
  }, [setCurrentBreadcrumb, individual?.name]);

  useEffect(() => {
    fetchIndividualDetails();
  }, [individualId]);

  useEffect(() => {
    if (individual) {
      setEditedIndividual(individual);
    }
  }, [individual]);

  // Update active tab width when tab changes
  useEffect(() => {
    const activeTabElement = tabRefs.current[tabs.findIndex(tab => tab.id === activeTab)];
    if (activeTabElement) {
      const width = activeTabElement.offsetWidth;
      setActiveTabWidth(width);
    }
  }, [activeTab, tabs]);

  // Add new function to fetch cases
  const fetchCases = async () => {
    try {
      setCasesLoading(true);
      const response = await api.get(`/management/user/${individualId}`);
      if (response.data.status === 'success') {
        setCases(response.data.data.entries);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      setError(error.response?.data?.message || 'Failed to fetch cases');
    } finally {
      setCasesLoading(false);
    }
  };

  // Add useEffect to fetch cases when tab changes to 'cases'
  useEffect(() => {
    if (activeTab === 'cases' && individualId) {
      fetchCases();
    }
  }, [activeTab, individualId]);

  const fetchIndividualDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/auth/users/${individualId}`);
      
      if (response.data.success) {
        setIndividual(response.data.data);
      } else {
        setError('Failed to fetch individual details');
      }
    } catch (error) {
      console.error('Error fetching individual details:', error);
      setError(error.response?.data?.message || 'Failed to fetch individual details');
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
      const response = await api.put('/auth/update-user', {
        user_id: individualId,
        ...editedIndividual
      });

      if (response.data.status === "success") {
        setIndividual(response.data.data.user);
        setIsEditing(false);
        setError(null);
      } else {
        setError('Failed to update individual');
      }
    } catch (error) {
      console.error('Error updating individual:', error);
      setError(error.response?.data?.message || 'Failed to update individual');
    }
  };

  const handleInputChange = (field, value) => {
    setEditedIndividual(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    setEditedIndividual(individual);
    setIsEditing(false);
    setError(null);
  };

  // Add CaseRow component with PropTypes
  const CaseRow = ({ caseItem }) => {
    const formattedDeadline = caseItem.deadline 
      ? new Date(caseItem.deadline).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : '-';

    return (
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="hover:bg-blue-50/50 cursor-pointer transition-colors duration-200"
        onClick={() => navigate(`/cases/${caseItem._id}`)}
      >
        <td className="px-6 py-4 text-sm text-gray-900">{caseItem._id?.substring(0, 6)}</td>
        <td className="px-6 py-4 text-sm text-gray-600">{caseItem.userName}</td>
        <td className="px-6 py-4 text-sm text-gray-600">{caseItem.caseManagerName}</td>
        <td className="px-6 py-4 text-sm text-gray-600">{caseItem.categoryName}</td>
        <td className="px-6 py-4 text-sm text-gray-600">{formattedDeadline}</td>
        <td className="px-6 py-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            caseItem.categoryStatus === 'completed' 
              ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
              : 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20'
          }`}>
            {caseItem.categoryStatus}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">
          {caseItem.documentTypes ? (
            <span>
              {(() => {
                const pendingCount = caseItem.documentTypes.filter(doc => 
                  doc.status === 'pending'
                ).length;
                return pendingCount === 0 ? '0 (completed)' : pendingCount;
              })()}
            </span>
          ) : '-'}
        </td>
      </motion.tr>
    );
  };

  CaseRow.propTypes = CaseRowPropTypes;

  if (loading) {
    return <IndividualDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => navigate('/individuals')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Individuals
        </button>
      </div>
    );
  }

  if (!individual) {
    return (
      <div className="p-6">
        <div className="text-gray-500 mb-4">Individual not found</div>
        <button 
          onClick={() => navigate('/individuals')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Individuals
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
                  : 'text-gray-600 hover:text-gray-800'
                }
              `}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* First Column - Individual Details */}
              <div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold">Individual Details</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          value={editedIndividual?.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                      ) : (
                        <div className="text-sm font-medium p-2.5 border border-gray-200 rounded-lg bg-gray-50">
                          {individual?.name || 'N/A'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Gender</label>
                      {isEditing ? (
                        <select
                          className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          value={editedIndividual?.sex || ''}
                          onChange={(e) => handleInputChange('sex', e.target.value)}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <div className="text-sm font-medium p-2.5 border border-gray-200 rounded-lg bg-gray-50">
                          {individual?.sex || 'N/A'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Date of Birth</label>
                      {isEditing ? (
                        <input
                          type="date"
                          className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          value={editedIndividual?.birthInfo?.dateOfBirth?.split('T')[0] || ''}
                          onChange={(e) => handleInputChange('birthInfo', { ...editedIndividual?.birthInfo, dateOfBirth: e.target.value })}
                        />
                      ) : (
                        <div className="text-sm font-medium p-2.5 border border-gray-200 rounded-lg bg-gray-50">
                          {individual?.birthInfo?.dateOfBirth ? new Date(individual.birthInfo.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Place of Birth</label>
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="City of Birth"
                            className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            value={editedIndividual?.birthInfo?.cityOfBirth || ''}
                            onChange={(e) => handleInputChange('birthInfo', { ...editedIndividual?.birthInfo, cityOfBirth: e.target.value })}
                          />
                          <input
                            type="text"
                            placeholder="Country of Birth"
                            className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            value={editedIndividual?.birthInfo?.countryOfBirth || ''}
                            onChange={(e) => handleInputChange('birthInfo', { ...editedIndividual?.birthInfo, countryOfBirth: e.target.value })}
                          />
                        </div>
                      ) : (
                        <div className="text-sm font-medium p-2.5 border border-gray-200 rounded-lg bg-gray-50">
                          {individual?.birthInfo?.cityOfBirth && individual?.birthInfo?.countryOfBirth ? 
                            `${individual.birthInfo.cityOfBirth}, ${individual.birthInfo.countryOfBirth}` : 'N/A'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          value={editedIndividual?.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      ) : (
                        <div className="text-sm font-medium p-2.5 border border-gray-200 rounded-lg bg-gray-50">
                          {individual?.email || 'N/A'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Mobile Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          value={editedIndividual?.contact?.mobileNumber || ''}
                          onChange={(e) => handleInputChange('contact', { ...editedIndividual.contact, mobileNumber: e.target.value })}
                        />
                      ) : (
                        <div className="text-sm font-medium p-2.5 border border-gray-200 rounded-lg bg-gray-50">
                          {individual?.contact?.mobileNumber || 'N/A'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Residence Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          value={editedIndividual?.contact?.residencePhone || ''}
                          onChange={(e) => handleInputChange('contact', { ...editedIndividual.contact, residencePhone: e.target.value })}
                        />
                      ) : (
                        <div className="text-sm font-medium p-2.5 border border-gray-200 rounded-lg bg-gray-50">
                          {individual?.contact?.residencePhone || 'N/A'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Column - Passport, Education, Work History */}
              <div className="space-y-6">
                {/* Passport Details */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold mb-4">Passport Details</h2>
                  {individual?.passport ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Passport Number</div>
                          <div className="font-medium">{individual.passport.number}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Type</div>
                          <div className="font-medium">{individual.passport.passportType}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Date of Issue</div>
                          <div className="font-medium">
                            {new Date(individual.passport.dateOfIssue).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Date of Expiry</div>
                          <div className="font-medium">
                            {new Date(individual.passport.dateOfExpiry).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Place of Issue</div>
                          <div className="font-medium">{individual.passport.placeOfIssue}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Issued By</div>
                          <div className="font-medium">{individual.passport.issuedBy}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No passport information available
                    </div>
                  )}
                </div>

                {/* Education History */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold mb-4">Education History</h2>
                  {individual?.educationHistory?.length > 0 ? (
                    <div className="space-y-4">
                      {individual.educationHistory.map((education, index) => (
                        <div key={education._id} className={`${index !== 0 ? 'border-t pt-4' : ''}`}>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-500">Institution</div>
                              <div className="font-medium">{education.institution}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Course Level</div>
                              <div className="font-medium">{education.courseLevel}</div>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-500">Specialization</div>
                              <div className="font-medium">{education.specialization}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">GPA</div>
                              <div className="font-medium">{education.gpa}</div>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="text-sm text-gray-500">Graduation Year</div>
                            <div className="font-medium">
                              {new Date(education.passoutYear).getFullYear()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No education history available
                    </div>
                  )}
                </div>

                {/* Work History */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold mb-4">Work History</h2>
                  {individual?.workHistory?.length > 0 ? (
                    <div className="space-y-4">
                      {individual.workHistory.map((work, index) => (
                        <div key={index} className={`${index !== 0 ? 'border-t pt-4' : ''}`}>
                          {/* Work history item content will go here when data is available */}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No work history available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'cases' ? (
          <motion.div
            key="cases"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">Cases</h2>
                <button
                  onClick={() => navigate(`/cases/new?individualId=${individualId}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                           hover:bg-blue-700 transition-colors duration-200"
                >
                  New Case
                </button>
              </div>
            </div>

            {casesLoading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : cases.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No cases found for this individual
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      {[
                        'Case Id', 'Individual Name', 'Case Manager', 'Process Name',
                        'Deadline', 'Status', 'Documents Pending'
                      ].map((header) => (
                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    <AnimatePresence>
                      {cases.map((caseItem) => (
                        <CaseRow key={caseItem._id} caseItem={caseItem} />
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Error State */}
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

IndividualDetails.propTypes = {
  setCurrentBreadcrumb: PropTypes.func.isRequired
};

export default IndividualDetails; 