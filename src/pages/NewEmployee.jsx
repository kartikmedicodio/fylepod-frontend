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
import { formatPhoneNumber, validatePhoneNumber } from '../utils/formatPhoneNumber';

const NewEmployee = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const { setPageTitle } = usePage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [attorneys, setAttorneys] = useState([]);
  const [isLoadingAttorneys, setIsLoadingAttorneys] = useState(false);
  const [selectedAttorney, setSelectedAttorney] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    sex: 'Male',
    nationality: '',
    company_id: '',
    company_name: '',
    attorney_id: '',
    attorney_name: '',
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
      formData.attorney_id !== '' &&
      validatePhoneNumber(formData.contact.mobileNumber)
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

  // Format attorneys for react-select
  const attorneyOptions = attorneys
    .filter(attorney => {
      const userLawfirmId = user?.lawfirm_id?._id;
      return !userLawfirmId || String(attorney.lawfirm_id?._id) === String(userLawfirmId);
    })
    .map(attorney => ({
      value: attorney._id,
      label: `${attorney.name} (${attorney.lawfirm_id?.name || attorney.lawfirm_name || 'No Law Firm'})`,
      attorney: attorney
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

  // Fetch attorneys for dropdown
  useEffect(() => {
    const fetchAttorneys = async () => {
      setIsLoadingAttorneys(true);
      try {
        const response = await api.get('/auth/attorneys');
        if (response.data.status === 'success') {
          const attorneysData = response.data.data.attorneys;
          setAttorneys(attorneysData);
        }
      } catch (error) {
        toast.error('Failed to load attorneys');
      } finally {
        setIsLoadingAttorneys(false);
      }
    };

    fetchAttorneys();
  }, [user?.lawfirm_id]);

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

  const handleAttorneySelect = (selectedOption) => {
    console.log('Selected attorney option:', selectedOption);
    setSelectedAttorney(selectedOption);
    
    if (selectedOption) {
      const selectedAttorney = selectedOption.attorney;
      console.log('Found selected attorney:', selectedAttorney);
      
      setFormData(prev => ({
        ...prev,
        attorney_id: selectedAttorney._id,
        attorney_name: selectedAttorney.name,
        lawfirm_id: selectedAttorney.lawfirm_id?._id || null,
        lawfirm_name: selectedAttorney.lawfirm_id?.name || selectedAttorney.lawfirm_name || null
      }));
    } else {
      console.log('Clearing attorney selection');
      setFormData(prev => ({
        ...prev,
        attorney_id: '',
        attorney_name: '',
        lawfirm_id: user?.lawfirm_id?._id || null,
        lawfirm_name: user?.lawfirm_name || null
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
        role: 'employee',
        sex: formData.sex,
        nationality: formData.nationality,
        company_id: formData.company_id,
        company_name: formData.company_name,
        attorney_id: formData.attorney_id,
        attorney_name: formData.attorney_name,
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
      if (error.response?.data?.message?.includes('already exists')) {
        toast.error('This email is already registered. Please use a different email address.');
      } else {
        toast.error(error.response?.data?.message || error.message || 'Failed to create employee');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-3 max-w-4xl h-screen flex flex-col overflow-hidden fixed inset-0">
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

      <div className="space-y-4">
        {/* Combined Corporation and Attorney Selection Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 mt-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Organization Details</h2>
              <p className="text-sm text-gray-500">Select the corporation and attorney for this employee</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Corporation Selection */}
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

            {/* Attorney Selection */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                Select Attorney
                {!formData.attorney_id && <span className="text-rose-500 text-lg leading-none">*</span>}
              </label>
              <Select
                value={selectedAttorney}
                onChange={handleAttorneySelect}
                options={attorneyOptions}
                isLoading={isLoadingAttorneys}
                isClearable
                isSearchable
                placeholder="Search and select attorney..."
                noOptionsMessage={() => "No attorneys found"}
                className={`react-select-container ${!formData.attorney_id ? 'select-error' : ''}`}
                classNamePrefix="react-select"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: '42px',
                    borderColor: !formData.attorney_id ? '#FCA5A5' : state.isFocused ? '#6366F1' : '#E5E7EB',
                    boxShadow: state.isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
                    '&:hover': {
                      borderColor: state.isFocused ? '#6366F1' : !formData.attorney_id ? '#EF4444' : '#CBD5E1'
                    }
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: !formData.attorney_id ? '#EF4444' : '#94A3B8'
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
              {attorneyOptions.length === 0 && !isLoadingAttorneys && (
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
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Employee Details</h2>
                <p className="text-sm text-gray-500">Enter the employee's personal information</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
              </div>

              {/* Form Fields */}
              <div className="flex-grow">
                <form onSubmit={handleSubmit} className="space-y-4">
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

                    {/* Email */}
                    <div>
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
                        maxLength={12}
                        required
                        className={`block w-full rounded-lg border ${
                          !validatePhoneNumber(formData.contact.mobileNumber) ? 'border-rose-300 bg-rose-50' : 'border-gray-300'
                        } py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                      />
                      {!validatePhoneNumber(formData.contact.mobileNumber) && formData.contact.mobileNumber && (
                        <p className="mt-1 text-sm text-rose-600">Please enter a valid 10-digit phone number</p>
                      )}
                    </div>

                    {/* Residence Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.contact.residencePhone}
                        onChange={(e) => handleInputChange('residence_phone', e.target.value)}
                        placeholder="Enter residence phone"
                        maxLength={12}
                        className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
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

                    {/* Nationality */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nationality
                      </label>
                      <select
                        value={formData.nationality}
                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      >
                        <option value="">Select nationality</option>
                        <option value="Afghan">Afghan</option>
                        <option value="Albanian">Albanian</option>
                        <option value="Algerian">Algerian</option>
                        <option value="American">American</option>
                        <option value="Andorran">Andorran</option>
                        <option value="Angolan">Angolan</option>
                        <option value="Argentine">Argentine</option>
                        <option value="Armenian">Armenian</option>
                        <option value="Australian">Australian</option>
                        <option value="Austrian">Austrian</option>
                        <option value="Azerbaijani">Azerbaijani</option>
                        <option value="Bahamian">Bahamian</option>
                        <option value="Bahraini">Bahraini</option>
                        <option value="Bangladeshi">Bangladeshi</option>
                        <option value="Barbadian">Barbadian</option>
                        <option value="Belarusian">Belarusian</option>
                        <option value="Belgian">Belgian</option>
                        <option value="Belizean">Belizean</option>
                        <option value="Beninese">Beninese</option>
                        <option value="Bhutanese">Bhutanese</option>
                        <option value="Bolivian">Bolivian</option>
                        <option value="Brazilian">Brazilian</option>
                        <option value="British">British</option>
                        <option value="Bruneian">Bruneian</option>
                        <option value="Bulgarian">Bulgarian</option>
                        <option value="Burkinabe">Burkinabe</option>
                        <option value="Burmese">Burmese</option>
                        <option value="Burundian">Burundian</option>
                        <option value="Cambodian">Cambodian</option>
                        <option value="Cameroonian">Cameroonian</option>
                        <option value="Canadian">Canadian</option>
                        <option value="Cape Verdean">Cape Verdean</option>
                        <option value="Central African">Central African</option>
                        <option value="Chadian">Chadian</option>
                        <option value="Chilean">Chilean</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Colombian">Colombian</option>
                        <option value="Comoran">Comoran</option>
                        <option value="Congolese">Congolese</option>
                        <option value="Costa Rican">Costa Rican</option>
                        <option value="Croatian">Croatian</option>
                        <option value="Cuban">Cuban</option>
                        <option value="Cypriot">Cypriot</option>
                        <option value="Czech">Czech</option>
                        <option value="Danish">Danish</option>
                        <option value="Djiboutian">Djiboutian</option>
                        <option value="Dominican">Dominican</option>
                        <option value="Dutch">Dutch</option>
                        <option value="East Timorese">East Timorese</option>
                        <option value="Ecuadorean">Ecuadorean</option>
                        <option value="Egyptian">Egyptian</option>
                        <option value="Emirati">Emirati</option>
                        <option value="Equatorial Guinean">Equatorial Guinean</option>
                        <option value="Eritrean">Eritrean</option>
                        <option value="Estonian">Estonian</option>
                        <option value="Ethiopian">Ethiopian</option>
                        <option value="Fijian">Fijian</option>
                        <option value="Filipino">Filipino</option>
                        <option value="Finnish">Finnish</option>
                        <option value="French">French</option>
                        <option value="Gabonese">Gabonese</option>
                        <option value="Gambian">Gambian</option>
                        <option value="Georgian">Georgian</option>
                        <option value="German">German</option>
                        <option value="Ghanaian">Ghanaian</option>
                        <option value="Greek">Greek</option>
                        <option value="Grenadian">Grenadian</option>
                        <option value="Guatemalan">Guatemalan</option>
                        <option value="Guinean">Guinean</option>
                        <option value="Guyanese">Guyanese</option>
                        <option value="Haitian">Haitian</option>
                        <option value="Honduran">Honduran</option>
                        <option value="Hungarian">Hungarian</option>
                        <option value="Icelandic">Icelandic</option>
                        <option value="Indian">Indian</option>
                        <option value="Indonesian">Indonesian</option>
                        <option value="Iranian">Iranian</option>
                        <option value="Iraqi">Iraqi</option>
                        <option value="Irish">Irish</option>
                        <option value="Israeli">Israeli</option>
                        <option value="Italian">Italian</option>
                        <option value="Ivorian">Ivorian</option>
                        <option value="Jamaican">Jamaican</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Jordanian">Jordanian</option>
                        <option value="Kazakhstani">Kazakhstani</option>
                        <option value="Kenyan">Kenyan</option>
                        <option value="Korean">Korean</option>
                        <option value="Kuwaiti">Kuwaiti</option>
                        <option value="Laotian">Laotian</option>
                        <option value="Latvian">Latvian</option>
                        <option value="Lebanese">Lebanese</option>
                        <option value="Liberian">Liberian</option>
                        <option value="Libyan">Libyan</option>
                        <option value="Lithuanian">Lithuanian</option>
                        <option value="Luxembourger">Luxembourger</option>
                        <option value="Macedonian">Macedonian</option>
                        <option value="Malagasy">Malagasy</option>
                        <option value="Malawian">Malawian</option>
                        <option value="Malaysian">Malaysian</option>
                        <option value="Maldivian">Maldivian</option>
                        <option value="Malian">Malian</option>
                        <option value="Maltese">Maltese</option>
                        <option value="Mauritanian">Mauritanian</option>
                        <option value="Mauritian">Mauritian</option>
                        <option value="Mexican">Mexican</option>
                        <option value="Moldovan">Moldovan</option>
                        <option value="Monacan">Monacan</option>
                        <option value="Mongolian">Mongolian</option>
                        <option value="Moroccan">Moroccan</option>
                        <option value="Mozambican">Mozambican</option>
                        <option value="Namibian">Namibian</option>
                        <option value="Nepalese">Nepalese</option>
                        <option value="New Zealander">New Zealander</option>
                        <option value="Nicaraguan">Nicaraguan</option>
                        <option value="Nigerian">Nigerian</option>
                        <option value="Norwegian">Norwegian</option>
                        <option value="Omani">Omani</option>
                        <option value="Pakistani">Pakistani</option>
                        <option value="Panamanian">Panamanian</option>
                        <option value="Papua New Guinean">Papua New Guinean</option>
                        <option value="Paraguayan">Paraguayan</option>
                        <option value="Peruvian">Peruvian</option>
                        <option value="Polish">Polish</option>
                        <option value="Portuguese">Portuguese</option>
                        <option value="Qatari">Qatari</option>
                        <option value="Romanian">Romanian</option>
                        <option value="Russian">Russian</option>
                        <option value="Rwandan">Rwandan</option>
                        <option value="Saudi">Saudi</option>
                        <option value="Senegalese">Senegalese</option>
                        <option value="Serbian">Serbian</option>
                        <option value="Seychellois">Seychellois</option>
                        <option value="Sierra Leonean">Sierra Leonean</option>
                        <option value="Singaporean">Singaporean</option>
                        <option value="Slovak">Slovak</option>
                        <option value="Slovenian">Slovenian</option>
                        <option value="Solomon Islander">Solomon Islander</option>
                        <option value="Somali">Somali</option>
                        <option value="South African">South African</option>
                        <option value="Spanish">Spanish</option>
                        <option value="Sri Lankan">Sri Lankan</option>
                        <option value="Sudanese">Sudanese</option>
                        <option value="Surinamer">Surinamer</option>
                        <option value="Swazi">Swazi</option>
                        <option value="Swedish">Swedish</option>
                        <option value="Swiss">Swiss</option>
                        <option value="Syrian">Syrian</option>
                        <option value="Taiwanese">Taiwanese</option>
                        <option value="Tajik">Tajik</option>
                        <option value="Tanzanian">Tanzanian</option>
                        <option value="Thai">Thai</option>
                        <option value="Togolese">Togolese</option>
                        <option value="Tongan">Tongan</option>
                        <option value="Trinidadian">Trinidadian</option>
                        <option value="Tunisian">Tunisian</option>
                        <option value="Turkish">Turkish</option>
                        <option value="Turkmen">Turkmen</option>
                        <option value="Tuvaluan">Tuvaluan</option>
                        <option value="Ugandan">Ugandan</option>
                        <option value="Ukrainian">Ukrainian</option>
                        <option value="Uruguayan">Uruguayan</option>
                        <option value="Uzbekistani">Uzbekistani</option>
                        <option value="Venezuelan">Venezuelan</option>
                        <option value="Vietnamese">Vietnamese</option>
                        <option value="Yemeni">Yemeni</option>
                        <option value="Zambian">Zambian</option>
                        <option value="Zimbabwean">Zimbabwean</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 mt-3 pt-2 border-t border-gray-100">
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