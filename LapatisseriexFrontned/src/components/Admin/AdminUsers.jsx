import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUser, FaPhone, FaMapMarkerAlt, FaCrown, FaExclamationTriangle, FaEye } from 'react-icons/fa';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL;
  
  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get ID token from auth
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      
      setUsers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // View user details
  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };
  
  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">User Management</h1>
        <p className="text-gray-600">View and manage user accounts</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-400 mt-0.5 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
      
      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <FaUser className="text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaPhone className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700">{user.phone || 'Not provided'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.location ? (
                      <div className="flex items-center">
                        <FaMapMarkerAlt className={`mr-2 ${user.location.isActive ? 'text-cakePink' : 'text-gray-400'}`} />
                        <span className="text-sm text-gray-700">{user.location.area}, {user.location.city}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not set</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.role === 'admin' && <FaCrown className="text-amber-400 mr-2" />}
                      <span className={`text-sm ${user.role === 'admin' ? 'font-semibold text-amber-700' : 'text-gray-700'}`}>
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => viewUserDetails(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaUser className="mr-2" />
              User Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Basic Information</h4>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="mb-2">
                    <span className="font-medium">Name:</span> {selectedUser.name || 'Not provided'}
                  </p>
                  <p className="mb-2">
                    <span className="font-medium">Phone:</span> {selectedUser.phone || 'Not provided'}
                  </p>
                  <p className="mb-2">
                    <span className="font-medium">Email:</span> {selectedUser.email || 'Not provided'}
                  </p>
                  <p className="mb-2">
                    <span className="font-medium">Role:</span> 
                    <span className={selectedUser.role === 'admin' ? 'text-amber-700 font-semibold' : ''}>
                      {selectedUser.role}
                    </span>
                  </p>
                  <p className="mb-2">
                    <span className="font-medium">Joined:</span> {new Date(selectedUser.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Delivery Location</h4>
                <div className="bg-gray-50 rounded-md p-4">
                  {selectedUser.location ? (
                    <>
                      <div className="flex items-start mb-2">
                        <FaMapMarkerAlt className={`mt-1 mr-2 ${selectedUser.location.isActive ? 'text-cakePink' : 'text-gray-400'}`} />
                        <div>
                          <p className="font-medium">{selectedUser.location.area}</p>
                          <p>{selectedUser.location.city}, {selectedUser.location.pincode}</p>
                        </div>
                      </div>
                      <div className={`text-xs mt-2 px-2 py-1 rounded inline-block ${
                        selectedUser.location.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedUser.location.isActive ? 'Active location' : 'Inactive location'}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">No delivery location set</p>
                  )}
                </div>
                
                <h4 className="text-sm font-medium text-gray-500 mt-4 mb-2">Order Statistics</h4>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="mb-2">
                    <span className="font-medium">Total Orders:</span> {selectedUser.totalOrders || 0}
                  </p>
                  <p className="mb-2">
                    <span className="font-medium">Last Order:</span> {selectedUser.lastOrderDate ? new Date(selectedUser.lastOrderDate).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
