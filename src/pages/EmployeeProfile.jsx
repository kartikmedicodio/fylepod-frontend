import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { Pencil } from 'lucide-react';
import employeeService from '../services/employeeService';
import EmployeeCaseList from '../components/employees/EmployeeCaseList';

const EmployeeProfile = () => {
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
  const { setCurrentBreadcrumb } = useBreadcrumb();

  // Fetch basic details
  useEffect(() => {
    const fetchBasicDetails = async () => {
      try {
        setLoading(prev => ({ ...prev, basic: true }));
        const response = await employeeService.getEmployeeBasicDetails(employeeId);
        console.log("response", response);
        
        // Add null check and ensure data exists before accessing
        if (response?.success && response?.data) {
          setBasicDetails(response.data);
          // Update breadcrumb with employee name
          setCurrentBreadcrumb({
            name: response.data.name || 'Employee Details', // Fallback name if name is undefined
            path: `/corporations/${corporationId}/employee/${employeeId}`,
            parentBreadcrumb: {
              name: 'Employee List',
              path: `/corporations/${corporationId}/employees`
            }
          });
        } else {
          console.error('Invalid response format:', response);
          // Set some default state or error handling
          setBasicDetails(null);
        }
      } catch (error) {
        console.error('Error fetching employee basic details:', error);
        setBasicDetails(null);
      } finally {
        setLoading(prev => ({ ...prev, basic: false }));
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

  // Loading states
  if (loading.basic) {
    return <div>Loading...</div>; // You can replace this with a skeleton loader
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
            activeTab === 'case' ? 'bg-white text-gray-800' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('case')}
        >
          Case List
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

      {/* Profile Content */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Employee Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-lg font-semibold">Employee Details</h2>
              <button className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-700 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50">
                <Pencil size={16} />
                Edit
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {basicDetails?.name}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Email Address</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {basicDetails?.email}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {basicDetails?.contact?.mobileNumber}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Address</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {basicDetails?.address && (
                    `${basicDetails.address.floorAptSuite || ''} ${basicDetails.address.streetName || ''}, 
                     ${basicDetails.address.cityOfBirth || ''}, ${basicDetails.address.countryOfBirth || ''}`
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Company</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {basicDetails?.company_name}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Role</label>
                <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {basicDetails?.role}
                </div>
              </div>
            </div>
          </div>

          {/* Passport Details */}
          {loading.documents ? (
            <div>Loading passport details...</div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-6">Passport Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Passport Number</label>
                  <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                    {documents?.rawDocuments.Passport.passportNumber}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date of Issue</label>
                  <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                    {documents?.rawDocuments.Passport.dateOfIssue}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date of Expiry</label>
                  <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                    {documents?.rawDocuments.Passport.dateOfExpiry}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Place of Issue</label>
                  <div className="text-sm font-medium p-2 border border-gray-200 rounded-lg bg-gray-50">
                    {documents?.rawDocuments.Passport.placeOfIssue}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Work History */}
          {loading.documents ? (
            <div>Loading work history...</div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-6">Work History</h2>
              <div className="space-y-4">
                {documents?.rawDocuments.Resume.workExperience.map((exp, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="font-medium">{exp.jobTitle}</div>
                    <div className="text-sm text-gray-600">{exp.companyName}</div>
                    <div className="text-sm text-gray-500">
                      {exp.fromDate} - {exp.toDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education History */}
          {loading.documents ? (
            <div>Loading education history...</div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-6">Education History</h2>
              <div className="space-y-4">
                {documents?.rawDocuments.Resume.educationHistory.map((edu, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="font-medium">{edu.courseLevel}</div>
                    <div className="text-sm text-gray-600">{edu.schoolUniversityCollege}</div>
                    <div className="text-sm text-gray-500">Graduated: {edu.passOutYear}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Case List Content */}
      {activeTab === 'case' && (
        loading.cases ? (
          <div>Loading cases...</div>
        ) : (
          <EmployeeCaseList cases={cases} />
        )
      )}

      {/* Documents Content */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold">Documents</h2>
          {/* Documents content here */}
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile; 