import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaExclamationTriangle, FaBuilding, FaEye, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const AdminLocations = () => {
  const [locations, setLocations] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  
  // Hostel management states
  const [showHostelModal, setShowHostelModal] = useState(false);
  const [editingHostel, setEditingHostel] = useState(null);
  const [selectedLocationForHostels, setSelectedLocationForHostels] = useState(null);
  const [expandedLocation, setExpandedLocation] = useState(null);
  
  const [formData, setFormData] = useState({
    city: '',
    area: '',
    pincode: '',
    isActive: true
  });
  
  const [hostelFormData, setHostelFormData] = useState({
    name: '',
    locationId: '',
    address: '',
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
  
  // Fetch all hostels
  const fetchHostels = async () => {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      const response = await axios.get(`${API_URL}/hostels`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      
      setHostels(response.data);
    } catch (err) {
      console.error('Error fetching hostels:', err);
    }
  };
  
  // Fetch hostels for a specific location
  const fetchHostelsByLocation = async (locationId) => {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      const response = await axios.get(`${API_URL}/hostels/location/${locationId}/admin`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      
      return response.data;
    } catch (err) {
      console.error('Error fetching hostels for location:', err);
      return [];
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

  // Hostel management functions
  const createHostel = async () => {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      await axios.post(
        `${API_URL}/hostels`,
        hostelFormData,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      fetchHostels();
      setShowHostelModal(false);
      resetHostelForm();
    } catch (err) {
      console.error('Error creating hostel:', err);
      setError('Failed to create hostel. Please try again.');
    }
  };
  
  const updateHostel = async () => {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      await axios.put(
        `${API_URL}/hostels/${editingHostel._id}`,
        hostelFormData,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      fetchHostels();
      setEditingHostel(null);
      resetHostelForm();
      setShowHostelModal(false);
    } catch (err) {
      console.error('Error updating hostel:', err);
      setError('Failed to update hostel. Please try again.');
    }
  };
  
  const deleteHostel = async (hostelId) => {
    if (!window.confirm('Are you sure you want to delete this hostel?')) {
      return;
    }
    
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      await axios.delete(`${API_URL}/hostels/${hostelId}`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      
      fetchHostels();
    } catch (err) {
      console.error('Error deleting hostel:', err);
      setError('Failed to delete hostel. Please try again.');
    }
  };
  
  const toggleHostelStatus = async (hostelId) => {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      await axios.patch(
        `${API_URL}/hostels/${hostelId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      fetchHostels();
    } catch (err) {
      console.error('Error toggling hostel status:', err);
      setError('Failed to update hostel status. Please try again.');
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
  
  // Handle hostel form input change
  const handleHostelInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHostelFormData({
      ...hostelFormData,
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
  
  // Reset hostel form
  const resetHostelForm = () => {
    setHostelFormData({
      name: '',
      locationId: '',
      address: '',
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
  
  // Open hostel modal
  const openHostelModal = (locationId = null, hostel = null) => {
    if (hostel) {
      setEditingHostel(hostel);
      setHostelFormData({
        name: hostel.name,
        locationId: hostel.locationId._id || hostel.locationId,
        address: hostel.address || '',
        isActive: hostel.isActive
      });
    } else {
      setEditingHostel(null);
      setHostelFormData({
        name: '',
        locationId: locationId || '',
        address: '',
        isActive: true
      });
    }
    setShowHostelModal(true);
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
  
  // Handle hostel form submission
  const handleHostelSubmit = (e) => {
    e.preventDefault();
    if (editingHostel) {
      updateHostel();
    } else {
      createHostel();
    }
  };
  
  // Toggle expanded location to show hostels
  const toggleLocationExpansion = async (locationId) => {
    if (expandedLocation === locationId) {
      setExpandedLocation(null);
    } else {
      setExpandedLocation(locationId);
      // Fetch hostels for this location if not already fetched
      const locationHostels = await fetchHostelsByLocation(locationId);
      setHostels(prev => {
        // Remove existing hostels for this location and add new ones
        const filtered = prev.filter(h => h.locationId._id !== locationId);
        return [...filtered, ...locationHostels];
      });
    }
  };
  
  // Get hostels for a specific location
  const getHostelsForLocation = (locationId) => {
    return hostels.filter(hostel => 
      (hostel.locationId._id || hostel.locationId) === locationId
    );
  };
  
  // Load locations and hostels on component mount
  useEffect(() => {
    fetchLocations();
    fetchHostels();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 pt-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-black">Delivery Locations & Hostels</h1>
          <p className="text-black">Manage delivery locations and hostels for your store</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => openHostelModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
          >
            <FaBuilding className="mr-2" />
            Add Hostel
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-black text-white px-4 py-2 rounded-md flex items-center hover:bg-gray-800 transition-colors"
          >
            <FaPlus className="mr-2" />
            Add Location
          </button>
        </div>
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
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                City
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Pincode
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Hostels
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-black">
                  Loading locations...
                </td>
              </tr>
            ) : locations.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-black">
                  No locations found
                </td>
              </tr>
            ) : (
              locations.map((location) => (
                <React.Fragment key={location._id}>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaMapMarkerAlt className={`mr-2 ${location.isActive ? 'text-black' : 'text-white'}`} />
                        <span className="font-medium text-black">{location.area}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-black">{location.city}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-black">{location.pincode}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-black">
                          {getHostelsForLocation(location._id).length} hostel(s)
                        </span>
                        <button
                          onClick={() => toggleLocationExpansion(location._id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {expandedLocation === location._id ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                        <button
                          onClick={() => openHostelModal(location._id)}
                          className="text-green-600 hover:text-green-800"
                          title="Add hostel to this location"
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        location.isActive ? 'bg-green-100 text-green-800' : 'bg-white text-black'
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
                  
                  {/* Expanded hostels row */}
                  {expandedLocation === location._id && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 bg-gray-100">
                        <div className="space-y-2">
                          <h4 className="font-medium text-black mb-3">Hostels in {location.area}</h4>
                          {getHostelsForLocation(location._id).length === 0 ? (
                            <p className="text-black text-sm">No hostels found in this location.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {getHostelsForLocation(location._id).map((hostel) => (
                                <div key={hostel._id} className="bg-white p-3 rounded-md border border-white">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-medium text-black">{hostel.name}</h5>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      hostel.isActive ? 'bg-green-100 text-green-800' : 'bg-white text-black'
                                    }`}>
                                      {hostel.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                  {hostel.address && (
                                    <p className="text-black text-sm mb-2">{hostel.address}</p>
                                  )}
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => openHostelModal(null, hostel)}
                                      className="text-blue-600 hover:text-blue-900 text-sm"
                                    >
                                      <FaEdit />
                                    </button>
                                    <button
                                      onClick={() => toggleHostelStatus(hostel._id)}
                                      className={`text-sm ${hostel.isActive ? 'text-amber-500 hover:text-amber-700' : 'text-green-600 hover:text-green-800'}`}
                                    >
                                      {hostel.isActive ? <FaToggleOff /> : <FaToggleOn />}
                                    </button>
                                    <button
                                      onClick={() => deleteHostel(hostel._id)}
                                      className="text-red-600 hover:text-red-900 text-sm"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add/Edit Location Modal */}
      {(showAddModal || editingLocation) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-black mb-4">
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                    placeholder="e.g. Coimbatore"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Area
                  </label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                    placeholder="e.g. Avinashi Rd, Peelamedu"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
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
                    className="h-4 w-4 text-black focus:ring-white border-white rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-black">
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
                  className="px-4 py-2 border border-white rounded-md text-black hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  {editingLocation ? 'Update Location' : 'Add Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Hostel Modal */}
      {showHostelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-black mb-4">
              {editingHostel ? 'Edit Hostel' : 'Add New Hostel'}
            </h3>
            
            <form onSubmit={handleHostelSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Hostel Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={hostelFormData.name}
                    onChange={handleHostelInputChange}
                    className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                    placeholder="e.g. Student Hostel A"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Location
                  </label>
                  <select
                    name="locationId"
                    value={hostelFormData.locationId}
                    onChange={handleHostelInputChange}
                    className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                    required
                  >
                    <option value="">Select a location</option>
                    {locations.filter(loc => loc.isActive).map(location => (
                      <option key={location._id} value={location._id}>
                        {location.area}, {location.city} - {location.pincode}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Address (Optional)
                  </label>
                  <textarea
                    name="address"
                    value={hostelFormData.address}
                    onChange={handleHostelInputChange}
                    className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                    placeholder="Detailed address of the hostel"
                    rows="3"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="hostelIsActive"
                    checked={hostelFormData.isActive}
                    onChange={handleHostelInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-white rounded"
                  />
                  <label htmlFor="hostelIsActive" className="ml-2 block text-sm text-black">
                    Hostel is active and available for delivery
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowHostelModal(false);
                    setEditingHostel(null);
                    resetHostelForm();
                  }}
                  className="px-4 py-2 border border-white rounded-md text-black hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingHostel ? 'Update Hostel' : 'Add Hostel'}
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





