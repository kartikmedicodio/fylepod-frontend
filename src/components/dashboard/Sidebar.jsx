import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Database, 
  MessageSquare,
  Users,
  Settings,
  LogOut,
  FolderTree,
  ClipboardList,
  Loader2,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { logout, user, pendingFormsCount } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Extracted Data', href: '/extracted', icon: Database },
    { name: 'AI Chat', href: '/chat', icon: MessageSquare },
  ];

  // Management section links
  const managementLinks = [
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Categories', href: '/categories', icon: FolderTree },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  // Pending Forms section with count from context
  const pendingFormsLinks = [
    { 
      name: 'Pending Forms', 
      href: '/pending-forms', 
      icon: ClipboardList,
      count: pendingFormsCount
    },
  ];

  // Update the forms section to include completed forms
  const formsLinks = [
    { 
      name: 'Pending Forms', 
      href: '/pending-forms', 
      icon: ClipboardList,
      count: pendingFormsCount
    },
    { 
      name: 'Completed Forms', 
      href: '/completed-forms', 
      icon: FileCheck,
      count: 0 // You can add a count for completed forms if needed
    },
  ];

  return (
    <div className="w-64 bg-white border-r min-h-screen p-4">
      <div className="flex flex-col h-full">
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

        {/* Forms Section */}
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Forms
          </h3>
          <div className="mt-2 space-y-1">
            {formsLinks.map((item) => {
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
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-green-100 bg-green-600 rounded-full">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Management Section */}
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

        {/* Logout Button */}
        <div className="mt-auto">
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