import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { Pencil } from 'lucide-react';
import employeeService from '../services/employeeService';
import EmployeeCaseList from '../components/employees/EmployeeCaseList';
import PropTypes from 'prop-types';

// First, let's create a reusable skeleton component at the top of the file
const SkeletonLoader = ({ lines = 4, headerText = '' }) => {
  return (
    <div className="animate-pulse">
      {/* Header section with optional text */}
      <div className="mb-6">
        {headerText ? (
          <div className="text-lg font-semibold text-gray-800">{headerText}</div>
        ) : (
          <div className="h-7 w-48 bg-gray-200 rounded"></div>
        )}
      </div>
      
      {/* Content lines */}
      <div className="space-y-4">
        {[...Array(lines)].map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-100 rounded-lg w-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Basic skeleton loader for the tabs
const TabsSkeleton = () => (
  <div className="flex gap-2 mb-6">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
    ))}
  </div>
);

// Skeleton for a single detail field
const DetailFieldSkeleton = () => (
  <div className="space-y-2">
    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
    <div className="h-10 bg-gray-100 rounded-lg w-full animate-pulse" />
  </div>
);

// Skeleton for the employee details section
const EmployeeDetailsSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="text-lg font-semibold text-gray-800">Employee Details</div>
    <div className="flex justify-between items-start mb-6">
      <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
      <div className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse" />
    </div>
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <DetailFieldSkeleton key={i} />
      ))}
    </div>
  </div>
);

