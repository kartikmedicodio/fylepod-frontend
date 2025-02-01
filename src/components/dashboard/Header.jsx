import { useAuth } from '../../contexts/AuthContext';
import { Bell, Building, ChevronRight } from 'lucide-react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';

const Header = ({ showText = true, selectedUser, activeTab }) => {
  const { user } = useAuth();
  const companyName = "Lexon Legal Solutions";
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isCorpRoute = location.pathname.includes('/crm');

  const renderBreadcrumb = () => {
    if (isCorpRoute) {
      return (
        <div className="flex items-center space-x-2">
          {/* Company name for corporation routes */}
          <div 
            onClick={() => navigate('/crm')}
            className="flex items-center text-gray-700 cursor-pointer hover:text-gray-900"
          >
            <Building className="w-5 h-5 mr-2 text-gray-500" />
            <span className="text-sm font-medium">{companyName}</span>
          </div>

          {!showText && selectedUser && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {selectedUser.name}
              </span>
            </>
          )}

          {!showText && activeTab && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {activeTab === 'completed' ? 'Completed Applications' : 'Pending Applications'}
              </span>
            </>
          )}

          {!showText && applicationId && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Documents
              </span>
            </>
          )}
        </div>
      );
    } else {
      // Document Collection Agent view
      return (
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-gray-700">
            <span className="text-lg font-semibold">Document Collection Agent</span>
          </div>

          {!showText && selectedUser && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {selectedUser.name}
              </span>
            </>
          )}

          {!showText && activeTab && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {activeTab === 'completed' ? 'Completed Documents' : 'Pending Documents'}
              </span>
            </>
          )}

          {!showText && applicationId && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Document Details
              </span>
            </>
          )}
        </div>
      );
    }
  };

  return (
    <header className="bg-white border-b h-16">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {renderBreadcrumb()}
        </div>

        {/* User Profile Section */}
        <div className="flex items-center space-x-6">
          <button className="text-gray-500 hover:text-gray-700">
            <Bell className="w-5 h-5" />
          </button>
          
          <div className="border-l h-8 border-gray-200"></div>
          
          <Link 
            to="/profile" 
            className="flex items-center space-x-3 hover:opacity-80 pl-4"
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