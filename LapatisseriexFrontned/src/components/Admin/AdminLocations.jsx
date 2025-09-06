import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaExclamationTriangle } from 'react-icons/fa';

const AdminLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  
  const [formData, setFormData] = useState({
    city: '',
    area: '',
    pincode: '',
    isActive: true
  });
  
  const API_URL = import.meta.env.VITE_API_URL;
  
  // Fetch all locations (including inactive ones)
  const fetchLocations = async () => {
    try {
      setLoading(true);
      
      // Get ID token from auth
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      const response = await axios.get(`${API_URL}/admin/locations`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      
      setLocations(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load locations. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Create new location
  const createLocation = async () => {
    try {
      // Get ID token from auth
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      await axios.post(
        `${API_URL}/admin/locations`,
        formData,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      // Refresh locations
      fetchLocations();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error('Error creating location:', err);
      setError('Failed to create location. Please try again.');
    }
  };
  
  // Update location
  const updateLocation = async () => {
    try {
      // Get ID token from auth
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      await axios.put(
        `${API_URL}/admin/locations/${editingLocation._id}`,
        formData,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      // Refresh locations
      fetchLocations();
      setEditingLocation(null);
      resetForm();
    } catch (err) {
      console.error('Error updating location:', err);
      setError('Failed to update location. Please try again.');
    }
  };
  
  // Toggle location status
  const toggleLocationStatus = async (locationId) => {
    try {
      // Get ID token from auth
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      await axios.patch(
        `${API_URL}/admin/locations/${locationId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      // Refresh locations
      fetchLocations();
    } catch (err) {
      console.error('Error toggling location status:', err);
      setError('Failed to update location status. Please try again.');
    }
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      city: '',
      area: '',
      pincode: '',
      isActive: true
    });
  };
  
  // Open edit modal
  const openEditModal = (location) => {
    setEditingLocation(location);
    setFormData({
      city: location.city,
      area: location.area,
      pincode: location.pincode,
      isActive: location.isActive
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingLocation) {
      updateLocation();
    } else {
      createLocation();
    }
  };
  
  // Load locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Delivery Locations</h1>
          <p className="text-gray-600">Manage delivery locations for your store</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-cakePink text-white px-4 py-2 rounded-md flex items-center hover:bg-pink-700 transition-colors"
        >
          <FaPlus className="mr-2" />
          Add Location
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-400 mt-0.5 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
      
      {/* Locations Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pincode
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Loading locations...
                </td>
              </tr>
            ) : locations.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No locations found
                </td>
              </tr>
            ) : (
              locations.map((location) => (
                <tr key={location._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaMapMarkerAlt className={`mr-2 ${location.isActive ? 'text-cakePink' : 'text-gray-400'}`} />
                      <span className="font-medium text-gray-900">{location.area}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-700">{location.city}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-700">{location.pincode}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      location.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(location)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => toggleLocationStatus(location._id)}
                        className={location.isActive ? 'text-amber-500 hover:text-amber-700' : 'text-green-600 hover:text-green-800'}
                      >
                        {location.isActive ? <FaToggleOff /> : <FaToggleOn />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add/Edit Location Modal */}
      {(showAddModal || editingLocation) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cakePink focus:border-cakePink"
                    placeholder="e.g. Coimbatore"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area
                  </label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cakePink focus:border-cakePink"
                    placeholder="e.g. Avinashi Rd, Peelamedu"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cakePink focus:border-cakePink"
                    placeholder="e.g. 641004"
                    required
                    pattern="[0-9]{6}"
                    title="Pincode must be 6 digits"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-cakePink focus:ring-cakePink border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Location is active and available for delivery
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingLocation(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cakePink text-white rounded-md hover:bg-pink-700 transition-colors"
                >
                  {editingLocation ? 'Update Location' : 'Add Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLocations;
