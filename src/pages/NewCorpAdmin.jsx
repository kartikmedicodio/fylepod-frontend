import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, X } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { usePage } from '../contexts/PageContext';

const NewCorpAdmin = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const { user } = useAuth();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const { setPageTitle } = usePage();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const [validationErrors, setValidationErrors] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    residencePhone: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'corp_admin',
    sex: 'Male',
    company_id: companyId,
    company_name: '',
    lawfirm_id: user?.lawfirm_id?._id || null,
    lawfirm_name: user?.lawfirm_name || null,
    contact: {
      residencePhone: '',
      mobileNumber: '',
      email: ''
    }
  });

  // Set breadcrumb and page title on mount
  useEffect(() => {
    setPageTitle('New Corporate Admin');
    setCurrentBreadcrumb([
      { name: 'Home', path: '/dashboard' },
      { name: 'New Company', path: '/company/new' },
      { name: 'New Corporate Admin', path: `/companies/${companyId}/admin/new` }
    ]);
    return () => {
      setPageTitle('');
      setCurrentBreadcrumb([]);
    };
  }, [setPageTitle, setCurrentBreadcrumb, companyId]);

  // Fetch company details
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const response = await api.get(`/companies/${companyId}`);
        if (response.data.success) {
          const company = response.data.data;
          setCompanyDetails(company);
          setFormData(prev => ({
            ...prev,
            company_name: company.company_name,
            company_id: company._id
          }));
        }
      } catch (error) {
        toast.error('Failed to fetch company details');
        navigate('/dashboard');
      }
    };

    if (companyId) {
      fetchCompanyDetails();
    }
  }, [companyId, navigate]);

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s]*$/.test(name)) return 'Name should only contain letters and spaces';
    return '';
  };

  const validateEmail = (email) => {
    if (!email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
    return '';
  };

  const validatePhoneNumber = (number, isRequired = false) => {
    if (!number.trim() && isRequired) return 'Phone number is required';
    if (number.trim()) {
      // Remove any spaces, dashes or other non-digit characters
      const digitsOnly = number.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        return 'Phone number must be exactly 10 digits';
      }
      // Check if it follows the format: 10 digits only
      if (!/^\d{10}$/.test(digitsOnly)) {
        return 'Invalid phone number format';
      }
    }
    return '';
  };

  // Update isFormValid to use validation functions
  const isFormValid = () => {
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const mobileError = validatePhoneNumber(formData.contact.mobileNumber, true);
    const residenceError = validatePhoneNumber(formData.contact.residencePhone, false);
    
    return !nameError && !emailError && !mobileError && !residenceError;
  };

  const handleInputChange = (field, value) => {
    // For phone numbers, only allow digits and format them
    if (field === 'mobile_number' || field === 'residence_phone') {
      // Remove any non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      // Limit to 10 digits
      const truncated = digitsOnly.slice(0, 10);
      // Format as: XXX-XXX-XXXX
      const formatted = truncated.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      value = truncated.length ? formatted : truncated;
    }

    // Update form data
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

    // Validate and update errors
    let error = '';
    switch(field) {
      case 'name':
        error = validateName(value);
        setValidationErrors(prev => ({ ...prev, name: error }));
        break;
      case 'email':
        error = validateEmail(value);
        setValidationErrors(prev => ({ ...prev, email: error }));
        break;
      case 'mobile_number':
        error = validatePhoneNumber(value, true);
        setValidationErrors(prev => ({ ...prev, mobileNumber: error }));
        break;
      case 'residence_phone':
        error = validatePhoneNumber(value, false);
        setValidationErrors(prev => ({ ...prev, residencePhone: error }));
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields before submission
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const mobileError = validatePhoneNumber(formData.contact.mobileNumber, true);
    const residenceError = validatePhoneNumber(formData.contact.residencePhone, false);

    // Update all validation errors
    setValidationErrors({
      name: nameError,
      email: emailError,
      mobileNumber: mobileError,
      residencePhone: residenceError
    });

    // Check if there are any validation errors
    if (nameError || emailError || mobileError || residenceError) {
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Validation Error
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Please fix all validation errors before submitting
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ),
        { duration: 4000 }
      );
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        role: 'corp_admin',
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

      const response = await api.post('/auth/users', userData);
      
      if (response.data.status === 'success') {
        toast.success('Corporate admin created successfully!', {
          style: {
            background: '#10B981',
            color: '#FFFFFF'
          },
          iconTheme: {
            primary: '#FFFFFF',
            secondary: '#10B981'
          }
        });
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to create corporate admin');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      
      if (errorMessage.includes('email already exists')) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'This email is already registered'
        }));
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <X className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Email Already Exists
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      This email address is already registered in the system
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          ),
          { duration: 4000 }
        );
      } else {
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <X className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Failed to Create Admin
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          ),
          { duration: 4000 }
        );
      }
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Corporate Admin Created!</h2>
            <p className="text-gray-600">{formData.name} has been added successfully</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-rose-800">Failed to Create Admin</h3>
              <p className="mt-1 text-sm text-rose-700">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Company Info Card */}
      {companyDetails && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">{companyDetails.company_name}</h2>
              <p className="text-sm text-gray-500">Creating admin account for this company</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Admin Details</h2>
              <p className="text-sm text-gray-500">Enter the corporate admin&apos;s information</p>
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
                      <span className="text-rose-500 text-lg leading-none">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter full name"
                      required
                      className={`block w-full rounded-lg border ${
                        validationErrors.name ? 'border-rose-300 bg-rose-50' : 'border-gray-300'
                      } py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                    {validationErrors.name && (
                      <p className="mt-1 text-sm text-rose-500">{validationErrors.name}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.contact.residencePhone}
                      onChange={(e) => handleInputChange('residence_phone', e.target.value)}
                      placeholder="Enter residence phone"
                      className={`block w-full rounded-lg border ${
                        validationErrors.residencePhone ? 'border-rose-300 bg-rose-50' : 'border-gray-300'
                      } py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                    {validationErrors.residencePhone && (
                      <p className="mt-1 text-sm text-rose-500">{validationErrors.residencePhone}</p>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Mobile Number
                      <span className="text-rose-500 text-lg leading-none">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.contact.mobileNumber}
                      onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                      placeholder="Enter mobile number"
                      required
                      className={`block w-full rounded-lg border ${
                        validationErrors.mobileNumber ? 'border-rose-300 bg-rose-50' : 'border-gray-300'
                      } py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                    {validationErrors.mobileNumber && (
                      <p className="mt-1 text-sm text-rose-500">{validationErrors.mobileNumber}</p>
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
                      <span className="text-rose-500 text-lg leading-none">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      required
                      className={`block w-full rounded-lg border ${
                        validationErrors.email ? 'border-rose-300 bg-rose-50' : 'border-gray-300'
                      } py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-rose-500">{validationErrors.email}</p>
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
                      'Save Admin'
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

NewCorpAdmin.propTypes = {
  setCurrentBreadcrumb: PropTypes.func
};

NewCorpAdmin.defaultProps = {
  setCurrentBreadcrumb: () => {}
};

export default NewCorpAdmin; 