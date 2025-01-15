import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, FolderTree, Loader2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../utils/api';

const Settings = () => {
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, categoriesResponse] = await Promise.all([
          api.get('/auth/users'),
          api.get('/categories')
        ]);

        setUsers(usersResponse.data.data.users);
        setCategories(categoriesResponse.data.data.categories);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedCategory) {
      alert('Please select both a user and a category');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // First create management entry
      const managementResponse = await api.post('/management', {
        userId: selectedUser,
        categoryId: selectedCategory
      });

      console.log('Management entry created:', managementResponse.data);

      // Then send invitation email
      const invitationResponse = await api.post('/invitations/send', {
        userId: selectedUser,
        categoryId: selectedCategory
      });

      console.log('Invitation sent:', invitationResponse.data);

      // Show success message
      alert('Form assigned and invitation sent successfully!');
      
      // Reset selections
      setSelectedUser('');
      setSelectedCategory('');
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Failed to assign form and send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Select User
                </div>
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                required
                disabled={submitting}
              >
                <option value="">Choose a user...</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <FolderTree className="w-4 h-4 mr-2" />
                  Select Category
                </div>
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                required
                disabled={submitting}
              >
                <option value="">Choose a category...</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Details Display */}
            {(selectedUser || selectedCategory) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Details:</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  {selectedUser && (
                    <div>
                      <span className="font-medium">User: </span>
                      {users.find(u => u._id === selectedUser)?.name}
                    </div>
                  )}
                  {selectedCategory && (
                    <div>
                      <span className="font-medium">Category: </span>
                      {categories.find(c => c._id === selectedCategory)?.name}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${submitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                  }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Assign Form'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings; 