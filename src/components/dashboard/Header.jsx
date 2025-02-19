import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, ChevronRight } from 'lucide-react';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import PropTypes from 'prop-types';
import { usePage } from '../../contexts/PageContext';

const Header = ({ sidebarCollapsed }) => {
  const location = useLocation();
  const { currentBreadcrumb } = useBreadcrumb();
  const { pageTitle } = usePage();

  // Use pageTitle if available, otherwise fallback to path-based breadcrumbs
  const getBreadcrumbs = () => {
    if (pageTitle) {
      return [{
        name: pageTitle,
        path: location.pathname
      }];
    }

    const paths = location.pathname.split('/').filter(Boolean);
    return paths.map((path, index) => {
      const fullPath = `/${paths.slice(0, index + 1).join('/')}`;
      
      // If this is a corporation ID and we have currentBreadcrumb
      if (index === 1 && paths[0] === 'corporations' && currentBreadcrumb?.path === fullPath) {
        return currentBreadcrumb;
      }

      return {
        name: path.charAt(0).toUpperCase() + path.slice(1),
        path: fullPath
      };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className={`fixed top-0 right-0 transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-56'} z-50`}>
      <div className="border-b-2 border-gray-400/50 bg-gradient-third/20 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Left section */}
          <div className="flex items-center">
            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-2' : 'ml-4 lg:ml-0'}`}>
              <div className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  {breadcrumbs.map((breadcrumb, index) => (
                    <li key={breadcrumb.path} className="flex items-center">
                      {index > 0 && (
                        <ChevronRight className="h-4 w-4 text-gray-500 mx-1" />
                      )}
                      <Link
                        to={breadcrumb.path}
                        className={`text-sm font-medium text-gray-900 hover:text-blue-600 transition-all duration-300 
                          ${sidebarCollapsed ? 'truncate max-w-[150px]' : 'truncate max-w-[200px]'}`}
                      >
                        {breadcrumb.name}
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            {/* Search button */}
            <button className="p-1.5 bg-transparent hover:bg-white/80 rounded-lg text-black hover:text-blue-600 transition-all duration-200">
              <Search className="h-4 w-4" />
            </button>

            {/* Notifications */}
            <button className="p-1.5 bg-transparent hover:bg-white/80 rounded-lg text-black hover:text-blue-600 transition-all duration-200">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

Header.propTypes = {
  sidebarCollapsed: PropTypes.bool.isRequired
};

export default Header; 