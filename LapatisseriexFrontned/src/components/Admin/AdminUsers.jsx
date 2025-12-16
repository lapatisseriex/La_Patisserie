import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUser, FaPhone, FaMapMarkerAlt, FaCrown, FaExclamationTriangle, FaEye, FaFilter, FaEnvelope, FaBell, FaTimes, FaSyncAlt, FaShoppingCart, FaCreditCard, FaHeart, FaGift, FaComment, FaNewspaper, FaCalendarAlt, FaChartLine, FaDollarSign } from 'react-icons/fa';
import { useLocation as useLocationContext } from '../../context/LocationContext/LocationContext';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';
import { getWebSocketBaseUrl, getSocketOptions } from '../../utils/websocketUrl.js';

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

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  // Filters
  const [nameQuery, setNameQuery] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [globalSearch, setGlobalSearch] = useState(''); // name/email/phone
  const [locationId, setLocationId] = useState(''); // from dropdown
  // Joined (createdAt) filters: year/month/day
  const [joinYear, setJoinYear] = useState('');
  const [joinMonth, setJoinMonth] = useState('');
  const [joinDay, setJoinDay] = useState('');
  // Toggle filters
  const [showFilters, setShowFilters] = useState(false);
  // Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [authReady, setAuthReady] = useState(false);
  // WebSocket state
  const [showNewUserBanner, setShowNewUserBanner] = useState(false);
  const [newUserCount, setNewUserCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsSocketId, setWsSocketId] = useState('');

  const { locations } = useLocationContext?.() || { locations: [] };
  
  const API_URL = import.meta.env.VITE_API_URL;
  
  // Fetch all users
  const fetchUsers = async (pageNum = page, searchText = globalSearch) => {
    // Only proceed if auth is ready
    if (!authReady) {
      console.log('Auth not ready yet, skipping fetch users');
      return;
    }

    try {
      setLoading(true);
      
      // Get ID token from auth
      const auth = getAuth();
      if (!auth.currentUser) {
        console.error('No current user found');
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }
      
      const idToken = await auth.currentUser.getIdToken(true);
      
      const params = new URLSearchParams();
      params.set('page', String(pageNum || 1));
      params.set('limit', '10');
      if (searchText) params.set('search', searchText);

      const response = await axios.get(`${API_URL}/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const data = response.data;
      // Support both wrapped and raw array formats
      const usersArray = Array.isArray(data) ? data : (data.users || []);
      setUsers(usersArray);
      if (!Array.isArray(data)) {
        setPage(data.page || 1);
        setPages(data.pages || 1);
        setTotalUsers(data.totalUsers || usersArray.length);
      } else {
        setPages(1);
        setTotalUsers(usersArray.length);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // View user details
  const viewUserDetails = async (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setLoadingDetails(true);
    setUserDetails(null);

    try {
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);

      // Fetch comprehensive user details from multiple endpoints
      const [detailsRes, contactsRes, newsletterRes, loyaltyRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users/${user.uid}/details`, {
          headers: { Authorization: `Bearer ${idToken}` }
        }),
        axios.get(`${API_URL}/admin/contacts/user/${user.email}`, {
          headers: { Authorization: `Bearer ${idToken}` }
        }),
        axios.get(`${API_URL}/admin/newsletter/status/${user.email}`, {
          headers: { Authorization: `Bearer ${idToken}` }
        }),
        axios.get(`${API_URL}/admin/users/${user.uid}/loyalty`, {
          headers: { Authorization: `Bearer ${idToken}` }
        })
      ]);

      setUserDetails({
        userInfo: detailsRes.data.data,
        contacts: contactsRes.data.data || [],
        newsletter: newsletterRes.data.data,
        loyalty: loyaltyRes.data.data
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Clear all filters and close panel
  const clearAllFilters = () => {
    setNameQuery('');
    setPhoneQuery('');
    setGlobalSearch('');
    setLocationId('');
    setJoinYear('');
    setJoinMonth('');
    setJoinDay('');
    setShowFilters(false);
  };
  
  // Wait for Firebase auth to be ready
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Set up WebSocket connection for real-time user signup notifications
  useEffect(() => {
    const apiUrl = getWebSocketBaseUrl();
    console.log('%c🔌 WebSocket Connection (Users Page)', 'color: #733857; font-weight: bold; font-size: 14px');
    console.log('📍 Derived WS Base:', apiUrl);
    console.log('⏰ Time:', new Date().toLocaleTimeString());

    const socket = io(apiUrl, getSocketOptions({ autoConnect: true }));
    let heartbeatInterval = setInterval(() => {
      if (socket.connected) socket.emit('ping');
    }, 30000);
    
    socket.on('connect', () => {
      console.log('%c✅ WebSocket CONNECTED (Users Page)', 'color: green; font-weight: bold; font-size: 14px');
      console.log('🆔 Socket ID:', socket.id);
      setWsConnected(true);
      setWsSocketId(socket.id);
      toast.success('Live user updates connected!', {
        duration: 3000,
        icon: '🔌'});
    });

    socket.on('connect_error', (error) => {
      console.log('%c❌ WebSocket Error (Users Page)', 'color: red; font-weight: bold');
      console.error('Error:', error.message);
      setWsConnected(false);
      setWsSocketId('');
    });

    socket.on('disconnect', (reason) => {
      console.log('%c🔌 WebSocket Disconnected (Users Page)', 'color: orange; font-weight: bold');
      console.log('Reason:', reason);
      setWsConnected(false);
      setWsSocketId('');
    });
    
    // Listen for new user signup events
    socket.on('newUserSignup', (data) => {
      console.log('%c👤 NEW USER SIGNUP EVENT!', 'color: blue; font-weight: bold; font-size: 16px; background: #e6f3ff; padding: 5px');
      console.log('📧 Email:', data.userData?.email);
      console.log('👤 Name:', data.userData?.name);
      console.log('🆔 User ID:', data.userId);
      console.log('📍 Location:', data.userData?.location);
      console.log('⏰ Signed up at:', new Date().toLocaleTimeString());
      console.log('📋 Full Data:', data);
      
      setShowNewUserBanner(true);
      setNewUserCount(prev => prev + 1);
      
      // Show toast notification
      toast.success(`New user signed up: ${data.userData?.email || 'Unknown'}!`, {
        duration: 4000,
        icon: '👤'});
    });

    // Cleanup on unmount
    return () => {
      console.log('%c🔌 Cleaning up WebSocket (Users Page)', 'color: gray');
      clearInterval(heartbeatInterval);
      socket.off('newUserSignup');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, []);
  
  // Load users on component mount
  useEffect(() => {
    fetchUsers(page, globalSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, authReady]);

  // Refetch when global search changes, reset to page 1 (debounced)
  useEffect(() => {
    if (!authReady) return;
    
    const t = setTimeout(() => {
      setPage(1);
      fetchUsers(1, globalSearch);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSearch, authReady]);

  // Highlight helpers for name matches (case-insensitive)
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const highlightMatch = (text, query) => {
    const base = (text || '').toString();
    const q = (query || '').toString();
    if (!q) return base;
    try {
      const parts = base.split(new RegExp(`(${escapeRegExp(q)})`, 'ig'));
      return (
        <>
          {parts.map((part, idx) =>
            part.toLowerCase() === q.toLowerCase() ? (
              <mark key={idx} className="bg-yellow-200 px-0.5 rounded">
                {part}
              </mark>
            ) : (
              <span key={idx}>{part}</span>
            )
          )}
        </>
      );
    } catch {
      return base;
    }
  };

  // Helpers for date parts
  const getDateParts = (value) => {
    if (!value) return { y: '', m: '', d: '' };
    const dt = new Date(value);
    if (isNaN(dt)) return { y: '', m: '', d: '' };
    return {
      y: String(dt.getFullYear()),
      m: String(dt.getMonth() + 1).padStart(2, '0'),
      d: String(dt.getDate()).padStart(2, '0')};
  };

  // Derived filtered users
  const filteredUsers = React.useMemo(() => {
    const norm = (s) => (s || '').toString().toLowerCase();
    const pad2 = (s) => (s ? String(s).padStart(2, '0') : s);
    const matchesDateParts = (dateValue, y, m, d) => {
      if (!y && !m && !d) return true; // no constraint
      if (!dateValue) return false;
      const parts = getDateParts(dateValue);
      if (y && parts.y !== y) return false;
      if (m && parts.m !== pad2(m)) return false;
      if (d && parts.d !== pad2(d)) return false;
      return true;
    };

    return users.filter((u) => {
  const nameOk = !nameQuery || norm(u?.name).includes(norm(nameQuery));
  const phoneOk = !phoneQuery || norm(u?.phone).includes(norm(phoneQuery));
  const emailOkGlobal = !globalSearch || norm(u?.email).includes(norm(globalSearch));
  const nameOkGlobal = !globalSearch || norm(u?.name).includes(norm(globalSearch));
  const phoneOkGlobal = !globalSearch || norm(u?.phone).includes(norm(globalSearch));
      const locationOk = !locationId || u?.location?._id === locationId;
      const joinOk = matchesDateParts(u?.createdAt, joinYear, joinMonth, joinDay);
      const globalOk = emailOkGlobal || nameOkGlobal || phoneOkGlobal;
      return nameOk && phoneOk && locationOk && joinOk && globalOk;
    });
  }, [users, nameQuery, phoneQuery, locationId, joinYear, joinMonth, joinDay, globalSearch]);

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 font-sans overflow-x-hidden min-w-0 max-w-[1400px]">
      {/* New User Notification Banner */}
      {showNewUserBanner && (
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-md animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 rounded-full p-2 animate-pulse">
                <FaBell className="text-white text-lg" />
              </div>
              <div>
                <p className="text-blue-800 font-semibold text-lg">
                  New user{newUserCount > 1 ? 's' : ''} signed up!
                </p>
                <p className="text-blue-700 text-sm">
                  {newUserCount} new user{newUserCount > 1 ? 's have' : ' has'} joined. Click refresh to view.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  fetchUsers(page, globalSearch);
                  setShowNewUserBanner(false);
                  setNewUserCount(0);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <FaSyncAlt className="text-sm" />
                <span>Refresh Now</span>
              </button>
              <button
                onClick={() => {
                  setShowNewUserBanner(false);
                  setNewUserCount(0);
                }}
                className="text-blue-600 hover:text-blue-800 transition-colors p-2"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tweak left padding: change pl-8 to desired value (e.g., pl-6 for less, pl-10 for more) */}
      {/* Tweak top/bottom padding: change py-6 to desired value (e.g., py-4 for less, py-8 for more) */}
  <div className="mb-6 md:mb-8 pt-16 md:pt-4 flex items-center justify-between">
        {/* Tweak header margin: change mb-0 md:mb-6 to desired values (e.g., mb-2 md:mb-4 for less spacing) */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-black">User Management</h1>
            {/* WebSocket Connection Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              wsConnected 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span>{wsConnected ? 'Live Updates Active' : 'Disconnected'}</span> 
            </div>
          </div>
          <p className="text-black font-light">
            View and manage user accounts
          </p>
        </div>
        <button
          className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 text-sm"
          onClick={() => setShowFilters((v) => !v)}
        >
          <FaFilter className="text-gray-700" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* Mobile: search + filter icon under title */}
  <div className="sm:hidden mb-4 flex items-center gap-2">
        <input
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="name/email/number"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <button
          className="inline-flex sm:hidden items-center justify-center px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
          onClick={() => setShowFilters((v) => !v)}
          aria-label="Toggle filters"
        >
          <FaFilter className="text-gray-700" />
        </button>
      </div>

      {/* Desktop: search bar optional too */}
      <div className="hidden sm:block mb-4">
        <input
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="name/email/number"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-400 mt-0.5 mr-2" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}
      
      {/* Filters */}
      {showFilters && (
      <div className="mb-4 bg-white border border-gray-100 rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input
              type="text"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Search by name"
              className={`w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${nameQuery ? 'ring-yellow-300 bg-yellow-50' : 'focus:ring-pink-300'}`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input
              type="text"
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
              placeholder="Search by phone"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              <option value="">All locations</option>
              {locations?.map((loc) => (
                <option key={loc._id} value={loc._id}>{loc.area}, {loc.city}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Joined date inline below location */}
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Joined date</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="YYYY"
              value={joinYear}
              onChange={(e) => setJoinYear(e.target.value)}
              className="w-24 border border-gray-300 rounded px-2 py-2 text-sm bg-white"
            />
            {/* Month with inline +/- buttons inside the field */}
            <div className="relative w-20">
              <input
                type="number"
                inputMode="numeric"
                placeholder="MM"
                value={joinMonth}
                onChange={(e) => setJoinMonth(e.target.value)}
                className="w-full border border-gray-300 rounded py-2 text-sm bg-white text-center appearance-none pl-13 pr-6"
              />
            </div>
            {/* Day with inline +/- buttons inside the field */}
            <div className="relative w-20">
              <input
                type="number"
                inputMode="numeric"
                placeholder="DD"
                value={joinDay}
                onChange={(e) => setJoinDay(e.target.value)}
                className="w-full border border-gray-300 rounded py-2 text-sm bg-white text-center appearance-none pl-13 pr-6"
              />
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-2 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>
      )}

  {/* Desktop table (xl+) with its own vertical scroller */}
  <div className="hidden xl:block bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="max-w-full overflow-x-auto max-h-[65vh] overflow-y-auto">
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
                Daily Rewards
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
                <td colSpan="7" className="px-6 py-4 text-center text-black font-light">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-black font-light">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-100">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                        <FaUser className="text-black" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm text-black">
                          {nameQuery
                            ? highlightMatch(user.name || 'unnamed user', nameQuery)
                            : (globalSearch
                                ? highlightMatch(user.name || 'unnamed user', globalSearch)
                                : (user.name || 'unnamed user'))}
                        </div>
                        <div className="text-sm text-black font-light flex items-center">
                          {globalSearch ? highlightMatch(user.email || 'No email', globalSearch) : (user.email || 'No email')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaPhone className="text-gray-500 mr-2" />
                      <span className="text-sm text-black font-normal">
                        {globalSearch ? highlightMatch(user.phone || 'Not provided', globalSearch) : (user.phone || 'Not provided')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.userAddress?.fullAddress ? (
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <FaMapMarkerAlt className="mr-2 text-black" />
                          <span className="text-sm text-black font-normal">{user.userAddress.fullAddress}</span>
                        </div>
                        {user.location && (
                          <span className="text-xs text-blue-600 ml-6">📍 Zone: {user.location.area}, {user.location.city}</span>
                        )}
                      </div>
                    ) : user.location ? (
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
                    {(() => {
                      const currentMonthDays = calculateCurrentMonthDays(user.monthlyOrderDays);
                      const progressPercent = Math.min((currentMonthDays / 10) * 100, 100);
                      const isEligible = user.freeProductEligible && !user.freeProductUsed;
                      const hasUsed = user.freeProductUsed;
                      
                      return (
                        <div className="w-24">
                          <div className="flex items-center justify-between mb-1">
                            <FaGift className={`text-xs ${isEligible ? 'text-green-500' : hasUsed ? 'text-blue-500' : 'text-rose-400'}`} />
                            <span className={`text-[10px] font-medium ${isEligible ? 'text-green-600' : hasUsed ? 'text-blue-600' : 'text-gray-600'}`}>
                              {isEligible ? 'Eligible!' : hasUsed ? 'Claimed' : `${currentMonthDays}/10`}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${isEligible ? 'bg-green-500' : hasUsed ? 'bg-blue-500' : 'bg-rose-400'}`}
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })()}
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
      </div>

      {/* Pagination controls */}
      <div className="mt-4 mb-8 flex items-center justify-between">
        <div className="text-sm text-gray-600">Total: {totalUsers}</div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Prev
          </button>
          <span className="text-sm">Page {page} of {pages}</span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages || loading}
          >
            Next
          </button>
        </div>
      </div>

  {/* Cards (<xl): 1/2/3 responsive columns */}
  <div className="xl:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="text-center text-black py-6">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center text-black py-6">No users found</div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user._id} className="bg-white rounded-lg shadow-md border border-gray-100 p-3">
              {/* Title: avatar + name */}
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <FaUser className="text-gray-600" />
                </div>
                <div className="text-base font-semibold text-black">
                  {nameQuery
                    ? highlightMatch(user.name || 'unnamed user', nameQuery)
                    : (globalSearch
                        ? highlightMatch(user.name || 'unnamed user', globalSearch)
                        : (user.name || 'unnamed user'))}
                </div>
              </div>

              {/* Body: two columns with alignment */}
              <div className="grid grid-cols-[1.7fr_1fr] gap-1 text-xs">
                {/* Left: left-aligned with more spacing */}
                <div className="space-y-3 text-left pr-5 min-w-0">
                  <div>
                    <div className="text-gray-500">Email</div>
                    <div className="text-black flex items-center min-w-0 whitespace-nowrap overflow-hidden">
                      <FaEnvelope className="text-gray-500 mr-2 shrink-0" />
                      <span className="truncate">{globalSearch ? highlightMatch(user.email || 'No email', globalSearch) : (user.email || 'No email')}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Phone</div>
                    <div className="text-black flex items-center min-w-0 whitespace-nowrap overflow-hidden">
                      <FaPhone className="text-gray-500 mr-2 shrink-0" />
                      <span className="truncate">{globalSearch ? highlightMatch(user.phone || 'Not provided', globalSearch) : (user.phone || 'Not provided')}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Location</div>
                    <div className="text-black flex flex-col min-w-0">
                      {user.userAddress?.fullAddress ? (
                        <>
                          <div className="flex items-center">
                            <FaMapMarkerAlt className="mr-1 shrink-0 text-black" />
                            <span className="truncate">{user.userAddress.fullAddress}</span>
                          </div>
                          {user.location && (
                            <span className="text-xs text-blue-600 ml-5">📍 Zone: {user.location.area}, {user.location.city}</span>
                          )}
                        </>
                      ) : user.location ? (
                        <div className="flex items-center">
                          <FaMapMarkerAlt className={`mr-1 shrink-0 ${user.location.isActive ? 'text-black' : 'text-gray-400'}`} />
                          <span className="truncate">{user.location.area}, {user.location.city}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Not set</span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Right: right-aligned */}
                <div className="space-y-3 text-right min-w-0">
                  <div>
                    <div className="text-gray-500">Role</div>
                    <div className={`inline-flex items-center gap-1 ${user.role === 'admin' ? 'text-amber-700' : 'text-gray-800'}`}>
                      {user.role === 'admin' && <FaCrown className="text-amber-500" />}
                      <span>{user.role}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Joined</div>
                    <div className="text-black">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => viewUserDetails(user)}
                      className="p-2 rounded hover:bg-gray-100 text-blue-600 hover:text-blue-900"
                      aria-label="View"
                    >
                      <FaEye />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Daily Rewards Progress Bar */}
              {(() => {
                const currentMonthDays = calculateCurrentMonthDays(user.monthlyOrderDays);
                const progressPercent = Math.min((currentMonthDays / 10) * 100, 100);
                const isEligible = user.freeProductEligible && !user.freeProductUsed;
                const hasUsed = user.freeProductUsed;
                
                return (
                  <div className="mt-3 pt-3 border-t border-gray-100">
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
                );
              })()}
            </div>
          ))
        )}
      </div>
      
      {/* Comprehensive User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[999] pt-10">
          <div className="bg-white rounded-lg w-full max-w-[95vw] lg:max-w-7xl h-[calc(100vh-5rem)] shadow-2xl flex flex-col mx-4">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <FaUser className="text-xl text-blue-600" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedUser.name || 'User Details'}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaTimes className="text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                
                {loadingDetails ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading user details...</span>
                  </div>
                ) : userDetails ? (
                  <div className="space-y-8">
                    
                    {/* Basic Information Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* User Information */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <FaUser className="mr-2 text-blue-600" />
                          User Information
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Name:</span>
                            <span className="text-gray-900">{selectedUser.name || 'Not provided'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Email:</span>
                            <span className="text-gray-900">{selectedUser.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Phone:</span>
                            <span className="text-gray-900">{selectedUser.phone || 'Not provided'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Role:</span>
                            <span className={`${selectedUser.role === 'admin' ? 'text-amber-600 font-semibold' : 'text-gray-900'}`}>
                              {selectedUser.role === 'admin' && <FaCrown className="inline mr-1" />}
                              {selectedUser.role}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Joined:</span>
                            <span className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Location & Statistics */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <FaMapMarkerAlt className="mr-2 text-green-600" />
                          Location & Stats
                        </h4>
                        <div className="space-y-3">
                          {/* User's precise sublocation from Google */}
                          {selectedUser.userAddress?.fullAddress && (
                            <div>
                              <span className="font-medium text-gray-700">Precise Location:</span>
                              <p className="text-gray-900">{selectedUser.userAddress.fullAddress}</p>
                            </div>
                          )}
                          {selectedUser.location ? (
                            <>
                              <div>
                                <span className="font-medium text-gray-700">{selectedUser.userAddress?.fullAddress ? 'Delivery Zone:' : 'Area:'}</span>
                                <p className="text-gray-900">{selectedUser.location.area}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">City:</span>
                                <p className="text-gray-900">{selectedUser.location.city}, {selectedUser.location.pincode}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Status:</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                  selectedUser.location.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {selectedUser.location.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </>
                          ) : (
                            <p className="text-gray-500 italic">No delivery location set</p>
                          )}}
                          
                          {userDetails.userInfo && (
                            <>
                              <div className="pt-2 border-t border-gray-200">
                                <span className="font-medium text-gray-700">Total Orders:</span>
                                <span className="text-gray-900 ml-2">{userDetails.userInfo.totalOrders || 0}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Total Spent:</span>
                                <span className="text-gray-900 ml-2">₹{userDetails.userInfo.totalSpent || 0}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Average Order:</span>
                                <span className="text-gray-900 ml-2">₹{userDetails.userInfo.averageOrderValue || 0}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Orders Section */}
                    {userDetails.userInfo?.recentOrders && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <FaShoppingCart className="mr-2 text-purple-600" />
                          Recent Orders ({userDetails.userInfo.recentOrders.length})
                        </h4>
                        
                        {userDetails.userInfo.recentOrders.length > 0 ? (
                          <div className="space-y-4 max-h-64 overflow-y-auto">
                            {userDetails.userInfo.recentOrders.map((order) => (
                              <div key={order._id} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                      {order.cartItems && order.cartItems.length > 0 && (
                                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                          {order.cartItems.reduce((total, item) => total + item.quantity, 0)} items
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-gray-900">₹{order.amount}</p>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                      order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                                      order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      order.orderStatus === 'placed' ? 'bg-blue-100 text-blue-800' :
                                      order.orderStatus === 'out_for_delivery' ? 'bg-amber-100 text-amber-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {order.orderStatus}
                                    </span>
                                  </div>
                                </div>

                                {/* Product Items */}
                                {order.cartItems && order.cartItems.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-xs font-medium text-gray-700 mb-2">
                                      Products ({order.cartItems.length})
                                    </p>
                                    <div className="space-y-1">
                                      {order.cartItems.map((item, index) => (
                                        <div key={index} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-2">
                                          {/* Product Image */}
                                          <div className="flex-shrink-0">
                                            {item.productId?.images?.[0] ? (
                                              <img 
                                                src={item.productId.images[0]} 
                                                alt={item.productName}
                                                className="w-10 h-10 rounded-md object-cover border border-gray-200"
                                                onError={(e) => {
                                                  e.target.src = '/placeholder-image.png';
                                                  e.target.onerror = null;
                                                }}
                                              />
                                            ) : (
                                              <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center">
                                                <FaShoppingCart className="text-gray-400 text-xs" />
                                              </div>
                                            )}
                                          </div>
                                          
                                          {/* Product Details */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                              <p className="text-sm font-medium text-gray-900 truncate">
                                                {item.productName || 'Product'}
                                              </p>
                                              <span className="text-sm font-semibold text-gray-900 ml-2">
                                                ₹{item.price}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-600">
                                              <span>Qty: {item.quantity}</span>
                                              {item.variantLabel && (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                  {item.variantLabel}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="text-sm text-gray-600 space-y-1">
                                  {order.deliveryLocation && (
                                    <p>
                                      <FaMapMarkerAlt className="inline mr-1" />
                                      {order.deliveryLocation}
                                    </p>
                                  )}
                                  {order.hostelName && (
                                    <p className="text-xs text-gray-500">Hostel: {order.hostelName}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No orders found</p>
                        )}
                      </div>
                    )}

                    {/* Secondary Information Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Contact Messages */}
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <FaComment className="mr-2 text-orange-600" />
                          Contact Messages
                        </h4>
                        
                        {userDetails.contacts && userDetails.contacts.length > 0 ? (
                          <div className="space-y-3 max-h-48 overflow-y-auto">
                            {userDetails.contacts.map((contact, index) => (
                              <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-sm font-medium text-gray-900">{contact.subject || 'No Subject'}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {new Date(contact.createdAt).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                                  {contact.message?.substring(0, 100)}...
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No contact messages</p>
                        )}
                      </div>

                      {/* Newsletter & Loyalty */}
                      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <FaNewspaper className="mr-2 text-teal-600" />
                          Newsletter & Loyalty
                        </h4>
                        
                        <div className="space-y-4">
                          {/* Newsletter Status */}
                          <div>
                            <p className="text-sm font-medium text-gray-700">Newsletter Status:</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              userDetails.newsletter?.subscribed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {userDetails.newsletter?.subscribed ? 'Subscribed' : 'Not Subscribed'}
                            </span>
                            {userDetails.newsletter?.subscribedAt && (
                              <p className="text-xs text-gray-600 mt-1">
                                Since: {new Date(userDetails.newsletter.subscribedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          {/* Loyalty Status */}
                          {userDetails.loyalty && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">Monthly Rewards:</p>
                              <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>Days this month:</span>
                                  <span className="font-medium">{userDetails.loyalty.uniqueDaysCount}/10</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${Math.min((userDetails.loyalty.uniqueDaysCount / 10) * 100, 100)}%` }}
                                  ></div>
                                </div>
                                {userDetails.loyalty.freeProductEligible && (
                                  <p className="text-xs text-green-600 font-medium">Eligible for free product!</p>
                                )}
                                {userDetails.loyalty.freeProductClaimed && (
                                  <p className="text-xs text-blue-600 font-medium">Free product claimed</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaExclamationTriangle className="text-gray-400 text-3xl mb-3 mx-auto" />
                    <p className="text-gray-600">Failed to load user details. Please try again.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminUsers;