// First, add this new skeleton component near the top of the file with other skeleton components
const CaseListSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    {/* Header skeleton */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2 flex-1">
        {/* Search bar skeleton */}
        <div className="w-[400px] h-10 bg-gray-200 rounded-lg animate-pulse" />
        {/* Filter buttons skeleton */}
        <div className="w-28 h-10 bg-gray-200 rounded-lg animate-pulse" />
        <div className="w-20 h-10 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      {/* Add New Case button skeleton */}
      <div className="w-36 h-10 bg-gray-200 rounded-lg animate-pulse" />
    </div>

    {/* Table skeleton */}
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {/* Header cells skeleton */}
            {[...Array(7)].map((_, i) => (
              <th key={i} className="px-6 py-3 text-left">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Row skeletons */}
          {[...Array(6)].map((_, rowIndex) => (
            <tr key={rowIndex} className={`border-b border-gray-100 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              {[...Array(7)].map((_, cellIndex) => (
                <td key={cellIndex} className="px-6 py-3">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
        <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

const EmployeeProfile = ({ setCurrentBreadcrumb }) => {
  const { corporationId, employeeId } = useParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [basicDetails, setBasicDetails] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState({
    basic: true,
    documents: true,
    cases: false
  });
  const { setCurrentBreadcrumb: breadcrumbContextSetCurrentBreadcrumb } = useBreadcrumb();

  // Fetch basic details
  useEffect(() => {
    const fetchBasicDetails = async () => {
      try {
        setLoading(prev => ({ ...prev, basic: true, documents: true })); // Set documents loading
        const response = await employeeService.getEmployeeBasicDetails(employeeId);
        console.log("response", response);
        
        // Add null check and ensure data exists before accessing
        if (response?.success && response?.data) {
          setBasicDetails(response.data);
          // If passport data exists in basic details, use it for documents
          if (response.data.passport) {
            setDocuments({
              rawDocuments: {
                Passport: response.data.passport
              }
            });
          }
          
          // Update breadcrumb with employee name
          setCurrentBreadcrumb([
            { label: 'Dashboard', link: '/' },
            { label: 'Corporations', link: '/corporations' },
            { label: corporationId ? `Corporation Details` : 'Employees', link: corporationId ? `/corporations/${corporationId}` : '/employees' },
            { label: response.data.name || 'Employee Details', link: '#' }
          ]);
        } else {
          console.error('Invalid response format:', response);
          // Set some default state or error handling
          setBasicDetails(null);
        }
      } catch (error) {
        console.error('Error fetching employee basic details:', error);
        setBasicDetails(null);
      } finally {
        setLoading(prev => ({ ...prev, basic: false, documents: false }));
      }
    };

    fetchBasicDetails();
  }, [employeeId, corporationId, setCurrentBreadcrumb]);

  // Fetch documents when profile tab is active
//   useEffect(() => {
//     const fetchDocuments = async () => {
//       if (activeTab === 'profile' && !documents) {
//         try {
//           setLoading(prev => ({ ...prev, documents: true }));
//           const response = await employeeService.getEmployeeDocuments(employeeId);
//           if (response.success) {
//             setDocuments(response.data);
//           }
//         } catch (error) {
//           console.error('Error fetching employee documents:', error);
//         } finally {
//           setLoading(prev => ({ ...prev, documents: false }));
//         }
//       }
//     };

//     fetchDocuments();
//   }, [activeTab, employeeId]);

  // Fetch cases when case tab is active
  useEffect(() => {
    const fetchCases = async () => {
      if (activeTab === 'case' && !cases.length) {
        try {
          setLoading(prev => ({ ...prev, cases: true }));
          const response = await employeeService.getUserCases(employeeId);
          if (response.status=="success" && response.data) {
            setCases(response.data.entries || []);
            console.log("cases",response.data.entries);
          }
        } catch (error) {
          console.error('Error fetching cases:', error);
        } finally {
          setLoading(prev => ({ ...prev, cases: false }));
        }
      }
    };
    
    fetchCases();
  }, [activeTab, employeeId]);

  // Update the passport details section
  const renderPassportDetails = () => {
    if (loading.basic || loading.documents) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <SkeletonLoader lines={6} headerText="Passport Details" />
        </div>
      );
    }

    const passportData = basicDetails?.passport || (documents?.rawDocuments?.Passport);
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Passport Details</h2>
        {passportData ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Passport Number</label>
              <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                {passportData.number || 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Passport Type</label>
              <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                {passportData.passportType || 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Date of Issue</label>
              <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                {passportData.dateOfIssue ? new Date(passportData.dateOfIssue).toLocaleDateString() : 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Date of Expiry</label>
              <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                {passportData.dateOfExpiry ? new Date(passportData.dateOfExpiry).toLocaleDateString() : 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Place of Issue</label>
              <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                {passportData.placeOfIssue || 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Issued By</label>
              <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                {passportData.issuedBy || 'N/A'}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No passport information available
          </div>
        )}
      </div>
    );
  };

  // Update the work history section
  const renderWorkHistory = () => {
    if (loading.documents) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <SkeletonLoader lines={3} headerText="Work History" />
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-6">Work History</h2>
        <div className="space-y-4">
          {basicDetails?.workHistory && basicDetails.workHistory.length > 0 ? (
            basicDetails.workHistory.map((exp, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="font-medium">{exp.jobTitle}</div>
                <div className="text-sm text-gray-600">{exp.companyName}</div>
                <div className="text-sm text-gray-500">
                  {exp.fromDate ? new Date(exp.fromDate).toLocaleDateString() : 'N/A'} - 
                  {exp.toDate ? new Date(exp.toDate).toLocaleDateString() : 'Present'}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No work history available</div>
          )}
        </div>
      </div>
    );
  };

  // Update the education history section
  const renderEducationHistory = () => {
    if (loading.documents) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <SkeletonLoader lines={2} headerText="Education History" />
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-6">Education History</h2>
        <div className="space-y-4">
          {basicDetails?.educationHistory && basicDetails.educationHistory.length > 0 ? (
            basicDetails.educationHistory.map((edu, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="font-medium">{edu.courseLevel} in {edu.specialization}</div>
                <div className="text-sm text-gray-600">{edu.institution}</div>
                <div className="text-sm text-gray-500">GPA: {edu.gpa}</div>
                <div className="text-sm text-gray-500">
                  Graduated: {edu.passoutYear ? new Date(edu.passoutYear).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No education history available</div>
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      count: null
    },
    {
      id: 'case',
      label: 'Case List',
      count: cases.length || null
    },
    {
      id: 'documents',
      label: 'Documents',
      count: null,
      disabled: true
    }
  ];

  const renderTabs = () => (
    <div className="relative mb-6 w-fit">
      {/* Tabs container */}
      <div className="relative flex rounded-lg bg-gray-100/80 p-1">
        {/* Moving background - add this div */}
        <div
          className="absolute inset-y-1 transition-all duration-300 ease-out bg-blue-600 rounded-md"
          style={{
            left: '4px',  // p-1 padding
            width: `calc(${100/tabs.length}% - 4px)`,  // Subtracting padding
            transform: `translateX(${tabs.findIndex(tab => tab.id === activeTab) * 100}%)`
          }}
        />
        
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
            className={`
              relative flex items-center justify-center px-4 py-2 rounded-md
              font-medium text-sm transition-colors duration-200 min-w-[100px]
              ${activeTab === tab.id 
                ? 'text-white'
                : tab.disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800'
              }
            `}
            title={tab.disabled ? "Coming soon" : ""}
          >
            <span>{tab.label}</span>
            {tab.count !== null && !tab.disabled && (
              <span 
                className={`
                  ml-2 px-1.5 py-0.5 text-xs rounded-full
                  transition-colors duration-200
                  ${activeTab === tab.id 
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                  }
                `}
              >
                {tab.count}
              </span>
            )}
            {tab.disabled && (
              <span className="ml-1 text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded"></span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // Replace the basic loading state with skeleton loader
  if (loading.basic) {
    return (
      <div className="p-4">
        <TabsSkeleton />
        <div className="grid grid-cols-2 gap-6">
          <EmployeeDetailsSkeleton />
          
          {/* Passport Details Skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <SkeletonLoader lines={6} headerText="Passport Details" />
          </div>
          
          {/* Work History Skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <SkeletonLoader lines={3} headerText="Work History" />
          </div>
          
          {/* Education History Skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <SkeletonLoader lines={2} headerText="Education History" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {renderTabs()}

      <div className="relative">
        <div 
          className={`
            transition-all duration-300 
            ${activeTab === 'profile' 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 translate-x-4 absolute inset-0 pointer-events-none'
            }
          `}
        >
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* First Column - Only Employee Details */}
              <div>
                {/* Employee Details */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold">Employee Details</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                      <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                        {basicDetails?.name || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Gender</label>
                      <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                        {basicDetails?.sex || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Date of Birth</label>
                      <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                        {basicDetails?.birthInfo?.dateOfBirth 
                          ? new Date(basicDetails.birthInfo.dateOfBirth).toLocaleDateString() 
                          : 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Place of Birth</label>
                      <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                        {basicDetails?.birthInfo?.cityOfBirth && basicDetails?.birthInfo?.countryOfBirth
                          ? `${basicDetails.birthInfo.cityOfBirth}, ${basicDetails.birthInfo.countryOfBirth}`
                          : 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Email Address</label>
                      <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                        {basicDetails?.email || basicDetails?.contact?.email || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Mobile Phone</label>
                      <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                        {basicDetails?.contact?.mobileNumber || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Residence Phone</label>
                      <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                        {basicDetails?.contact?.residencePhone || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Address</label>
                      <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                        {basicDetails?.address ? (
                          <>
                            {basicDetails.address.floorAptSuite && `${basicDetails.address.floorAptSuite}, `}
                            {basicDetails.address.streetNumber && `${basicDetails.address.streetNumber} `}
                            {basicDetails.address.streetName && `${basicDetails.address.streetName}, `}
                            {basicDetails.address.city && `${basicDetails.address.city}, `}
                            {basicDetails.address.stateProvince && `${basicDetails.address.stateProvince}, `}
                            {basicDetails.address.country && `${basicDetails.address.country} `}
                            {basicDetails.address.zipCode && basicDetails.address.zipCode}
                          </>
                        ) : 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Company</label>
                      <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                        {basicDetails?.company_name || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Law Firm</label>
                      <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                        {basicDetails?.lawfirm_name || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Role</label>
                      <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                        {basicDetails?.role || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Column - Passport, Education, and Work History */}
              <div className="space-y-6">
                {/* Passport Details */}
                {renderPassportDetails()}

                {/* Education History */}
                {renderEducationHistory()}

                {/* Work History - Moved here */}
                {renderWorkHistory()}
              </div>
            </div>
          )}
        </div>

        {/* Case List Content */}
        <div 
          className={`
            transition-all duration-300
            ${activeTab === 'case' 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 translate-x-4 absolute inset-0 pointer-events-none'
            }
          `}
        >
          {activeTab === 'case' && (
            loading.cases ? (
              <CaseListSkeleton />
            ) : (
              <EmployeeCaseList cases={cases} />
            )
          )}
        </div>

        {/* Documents Content */}
        <div 
          className={`
            transition-all duration-300
            ${activeTab === 'documents' 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 translate-x-4 absolute inset-0 pointer-events-none'
            }
          `}
        >
          {activeTab === 'documents' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold">Documents</h2>
              {/* Documents content here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

EmployeeProfile.propTypes = {
  setCurrentBreadcrumb: PropTypes.func.isRequired
};

export default EmployeeProfile; 