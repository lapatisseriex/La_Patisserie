import React, { useState, useEffect } from 'react';
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
  FaChevronRight
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext/AuthContext';

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

  return (
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
              <FaChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <Link 
                to="/admin/dashboard" 
                className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/dashboard' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`}
              >
                <FaTachometerAlt className="mr-3 flex-shrink-0" />
                <span className={!isSidebarOpen ? 'hidden' : ''}>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/users" 
                className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/users' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`}
              >
                <FaUsers className="mr-3 flex-shrink-0" />
                <span className={!isSidebarOpen ? 'hidden' : ''}>Users</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/orders" 
                className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/orders' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`}
              >
                <FaShoppingCart className="mr-3 flex-shrink-0" />
                <span className={!isSidebarOpen ? 'hidden' : ''}>Orders</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/products" 
                className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/products' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`}
              >
                <FaList className="mr-3 flex-shrink-0" />
                <span className={!isSidebarOpen ? 'hidden' : ''}>Products</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/categories" 
                className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/categories' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`}
              >
                <FaList className="mr-3 flex-shrink-0" />
                <span className={!isSidebarOpen ? 'hidden' : ''}>Categories</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/locations" 
                className={`flex items-center py-3 px-4 font-medium ${location.pathname === '/admin/locations' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'}`}
              >
                <FaMapMarkerAlt className="mr-3 flex-shrink-0" />
                <span className={!isSidebarOpen ? 'hidden' : ''}>Locations</span>
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
        {/* Top header bar */}
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-gray-100 md:hidden"
          >
            <FaBars className="h-5 w-5 text-gray-700" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium text-gray-800">{user?.name || 'Admin'}</p>
              <p className="text-sm text-gray-500 font-light">Administrator</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;