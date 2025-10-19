import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUser, FaPhone, FaMapMarkerAlt, FaCrown, FaExclamationTriangle, FaEye, FaFilter, FaEnvelope, FaBell, FaTimes, FaSyncAlt } from 'react-icons/fa';
import { useLocation as useLocationContext } from '../../context/LocationContext/LocationContext';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
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
  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
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
    let rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Remove /api or any path from the URL to get base server URL
    const apiUrl = rawApiUrl.replace(/\/api.*$/, '');
    
    console.log('%c🔌 WebSocket Connection (Users Page)', 'color: #733857; font-weight: bold; font-size: 14px');
    console.log('📍 Connecting to:', apiUrl);
    console.log('⏰ Time:', new Date().toLocaleTimeString());
    
    const socket = io(apiUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true
    });
    
    socket.on('connect', () => {
      console.log('%c✅ WebSocket CONNECTED (Users Page)', 'color: green; font-weight: bold; font-size: 14px');
      console.log('🆔 Socket ID:', socket.id);
      setWsConnected(true);
      setWsSocketId(socket.id);
      toast.success('Live user updates connected!', {
        duration: 3000,
        icon: '🔌',
      });
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
        icon: '👤',
      });
    });

    // Cleanup on unmount
    return () => {
      console.log('%c🔌 Cleaning up WebSocket (Users Page)', 'color: gray');
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
      d: String(dt.getDate()).padStart(2, '0'),
    };
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
    <div className="container mx-auto pl-8 pr-4 py-6 pt-8 font-sans overflow-x-hidden min-w-0">
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
      <div className="mb-2 md:mb-4 flex items-center justify-between">
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

      {/* Desktop table (md+) with its own vertical scroller */}
      <div className="hidden md:block bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
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

      {/* Mobile cards (<md) */}
      <div className="md:hidden space-y-3">
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
                    <div className="text-black flex items-center min-w-0">
                      {user.location ? (
                        <>
                          <FaMapMarkerAlt className={`mr-1 shrink-0 ${user.location.isActive ? 'text-black' : 'text-gray-400'}`} />
                          <span className="truncate">{user.location.area}, {user.location.city}</span>
                        </>
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
            </div>
          ))
        )}
      </div>
      
      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[999] pt-24 md:pt-28">
          <div className="bg-white rounded-lg w-full max-w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] shadow-2xl flex flex-col mx-4 sm:mx-6 md:mx-8 lg:mx-10">

            {/* Header / padding wrapper */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 md:p-8 lg:p-10">
                <h3 className="text-lg font-bold text-black mb-6 md:mb-4 flex items-center">
                  <FaUser className="mr-2" />
                  User Details
                </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-bold text-black mb-2">Basic Information</h4>
                <div className="bg-gray-100 rounded-md p-4">
                  <p className="mb-2">
                    <span className="font-bold">Name:</span> <span className="font-normal break-words">{selectedUser.name || 'Not provided'}</span>
                  </p>
                  <p className="mb-2">
                    <span className="font-bold">Phone:</span> <span className="font-normal break-words">{selectedUser.phone || 'Not provided'}</span>
                  </p>
                  <p className="mb-2">
                    <span className="font-bold">Email:</span> <span className="font-normal break-words">{selectedUser.email || 'Not provided'}</span>
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
                        <div className="min-w-0">
                          <p className="font-bold break-words">{selectedUser.location.area}</p>
                          <p className="font-normal break-words">{selectedUser.location.city}, {selectedUser.location.pincode}</p>
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
          </div>
        </div>
      )}

      <style jsx>{`
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
