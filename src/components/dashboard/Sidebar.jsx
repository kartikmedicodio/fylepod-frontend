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
  FolderIcon,
  User2Icon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
// import { getStoredToken } from '../../utils/auth';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const { user, loading, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const menuRef = useRef(null);
  const newMenuRef = useRef(null);
  const menuTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const [relationships, setRelationships] = useState([]);
  const [loadingRelationships, setLoadingRelationships] = useState(false);
  // Get token from auth context
  // const token = localStorage.getItem('token'); // We'll keep this temporarily for debugging

  // Fetch user relationships
  useEffect(() => {
    const fetchRelationships = async () => {
      if (user && (user.role === 'individual' || user.role === 'employee')) {
        try {
          setLoadingRelationships(true);
          
          // Use the configured api instance instead of fetch
          const response = await api.get(`/auth/user-relationships/${user.id}`);
          
          // api instance automatically handles the response.data
          if (response.data.status === 'success') {
            setRelationships(response.data.data.relationships || []);
          } else {
            setRelationships([]);
          }
        } catch (error) {
          console.error('Error fetching relationships:', error);
          setRelationships([]);
        } finally {
          setLoadingRelationships(false);
        }
      }
    };

    // Only fetch if we have a user
    if (user) {
      fetchRelationships();
    }
  }, [user]);

  // Get navigation based on role
  const getNavigation = () => {
    if (!user?.role) return [];

    // Individual/Employee navigation
    const individualNavigation = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Inbox', href: '/inbox', icon: MailIcon, badge: 15 },
      { 
        section: 'All Profiles',
        items: [
          // Show the user's own profile
          { name: user?.name || 'My Profile', href: `/profile/${user?._id}`, icon: CircleUserIcon },
          // Show relationships from the API
          ...relationships.map(rel => ({
            name: rel.user_id.name,
            href: `/profile/${rel.user_id._id}`,
            icon: CircleUserIcon,
            relationshipType: rel.relationshipType
          }))
        ],
        expandable: relationships.length > 2
      },
      { 
        section: 'Cases',
        items: [
          { name: 'All Cases', href: '/individual-cases', icon: BriefcaseBusiness },
          { name: 'Document Library', href: '/documents', icon: FolderIcon },
        ]
      }
    ];

    // Admin/Attorney/Manager navigation
    const adminNavigation = [
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
          { name: 'Account Info', href: '/account', icon: User2Icon  },
          { name: 'Knowledge Base', href: '/knowledge', icon: TableOfContents },
          { name: 'Reminder Settings', href: '/reminders', icon: Settings },
        ]
      },
    ];

    switch (user.role) {
      case 'admin':
      case 'attorney':
      case 'manager':
        return adminNavigation;
      case 'individual':
      case 'employee':
        return individualNavigation;
      default:
        return adminNavigation;
    }
  };

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const isActive = (href) => {
    // Special case for Knowledge Base - it should be active for all /knowledge routes
    if (href === '/knowledge') {
      return location.pathname.startsWith('/knowledge');
    }
    
    // For other paths, exact match
    return location.pathname === href;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Check if user should see the New button
  const showNewButton = user?.role === 'admin' || user?.role === 'attorney' || user?.role === 'manager';

  return (
    <div className={`fixed inset-y-0 left-0 z-50 border-r-2 border-[#c0c4d4] transition-all duration-300 ease-in-out bg-gradient-start/20 backdrop-blur-md
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

        {/* New button - only show for admin/attorney/manager */}
        {showNewButton && (
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
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {getNavigation().map((item, index) => (
            item.section ? (
              <div key={index} className="space-y-1">
                {!collapsed && (
                  <div className="flex items-center justify-between px-3">
                    <h3 className="text-xs font-semibold text-gray-500">
                      {item.section}
                    </h3>
                    {item.expandable && (
                      <button className="text-xs text-gray-500 hover:text-gray-700">
                        See More
                      </button>
                    )}
                  </div>
                )}
                {loadingRelationships && item.section === 'All Profiles' ? (
                  // Show loading state for relationships
                  <div className="px-3 py-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-full mb-2"></div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-full"></div>
                  </div>
                ) : (
                  item.items.map((subItem) => (
                    <Link
                      key={subItem.name + (subItem.relationshipType || '')}
                      to={subItem.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive(subItem.href)
                          ? 'bg-white text-black'
                          : 'text-gray-900 hover:bg-white hover:text-black'
                      } ${collapsed ? 'justify-center' : ''}`}
                      title={collapsed ? (subItem.relationshipType ? `${subItem.name} (${subItem.relationshipType})` : subItem.name) : ''}
                    >
                      {subItem.icon === CircleUserIcon ? (
                        <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(subItem.name || 'U')}&background=random`}
                            alt={subItem.name || 'User'}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <subItem.icon className="h-5 w-5 flex-shrink-0" />
                      )}
                      {!collapsed && (
                        <div className="ml-3 flex-1 overflow-hidden">
                          <span className="block truncate">{subItem.name}</span>
                          {subItem.relationshipType && (
                            <span className="text-xs text-gray-500">{subItem.relationshipType}</span>
                          )}
                        </div>
                      )}
                      {!collapsed && subItem.badge && (
                        <span className="ml-auto bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                          {subItem.badge}
                        </span>
                      )}
                    </Link>
                  ))
                )}
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
                  <>
                    <span className="ml-3">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                        {item.badge}
                      </span>
                    )}
                  </>
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