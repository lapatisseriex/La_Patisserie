import React, { useState, useEffect } from 'react';
import { FaUsers, FaShoppingCart, FaMapMarkerAlt, FaList, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useLocation as useLocationContext } from '../../context/LocationContext/LocationContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { locations } = useLocationContext();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalCategories: 0,
    activeLocations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || user.role !== 'admin') {
        setError("Unauthorized access");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get ID token for authentication
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const idToken = await auth.currentUser.getIdToken(true);
        const headers = { Authorization: `Bearer ${idToken}` };
        
        // Fetch users from the admin endpoint
        const usersResponse = await axios.get(`${API_URL}/admin/users`, { headers });
        const usersData = usersResponse.data || [];
        
        // Fetch products and categories
        const [productsResponse, categoriesResponse] = await Promise.all([
          axios.get(`${API_URL}/admin/products`, { headers }),
          axios.get(`${API_URL}/admin/categories`, { headers })
        ]);
        
        const productsData = productsResponse.data?.products || [];
        const categoriesData = categoriesResponse.data?.data || [];
        
        console.log("User data fetched:", usersData);
        console.log("Products data fetched:", productsData);
        console.log("Categories data fetched:", categoriesData);
        
        // Set recent users (last 5)
        // Make sure we're sorting correctly based on the actual data structure
        const sortedUsers = Array.isArray(usersData) ? 
          [...usersData].sort((a, b) => 
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          ).slice(0, 5) : 
          [];
        
        setRecentUsers(sortedUsers);
        
        // Update the stats with real data
        setStats({
          totalUsers: Array.isArray(usersData) ? usersData.length : 0,
          totalOrders: 0, // We're setting this to 0 as requested
          pendingOrders: 0, // We're setting this to 0 as requested
          totalProducts: Array.isArray(productsData) ? productsData.length : 0,
          totalCategories: Array.isArray(categoriesData) ? categoriesData.length : 0,
          activeLocations: locations ? locations.filter(loc => loc.isActive).length : 0
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data: " + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    };

    if (user && locations) {
      fetchDashboardData();
    }
  }, [user, locations]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, Admin</p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="text-center py-10">
          <p>Loading dashboard data...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <FaUsers className="text-blue-500 text-xl" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-600">Total Users</h2>
                <p className="text-2xl font-semibold text-gray-800">{stats.totalUsers}</p>
              </div>
            </div>
            <div className="mt-4">
              <a href="/admin/users" className="text-blue-500 text-sm hover:underline">View all users</a>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <FaShoppingCart className="text-green-500 text-xl" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-600">Total Orders</h2>
                <p className="text-2xl font-semibold text-gray-800">{stats.totalOrders}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <a href="/admin/orders" className="text-green-500 text-sm hover:underline">View all orders</a>
              <div className="text-amber-500 text-sm font-medium bg-amber-50 px-2 py-1 rounded">
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
                <h2 className="text-sm font-medium text-gray-600">Total Products</h2>
                <p className="text-2xl font-semibold text-gray-800">{stats.totalProducts}</p>
              </div>
            </div>
            <div className="mt-4">
              <a href="/admin/products" className="text-purple-500 text-sm hover:underline">View all products</a>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-full">
                <FaList className="text-indigo-500 text-xl" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-600">Categories</h2>
                <p className="text-2xl font-semibold text-gray-800">{stats.totalCategories}</p>
              </div>
            </div>
            <div className="mt-4">
              <a href="/admin/categories" className="text-indigo-500 text-sm hover:underline">Manage categories</a>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-cakePink bg-opacity-20 p-3 rounded-full">
                <FaMapMarkerAlt className="text-cakePink text-xl" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-600">Delivery Locations</h2>
                <p className="text-2xl font-semibold text-gray-800">{stats.activeLocations}</p>
              </div>
            </div>
            <div className="mt-4">
              <a href="/admin/locations" className="text-cakePink text-sm hover:underline">Manage locations</a>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h2>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-600">No orders available yet</p>
            <p className="text-sm text-gray-500 mt-2">Order management coming soon</p>
          </div>
          <div className="mt-4">
            <a href="/admin/orders" className="text-cakePink text-sm hover:underline">View orders page</a>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Users</h2>
          {loading ? (
            <div className="text-center py-4">
              <p>Loading user data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">
              <p>{error}</p>
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentUsers.map((userData, i) => (
                <div key={userData._id || i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">{userData.name || 'Unnamed User'}</p>
                        <p className="text-sm text-gray-600">{userData.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
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
            <a href="/admin/users" className="text-cakePink text-sm hover:underline">View all users</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
