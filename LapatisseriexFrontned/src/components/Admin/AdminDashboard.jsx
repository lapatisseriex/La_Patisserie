import React, { useState, useEffect } from 'react';
import { FaUsers, FaShoppingCart, FaMapMarkerAlt, FaList, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import InventoryWidget from './Dashboard/InventoryWidget';

import { useLocation as useLocationContext } from '../../context/LocationContext/LocationContext';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { locations } = useLocationContext();
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
          totalProducts: 0, // We're setting this to 0 as requested
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

  return (
    <div className="container mx-auto pl-8 pr-4 py-8 md:px-6 md:py-8 font-sans">
      {/* Tweak left padding: change pl-8 to desired value (e.g., pl-6 for less, pl-10 for more) */}
      {/* Tweak top/bottom padding: change py-6 to desired value (e.g., py-4 for less, py-8 for more) */}
      <div className="mb-2 md:mb-8">
        {/* Tweak header margin: change mb-0 md:mb-8 to desired values (e.g., mb-2 md:mb-6 for less spacing) */}
        <h1 className="text-2xl md:text-3xl font-bold text-black">Admin Dashboard</h1>
        <p className="text-black font-light">Welcome back, Admin</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <a href="/admin/users" className="text-blue-500 text-sm hover:underline font-medium">View all users</a>
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
              <a href="/admin/orders" className="text-green-500 text-sm hover:underline font-medium">View all orders</a>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Widget */}
        <InventoryWidget />
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-black mb-4">Recent Orders</h2>
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
              {recentOrders.map((order, i) => (
                <div key={order._id || i} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-black">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.userDetails?.name || 'Customer'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-black">₹{order.amount?.toFixed(2)}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                        ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.orderStatus) 
                          ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.orderStatus?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <a href="/admin/orders" className="text-blue-600 text-sm hover:underline font-medium">View all orders</a>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-black mb-4">Recent Users</h2>
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
              {recentUsers.map((userData, i) => (
                <div key={userData._id || i} className="border-b border-white pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-medium">
                        {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="ml-3">
                        <p>{userData.name || 'Unnamed User'}</p>
                        <p className="text-sm text-black font-light">{userData.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <div className="text-sm text-black font-light">
                      Joined {userData.createdAt 
                        ? new Date(userData.createdAt).toLocaleDateString() 
                        : 'Unknown date'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <a href="/admin/users" className="color blue text-sm hover:underline font-medium">View all users</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
