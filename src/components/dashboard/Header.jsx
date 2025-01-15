import { useAuth } from '../../contexts/AuthContext';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b h-16">
      <div className="h-full px-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          Document Management System
        </h1>

        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700">
            <Bell className="w-5 h-5" />
          </button>
          
          <Link 
            to="/profile" 
            className="flex items-center space-x-3 hover:opacity-80"
          >
            <span className="text-sm font-medium text-gray-700">
              {user?.name || 'User'}
            </span>
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {(user?.name || 'U').charAt(0)}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header; 