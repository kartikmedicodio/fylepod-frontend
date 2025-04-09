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
  UserPlus,
  Briefcase,
  Building,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
// import { getStoredToken } from '../../utils/auth';

/**
 * Sidebar component for dashboard navigation
 * @param {Object} props - Component props
 * @param {boolean} props.collapsed - Whether sidebar is collapsed
 * @param {Function} props.setCollapsed - Function to toggle sidebar collapse state
 */
const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const { user, loading, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showCustomerSubmenu, setShowCustomerSubmenu] = useState(false);
  const menuRef = useRef(null);
  const newMenuRef = useRef(null);
  const customerSubmenuRef = useRef(null);
  const menuTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const [relationships, setRelationships] = useState([]);
  const [loadingRelationships, setLoadingRelationships] = useState(false);
  // Get token from auth context
  // const token = localStorage.getItem('token'); // We'll keep this temporarily for debugging

  /**
   * Fetches user relationships from the API
   * Only for individual or employee roles
   */
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

  /**
   * Returns navigation items based on user role
   * Different menus for admin/attorney/manager vs individual/employee
   */
  const getNavigation = () => {
    if (!user?.role) return [];

    // Individual/Employee navigation
    const individualNavigation = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { 
        section: 'All Profiles',
        items: [
          // Show the user's own profile - check both id properties
          { name: user?.name || 'My Profile', href: `/profile/${user?.id || user?._id}`, icon: CircleUserIcon },
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
        ]
      }
    ];

    // Admin/Attorney/Manager navigation
    const adminNavigation = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
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
          { name: 'Queries', href: '/queries', icon: MailIcon },
        ]
      },
      {
        section: 'Setup',
        items: [
          { name: 'Knowledge Base', href: '/knowledge', icon: TableOfContents },
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

  /**
   * Handles clicks outside of menus to close them
   * Manages multiple menu states: main menu, new menu, and customer submenu
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if clicked outside all menus
      const isOutsideMainMenu = menuRef.current && !menuRef.current.contains(event.target);
      const isOutsideNewMenu = newMenuRef.current && !newMenuRef.current.contains(event.target);
      const isOutsideCustomerMenu = customerSubmenuRef.current && !customerSubmenuRef.current.contains(event.target);
      
      // For the new menu, make sure customer submenu is considered (don't close parent if clicking in child)
      if (isOutsideNewMenu && (!customerSubmenuRef.current || isOutsideCustomerMenu)) {
        setShowNewMenu(false);
      }
      
      // For the customer submenu, we can close it independently
      if (isOutsideCustomerMenu && !newMenuRef.current?.contains(event.target)) {
        setShowCustomerSubmenu(false);
      }
      
      // For the main menu
      if (isOutsideMainMenu) {
        setShowMenu(false);
      }
      
      // If clicked outside all menus, clear any auto-hide timeout
      if (isOutsideMainMenu && isOutsideNewMenu && isOutsideCustomerMenu) {
        if (menuTimeoutRef.current) {
          clearTimeout(menuTimeoutRef.current);
          menuTimeoutRef.current = null;
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Manages auto-hide behavior for menus
   * Cleans up timeouts when menus are closed
   */
  useEffect(() => {
    if (showMenu || showNewMenu || showCustomerSubmenu) {
      // Don't set auto-hide timeout here - we'll only set it on mouse leave
      return () => {
        if (menuTimeoutRef.current) {
          clearTimeout(menuTimeoutRef.current);
        }
      };
    }
  }, [showMenu, showNewMenu, showCustomerSubmenu]);

  /**
   * Clears auto-hide timeout when mouse enters menu
   */
  const handleMenuMouseEnter = () => {
    // Clear any existing timeout when mouse enters the menu
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
  };

  /**
   * Sets timeout to auto-hide menus when mouse leaves
   */
  const handleMenuMouseLeave = () => {
    // Only set timeout when mouse leaves
    if (!menuTimeoutRef.current) {
      menuTimeoutRef.current = setTimeout(() => {
        setShowMenu(false);
        setShowNewMenu(false);
        setShowCustomerSubmenu(false);
        menuTimeoutRef.current = null;
      }, 3000);
    }
  };

  /**
   * Checks if a navigation item is currently active
   * Handles parent-child route relationships
   */
  const isActive = (href) => {
    // Special case for Knowledge Base - it should be active for all /knowledge routes
    if (href === '/knowledge') {
      return location.pathname.startsWith('/knowledge');
    }

    // Handle parent-child relationships for main sections
    if (href === '/cases') {
      return location.pathname === '/cases' || location.pathname.startsWith('/cases/');
    }

    if (href === '/corporations') {
      // Match /corporations and any path that starts with /corporations/
      return location.pathname === '/corporations' || location.pathname.startsWith('/corporations/');
    }

    if (href === '/individuals') {
      // Match /individuals and any path that starts with /individuals/
      return location.pathname === '/individuals' || location.pathname.startsWith('/individuals/');
    }

    if (href === '/individual-cases') {
      // Match /individual-cases and any path that includes /individuals/case/
      return location.pathname === '/individual-cases' || location.pathname.includes('/individuals/case/');
    }
    
    // For other paths, exact match
    return location.pathname === href;
  };

  /**
   * Handles user logout
   */
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
      {/* Main sidebar container */}
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

        {/* New button section - only visible for admin/attorney/manager */}
        {showNewButton && (
          <div className="px-4 mt-2 relative" ref={newMenuRef}>
            <button 
              className={`flex items-center justify-center w-full space-x-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors duration-200 
                ${collapsed ? 'px-2' : 'px-6'}`}
              onClick={() => {
                setShowNewMenu(!showNewMenu);
                // Clear any existing timeout
                if (menuTimeoutRef.current) {
                  clearTimeout(menuTimeoutRef.current);
                  menuTimeoutRef.current = null;
                }
              }}
              onMouseEnter={() => {
                // Only clear timeout on hover, don't open menu automatically
                handleMenuMouseEnter();
              }}
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
                <div 
                  className="relative"
                  onMouseEnter={handleMenuMouseEnter}
                  onMouseLeave={handleMenuMouseLeave}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCustomerSubmenu(!showCustomerSubmenu);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                    onMouseEnter={handleMenuMouseEnter}
                    onMouseLeave={handleMenuMouseLeave}
                  >
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>New Customer</span>
                    </div>
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                  
                  {showCustomerSubmenu && (
                    <div 
                      ref={customerSubmenuRef}
                      className="absolute left-full top-0 ml-1 w-48 rounded-lg bg-white shadow-lg border border-gray-200 py-1 z-50"
                      onMouseEnter={handleMenuMouseEnter}
                      onMouseLeave={handleMenuMouseLeave}
                    >
                      <button
                        onClick={() => {
                          console.log('Navigating to New Company page...');
                          navigate('/company/new');
                          setShowNewMenu(false);
                          setShowCustomerSubmenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        onMouseEnter={handleMenuMouseEnter}
                        onMouseLeave={handleMenuMouseLeave}
                      >
                        <Building className="h-4 w-4" />
                        <span>New Company</span>
                      </button>
                      <button
                        onClick={() => {
                          console.log('Navigating to New Employee page...');
                          navigate('/employee/new');
                          setShowNewMenu(false);
                          setShowCustomerSubmenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        onMouseEnter={handleMenuMouseEnter}
                        onMouseLeave={handleMenuMouseLeave}
                      >
                        <Briefcase className="h-4 w-4" />
                        <span>New Employee</span>
                      </button>
                      <button
                        onClick={() => {
                          console.log('Navigating to New Individual page...');
                          navigate('/individual/new');
                          setShowNewMenu(false);
                          setShowCustomerSubmenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        onMouseEnter={handleMenuMouseEnter}
                        onMouseLeave={handleMenuMouseLeave}
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>New Individual</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    navigate('/cases/new');
                    setShowNewMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  onMouseEnter={handleMenuMouseEnter}
                  onMouseLeave={handleMenuMouseLeave}
                >
                  <BriefcaseBusiness className="h-4 w-4" />
                  <span>New Case</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main navigation section */}
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
                    subItem.disabled ? (
                      <div
                        key={subItem.name + (subItem.relationshipType || '')}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg 
                          text-gray-400 cursor-not-allowed ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? subItem.name : ''}
                      >
                        <subItem.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && (
                          <div className="ml-3 flex-1 overflow-hidden">
                            <span className="block truncate">{subItem.name}</span>
                            {subItem.relationshipType && (
                              <span className="text-xs text-gray-400">{subItem.relationshipType}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
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
                    )
                  ))
                )}
              </div>
            ) : (
              item.disabled ? (
                <div
                  key={item.name}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg
                    text-gray-400 cursor-not-allowed ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.name : ''}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="ml-3">{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full text-xs">
                          {item.badge}
                        </span>
                      )}
                    </>
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
            )
          ))}
        </nav>

        {/* User profile section */}
        <div className="border-t border-[#c0c4d4] p-4">
          <div className="flex items-center space-x-3">
            <Link 
              to={`/profile/${user?.id || user?._id}`}
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
                <Link to={`/profile/${user?.id || user?._id}`} className="flex-1 min-w-0 hover:text-blue-600 transition-colors duration-200">
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