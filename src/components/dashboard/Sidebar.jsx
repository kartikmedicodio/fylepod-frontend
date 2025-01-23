import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Database, 
  MessageSquare,
  Users,
  Settings,
  LogOut,
  FolderTree,
  ClipboardList,
  FileCheck,
  FileArchive,
  Building
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { logout, user, pendingFormsCount } = useAuth();

  // Logo Component
  const Logo = () => (
    <div className="mb-6 px-3">
      <Link to="/" className="flex items-center space-x-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fylepod</h1>
          <p className="text-xs text-gray-500">Document Management</p>
        </div>
      </Link>
    </div>
  );

  const navigation = [
    { name: 'AI Chat', href: '/chat', icon: MessageSquare },
    { name: 'CRM', href: '/crm', icon: Building },
  ];

  // Management section links - only visible to admin
  const managementLinks = [
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Process Types', href: '/categories', icon: FolderTree },
    { name: 'Assign', href: '/settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  // Forms section renamed to Process/Applications section
  const processLinks = [
    { 
      name: 'Pending', 
      href: '/pending-forms', 
      icon: ClipboardList,
      count: pendingFormsCount
    },
    { 
      name: 'Completed', 
      href: '/completed-forms', 
      icon: FileCheck,
      count: 0
    },
  ];

  return (
    <div className="w-64 bg-white border-r min-h-screen p-4">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <Logo />

        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Process/Applications Section */}
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Process / Applications
          </h3>
          <div className="mt-2 space-y-1">
            {processLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                  {item.count > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-100 bg-primary-600 rounded-full">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Management Section - Only visible to admin */}
        {user?.role === 'admin' && (
          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Management
            </h3>
            <div className="mt-2 space-y-1">
              {managementLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="mt-auto pt-8">
          <button
            onClick={logout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 