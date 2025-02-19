import { useState } from 'react';
import PropTypes from 'prop-types';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gradient-start/70 via-gradient-second/70 via-gradient-third/70 via-gradient-fourth/70 to-gradient-end/70">
      <div className="relative min-h-screen backdrop-blur-sm">
        <Sidebar 
          open={sidebarOpen} 
          setOpen={setSidebarOpen}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          sidebarCollapsed={sidebarCollapsed}
        />
        
        {/* Main content */}
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'} pt-16`}>
          <main className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired
};

export default Layout; 