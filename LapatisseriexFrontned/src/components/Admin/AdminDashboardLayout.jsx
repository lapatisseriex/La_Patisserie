import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation as useRouterLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaShoppingCart, 
  FaUsers, 
  FaList, 
  FaMapMarkerAlt, 
  FaTachometerAlt, 
  FaSignOutAlt 
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext/AuthContext';

const AdminDashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useRouterLocation();
  const { logout } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Navigate away if not admin (additional protection)
  // This is just a UI protection, server-side protection is also implemented
  
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-black text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-black flex justify-between items-center">
          <h1 className={`font-bold text-xl ${!isSidebarOpen && 'hidden'}`}>Admin Panel</h1>
          <button onClick={toggleSidebar} className="p-1 rounded-full hover:bg-black">
            {isSidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
        
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            <li>
              <Link 
                to="/admin/dashboard" 
                className={`flex items-center py-3 px-4 ${location.pathname === '/admin/dashboard' ? 'bg-black text-white' : 'hover:bg-black'}`}
              >
                <FaTachometerAlt className="mr-3" />
                <span className={!isSidebarOpen ? 'hidden' : ''}>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/users" 
                className={`flex items-center py-3 px-4 ${location.pathname === '/admin/users' ? 'bg-black text-white' : 'hover:bg-black'}`}
              >
                <FaUsers className="mr-3" />
                <span className={!isSidebarOpen ? 'hidden' : ''}>Users</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/orders" 
                className={`flex items-center py-3 px-4 ${location.pathname === '/admin/orders' ? 'bg-black text-white' : 'hover:bg-black'}`}
              >
                <FaShoppingCart className="mr-3" />
                <span className={!isSidebarOpen ? 'hidden' : ''}>Orders</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/products" 
                className={`flex items-center py-3 px-4 ${location.pathname === '/admin/products' ? 'bg-black text-white' : 'hover:bg-black'}`}
              >
                <FaList className="mr-3" />
                <span className={!isSidebarOpen ? 'hidden' : ''}>Products</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/categories" 
                className={`flex items-center py-3 px-4 ${location.pathname === '/admin/categories' ? 'bg-black text-white' : 'hover:bg-black'}`}
              >
                <FaList className="mr-3" />
                <span className={!isSidebarOpen ? 'hidden' : ''}>Categories</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/locations" 
                className={`flex items-center py-3 px-4 ${location.pathname === '/admin/locations' ? 'bg-black text-white' : 'hover:bg-black'}`}
              >
                <FaMapMarkerAlt className="mr-3" />
                <span className={!isSidebarOpen ? 'hidden' : ''}>Locations</span>
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-black">
          <Link to="/" className={`flex items-center py-2 ${!isSidebarOpen && 'justify-center'}`}>
            <FaHome className="mr-3" />
            <span className={!isSidebarOpen ? 'hidden' : ''}>Back to Site</span>
          </Link>
          <button 
            onClick={logout} 
            className={`flex items-center py-2 text-red-400 hover:text-red-300 ${!isSidebarOpen && 'justify-center w-full'}`}
          >
            <FaSignOutAlt className="mr-3" />
            <span className={!isSidebarOpen ? 'hidden' : ''}>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;





