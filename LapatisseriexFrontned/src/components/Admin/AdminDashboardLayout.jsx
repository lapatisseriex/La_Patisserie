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
  FaChevronLeft,
  FaChevronRight,
  FaImage,
  FaClock
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext/AuthContext';

// Create Sidebar Context
const SidebarContext = createContext();

// Custom hook to use sidebar context
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Function to close sidebar only if it's open and on mobile
  const closeSidebarIfOpen = () => {
    if (isSidebarOpen && isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <SidebarContext.Provider value={{
      isSidebarOpen,
      isMobile,
      toggleSidebar,
      closeSidebarIfOpen
    }}>
      <div className="flex h-screen bg-gray-50 font-sans">
        {/* Sidebar Overlay for Mobile */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed md:relative z-30 bg-black text-white transition-all duration-300 flex flex-col
            ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 md:w-20 -translate-x-full md:translate-x-0'}
            h-full
          `}
        >
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h1 className={`font-bold text-xl ${!isSidebarOpen && 'hidden'}`}>Admin Panel</h1>
            <button onClick={toggleSidebar} className="p-1 rounded-full hover:bg-gray-800 transition-colors">
              {isSidebarOpen ? (
                <FaChevronLeft className="h-5 w-5" />
              ) : (
                <FaChevronRight className={`h-5 w-5 ${isMobile ? 'text-black' : 'text-white'}`} />
              )}
            </button>
          </div>

          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1">
              <li>
                <Link
                  to="/admin/dashboard"
                  onClick={closeSidebarIfOpen}
                  className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/dashboard' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`}
                >
                  <FaTachometerAlt className="mr-3 flex-shrink-0" />
                  <span className={!isSidebarOpen ? 'hidden' : ''}>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/users"
                  onClick={closeSidebarIfOpen}
                  className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/users' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`}
                >
                  <FaUsers className="mr-3 flex-shrink-0" />
                  <span className={!isSidebarOpen ? 'hidden' : ''}>Users</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/orders"
                  onClick={closeSidebarIfOpen}
                  className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/orders' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`}
                >
                  <FaShoppingCart className="mr-3 flex-shrink-0" />
                  <span className={!isSidebarOpen ? 'hidden' : ''}>Orders</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/products"
                  onClick={closeSidebarIfOpen}
                  className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/products' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`}
                >
                  <FaList className="mr-3 flex-shrink-0" />
                  <span className={!isSidebarOpen ? 'hidden' : ''}>Products</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/categories"
                  onClick={closeSidebarIfOpen}
                  className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/categories' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`}
                >
                  <FaList className="mr-3 flex-shrink-0" />
                  <span className={!isSidebarOpen ? 'hidden' : ''}>Categories</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/banners"
                  onClick={closeSidebarIfOpen}
                  className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/banners' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`}
                >
                  <FaImage className="mr-3 flex-shrink-0" />
                  <span className={!isSidebarOpen ? 'hidden' : ''}>Banners</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/locations"
                  onClick={closeSidebarIfOpen}
                  className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/locations' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`}
                >
                  <FaMapMarkerAlt className="mr-3 flex-shrink-0" />
                  <span className={!isSidebarOpen ? 'hidden' : ''}>Locations</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/time-settings"
                  onClick={closeSidebarIfOpen}
                  className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/time-settings' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`}
                >
                  <FaClock className="mr-3 flex-shrink-0" />
                  <span className={!isSidebarOpen ? 'hidden' : ''}>Time Settings</span>
                </Link>
              </li>
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-800">
            <Link
              to="/"
              className={`flex items-center py-2 font-medium hover:text-gray-300 ${!isSidebarOpen && 'justify-center'}`}
            >
              <FaHome className="mr-3 flex-shrink-0" />
              <span className={!isSidebarOpen ? 'hidden' : ''}>Back to Site</span>
            </Link>
            <button
              onClick={logout}
              className={`flex items-center py-2 text-red-400 hover:text-red-300 font-medium ${!isSidebarOpen && 'justify-center w-full'}`}
            >
              <FaSignOutAlt className="mr-3 flex-shrink-0" />
              <span className={!isSidebarOpen ? 'hidden' : ''}>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main content area - Spacious and responsive padding */}
          {/* RULE: To adjust vertical spacing between header and dashboard content, change the p-4 sm:p-6 md:p-8 values */}
          {/* For more spacing, use p-6 sm:p-8 md:p-10. For less, use p-3 sm:p-4 md:p-6 */}
          {/* NOTE: This controls the padding AROUND the dashboard content area */}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default AdminDashboardLayout;
