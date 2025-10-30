import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import OfflineAwareOutlet from '../common/OfflineAwareOutlet';
// Admin layout intentionally omits the global site Header/Footer

const AdminLayout = () => {
  const location = useLocation();
  // All admin routes should not render the global header/footer
  const isDashboard = location.pathname === '/admin/dashboard';
  
  // RESPONSIVE HOOKS: Track screen size for adaptive behavior
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  // Apply an admin marker class only (no fixed header spacing in admin)
  useEffect(() => {
    document.body.classList.add('admin-layout');
    // Ensure any site header spacing class is removed when entering admin
    document.body.classList.remove('has-fixed-header');
    return () => {
      document.body.classList.remove('admin-layout');
    };
  }, []);

  // RESPONSIVE HOOK: Listen for screen size changes to optimize layout
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newIsMobile = newWidth < 768;
      
      setScreenWidth(newWidth);
      setIsMobile(newIsMobile);
      
      // Add responsive class to body for CSS targeting if needed
      if (newIsMobile) {
        document.body.classList.add('admin-mobile');
        document.body.classList.remove('admin-desktop');
      } else {
        document.body.classList.add('admin-desktop');
        document.body.classList.remove('admin-mobile');
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    return () => {
      // Cleanup
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('admin-mobile', 'admin-desktop');
    };
  }, []);

  // DYNAMIC RESPONSIVE CLASSES: Adjust padding based on screen size and page type
  const getResponsiveClasses = () => {
    // Keep admin main edge-to-edge so the nested dashboard can fully control its own spacing
    return 'p-0';
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-white">
      {/* Admin routes intentionally have no global Header/Footer */}
      <main className={`flex-1 bg-white ${getResponsiveClasses()}`}>
        <OfflineAwareOutlet />
      </main>
    </div>
  );
};

export default AdminLayout;
