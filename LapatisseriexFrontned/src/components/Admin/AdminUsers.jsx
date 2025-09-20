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
    <div className="container mx-auto pl-8 pr-4 py-6 pt-8 font-sans">
      {/* Tweak left padding: change pl-8 to desired value (e.g., pl-6 for less, pl-10 for more) */}
      {/* Tweak top/bottom padding: change py-6 to desired value (e.g., py-4 for less, py-8 for more) */}
      <div className="mb-0 md:mb-6">
        {/* Tweak header margin: change mb-0 md:mb-6 to desired values (e.g., mb-2 md:mb-4 for less spacing) */}
        <h1 className="text-2xl font-bold text-black">User Management</h1>
        <p className="text-black font-light">View and manage user accounts</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-400 mt-0.5 mr-2" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}
      
      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Phone
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Joined
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-black font-light">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-black font-light">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-100">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                        <FaUser className="text-black" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm text-black">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-black font-light">
                          {user.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaPhone className="text-gray-500 mr-2" />
                      <span className="text-sm text-black font-normal">{user.phone || 'Not provided'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.location ? (
                      <div className="flex items-center">
                        <FaMapMarkerAlt className={`mr-2 ${user.location.isActive ? 'text-black' : 'text-gray-400'}`} />
                        <span className="text-sm text-black font-normal">{user.location.area}, {user.location.city}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-black font-light">Not set</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.role === 'admin' && <FaCrown className="text-amber-400 mr-2" />}
                      <span className={`text-sm ${user.role === 'admin' ? 'font-bold text-amber-700' : 'text-black font-normal'}`}>
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-black font-normal">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => viewUserDetails(user)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-sans">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center">
              <FaUser className="mr-2" />
              User Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-bold text-black mb-2">Basic Information</h4>
                <div className="bg-gray-100 rounded-md p-4">
                  <p className="mb-2">
                    <span className="font-bold">Name:</span> <span className="font-normal">{selectedUser.name || 'Not provided'}</span>
                  </p>
                  <p className="mb-2">
                    <span className="font-bold">Phone:</span> <span className="font-normal">{selectedUser.phone || 'Not provided'}</span>
                  </p>
                  <p className="mb-2">
                    <span className="font-bold">Email:</span> <span className="font-normal">{selectedUser.email || 'Not provided'}</span>
                  </p>
                  <p className="mb-2">
                    <span className="font-bold">Role:</span> 
                    <span className={`${selectedUser.role === 'admin' ? 'font-bold text-amber-700' : 'font-normal'}`}>
                      {selectedUser.role}
                    </span>
                  </p>
                  <p className="mb-2">
                    <span className="font-bold">Joined:</span> <span className="font-normal">{new Date(selectedUser.createdAt).toLocaleString()}</span>
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-black mb-2">Delivery Location</h4>
                <div className="bg-gray-100 rounded-md p-4">
                  {selectedUser.location ? (
                    <>
                      <div className="flex items-start mb-2">
                        <FaMapMarkerAlt className={`mt-1 mr-2 ${selectedUser.location.isActive ? 'text-black' : 'text-gray-400'}`} />
                        <div>
                          <p className="font-bold">{selectedUser.location.area}</p>
                          <p className="font-normal">{selectedUser.location.city}, {selectedUser.location.pincode}</p>
                        </div>
                      </div>
                      <div className={`text-xs mt-2 px-2 py-1 rounded inline-block font-medium ${
                        selectedUser.location.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedUser.location.isActive ? 'Active location' : 'Inactive location'}
                      </div>
                    </>
                  ) : (
                    <p className="text-black font-light">No delivery location set</p>
                  )}
                </div>
                
                <h4 className="text-sm font-bold text-black mt-4 mb-2">Order Statistics</h4>
                <div className="bg-gray-100 rounded-md p-4">
                  <p className="mb-2">
                    <span className="font-bold">Total Orders:</span> <span className="font-normal">{selectedUser.totalOrders || 0}</span>
                  </p>
                  <p className="mb-2">
                    <span className="font-bold">Last Order:</span> <span className="font-normal">{selectedUser.lastOrderDate ? new Date(selectedUser.lastOrderDate).toLocaleDateString() : 'Never'}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium"
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
