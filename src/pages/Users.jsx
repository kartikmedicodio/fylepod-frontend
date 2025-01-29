import { useState, useEffect } from 'react';
import { User, Loader2, Plus, X } from 'lucide-react';
import api from '../utils/api';
import DashboardLayout from '../layouts/DashboardLayout';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    company_name: '',
    lawfirm_name: ''
  });
  const [createError, setCreateError] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [lawFirms, setLawFirms] = useState([]);

  useEffect(() => {
    fetchUsers();
    const fetchDropdownData = async () => {
      try {
        const [companiesRes, lawFirmsRes] = await Promise.all([
          api.get('/companies'),
          api.get('/lawfirms')
        ]);
        setCompanies(companiesRes.data.data || []);
        setLawFirms(lawFirmsRes.data.data || []);
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
      }
    };

    fetchDropdownData();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      // console.log("all the users response", response);
      setUsers(response.data.data.users);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError(null);
    
    try {
      const response = await api.post('/auth/users', newUser);
      setUsers([...users, response.data.data.user]);
      setShowModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'user', company_name: '', lawfirm_name: '' });
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Error creating user');
    }
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Create New User</h2>
            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {createError && (
            <div className="mb-4 p-2 bg-red-50 text-red-500 rounded">
              {createError}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label htmlFor="company-select" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <select
                id="company-select"
                value={newUser.company_name}
                onChange={(e) => setNewUser({ ...newUser, company_name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                aria-label="Select company name"
              >
                <option value="">Select a company</option>
                {companies && companies.length > 0 && companies.map((company) => (
                  <option 
                    key={company._id || company.id} 
                    value={company.name || company.company_name}
                  >
                    {company.name || company.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="lawfirm-select" className="block text-sm font-medium text-gray-700">
                Law Firm Name
              </label>
              <select
                id="lawfirm-select"
                value={newUser.lawfirm_name}
                onChange={(e) => setNewUser({ ...newUser, lawfirm_name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                aria-label="Select law firm name"
              >
                <option value="">Select a law firm</option>
                {lawFirms && lawFirms.length > 0 && lawFirms.map((lawFirm, index) => (
                  <option 
                    key={lawFirm._id || lawFirm.id || index} 
                    value={lawFirm.lawfirm_name}
                  >
                    {lawFirm.lawfirm_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 text-red-500 text-center">
          <p>Error: {error}</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">All Users</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Law Firm Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">
                      {user.type?.replace('_', ' ') || 'individual'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.company_id?.company_name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.lawfirm_id?.lawfirm_name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Users Management</h1>
        {renderContent()}
        {renderModal()}
      </div>
    </DashboardLayout>
  );
};

export default Users; 