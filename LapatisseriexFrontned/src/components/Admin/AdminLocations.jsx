import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaExclamationTriangle, FaBuilding, FaEye, FaChevronDown, FaChevronUp, FaMapPin, FaGlobeAsia } from 'react-icons/fa';
import GoogleMapsLocationPicker from './GoogleMapsLocationPicker';

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
  
  // Geo-location picker states
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedLocationForMap, setSelectedLocationForMap] = useState(null);
  const [savingGeo, setSavingGeo] = useState(false);
  
  // Auth state
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  
  const [formData, setFormData] = useState({
    city: '',
    area: '',
    pincode: '',
    deliveryCharge: 49,
    isActive: true
  });
  
  const [hostelFormData, setHostelFormData] = useState({
    name: '',
    locationId: '',
    address: '',
    isActive: true
  });
  
  const API_URL = import.meta.env.VITE_API_URL;
  
  // Initialize Firebase auth listener to know when a user is available
  useEffect(() => {
    let unsubscribe;
    (async () => {
      try {
        const { getAuth, onAuthStateChanged } = await import('firebase/auth');
        const auth = getAuth();
        unsubscribe = onAuthStateChanged(auth, (user) => {
          setAuthUser(user);
          setAuthReady(true);
        });
      } catch (e) {
        console.error('Failed to initialize auth listener:', e);
        setAuthReady(true);
      }
    })();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);
  
  // Fetch all locations (including inactive ones)
  const fetchLocations = async () => {
    try {
      setLoading(true);
      
      // Get ID token from auth
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        // Not authenticated; avoid throwing and stop loading
        setError('Please log in to access locations');
        setLoading(false);
        return;
      }
      const idToken = await user.getIdToken(true);
      
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
      const user = auth.currentUser;
      if (!user) return;
      const idToken = await user.getIdToken(true);
      
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
      const user = auth.currentUser;
      if (!user) return [];
      const idToken = await user.getIdToken(true);
      
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
      const user = auth.currentUser;
      if (!user) {
        setError('Please log in to create locations');
        return;
      }
      const idToken = await user.getIdToken(true);
      
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
      const user = auth.currentUser;
      if (!user) {
        setError('Please log in to update locations');
        return;
      }
      const idToken = await user.getIdToken(true);
      
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
      const user = auth.currentUser;
      if (!user) {
        setError('Please log in to change location status');
        return;
      }
      const idToken = await user.getIdToken(true);
      
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

  // Delete location
  const deleteLocation = async (locationId) => {
    if (!window.confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Get ID token from auth
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError('Please log in to delete locations');
        return;
      }
      const idToken = await user.getIdToken(true);
      
      await axios.delete(`${API_URL}/admin/locations/${locationId}`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      
      // Refresh locations
      fetchLocations();
    } catch (err) {
      console.error('Error deleting location:', err);
      setError('Failed to delete location. Please try again.');
    }
  };

  // Hostel management functions
  const createHostel = async () => {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError('Please log in to create hostels');
        return;
      }
      const idToken = await user.getIdToken(true);
      
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
      const user = auth.currentUser;
      if (!user) {
        setError('Please log in to update hostels');
        return;
      }
      const idToken = await user.getIdToken(true);
      
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
      const user = auth.currentUser;
      if (!user) {
        setError('Please log in to delete hostels');
        return;
      }
      const idToken = await user.getIdToken(true);
      
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
      const user = auth.currentUser;
      if (!user) {
        setError('Please log in to change hostel status');
        return;
      }
      const idToken = await user.getIdToken(true);
      
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
      deliveryCharge: 49,
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
      deliveryCharge: location.deliveryCharge || 49, // Default to 49 if undefined
      isActive: location.isActive
    });
  };
  
  // Open map picker for a location
  const openMapPicker = (location) => {
    setSelectedLocationForMap(location);
    setShowMapPicker(true);
  };
  
  // Save geo location from map picker
  const saveGeoLocation = async (geoData) => {
    if (!selectedLocationForMap) return;
    
    try {
      setSavingGeo(true);
      
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError('Please log in to update location');
        return;
      }
      const idToken = await user.getIdToken(true);
      
      await axios.put(
        `${API_URL}/admin/locations/${selectedLocationForMap._id}/geo`,
        {
          lat: geoData.lat,
          lng: geoData.lng,
          deliveryRadiusKm: geoData.radius,
          useGeoDelivery: true
        },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      // Refresh locations
      fetchLocations();
      setShowMapPicker(false);
      setSelectedLocationForMap(null);
    } catch (err) {
      console.error('Error saving geo location:', err);
      setError('Failed to save delivery area. Please try again.');
    } finally {
      setSavingGeo(false);
    }
  };
  
  // Toggle geo-delivery for a location
  const toggleGeoDelivery = async (locationId, currentState) => {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError('Please log in to update location');
        return;
      }
      const idToken = await user.getIdToken(true);
      
      await axios.put(
        `${API_URL}/admin/locations/${locationId}/geo`,
        { useGeoDelivery: !currentState },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      fetchLocations();
    } catch (err) {
      console.error('Error toggling geo-delivery:', err);
      setError('Failed to update geo-delivery status.');
    }
  };
  
  // Open hostel modal
  const openHostelModal = (locationId = null, hostel = null) => {
    if (hostel) {
      setEditingHostel(hostel);
      setHostelFormData({
        name: hostel.name,
        locationId: (hostel.locationId && hostel.locationId._id) || hostel.locationId || '',
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
        const filtered = prev.filter(h => {
          if (!h.locationId) return true; // Keep hostels without locationId
          return (h.locationId._id || h.locationId) !== locationId;
        });
        return [...filtered, ...locationHostels];
      });
    }
  };
  
  // Get hostels for a specific location
  const getHostelsForLocation = (locationId) => {
    return hostels.filter(hostel => {
      if (!hostel.locationId) return false;
      return (hostel.locationId._id || hostel.locationId) === locationId;
    });
  };
  
  // Load locations and hostels after auth initializes and user is available
  useEffect(() => {
    if (!authReady) return;
    if (!authUser) {
      setLoading(false);
      setError('Please log in to access locations');
      return;
    }
    fetchLocations();
    fetchHostels();
  }, [authReady, authUser]);

  return (
    <div className="container mx-auto pl-8 pr-4 py-6 pt-8 md:pb-6 pb-28 font-sans overflow-x-hidden relative">
      <style>{`
        @media (max-width:1051px){
          .locations-table{display:none !important;}
          .locations-cards{display:block !important;}
          .locations-header{flex-direction:column;align-items:flex-start;}
          .locations-header-actions{display:none !important;}
        }
        @media (min-width:1052px){
          .locations-table{display:block !important;}
          .locations-cards{display:none !important;}
          .locations-header{flex-direction:row;align-items:center;justify-content:space-between;}
          .locations-header-actions{display:flex !important;}
        }
      `}</style>
      {/* Tweak left padding: change pl-8 to desired value (e.g., pl-6 for less, pl-10 for more) */}
      {/* Tweak top/bottom padding: change py-6 to desired value (e.g., py-4 for less, py-8 for more) */}
  <div className="pt-16 md:pt-2 locations-header mb-0 md:mb-6 flex gap-4">
        {/* Tweak header margin: change mb-0 md:mb-6 to desired values (e.g., mb-2 md:mb-4 for less spacing) */}
        <div>
          <h1 className="text-2xl font-bold text-black">Delivery Locations & Hostels</h1>
          <p className="text-black font-light">Manage delivery locations and hostels for your store</p>
        </div>
  {/* Header actions: always visible; stack below title under 1052px */}
  <div className="locations-header-actions flex flex-row flex-wrap gap-3 hidden md:flex">
          <button
            onClick={() => openHostelModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors font-medium"
          >
            <FaBuilding className="mr-2" />
            Add Hostel
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-black text-white px-4 py-2 rounded-md flex items-center hover:bg-gray-800 transition-colors font-medium"
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
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}
      
  {/* Card view (below 1052px) */}
  <div className="locations-cards space-y-4 pb-24" style={{display:'none'}}>
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center text-black font-light">
            Loading locations...
          </div>
        ) : locations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center text-black font-light">
            No locations found
          </div>
        ) : (
          locations.map((location) => (
            <div key={location._id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex flex-wrap items-start gap-3">
                {/* Left: Location details */}
                <div className="flex items-start min-w-0">
                  <FaMapMarkerAlt className={`mr-3 mt-1 flex-shrink-0 ${location.isActive ? 'text-black' : 'text-gray-400'}`} />
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-black truncate">{location.area}</div>
                    <div className="text-sm text-black font-medium flex flex-wrap gap-x-3 gap-y-1">
                      <span className="min-w-0 truncate">{location.city}</span>
                      <span className="text-gray-400">•</span>
                      <span className="min-w-0 truncate">{location.pincode}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Status + Actions (minus hostel controls) */}
                <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${location.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {location.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {location.useGeoDelivery && location.coordinates?.lat && (
                    <span className="px-2 py-1 text-xs rounded-full font-medium bg-purple-100 text-purple-800">
                      {location.deliveryRadiusKm || 5} km
                    </span>
                  )}
                  <button
                    onClick={() => openMapPicker(location)}
                    className="text-purple-600 hover:text-purple-900"
                    title="Set delivery area"
                  >
                    <FaGlobeAsia />
                  </button>
                  <button
                    onClick={() => openEditModal(location)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit location"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => deleteLocation(location._id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete location"
                  >
                    <FaTrash />
                  </button>
                  <button
                    onClick={() => toggleLocationStatus(location._id)}
                    className={location.isActive ? 'text-amber-500 hover:text-amber-700' : 'text-green-600 hover:text-green-800'}
                    title={location.isActive ? 'Deactivate location' : 'Activate location'}
                  >
                    {location.isActive ? <FaToggleOff /> : <FaToggleOn />}
                  </button>
                </div>

                {/* Hostels info row with + and dropdown aligned with info */}
                <div className="basis-full flex items-center justify-between mt-1">
                  <div className="text-xs text-black font-medium">
                    {getHostelsForLocation(location._id).length} hostel(s)
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openHostelModal(location._id)}
                      className="text-green-600 hover:text-green-800"
                      title="Add hostel to this location"
                      aria-label="Add hostel"
                    >
                      <FaPlus />
                    </button>
                    <button
                      onClick={() => toggleLocationExpansion(location._id)}
                      className="text-blue-600 hover:text-blue-800"
                      title={expandedLocation === location._id ? 'Hide hostels' : 'Show hostels'}
                      aria-label={expandedLocation === location._id ? 'Hide hostels' : 'Show hostels'}
                    >
                      {expandedLocation === location._id ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Hostels within Card */}
              {expandedLocation === location._id && (
                <div className="mt-4 pt-4 border-t bg-gray-100 rounded-md p-3">
                  <h4 className="font-bold text-black mb-3">Hostels in {location.area}</h4>
                  {getHostelsForLocation(location._id).length === 0 ? (
                    <p className="text-black text-sm font-light">No hostels found in this location.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {getHostelsForLocation(location._id).map((hostel) => (
                        <div key={hostel._id} className="bg-white p-3 rounded-md border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-bold text-black">{hostel.name}</h5>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${hostel.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {hostel.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {hostel.address && (
                            <p className="text-black text-sm mb-2 font-light">{hostel.address}</p>
                          )}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openHostelModal(null, hostel)}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                              title="Edit hostel"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => toggleHostelStatus(hostel._id)}
                              className={`text-sm ${hostel.isActive ? 'text-amber-500 hover:text-amber-700' : 'text-green-600 hover:text-green-800'}`}
                              title={hostel.isActive ? 'Deactivate hostel' : 'Activate hostel'}
                            >
                              {hostel.isActive ? <FaToggleOff /> : <FaToggleOn />}
                            </button>
                            <button
                              onClick={() => deleteHostel(hostel._id)}
                              className="text-red-600 hover:text-red-900 text-sm"
                              title="Delete hostel"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Table view (>=1052px) */}
      <div className="locations-table bg-white rounded-lg shadow-md overflow-hidden" style={{display:'block'}}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                City
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Pincode
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Delivery Charge
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Hostels
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Geo Delivery
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Status
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
                  Loading locations...
                </td>
              </tr>
            ) : locations.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-black font-light">
                  No locations found
                </td>
              </tr>
            ) : (
              locations.map((location) => (
                <React.Fragment key={location._id}>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaMapMarkerAlt className={`mr-2 ${location.isActive ? 'text-black' : 'text-gray-400'}`} />
                        <span className="text-black">{location.area}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-black font-medium">{location.city}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-black font-medium">{location.pincode}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-black font-medium">
                        {location.deliveryCharge === 0 ? (
                          <span className="text-green-600 font-semibold">Free</span>
                        ) : (
                          `₹${location.deliveryCharge}`
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-black font-medium">
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
                      <div className="flex items-center space-x-2">
                        {location.useGeoDelivery && location.coordinates?.lat ? (
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 text-xs rounded-full font-medium bg-purple-100 text-purple-800">
                              {location.deliveryRadiusKm || 5} km
                            </span>
                            <button
                              onClick={() => openMapPicker(location)}
                              className="text-purple-600 hover:text-purple-800"
                              title="Edit delivery area"
                            >
                              <FaMapPin />
                            </button>
                            <button
                              onClick={() => toggleGeoDelivery(location._id, location.useGeoDelivery)}
                              className="text-amber-500 hover:text-amber-700"
                              title="Disable geo-delivery"
                            >
                              <FaToggleOn />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Not set</span>
                            <button
                              onClick={() => openMapPicker(location)}
                              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                              title="Set up geo-delivery area"
                            >
                              <FaGlobeAsia />
                              <span className="text-xs">Set up</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
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
                          title="Edit location"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => deleteLocation(location._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete location"
                        >
                          <FaTrash />
                        </button>
                        <button
                          onClick={() => toggleLocationStatus(location._id)}
                          className={location.isActive ? 'text-amber-500 hover:text-amber-700' : 'text-green-600 hover:text-green-800'}
                          title={location.isActive ? 'Deactivate location' : 'Activate location'}
                        >
                          {location.isActive ? <FaToggleOff /> : <FaToggleOn />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded hostels row */}
                  {expandedLocation === location._id && (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 bg-gray-100">
                        <div className="space-y-2">
                          <h4 className="font-bold text-black mb-3">Hostels in {location.area}</h4>
                          {getHostelsForLocation(location._id).length === 0 ? (
                            <p className="text-black text-sm font-light">No hostels found in this location.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {getHostelsForLocation(location._id).map((hostel) => (
                                <div key={hostel._id} className="bg-white p-3 rounded-md border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-bold text-black">{hostel.name}</h5>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                      hostel.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {hostel.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                  {hostel.address && (
                                    <p className="text-black text-sm mb-2 font-light">{hostel.address}</p>
                                  )}
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => openHostelModal(null, hostel)}
                                      className="text-blue-600 hover:text-blue-900 text-sm"
                                      title="Edit hostel"
                                    >
                                      <FaEdit />
                                    </button>
                                    <button
                                      onClick={() => toggleHostelStatus(hostel._id)}
                                      className={`text-sm ${hostel.isActive ? 'text-amber-500 hover:text-amber-700' : 'text-green-600 hover:text-green-800'}`}
                                      title={hostel.isActive ? 'Deactivate hostel' : 'Activate hostel'}
                                    >
                                      {hostel.isActive ? <FaToggleOff /> : <FaToggleOn />}
                                    </button>
                                    <button
                                      onClick={() => deleteHostel(hostel._id)}
                                      className="text-red-600 hover:text-red-900 text-sm"
                                      title="Delete hostel"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-sans">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-black mb-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium"
                    placeholder="e.g. 641004"
                    required
                    pattern="[0-9]{6}"
                    title="Pincode must be 6 digits"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Delivery Charge (₹)
                  </label>
                  <input
                    type="number"
                    name="deliveryCharge"
                    value={formData.deliveryCharge}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium"
                    placeholder="e.g. 49"
                    required
                    min="0"
                    step="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Set to 0 for free delivery in this area</p>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-black font-medium">
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-sans">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-black mb-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-medium"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-medium"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-light"
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
                    className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="hostelIsActive" className="ml-2 block text-sm text-black font-medium">
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingHostel ? 'Update Hostel' : 'Add Hostel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

  {/* Floating action icons (bottom-right) - mobile only */}
  <div className="md:hidden fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {/* Add Location */}
        <div className="relative group">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-black text-white rounded-full w-11 h-11 flex items-center justify-center shadow-lg hover:bg-gray-800"
            aria-label="Add Location"
          >
            <FaMapMarkerAlt />
          </button>
          <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            <div className="px-2 py-1 text-xs rounded bg-gray-800 text-white whitespace-nowrap shadow-md">Add Location</div>
          </div>
        </div>
        {/* Add Hostel */}
        <div className="relative group">
          <button
            onClick={() => openHostelModal()}
            className="bg-blue-600 text-white rounded-full w-11 h-11 flex items-center justify-center shadow-lg hover:bg-blue-700"
            aria-label="Add Hostel"
          >
            <FaBuilding />
          </button>
          <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            <div className="px-2 py-1 text-xs rounded bg-gray-800 text-white whitespace-nowrap shadow-md">Add Hostel</div>
          </div>
        </div>
      </div>
      
      {/* Google Maps Location Picker Modal */}
      {showMapPicker && selectedLocationForMap && (
        <GoogleMapsLocationPicker
          initialLat={selectedLocationForMap.coordinates?.lat}
          initialLng={selectedLocationForMap.coordinates?.lng}
          initialRadius={selectedLocationForMap.deliveryRadiusKm || 5}
          googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          onLocationSelect={(data) => console.log('Location selected:', data)}
          onRadiusChange={(radius) => console.log('Radius changed:', radius)}
          onClose={() => {
            setShowMapPicker(false);
            setSelectedLocationForMap(null);
          }}
          onSave={saveGeoLocation}
        />
      )}
    </div>
  );
};

export default AdminLocations;
