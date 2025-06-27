import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { usePage } from '../contexts/PageContext';
import { formatPhoneNumber, validatePhoneNumber } from '../utils/formatPhoneNumber';

const NewCorpAdmin = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const { user } = useAuth();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const { setPageTitle } = usePage();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);

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

  const handleInputChange = (field, value) => {
    if (field === 'residence_phone' || field === 'mobile_number') {
      // Format the phone number as user types
      const formattedValue = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          [field === 'residence_phone' ? 'residencePhone' : 'mobileNumber']: formattedValue
        }
      }));
    } else {
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
    }
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.email.trim() !== '' &&
      validatePhoneNumber(formData.contact.mobileNumber) &&
      formData.sex !== ''
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to create corporate admin');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to create corporate admin');
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
                      maxLength={12} // XXX-XXX-XXXX format
                      className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Mobile Number
                      {!validatePhoneNumber(formData.contact.mobileNumber) && <span className="text-rose-500 text-lg leading-none">*</span>}
                    </label>
                    <input
                      type="tel"
                      value={formData.contact.mobileNumber}
                      onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                      placeholder="Enter mobile number"
                      maxLength={12} // XXX-XXX-XXXX format
                      required
                      className={`block w-full rounded-lg border ${
                        !validatePhoneNumber(formData.contact.mobileNumber) ? 'border-rose-300 bg-rose-50' : 'border-gray-300'
                      } py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                    {!validatePhoneNumber(formData.contact.mobileNumber) && formData.contact.mobileNumber && (
                      <p className="mt-1 text-sm text-rose-600">Please enter a valid 10-digit phone number</p>
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