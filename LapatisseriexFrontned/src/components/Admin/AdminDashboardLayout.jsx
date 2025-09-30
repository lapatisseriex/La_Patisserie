import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, Outlet, useLocation as useRouterLocation } from 'react-router-dom';
import {
  FaHome,
  FaShoppingCart,
  FaUsers,
  FaList,
  FaMapMarkerAlt,
  FaTachometerAlt,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaClock
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext/AuthContextRedux';

// Create Sidebar Context
const SidebarContext = createContext();

// Custom hook to use sidebar context (safe fallback outside provider)
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    // Provide safe no-op defaults to prevent crashes if used outside provider
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('useSidebar called outside of SidebarProvider. Returning no-op defaults.');
    }
    return {
      isSidebarOpen: false,
      isMobile,
      toggleSidebar: () => {},
      closeSidebarIfOpen: () => {},
    };
  }
  return context;
};

const AdminDashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useRouterLocation();
  const { logout, user } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper to set sidebar open state and broadcast changes
  const setSidebarOpen = (next) => {
    setIsSidebarOpen(next);
    try {
      localStorage.setItem('adminSidebarOpen', String(next));
      window.dispatchEvent(new CustomEvent('adminSidebarToggle', { detail: { isOpen: next } }));
    } catch (e) {
      // no-op if storage not available
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Function to close sidebar only if it's open and on mobile
  const closeSidebarIfOpen = () => {
    if (isSidebarOpen && isMobile) {
      setSidebarOpen(false);
    }
  };

  // Force close the sidebar regardless of device (use when opening modals)
  const closeSidebarForModal = () => {
    if (isSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <SidebarContext.Provider value={{
      isSidebarOpen,
      isMobile,
      toggleSidebar,
      closeSidebarIfOpen,
      closeSidebarForModal
    }}>
  <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
        {/* Sidebar Overlay for Mobile */}
        {/* Single overlay aligned below the fixed mobile header */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-x-0 z-20 md:hidden bg-black bg-opacity-50"
            // Uses CSS var defined in index.css: --admin-mobile-header-offset
            style={{ top: 'var(--admin-mobile-header-offset)', bottom: 0 }}
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed md:sticky md:top-0 z-30 bg-gradient-to-b from-rose-800 to-pink-900 text-white transition-all duration-300 flex flex-col
            ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 md:w-20 -translate-x-full md:translate-x-0'}
            h-full md:h-screen
          `}
          // Sidebar is positioned directly under the mobile header
          // Offset and height are driven by CSS variables in index.css
          style={
            isMobile
              ? {
                  top: 'var(--admin-mobile-header-offset)',
                  height: 'calc(100vh - var(--admin-mobile-header-offset))',
                }
              : undefined
          }
        >
          {/* Desktop Sidebar Header - with Admin Panel text and chevrons */}
          <div className="hidden md:block p-4 border-b border-gray-800">
            <div className="flex justify-between items-center">
              {/* NOTE: whitespace-nowrap + overflow-hidden + truncate prevents the text from briefly wrapping to two lines during sidebar width transition */}
              <h1 className={`font-bold text-xl whitespace-nowrap overflow-hidden truncate ${!isSidebarOpen && 'hidden'}`}>Admin Panel</h1>
              <button onClick={toggleSidebar} className="p-1 rounded-full hover:bg-rose-700 transition-colors">
                {isSidebarOpen ? (
                  <FaChevronLeft className="h-5 w-5" />
                ) : (
                  <FaChevronRight className="h-5 w-5 text-white" />
                )}
              </button>
            </div>
          </div>

          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1">
              <li>
                <Link
                  to="/admin/dashboard"
                  onClick={closeSidebarIfOpen}
                  className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/dashboard' ? 'bg-rose-700 text-white' : 'hover:bg-rose-700'}`}
                >
                  <FaTachometerAlt className="mr-3 flex-shrink-0" />
                  <span className={!isSidebarOpen ? 'hidden' : ''}>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/users"
                  onClick={closeSidebarIfOpen}
                  className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/users' ? 'bg-rose-700 text-white' : 'hover:bg-rose-700'}`}
                >
                  <FaUsers className="mr-3 flex-shrink-0" />
                  <span className={!isSidebarOpen ? 'hidden' : ''}>Users</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/orders"
                  onClick={closeSidebarIfOpen}
                  className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/orders' ? 'bg-rose-700 text-white' : 'hover:bg-rose-700'}`}
                >
                  <FaShoppingCart className="mr-3 flex-shrink-0" />
                  <span className={!isSidebarOpen ? 'hidden' : ''}>Orders</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/products"
                  onClick={closeSidebarIfOpen}
                  className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/products' ? 'bg-rose-700 text-white' : 'hover:bg-rose-700'}`}
                >
                  <FaList className="mr-3 flex-shrink-0" />
                  <span className={!isSidebarOpen ? 'hidden' : ''}>Products</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/categories"
                  onClick={closeSidebarIfOpen}
                  className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/categories' ? 'bg-rose-700 text-white' : 'hover:bg-rose-700'}`}
                >
                  <FaList className="mr-3 flex-shrink-0" />
                  <span className={!isSidebarOpen ? 'hidden' : ''}>Categories</span>
                </Link>
              </li>
              {/* Banners removed: managed statically in codebase */}
              <li>
                <Link
                  to="/admin/locations"
                  onClick={closeSidebarIfOpen}
                  className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/locations' ? 'bg-rose-700 text-white' : 'hover:bg-rose-700'}`}
                >
                  <FaMapMarkerAlt className="mr-3 flex-shrink-0" />
                  <span className={!isSidebarOpen ? 'hidden' : ''}>Locations</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/time-settings"
                  onClick={closeSidebarIfOpen}
                  className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/time-settings' ? 'bg-rose-700 text-white' : 'hover:bg-rose-700'}`}
                >
                  <FaClock className="mr-3 flex-shrink-0" />
                  <span className={!isSidebarOpen ? 'hidden' : ''}>Time Settings</span>
                </Link>
              </li>
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-800 space-y-3 hidden md:block">
            <Link
              to="/"
              className={`flex items-center py-2 text-white hover:text-rose-200 font-medium ${!isSidebarOpen && 'justify-center w-full'}`}
              title="Back to site"
            >
              <FaHome className="mr-3 flex-shrink-0" />
              <span className={!isSidebarOpen ? 'hidden' : ''}>Back to Site</span>
            </Link>
            <button
              onClick={logout}
              className={`flex items-center py-2 text-red-300 hover:text-red-200 font-medium ${!isSidebarOpen && 'justify-center w-full'}`}
            >
              <FaSignOutAlt className="mr-3 flex-shrink-0" />
              <span className={!isSidebarOpen ? 'hidden' : ''}>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
          {/* Mobile Header Bar (flush to very top, slight internal top padding) */}
          {isMobile && (
            <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white">
              <div
                className="h-14 px-3 flex items-center justify-between"
                // Inner top padding is controllable via CSS var in index.css
                style={{ paddingTop: 'var(--admin-mobile-header-inner-padding)' }}
              >
                <button
                  onClick={toggleSidebar}
                  aria-label={isSidebarOpen ? 'Close Admin Panel' : 'Open Admin Panel'}
                  title={isSidebarOpen ? 'Close Admin Panel' : 'Open Admin Panel'}
                  className="p-2 rounded-md text-rose-600 hover:bg-rose-50"
                >
                  {isSidebarOpen ? (
                    <FaTimes className="h-5 w-5" />
                  ) : (
                    <FaBars className="h-5 w-5" />
                  )}
                </button>
                <div className="font-semibold text-rose-700">Admin Panel</div>
                <Link
                  to="/"
                  className="p-2 rounded-md text-rose-600 hover:bg-rose-50"
                  title="Back to site"
                >
                  <FaHome className="h-5 w-5" />
                </Link>
              </div>
            </header>
          )}

          {/* Main scroll area */}
          <main
            className="flex-1 overflow-y-auto bg-white p-0 md:pt-0"
            // Padding equals header height + tiny content gap (see index.css variables)
            style={{
              paddingTop: isMobile ? 'var(--admin-mobile-header-offset)' : undefined,
              paddingBottom: isMobile ? 'var(--admin-mobile-bottom-gap)' : undefined,
            }}
          >
            <div className="admin-content-root">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default AdminDashboardLayout;
