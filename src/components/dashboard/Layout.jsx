import { useState } from 'react';
import PropTypes from 'prop-types';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleAgentClick = (agent) => {
    // This can be used for any additional handling needed at the layout level
    console.log('Agent clicked:', agent);
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-tr from-gradient-start/70 via-gradient-second/70 via-gradient-third/70 via-gradient-fourth/70 to-gradient-end/70">
      <div className="relative h-screen overflow-hidden backdrop-blur-sm">
        <Sidebar 
          open={sidebarOpen} 
          setOpen={setSidebarOpen}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          sidebarCollapsed={sidebarCollapsed}
          onAgentClick={handleAgentClick}
        />
        
        {/* Main content */}
        <div className={`transition-all duration-300 h-screen overflow-y-auto ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'} pt-12`}>
          <main className="py-4">
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