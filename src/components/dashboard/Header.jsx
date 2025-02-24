import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronRight } from 'lucide-react';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import PropTypes from 'prop-types';
import { usePage } from '../../contexts/PageContext';

const Header = ({ sidebarCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentBreadcrumb } = useBreadcrumb();
  const { pageTitle } = usePage();

  const getBreadcrumbs = () => {
    const path = location.pathname;

    // Add a special case for individual case details
    if (path.includes('/individuals/case/')) {
      return [{
        name: 'Case Details',
        path: path
      }];
    }

    if (currentBreadcrumb?.breadcrumbs) {
      return currentBreadcrumb.breadcrumbs;
    }

    if (pageTitle) {
      return [{
        name: pageTitle,
        path: location.pathname
      }];
    }

    const paths = location.pathname.split('/').filter(Boolean);
    
    // Handle different page types
    switch(paths[0]) {
      case 'case':
        return [
          { name: 'All Cases', path: '/individual-cases' },
          { name: currentBreadcrumb?.name || 'Case Details', path: location.pathname }
        ];
      
      case 'individual-cases':
        return [
          { name: 'All Cases', path: '/individual-cases' }
        ];

      case 'corporations':
        return [
          { name: 'Corporations', path: '/corporations' },
          ...(currentBreadcrumb?.path === `/${paths.slice(0, 2).join('/')}` ? 
            [currentBreadcrumb] : [])
        ];

      case 'knowledge':
        return [
          { name: 'Knowledge Base', path: '/knowledge' }
        ];

      default:
        // For other pages, create breadcrumbs from the path
        return paths.map((path, index) => {
          const fullPath = `/${paths.slice(0, index + 1).join('/')}`;
          return {
            name: path.split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' '),
            path: fullPath
          };
        });
    }
  };

  const breadcrumbs = getBreadcrumbs();

  const handleBreadcrumbClick = (path, index, totalLength) => {
    // If it's Process Templates breadcrumb, always navigate to /knowledge
    if (index === 1 && currentBreadcrumb?.breadcrumbs?.[index]?.name === 'Process Templates') {
      navigate('/knowledge');
      return;
    }
    
    // For other breadcrumbs, use their defined paths
    navigate(path);
  };

  const renderBreadcrumb = () => {
    return (
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.id || breadcrumb.path} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400">{'>'}</span>
            )}
            <button
              onClick={() => handleBreadcrumbClick(breadcrumb.path, index, breadcrumbs.length)}
              className={`text-sm font-medium text-gray-600 hover:text-blue-600 transition-all duration-300 
                ${sidebarCollapsed ? 'truncate max-w-[150px]' : 'truncate max-w-[200px]'}
                ${index === breadcrumbs.length - 1 ? 'text-gray-900' : ''}`}
            >
              {breadcrumb.name}
            </button>
          </li>
        ))}
      </ol>
    );
  };

  return (
    <header className={`fixed top-0 right-0 transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-56'} z-50`}>
      <div className="border-b-2 border-gray-400/50 bg-gradient-third/20 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Left section */}
          <div className="flex items-center">
            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-2' : 'ml-4 lg:ml-0'}`}>
              <div className="flex" aria-label="Breadcrumb">
                {renderBreadcrumb()}
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