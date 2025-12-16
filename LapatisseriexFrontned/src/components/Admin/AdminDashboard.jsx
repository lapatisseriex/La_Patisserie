import React, { useState, useEffect } from 'react';
import { FaUsers, FaShoppingCart, FaMapMarkerAlt, FaList, FaCheckCircle, FaSearch, FaGift } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import InventoryWidget from './Dashboard/InventoryWidget';

import { useLocation as useLocationContext } from '../../context/LocationContext/LocationContext';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Helper function to calculate current month's order days for rewards
const calculateCurrentMonthDays = (monthlyOrderDays) => {
  if (!monthlyOrderDays || !Array.isArray(monthlyOrderDays)) return 0;
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  const currentMonthDays = monthlyOrderDays.filter(day => {
    return day.month === currentMonth && day.year === currentYear;
  });
  
  return currentMonthDays.length;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { locations } = useLocationContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    activeLocations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [authReady, setAuthReady] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // Wait for Firebase auth to be ready
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Only proceed if auth is ready and we have both user and locations
      if (!authReady || !user || !locations) {
        return;
      }

      if (user.role !== 'admin') {
        setError("Unauthorized access");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get ID token for authentication
        const auth = getAuth();
        const idToken = await auth.currentUser.getIdToken(true);
        const headers = { Authorization: `Bearer ${idToken}` };

        // Fetch users from the admin endpoint
  const usersResponse = await axios.get(`${API_URL}/admin/users`, { headers });
  const raw = usersResponse.data;
  const usersData = Array.isArray(raw) ? raw : (raw?.users || []);

        console.log("User data fetched:", usersData);

        // Fetch order statistics
        const ordersResponse = await axios.get(`${API_URL}/payments/orders?limit=1000`, { headers });
        const ordersData = ordersResponse.data.orders || [];
        const totalOrders = ordersData.length;
        const pendingOrders = ordersData.filter(order => 
          ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.orderStatus)
        ).length;

        // Fetch products statistics
        const productsResponse = await axios.get(`${API_URL}/products`, { 
          headers,
          params: { userRole: 'admin' }
        });
        const productsData = productsResponse.data || [];
        const totalProducts = Array.isArray(productsData) ? productsData.length : 0;

        // Set recent users (last 5)
        // Make sure we're sorting correctly based on the actual data structure
        const sortedUsers = Array.isArray(usersData) ?
          [...usersData].sort((a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          ).slice(0, 5) :
          [];

        setRecentUsers(sortedUsers);

        // Set recent orders (last 5)
        const sortedOrders = ordersData
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setRecentOrders(sortedOrders);

        // Update the stats with real data
        setStats({
          totalUsers: Array.isArray(raw) ? usersData.length : (raw?.totalUsers ?? usersData.length ?? 0),
          totalOrders: totalOrders,
          pendingOrders: pendingOrders,
          totalProducts: totalProducts,
          activeLocations: locations ? locations.filter(loc => loc.isActive).length : 0
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data: " + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    };

    if (authReady && user && locations) {
      fetchDashboardData();
    } else if (authReady && user && user.role !== 'admin') {
      setError("Unauthorized access");
      setLoading(false);
    }
  }, [authReady, user, locations]);

  // Handle global search
  const handleGlobalSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Check if it looks like an order number
    if (searchQuery.includes('ORD') || searchQuery.match(/^\d{13}/)) {
      navigate(`/admin/orders`, { state: { searchQuery: searchQuery.trim() } });
    } 
    // Check if it looks like an email
    else if (searchQuery.includes('@')) {
      navigate(`/admin/users`, { state: { searchQuery: searchQuery.trim() } });
    }
    // Default to orders search
    else {
      navigate(`/admin/orders`, { state: { searchQuery: searchQuery.trim() } });
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGlobalSearch();
    }
  };

  return (
  <div className="mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-6 md:py-8 font-sans max-w-[1600px]">
      {/* Tweak left padding: change pl-8 to desired value (e.g., pl-6 for less, pl-10 for more) */}
      {/* Tweak top/bottom padding: change py-6 to desired value (e.g., py-4 for less, py-8 for more) */}
      <div className="mb-2 md:mb-8">
        {/* Tweak header margin: change mb-0 md:mb-8 to desired values (e.g., mb-2 md:mb-6 for less spacing) */}
        <div className="pt-16 md:pt-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-black">Admin Dashboard</h1>
            <p className="text-black font-light">Welcome back, Admin</p>
          </div>
          
          {/* Global Search Bar */}
          <div className="lg:max-w-md w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Quick search: order number, email, payment ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={handleGlobalSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors">
                    Search
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="text-center py-10">
          <p className="font-light">Loading dashboard data...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">
          <p className="font-medium">{error}</p>
        </div>
      ) : (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <FaUsers className="text-blue-500 text-xl" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-black">Total Users</h2>
                <p className="text-2xl font-bold text-black">{stats.totalUsers}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/admin/users" className="text-blue-500 text-sm hover:underline font-medium">View all users</Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <FaShoppingCart className="text-green-500 text-xl" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-black">Total Orders</h2>
                <p className="text-2xl font-bold text-black">{stats.totalOrders}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <Link to="/admin/orders" className="text-green-500 text-sm hover:underline font-medium">View all orders</Link>
              <div className="text-amber-500 text-sm font-bold bg-amber-50 px-2 py-1 rounded">
                {stats.pendingOrders} pending
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <FaList className="text-purple-500 text-xl" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-black">Total Products</h2>
                <p className="text-2xl font-bold text-black">{stats.totalProducts}</p>
              </div>
            </div>
            <div className="mt-4">
              <a href="/admin/products" className="text-purple-500 text-sm hover:underline font-medium">View all products</a>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <FaMapMarkerAlt className="text-black text-xl" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-black">Delivery Locations</h2>
                <p className="text-2xl font-bold text-black">{stats.activeLocations}</p>
              </div>
            </div>
            <div className="mt-4">
              <a href="/admin/locations" className="text-black text-sm hover:underline font-medium">Manage locations</a>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Section */}
  {/* Responsive dashboard widgets layout */}
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Inventory Widget */}
        <InventoryWidget />
        <div className="bg-white rounded-lg shadow-md p-5 md:p-6 flex flex-col">
          <h2 className="text-lg font-bold text-black mb-4 flex items-center justify-between">
            <span>Recent Orders</span>
            <span className="text-xs text-gray-500 font-medium">Last {recentOrders.length || 0}</span>
          </h2>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-black font-medium">No orders available yet</p>
              <p className="text-sm text-gray-600 mt-2">New orders will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order, i) => {
                const statusMap = {
                  delivered: 'bg-green-100 text-green-800',
                  cancelled: 'bg-red-100 text-red-800'
                };
                const inProgress = ['placed','confirmed','preparing','ready','out_for_delivery'];
                const statusClass = statusMap[order.orderStatus] || (inProgress.includes(order.orderStatus) ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-800');
                return (
                  <div key={order._id || i} className="group border border-gray-100 hover:border-rose-200 rounded-lg p-3 transition-colors bg-white/50">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-black truncate" title={order.orderNumber}>{order.orderNumber}</p>
                        <p className="text-sm text-gray-600 truncate" title={order.userDetails?.name}>{order.userDetails?.name || 'Customer'}</p>
                        <p className="text-[11px] text-gray-500 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start gap-2 w-full sm:w-auto">
                        <p className="font-semibold text-black text-sm sm:text-base shrink-0">₹{order.amount?.toFixed(2)}</p>
                        <span
                          className={`inline-flex items-center max-w-[140px] sm:max-w-none px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${statusClass} truncate`}
                          title={order.orderStatus?.replace('_',' ')}
                        >
                          {order.orderStatus?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4">
            <Link to="/admin/orders" className="text-blue-600 text-sm hover:underline font-medium">View all orders</Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-5 md:p-6 flex flex-col">
          <h2 className="text-lg font-bold text-black mb-4 flex items-center justify-between">
            <span>Recent Users</span>
            <span className="text-xs text-gray-500 font-medium">Last {recentUsers.length || 0}</span>
          </h2>
          {loading ? (
            <div className="text-center py-4">
              <p className="font-light">Loading user data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">
              <p className="font-medium">{error}</p>
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="text-center py-4 text-black">
              <p className="font-light">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentUsers.map((userData, i) => {
                const currentMonthDays = calculateCurrentMonthDays(userData.monthlyOrderDays);
                const progressPercent = Math.min((currentMonthDays / 10) * 100, 100);
                const isEligible = userData.freeProductEligible && !userData.freeProductUsed;
                const hasUsed = userData.freeProductUsed;
                
                return (
                <div key={userData._id || i} className="group border border-gray-100 hover:border-rose-200 rounded-lg p-3 transition-colors bg-white/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center text-sm font-semibold text-rose-700 shrink-0">
                        {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="ml-3 min-w-0">
                        <p className="text-sm font-medium text-black truncate" title={userData.name}>{userData.name || 'Unnamed User'}</p>
                        <p className="text-xs text-gray-600 truncate" title={userData.phone}>{userData.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-500 text-right whitespace-nowrap shrink-0">
                      Joined {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  {/* Daily Rewards Progress */}
                  <div className="mt-2 pt-2 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <FaGift className={`text-xs ${isEligible ? 'text-green-500' : hasUsed ? 'text-blue-500' : 'text-rose-400'}`} />
                        <span className="text-[10px] text-gray-600">Daily Rewards</span>
                      </div>
                      <span className={`text-[10px] font-medium ${isEligible ? 'text-green-600' : hasUsed ? 'text-blue-600' : 'text-gray-600'}`}>
                        {isEligible ? 'Eligible!' : hasUsed ? 'Claimed' : `${currentMonthDays}/10 days`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${isEligible ? 'bg-green-500' : hasUsed ? 'bg-blue-500' : 'bg-rose-400'}`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
          <div className="mt-4">
            <Link to="/admin/users" className="color blue text-sm hover:underline font-medium">View all users</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
