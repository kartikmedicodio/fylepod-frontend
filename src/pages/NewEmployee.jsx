import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { toast } from 'sonner';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { User, Building2 } from 'lucide-react';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { usePage } from '../contexts/PageContext';

const NewEmployee = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const { setPageTitle } = usePage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'fylepod@123',
    role: 'employee',
    sex: 'Male',
    company_id: '',
    company_name: '',
    lawfirm_id: user?.lawfirm_id?._id || null,
    lawfirm_name: user?.lawfirm_name || null,
    contact: {
      residencePhone: '',
      mobileNumber: '',
      email: ''
    }
  });

  // Check if all required fields are filled
  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.company_id !== '' &&
      formData.contact.mobileNumber.trim() !== ''
    );
  };

  // Format companies for react-select
  const companyOptions = companies
    .filter(company => {
      const userLawfirmId = user?.lawfirm_id?._id;
      return !userLawfirmId || String(company.lawfirm_id) === String(userLawfirmId);
    })
    .map(company => ({
      value: company._id,
      label: company.company_name
    }));

  // Set breadcrumb and page title on mount
  useEffect(() => {
    setPageTitle('New Employee');
    setCurrentBreadcrumb([
      { name: 'Home', path: '/dashboard' },
      { name: 'New Employee', path: '/employee/new' }
    ]);
    return () => {
      setPageTitle('');
      setCurrentBreadcrumb([]);
    };
  }, [setPageTitle, setCurrentBreadcrumb]);

  // Fetch companies for dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const response = await api.get('/companies');
        if (response.data.success) {
          const companiesData = response.data.data;
          setCompanies(companiesData);
        }
      } catch (error) {
        toast.error('Failed to load companies');
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, [user?.lawfirm_id]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      contact: {
        ...prev.contact,
        residencePhone: field === 'residence_phone' ? value : prev.contact.residencePhone,
        mobileNumber: field === 'mobile_number' ? value : prev.contact.mobileNumber,
        email: field === 'email' ? value : prev.contact.email
      }
    }));
  };

  const handleCompanySelect = (selectedOption) => {
    if (selectedOption) {
      const selectedCompany = companies.find(c => c._id === selectedOption.value);
      setFormData(prev => ({
        ...prev,
        company_id: selectedCompany._id,
        company_name: selectedCompany.company_name,
        lawfirm_id: user?.lawfirm_id?._id || null,
        lawfirm_name: user?.lawfirm_name || null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        company_id: '',
        company_name: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'employee',
        sex: formData.sex,
        company_id: formData.company_id,
        company_name: formData.company_name,
        lawfirm_id: formData.lawfirm_id,
        lawfirm_name: formData.lawfirm_name,
        contact: {
          residencePhone: formData.contact.residencePhone,
          mobileNumber: formData.contact.mobileNumber,
          email: formData.email
        }
      };

      await api.post('/auth/users', userData);
      
      // Show success message
      setShowSuccess(true);

      // Navigate after delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      toast.error('Failed to create employee', {
        description: error.response?.data?.message || error.message || 'Please try again',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Employee Created!</h2>
            <p className="text-gray-600">{formData.name} has been added successfully</p>
          </div>
        </div>
      )}

      {/* Corporation Selection Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <Building2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Corporation Details</h2>
            <p className="text-sm text-gray-500">Select the corporation this employee belongs to</p>
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            Select Corporation
            {!formData.company_id && <span className="text-rose-500 text-lg leading-none">*</span>}
          </label>
          <Select
            value={formData.company_id ? { value: formData.company_id, label: formData.company_name } : null}
            onChange={handleCompanySelect}
            options={companyOptions}
            isLoading={isLoadingCompanies}
            isClearable
            isSearchable
            placeholder="Search and select corporation..."
            noOptionsMessage={() => "No corporations found"}
            className={`react-select-container ${!formData.company_id ? 'select-error' : ''}`}
            classNamePrefix="react-select"
            styles={{
              control: (base, state) => ({
                ...base,
                minHeight: '42px',
                borderColor: !formData.company_id ? '#FCA5A5' : state.isFocused ? '#6366F1' : '#E5E7EB',
                boxShadow: state.isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
                '&:hover': {
                  borderColor: state.isFocused ? '#6366F1' : !formData.company_id ? '#EF4444' : '#CBD5E1'
                }
              }),
              placeholder: (base) => ({
                ...base,
                color: !formData.company_id ? '#EF4444' : '#94A3B8'
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
          {!formData.company_id && (
            <div className="mt-2 flex items-start gap-2 text-rose-600">
            </div>
          )}
          {companyOptions.length === 0 && !isLoadingCompanies && (
            <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-amber-600 text-sm font-medium">No Corporations Available</span>
                <p className="text-sm text-amber-700 mt-0.5">
                  There are no corporations available for your law firm. Please contact your administrator to add corporations.
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
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Employee Details</h2>
              <p className="text-sm text-gray-500">Enter the employee's personal information</p>
            </div>
          </div>

          <div className="flex items-start space-x-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            </div>

            {/* Form Fields */}
            <div className="flex-grow">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Full Name
                      {!formData.name.trim() && <span className="text-rose-500 text-lg leading-none">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter full name"
                      required
                      className={`block w-full rounded-lg border ${
                        !formData.name.trim() ? 'border-rose-300 bg-rose-50' : 'border-gray-300'
                      } py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                    {!formData.name.trim() && (
                      <div className="mt-2 flex items-start gap-2 text-rose-600">
                      </div>
                    )}
                  </div>

                  {/* Residence Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.contact.residencePhone}
                      onChange={(e) => handleInputChange('residence_phone', e.target.value)}
                      placeholder="Enter residence phone"
                      className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Mobile Number
                      {!formData.contact.mobileNumber.trim() && <span className="text-rose-500 text-lg leading-none">*</span>}
                    </label>
                    <input
                      type="tel"
                      value={formData.contact.mobileNumber}
                      onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                      placeholder="Enter mobile number"
                      required
                      className={`block w-full rounded-lg border ${
                        !formData.contact.mobileNumber.trim() ? 'border-rose-300 bg-rose-50' : 'border-gray-300'
                      } py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                    {!formData.contact.mobileNumber.trim() && (
                      <div className="mt-2 flex items-start gap-2 text-rose-600">
                      </div>
                    )}
                  </div>

                  {/* Sex */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <select
                      value={formData.sex}
                      onChange={(e) => handleInputChange('sex', e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Email Address
                      {!formData.email.trim() && <span className="text-rose-500 text-lg leading-none">*</span>}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      required
                      className={`block w-full rounded-lg border ${
                        !formData.email.trim() ? 'border-rose-300 bg-rose-50' : 'border-gray-300'
                      } py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                    {!formData.email.trim() && (
                      <div className="mt-2 flex items-start gap-2 text-rose-600">
                      </div>
                    )}
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
                    disabled={isSubmitting || !isFormValid()}
                    className={`px-4 py-2.5 text-sm font-medium text-white border border-transparent rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                      isFormValid()
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-indigo-100 text-indigo-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
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
                      'Save Employee'
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

NewEmployee.propTypes = {
  setCurrentBreadcrumb: PropTypes.func
};

NewEmployee.defaultProps = {
  setCurrentBreadcrumb: () => {}
};

export default NewEmployee; 