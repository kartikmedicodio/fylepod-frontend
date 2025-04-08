import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Phone,
  User
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import Select from 'react-select';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { usePage } from '../contexts/PageContext';

const NewCompany = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const { setPageTitle } = usePage();
  const [attorneys, setAttorneys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    phoneNumber: '',
    assignedAttorney: '',
    address: ''
  });

  // Set breadcrumb and page title on mount
  useEffect(() => {
    setPageTitle('New Company');
    setCurrentBreadcrumb([
      { name: 'Home', path: '/dashboard' },
      { name: 'New Company', path: '/company/new' }
    ]);
    return () => {
      setPageTitle('');
      setCurrentBreadcrumb([]);
    };
  }, [setPageTitle, setCurrentBreadcrumb]);

  // Format attorneys for react-select
  const attorneyOptions = attorneys
    .filter(attorney => {
      const userLawFirmId = user?.lawfirm_id?._id;
      return !userLawFirmId || String(attorney?.lawfirm_id?._id) === String(userLawFirmId);
    })
    .map(attorney => ({
      value: attorney._id,
      label: attorney.name
    }));

  // Fetch attorneys on mount
  useEffect(() => {
    const fetchAttorneys = async () => {
      setLoading(true);
      try {
        const response = await api.get('/auth/attorneys');
        if (response?.data?.status === 'success') {
          const allAttorneys = response.data.data.attorneys || [];
          const userLawFirmId = user?.lawfirm_id?._id;
          const filteredAttorneys = allAttorneys.filter(attorney => {
            const attorneyLawFirmId = attorney?.lawfirm_id?._id;
            return attorneyLawFirmId === userLawFirmId;
          });
          setAttorneys(filteredAttorneys);
        }
      } catch (error) {
        toast.error('Failed to fetch attorneys');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchAttorneys();
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAttorneySelect = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      assignedAttorney: selectedOption ? selectedOption.value : ''
    }));
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.contactName.trim() !== '' &&
      formData.phoneNumber.trim() !== '' &&
      formData.assignedAttorney !== '' &&
      formData.address.trim() !== ''
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        company_name: formData.name,
        contact_name: formData.contactName,
        phone_number: formData.phoneNumber,
        company_address: formData.address,
        attorney_id: formData.assignedAttorney,
        attorney_name: attorneys.find(a => a._id === formData.assignedAttorney)?.name || '',
        lawfirm_id: user?.lawfirm_id?._id,
        lawfirm_name: user?.lawfirm_name || user?.lawfirm_id?.lawfirm_name
      };

      const response = await api.post('/companies/create', payload);
      
      if (response.data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          navigate(`/companies/${response.data.data._id}/admin/new`);
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to create company');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center animate-fade-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg 
                className="w-10 h-10 text-green-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Company Created!</h2>
            <p className="text-gray-600">{formData.name} has been added successfully</p>
          </div>
        </div>
      )}

      {/* Attorney Selection Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <User className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Attorney Details</h2>
            <p className="text-sm text-gray-500">Select the attorney for this company</p>
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            Select Attorney
            {!formData.assignedAttorney && <span className="text-rose-500 text-lg leading-none">*</span>}
          </label>
          <Select
            value={formData.assignedAttorney ? attorneyOptions.find(opt => opt.value === formData.assignedAttorney) : null}
            onChange={handleAttorneySelect}
            options={attorneyOptions}
            isLoading={loading}
            isClearable
            isSearchable
            placeholder="Search and select attorney..."
            noOptionsMessage={() => "No attorneys found"}
            className={`react-select-container ${!formData.assignedAttorney ? 'select-error' : ''}`}
            classNamePrefix="react-select"
            styles={{
              control: (base, state) => ({
                ...base,
                minHeight: '42px',
                borderColor: !formData.assignedAttorney ? '#FCA5A5' : state.isFocused ? '#6366F1' : '#E5E7EB',
                boxShadow: state.isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
                '&:hover': {
                  borderColor: state.isFocused ? '#6366F1' : !formData.assignedAttorney ? '#EF4444' : '#CBD5E1'
                }
              }),
              placeholder: (base) => ({
                ...base,
                color: !formData.assignedAttorney ? '#EF4444' : '#94A3B8'
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected ? '#4F46E5' : state.isFocused ? '#EEF2FF' : base.backgroundColor,
                ':active': {
                  backgroundColor: '#4F46E5'
                }
              }),
              menu: (base) => ({
                ...base,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderRadius: '8px'
              })
            }}
          />
          {attorneyOptions.length === 0 && !loading && (
            <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-amber-600 text-sm font-medium">No Attorneys Available</span>
                <p className="text-sm text-amber-700 mt-0.5">
                  There are no attorneys available. Please contact your administrator to add attorneys.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Company Details</h2>
              <p className="text-sm text-gray-500">Enter the company&apos;s information</p>
            </div>
          </div>

          <div className="flex items-start space-x-6">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                <Building2 className="w-12 h-12 text-gray-400" />
              </div>
            </div>

            {/* Form Fields */}
            <div className="flex-grow">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Company Name
                      {!formData.name.trim() && <span className="text-rose-500 text-lg leading-none">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter company name"
                      required
                      className={`block w-full rounded-lg border ${
                        !formData.name.trim() ? 'border-rose-300 bg-rose-50' : 'border-gray-300'
                      } py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                  </div>

                  {/* Contact Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Contact Name
                      {!formData.contactName.trim() && <span className="text-rose-500 text-lg leading-none">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                      placeholder="Enter contact name"
                      required
                      className={`block w-full rounded-lg border ${
                        !formData.contactName.trim() ? 'border-rose-300 bg-rose-50' : 'border-gray-300'
                      } py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Phone Number
                      {!formData.phoneNumber.trim() && <span className="text-rose-500 text-lg leading-none">*</span>}
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      placeholder="Enter phone number"
                      required
                      className={`block w-full rounded-lg border ${
                        !formData.phoneNumber.trim() ? 'border-rose-300 bg-rose-50' : 'border-gray-300'
                      } py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                  </div>

                  {/* Company Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Company Address
                      {!formData.address.trim() && <span className="text-rose-500 text-lg leading-none">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter company address"
                      required
                      className={`block w-full rounded-lg border ${
                        !formData.address.trim() ? 'border-rose-300 bg-rose-50' : 'border-gray-300'
                      } py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !isFormValid()}
                    className={`px-4 py-2.5 text-sm font-medium text-white border border-transparent rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                      isFormValid()
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-indigo-100 text-indigo-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Save Company'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

NewCompany.propTypes = {
  setCurrentBreadcrumb: PropTypes.func
};

NewCompany.defaultProps = {
  setCurrentBreadcrumb: () => {}
};

export default NewCompany; 