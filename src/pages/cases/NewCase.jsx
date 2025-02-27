import { useEffect, useState, useRef } from 'react';
import { ChevronDown, Pencil, X } from 'lucide-react';
import { usePage } from '../../contexts/PageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getStoredToken } from '../../utils/auth';
import api from '../../utils/api';

const NewCase = () => {
  const { setPageTitle } = usePage();
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isAttorneyDropdownOpen, setIsAttorneyDropdownOpen] = useState(false);
  const [selectedAttorney, setSelectedAttorney] = useState(null);
  const [attorneys, setAttorneys] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelectedDocuments, setTempSelectedDocuments] = useState([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [attorneySearch, setAttorneySearch] = useState('');

  const dropdownRefs = {
    template: useRef(null),
    customer: useRef(null),
    attorney: useRef(null)
  };

  const timeoutRefs = {
    template: useRef(null),
    customer: useRef(null),
    attorney: useRef(null)
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { 
        replace: true,
        state: { from: '/cases/new' }
      });
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    setPageTitle('Create New Case');
    return () => setPageTitle('');
  }, [setPageTitle]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setError(null);
        const token = getStoredToken();
        
        if (!token) {
          navigate('/login', { 
            replace: true,
            state: { from: '/cases/new' }
          });
          return;
        }

        const response = await api.get('/categories');

        if (!response.data || !response.data.data || !response.data.data.categories) {
          throw new Error('No data received from categories endpoint');
        }

        const categoriesData = response.data.data.categories;
        
        if (!Array.isArray(categoriesData)) {
          throw new Error('Invalid categories data format');
        }

        setCategories(categoriesData);
      } catch (error) {
        setError(error.message);
        
        if (error.response?.status === 401) {
          navigate('/login', { 
            replace: true,
            state: { from: '/cases/new' }
          });
        }
      }
    };

    if (isAuthenticated) {
      fetchCategories();
    }
  }, [navigate, isAuthenticated]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/auth/users');

        if (!response.data || !response.data.data || !response.data.data.users) {
          throw new Error('No users data received');
        }

        // Filter for individuals and employees
        const filteredUsers = response.data.data.users.filter(user => 
          user.role === 'individual' || user.role === 'employee'
        );
        setUsers(filteredUsers);
      } catch (error) {
        setError(error.message);
      }
    };

    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchAttorneys = async () => {
      try {
        const response = await api.get('/auth/users');

        if (!response.data || !response.data.data || !response.data.data.users) {
          throw new Error('No users data received');
        }

        const attorneyUsers = response.data.data.users.filter(user => 
          user.role === 'attorney' || user.role === 'manager'
        );
        setAttorneys(attorneyUsers);
      } catch (error) {
        setError(error.message);
      }
    };

    if (isAuthenticated) {
      fetchAttorneys();
    }
  }, [isAuthenticated]);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs).forEach(ref => {
        if (ref.current) {
          clearTimeout(ref.current);
        }
      });
    };
  }, []);

  // Handle click outside for all dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdowns = {
        template: { ref: dropdownRefs.template, setter: setIsTemplateDropdownOpen },
        customer: { ref: dropdownRefs.customer, setter: setIsCustomerDropdownOpen },
        attorney: { ref: dropdownRefs.attorney, setter: setIsAttorneyDropdownOpen }
      };

      Object.values(dropdowns).forEach(({ ref, setter }) => {
        if (ref.current && !ref.current.contains(event.target)) {
          setter(false);
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startDropdownTimeout = (type, setter) => {
    if (timeoutRefs[type].current) {
      clearTimeout(timeoutRefs[type].current);
    }
    timeoutRefs[type].current = setTimeout(() => {
      setter(false);
    }, 3000);
  };

  const clearDropdownTimeout = (type) => {
    if (timeoutRefs[type].current) {
      clearTimeout(timeoutRefs[type].current);
    }
  };

  const handleDropdownOpen = (type, isOpen, setter) => {
    // Clear any existing timeouts for all dropdowns
    Object.keys(timeoutRefs).forEach(key => {
      clearDropdownTimeout(key);
    });

    // Close other dropdowns
    if (isOpen) {
      if (type !== 'template') setIsTemplateDropdownOpen(false);
      if (type !== 'customer') setIsCustomerDropdownOpen(false);
      if (type !== 'attorney') setIsAttorneyDropdownOpen(false);
    }

    setter(!isOpen);
    if (!isOpen) {
      startDropdownTimeout(type, setter);
    }
  };

  const handleEditTemplate = () => {
    if (selectedTemplate) {
      // Initialize with current selected documents instead of template documents
      setTempSelectedDocuments([...selectedDocuments]); // Create a new array
      setIsEditModalOpen(true);
    }
  };

  const getUniqueDocuments = () => {
    const uniqueDocs = new Map();
    categories.forEach(category => {
      category.documentTypes.forEach(doc => {
        if (!uniqueDocs.has(doc.name)) {
          uniqueDocs.set(doc.name, doc);
        }
      });
    });
    return Array.from(uniqueDocs.values());
  };

  const getFilteredDocuments = () => {
    const uniqueDocs = getUniqueDocuments();
    if (!searchQuery.trim()) {
      return uniqueDocs;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return uniqueDocs.filter(doc => 
      doc.name.toLowerCase().includes(query)
    );
  };

  const handleAttorneySelect = (attorney) => {
    setSelectedAttorney(attorney);
    handleDropdownOpen('attorney', isAttorneyDropdownOpen, setIsAttorneyDropdownOpen);
  };

  const handleDocumentToggle = (docName) => {
    setTempSelectedDocuments(prev => {
      const isSelected = prev.some(doc => doc.name === docName);
      if (isSelected) {
        // Remove document if it exists
        return prev.filter(doc => doc.name !== docName);
      } else {
        // Add document with original structure
        const docToAdd = getUniqueDocuments().find(doc => doc.name === docName);
        if (docToAdd) {
          return [...prev, docToAdd];
        }
        return prev;
      }
    });
  };

  const handleCreateCase = async () => {
    try {
      if (!selectedTemplate || !selectedCustomer || !selectedAttorney) {
        setError('Please select template, customer and attorney');
        return;
      }

      if (!selectedDocuments || selectedDocuments.length === 0) {
        setError('Please select at least one document');
        return;
      }

      const requestBody = {
        userId: selectedCustomer._id,
        categoryId: selectedTemplate._id,
        createdBy: selectedCustomer._id,
        attorneys: [selectedAttorney._id],
        documentTypeIds: selectedDocuments.map(doc => doc._id)
      };

      const response = await api.post('/management', requestBody);
      
      if (response.data.status === 'success') {
        
        const caseId = response.data.data.management._id;
        navigate(`/cases/${caseId}`);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create case');
    }
  };

  const handleModalClose = () => {
    setTempSelectedDocuments([]); // Clear temporary selection
    setSearchQuery(''); // Clear search
    setIsEditModalOpen(false);
  };

  const handleDoneClick = () => {
    setSelectedDocuments([...tempSelectedDocuments]); // Create a new array to ensure state update
    handleModalClose(); // Clean up and close modal
  };

  const getFilteredCategories = () => {
    if (!templateSearch.trim()) return categories;
    const search = templateSearch.toLowerCase();
    return categories.filter(category => 
      category.name.toLowerCase().includes(search)
    );
  };

  const getFilteredUsers = () => {
    if (!customerSearch.trim()) return users; // users are already filtered for individuals/employees
    const search = customerSearch.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(search) || 
      (user.company_name && user.company_name.toLowerCase().includes(search))
    );
  };

  const getFilteredAttorneys = () => {
    if (!attorneySearch.trim()) return attorneys;
    const search = attorneySearch.toLowerCase();
    return attorneys.filter(attorney => 
      attorney.name.toLowerCase().includes(search)
    );
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="space-y-6">
        {/* Form Section */}
        <div className="space-y-6">
          {/* Template Selection with Edit Button */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Template
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative" ref={dropdownRefs.template}>
                <button
                  type="button"
                  onClick={() => handleDropdownOpen('template', isTemplateDropdownOpen, setIsTemplateDropdownOpen)}
                  className="w-[500px] h-[52px] bg-white border border-gray-200 rounded-lg px-4 text-sm text-gray-500 text-left flex items-center justify-between hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span>{selectedTemplate?.name || 'Search template name...'}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {isTemplateDropdownOpen && categories.length > 0 && (
                  <div 
                    className="absolute z-10 w-[500px] mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
                    onMouseEnter={() => clearDropdownTimeout('template')}
                    onMouseLeave={() => startDropdownTimeout('template', setIsTemplateDropdownOpen)}
                  >
                    <div className="p-2">
                      <input
                        type="text"
                        value={templateSearch}
                        onChange={(e) => {
                          setTemplateSearch(e.target.value);
                          clearDropdownTimeout('template'); // Clear timeout when typing
                        }}
                        onFocus={() => clearDropdownTimeout('template')} // Clear timeout when focused
                        placeholder="Search templates..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <ul className="py-1 max-h-[240px] overflow-auto">
                      {getFilteredCategories().map((category) => (
                        <li
                          key={category._id}
                          onClick={() => {
                            setSelectedTemplate(category);
                            setSelectedDocuments(category.documentTypes);
                            handleDropdownOpen('template', isTemplateDropdownOpen, setIsTemplateDropdownOpen);
                          }}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                        >
                          {category.name}
                        </li>
                      ))}
                      {getFilteredCategories().length === 0 && (
                        <li className="px-4 py-2 text-sm text-gray-500">
                          No templates found
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {isTemplateDropdownOpen && categories.length === 0 && (
                  <div className="absolute z-10 w-[500px] mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No templates available
                    </div>
                  </div>
                )}
              </div>

              {selectedTemplate && (
                <button
                  type="button"
                  onClick={handleEditTemplate}
                  className="h-[52px] px-4 text-gray-500 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors duration-200"
                  title="Edit Template"
                >
                  <Pencil className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Customer
            </label>
            <div className="relative" ref={dropdownRefs.customer}>
              <button
                type="button"
                onClick={() => handleDropdownOpen('customer', isCustomerDropdownOpen, setIsCustomerDropdownOpen)}
                className="w-[500px] h-[52px] bg-white border border-gray-200 rounded-lg px-4 text-sm text-gray-500 text-left flex items-center justify-between hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span>
                  {selectedCustomer ? (
                    <div className="flex items-center space-x-2">
                      <span>{selectedCustomer.name}</span>
                    </div>
                  ) : (
                    'Search customer name...'
                  )}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {isCustomerDropdownOpen && users.length > 0 && (
                <div 
                  className="absolute z-10 w-[500px] mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
                  onMouseEnter={() => clearDropdownTimeout('customer')}
                  onMouseLeave={() => startDropdownTimeout('customer', setIsCustomerDropdownOpen)}
                >
                  <div className="p-2">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        clearDropdownTimeout('customer');
                      }}
                      onFocus={() => clearDropdownTimeout('customer')}
                      placeholder="Search customers..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <ul className="py-1 max-h-[240px] overflow-auto">
                    {getFilteredUsers().map((user) => (
                      <li
                        key={user._id}
                        onClick={() => {
                          setSelectedCustomer(user);
                          handleDropdownOpen('customer', isCustomerDropdownOpen, setIsCustomerDropdownOpen);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center justify-between border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            {user.company_name && (
                              <span className="text-xs text-gray-500">
                                {user.company_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {user.company_name ? 'Corporation' : 'Individual'}
                        </span>
                      </li>
                    ))}
                    {getFilteredUsers().length === 0 && (
                      <li className="px-4 py-2 text-sm text-gray-500">
                        No customers found
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {isCustomerDropdownOpen && users.length === 0 && (
                <div className="absolute z-10 w-[500px] mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No customers available
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Attorney Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Attorney
            </label>
            <div className="relative" ref={dropdownRefs.attorney}>
              <button
                type="button"
                onClick={() => handleDropdownOpen('attorney', isAttorneyDropdownOpen, setIsAttorneyDropdownOpen)}
                className="w-[500px] h-[52px] bg-white border border-gray-200 rounded-lg px-4 text-sm text-gray-500 text-left flex items-center justify-between hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span>
                  {selectedAttorney ? (
                    <div className="flex items-center space-x-2">
                      <span>{selectedAttorney.name}</span>
                    </div>
                  ) : (
                    'Select attorney...'
                  )}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {isAttorneyDropdownOpen && attorneys.length > 0 && (
                <div 
                  className="absolute z-10 w-[500px] mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
                  onMouseEnter={() => clearDropdownTimeout('attorney')}
                  onMouseLeave={() => startDropdownTimeout('attorney', setIsAttorneyDropdownOpen)}
                >
                  <div className="p-2">
                    <input
                      type="text"
                      value={attorneySearch}
                      onChange={(e) => {
                        setAttorneySearch(e.target.value);
                        clearDropdownTimeout('attorney');
                      }}
                      onFocus={() => clearDropdownTimeout('attorney')}
                      placeholder="Search attorneys..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <ul className="py-1 max-h-[240px] overflow-auto">
                    {getFilteredAttorneys().map((attorney) => {
                      const isSelected = selectedAttorney?._id === attorney._id;
                      return (
                        <li
                          key={attorney._id}
                          onClick={() => handleAttorneySelect(attorney)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center justify-between border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 text-xs">
                                {attorney.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{attorney.name}</span>
                          </div>
                          {isSelected && (
                            <svg className="w-5 h-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </li>
                      );
                    })}
                    {getFilteredAttorneys().length === 0 && (
                      <li className="px-4 py-2 text-sm text-gray-500">
                        No attorneys found
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Create Case Button */}
          <div className="pt-4 ml-[380px]">
            <button
              type="button"
              onClick={handleCreateCase}
              disabled={!selectedTemplate || !selectedCustomer || !selectedAttorney}
              className="w-[120px] h-[44px] bg-blue-600 text-white rounded-lg px-4 text-sm font-medium hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Create Case
            </button>
          </div>
        </div>
      </div>

      {/* Edit Template Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px] max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Edit document checklist
                </h2>
                <button
                  onClick={handleModalClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Box */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm text-gray-600 font-medium">Files in progress</h3>
              </div>

              {/* Document List */}
              <div className="space-y-2 mb-6">
                {getFilteredDocuments().map((doc) => {
                  const isSelected = tempSelectedDocuments.some(d => d.name === doc.name);
                  return (
                    <div
                      key={doc._id}
                      onClick={() => handleDocumentToggle(doc.name)}
                      className="flex items-center py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <button
                          className={`w-5 h-5 rounded-full border flex items-center justify-center
                            ${isSelected 
                              ? 'border-blue-500 bg-blue-500 text-white' 
                              : 'border-gray-300'
                            }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                              <path
                                d="M10 3L4.5 8.5L2 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </button>
                        <span className="text-sm">{doc.name}</span>
                      </div>
                    </div>
                  );
                })}
                
                {/* No results message */}
                {getFilteredDocuments().length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No documents found matching &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
              </div>

              {/* Done Button */}
              <button
                onClick={handleDoneClick}
                className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewCase; 