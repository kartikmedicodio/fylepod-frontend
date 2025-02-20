import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings,
  TableOfContents,
  PlusCircle,
  MailIcon,
  LogOut,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CircleUserIcon,
  MoreHorizontal,
  User,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const { user, loading, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const menuRef = useRef(null);
  const newMenuRef = useRef(null);
  const menuTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Handle click outside for both menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (newMenuRef.current && !newMenuRef.current.contains(event.target)) {
        setShowNewMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-hide menus after 3 seconds
  useEffect(() => {
    if (showMenu || showNewMenu) {
      menuTimeoutRef.current = setTimeout(() => {
        setShowMenu(false);
        setShowNewMenu(false);
      }, 3000);
    }
    return () => {
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
      }
    };
  }, [showMenu, showNewMenu]);

  // Reset timer when hovering over either menu
  const handleMenuMouseEnter = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
  };

  const handleMenuMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setShowMenu(false);
      setShowNewMenu(false);
    }, 3000);
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inbox', href: '/inbox', icon: MailIcon },
    { 
      section: 'Clients',
      items: [
        { name: 'Corporations', href: '/corporations', icon: Building2 },
        { name: 'Individuals', href: '/individuals', icon: Users },
      ]
    },
    {
      section: 'Cases',
      items: [
        { name: 'Cases', href: '/cases', icon: BriefcaseBusiness },
      ]
    },
    {
      section: 'Setup',
      items: [
        { name: 'Account Info', href: '/account', icon: CircleUserIcon },
        { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
        { name: 'Reminder Settings', href: '/reminders', icon: Settings },
      ]
    },
  ];

  const isActive = (path) => {
    // Special case for Knowledge Base - it should be active for all /knowledge routes
    if (path === '/knowledge') {
      return location.pathname.startsWith('/knowledge');
    }
    
    // For other paths, exact match
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 border-r-2 border-[#c0c4d4] transition-all duration-300 ease-in-out bg-gradient-start/20 backdrop-blur-md
      ${collapsed ? 'w-16' : 'w-56'}`}
    >
      <div className="flex h-full flex-col">
        {/* Logo section */}
        <div className="flex h-16 items-center">
          {collapsed ? (
            <div className="flex flex-col items-center w-full">
              <span className="text-sm font-semibold text-black">Fyle</span>
              <span className="text-sm font-medium text-black">Pod</span>
            </div>
          ) : (
            <Link to="/dashboard" className="text-xl font-semibold text-black px-4">
              Fylepod
            </Link>
          )}
        </div>

        {/* New button with dropdown */}
        <div className="px-4 mt-2 relative" ref={newMenuRef}>
          <button 
            className={`flex items-center justify-center w-full space-x-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors duration-200 
              ${collapsed ? 'px-2' : 'px-6'}`}
            onClick={() => setShowNewMenu(!showNewMenu)}
            onMouseEnter={handleMenuMouseEnter}
            onMouseLeave={handleMenuMouseLeave}
          >
            <PlusCircle className="h-4 w-4" />
            {!collapsed && <span>New</span>}
          </button>

          {/* Dropdown Menu */}
          {showNewMenu && (
            <div 
              className="absolute left-full ml-2 top-0 w-48 rounded-lg bg-white shadow-lg border border-gray-200 py-1 z-50"
              onMouseEnter={handleMenuMouseEnter}
              onMouseLeave={handleMenuMouseLeave}
            >
              <button
                onClick={() => {
                  navigate('/customers/new');
                  setShowNewMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span>New Customer</span>
              </button>
              <button
                onClick={() => {
                  navigate('/cases/new');
                  setShowNewMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <BriefcaseBusiness className="h-4 w-4" />
                <span>New Case</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item, index) => (
            item.section ? (
              <div key={index} className="space-y-1 pt-5">
                {!collapsed && (
                  <h3 className="px-3 text-xs font-semibold text-black">
                    {item.section}
                  </h3>
                )}
                {item.items.map((subItem) => (
                  <Link
                    key={subItem.name}
                    to={subItem.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive(subItem.href)
                        ? 'bg-white text-black'
                        : 'text-gray-900 hover:bg-white hover:text-black'
                    } ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? subItem.name : ''}
                  >
                    <subItem.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span className="ml-3">{subItem.name}</span>}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-white text-black'
                    : 'text-gray-900 hover:bg-white hover:text-black'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.name : ''}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="ml-3 flex-1">{item.name}</span>
                )}
              </Link>
            )
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-[#c0c4d4] p-4">
          <div className="flex items-center space-x-3">
            <Link 
              to="/profile" 
              className="h-8 w-8 rounded-full overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all duration-200"
            >
              <img 
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=random`} 
                alt={user?.name || 'User'} 
                className="h-full w-full object-cover"
              />
            </Link>
            {!collapsed && (
              <>
                <Link to="/profile" className="flex-1 min-w-0 hover:text-blue-600 transition-colors duration-200">
                  {loading ? (
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  ) : (
                    <p className="text-sm font-medium text-black truncate">
                      {user?.name || 'Guest'}
                    </p>
                  )}
                </Link>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-lg bg-transparent hover:bg-white/80 text-black hover:text-blue-600 transition-all duration-200"
                    title="Menu"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                  
                  {/* Popup Menu */}
                  {showMenu && (
                    <div 
                      className="absolute bottom-full right-0 mb-2 w-48 rounded-lg bg-white shadow-lg border border-gray-200 py-1"
                      onMouseEnter={handleMenuMouseEnter}
                      onMouseLeave={handleMenuMouseLeave}
                    >
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 p-1.5 rounded-full bg-white shadow-md text-black hover:text-blue-600 transition-colors duration-200"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  setCollapsed: PropTypes.func.isRequired
};

export default Sidebar; 