import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaGift, FaCalendarAlt, FaUser, FaTrophy, FaSearch, FaDownload } from 'react-icons/fa';
import apiClient from '../../services/apiService';

const AdminFreeProductRewards = () => {
  const [stats, setStats] = useState(null);
  const [claims, setClaims] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [viewMode, setViewMode] = useState('all-users'); // 'claims' or 'all-users' - default to all-users to show progress
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'eligible', 'used', 'progress'
  // Responsive list rendering
  const [useTableView, setUseTableView] = useState(true);
  const listWidthRef = useRef(null);

  // Generate month options for filter
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value: monthKey, label: monthLabel });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  useEffect(() => {
    fetchStats();
    if (viewMode === 'claims') {
      fetchClaims();
    } else {
      fetchAllUsers();
    }
  }, [selectedMonth, currentPage, viewMode, statusFilter]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/free-product-claims/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20
      };
      if (selectedMonth) {
        params.month = selectedMonth;
      }
      
      const response = await apiClient.get('/admin/free-product-claims', { params });
      if (response.data.success) {
        setClaims(response.data.data.claims);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await apiClient.get('/admin/free-product-claims/all-users', { params });
      if (response.data.success) {
        setAllUsers(response.data.data.users);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Decide between table or card view based on available width / potential overflow
  useEffect(() => {
    const decideView = () => {
      const el = listWidthRef.current;
      // Prefer cards on smaller screens
      if (window.innerWidth < 1024) {
        setUseTableView(false);
        return;
      }
      // Heuristic required width per view
      const estimatedWidth = viewMode === 'claims'
        ? 1200 /* 8 columns with padding */
        : 1150 /* 7 columns with padding */;
      if (el && el.clientWidth < estimatedWidth) {
        setUseTableView(false);
      } else {
        setUseTableView(true);
      }
    };
    decideView();
    window.addEventListener('resize', decideView);
    return () => window.removeEventListener('resize', decideView);
  }, [viewMode, claims, allUsers, currentPage, selectedMonth, statusFilter]);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    
    try {
      setLoading(true);
      // Search by email - filter claims
      const filtered = claims.filter(claim => 
        claim.userEmail.toLowerCase().includes(searchEmail.toLowerCase())
      );
      setClaims(filtered);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['User Name', 'Email', 'Product', 'Claimed Date', 'Month', 'Order Number', 'Current Days'];
    const rows = claims.map(claim => [
      claim.userName,
      claim.userEmail,
      claim.productName,
      new Date(claim.claimedAt).toLocaleDateString(),
      claim.month,
      claim.orderNumber,
      claim.currentOrderDays
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `free-product-claims-${selectedMonth || 'all'}.csv`;
    a.click();
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await apiClient.get(`/admin/free-product-claims/user/${userId}`);
      if (response.data.success) {
        setSelectedUser(response.data.data);
        setShowUserDetails(true);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${color} rounded-xl p-6 shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-white text-3xl font-bold mb-2">{value}</h3>
          {subtitle && <p className="text-white/70 text-xs">{subtitle}</p>}
        </div>
        <div className="bg-white/20 p-3 rounded-lg">
          <Icon className="text-white text-2xl" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="pt-16 md:pt-2 mb-8">
          <h1 className="text-3xl font-bold text-[#412434] mb-2">
            Free Product Rewards Dashboard
          </h1>
          <p className="text-[#733857]">
            Track user rewards, claims, and monthly progress
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={FaTrophy}
              title="Total Claims (All Time)"
              value={stats.totalUsersWithClaims}
              subtitle="Users who have claimed"
              color="from-[#733857] to-[#8d4466]"
            />
            <StatCard
              icon={FaGift}
              title="Claims This Month"
              value={stats.claimsThisMonth}
              subtitle={stats.currentMonth}
              color="from-[#8d4466] to-[#a05577]"
            />
            <StatCard
              icon={FaCalendarAlt}
              title="Currently Eligible"
              value={stats.currentlyEligible}
              subtitle="Can claim now"
              color="from-[#a05577] to-[#b36688]"
            />
            <StatCard
              icon={FaUser}
              title="Users With Progress"
              value={stats.usersWithProgress}
              subtitle="Working toward reward"
              color="from-[#b36688] to-[#c67799]"
            />
          </div>
        )}

        {/* Top Products */}
        {stats?.topClaimedProducts && stats.topClaimedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-md p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-[#412434] mb-4">
              🏆 Most Claimed Products This Month
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.topClaimedProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#f7eef3] to-[#f9f4f6] rounded-lg border border-[#d9c4cd]"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#733857] to-[#8d4466] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#412434] truncate">
                      {product.productName}
                    </p>
                    <p className="text-sm text-[#733857]">
                      {product.claimCount} {product.claimCount === 1 ? 'claim' : 'claims'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filters and Search */}
  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          {/* View Mode Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => {
                  setViewMode('claims');
                  setCurrentPage(1);
                }}
                className={`px-6 py-3 font-semibold transition-all ${
                  viewMode === 'claims'
                    ? 'text-[#733857] border-b-2 border-[#733857]'
                    : 'text-gray-500 hover:text-[#733857]'
                }`}
              >
                Claims History
              </button>
              <button
                onClick={() => {
                  setViewMode('all-users');
                  setCurrentPage(1);
                }}
                className={`px-6 py-3 font-semibold transition-all ${
                  viewMode === 'all-users'
                    ? 'text-[#733857] border-b-2 border-[#733857]'
                    : 'text-gray-500 hover:text-[#733857]'
                }`}
              >
                All Users Status
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
            {/* Month Filter - Only for Claims view */}
            {viewMode === 'claims' && (
              <div className="min-w-[240px]">
                <label className="block text-sm font-medium text-[#733857] mb-2">
                  Filter by Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-[#d9c4cd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#733857]"
                >
                  <option value="">All Months</option>
                  {monthOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter - Only for All Users view */}
            {viewMode === 'all-users' && (
              <div className="min-w-[240px]">
                <label className="block text-sm font-medium text-[#733857] mb-2">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-[#d9c4cd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#733857]"
                >
                  <option value="all">All Users</option>
                  <option value="eligible">Eligible (Not Used)</option>
                  <option value="used">Used This Month</option>
                  <option value="progress">In Progress</option>
                </select>
              </div>
            )}

            {/* Search */}
            <div className="min-w-[260px] md:col-span-2 xl:col-span-1">
              <label className="block text-sm font-medium text-[#733857] mb-2">
                Search by Email
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="user@example.com"
                  className="min-w-0 flex-1 px-4 py-2 border border-[#d9c4cd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#733857]"
                />
                <button
                  onClick={handleSearch}
                  className="shrink-0 px-4 py-2 bg-gradient-to-r from-[#733857] to-[#8d4466] text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <FaSearch />
                </button>
              </div>
            </div>

            {/* Export */}
            <div className="flex items-end md:col-span-2 xl:col-span-1 justify-self-start xl:justify-self-end min-w-[180px]">
              <button
                onClick={exportToCSV}
                disabled={claims.length === 0}
                className="w-full md:w-auto px-6 py-2 bg-gradient-to-r from-[#8d4466] to-[#a05577] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FaDownload />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Claims Table - Only show when viewMode is 'claims' */}
        {viewMode === 'claims' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div ref={listWidthRef} className="p-0">
            {useTableView ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#733857] to-[#8d4466] text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Product</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Claimed Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Month</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Order #</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Current Days</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#733857]"></div>
                            <span className="ml-3 text-[#733857]">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : claims.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-[#733857]">
                          No claims found for the selected criteria
                        </td>
                      </tr>
                    ) : (
                      claims.map((claim, index) => (
                        <tr key={index} className="hover:bg-[#f9f4f6] transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-[#412434]">{claim.userName || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-[#733857]">{claim.userEmail}</td>
                          <td className="px-6 py-4 text-sm font-medium text-[#412434]">{claim.productName}</td>
                          <td className="px-6 py-4 text-sm text-[#733857]">
                            {new Date(claim.claimedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-sm text-[#733857]">{claim.month}</td>
                          <td className="px-6 py-4 text-sm font-mono text-[#733857]">{claim.orderNumber}</td>
                          <td className="px-6 py-4 text-sm text-center">
                            <button onClick={() => fetchUserDetails(claim.userId)} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f7eef3] text-[#733857] hover:bg-[#733857] hover:text-white transition-colors cursor-pointer">
                              {claim.currentOrderDays} days 👁️
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {claim.currentEligible ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Eligible</span>
                            ) : claim.currentUsed ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Used</span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Progress</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {loading ? (
                  <div className="col-span-full px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#733857]"></div>
                      <span className="ml-3 text-[#733857]">Loading...</span>
                    </div>
                  </div>
                ) : claims.length === 0 ? (
                  <div className="col-span-full px-6 py-12 text-center text-[#733857]">No claims found for the selected criteria</div>
                ) : (
                  claims.map((claim, index) => (
                    <div key={index} className="p-4 sm:p-5 border border-gray-100 rounded-lg hover:bg-[#f9f4f6] transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#412434] truncate">{claim.userName || 'N/A'}</div>
                          <div className="text-xs text-[#733857] truncate">{claim.userEmail}</div>
                        </div>
                        <div>
                          {claim.currentEligible ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Eligible</span>
                          ) : claim.currentUsed ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Used</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Progress</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#733857]">
                        <div><span className="text-gray-500">Product:</span> <span className="font-medium text-[#412434]">{claim.productName}</span></div>
                        <div><span className="text-gray-500">Month:</span> <span className="font-medium">{claim.month}</span></div>
                        <div><span className="text-gray-500">Claimed:</span> {new Date(claim.claimedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="font-mono"><span className="text-gray-500">Order #:</span> {claim.orderNumber}</div>
                      </div>
                      <div className="mt-3">
                        <button onClick={() => fetchUserDetails(claim.userId)} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#f7eef3] text-[#733857] hover:bg-[#733857] hover:text-white transition-colors">
                          {claim.currentOrderDays} days 👁️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-[#733857]">
                Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-[#d9c4cd] rounded-lg text-[#733857] hover:bg-[#f7eef3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 border border-[#d9c4cd] rounded-lg text-[#733857] hover:bg-[#f7eef3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* All Users Table - Only show when viewMode is 'all-users' */}
        {viewMode === 'all-users' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div ref={listWidthRef} className="p-0">
            {useTableView ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#733857] to-[#8d4466] text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Progress</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Remaining</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Last Claim</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Total</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#733857]"></div>
                            <span className="ml-3 text-[#733857]">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : allUsers.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-[#733857]">No users found</td>
                      </tr>
                    ) : (
                      allUsers.map((user, index) => {
                        const progressPercent = Math.min((user.currentOrderDays / 10) * 100, 100);
                        const isEligible = user.status === 'eligible';
                        const hasUsed = user.status === 'used';
                        
                        return (
                        <tr key={index} className="hover:bg-[#f9f4f6] transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-[#412434]">{user.userName || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-[#733857]">{user.userEmail}</td>
                          <td className="px-6 py-4">
                            <div className="w-28">
                              <div className="flex items-center justify-between mb-1">
                                <FaGift className={`text-xs ${isEligible ? 'text-green-500' : hasUsed ? 'text-blue-500' : 'text-rose-400'}`} />
                                <span className={`text-xs font-semibold ${isEligible ? 'text-green-600' : hasUsed ? 'text-blue-600' : 'text-[#733857]'}`}>
                                  {user.currentOrderDays}/10
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${isEligible ? 'bg-green-500' : hasUsed ? 'bg-blue-500' : 'bg-gradient-to-r from-[#733857] to-[#a05577]'}`}
                                  style={{ width: `${progressPercent}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {user.daysRemaining} days
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {isEligible ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">✨ Eligible</span>
                            ) : hasUsed ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">✓ Claimed</span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">⏳ In Progress</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-[#733857]">
                            {user.lastClaim ? (
                              <div>
                                <div className="font-medium text-[#412434]">{user.lastClaim.productName}</div>
                                <div className="text-xs text-gray-500">{new Date(user.lastClaim.claimedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Never claimed</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">{user.totalClaims}</span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button onClick={() => fetchUserDetails(user.userId)} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[#733857] text-white hover:bg-[#5a2a44] transition-colors">
                              View 👁️
                            </button>
                          </td>
                        </tr>
                      )})
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                {loading ? (
                  <div className="col-span-full px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#733857]"></div>
                      <span className="ml-3 text-[#733857]">Loading...</span>
                    </div>
                  </div>
                ) : allUsers.length === 0 ? (
                  <div className="col-span-full px-6 py-12 text-center text-[#733857]">No users found</div>
                ) : (
                  allUsers.map((user, index) => {
                    const progressPercent = Math.min((user.currentOrderDays / 10) * 100, 100);
                    const isEligible = user.status === 'eligible';
                    const hasUsed = user.status === 'used';
                    
                    return (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                      {/* Card Header */}
                      <div className="p-4 bg-gradient-to-r from-[#f7eef3] to-[#f9f4f6] border-b border-gray-100">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-[#412434] truncate">{user.userName || 'N/A'}</div>
                            <div className="text-xs text-[#733857] truncate">{user.userEmail}</div>
                          </div>
                          {isEligible ? (
                            <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">✨ Eligible</span>
                          ) : hasUsed ? (
                            <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">✓ Claimed</span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">⏳ Progress</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Section */}
                      <div className="p-4">
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FaGift className={`text-sm ${isEligible ? 'text-green-500' : hasUsed ? 'text-blue-500' : 'text-[#733857]'}`} />
                              <span className="text-xs font-medium text-gray-600">Monthly Progress</span>
                            </div>
                            <span className={`text-sm font-bold ${isEligible ? 'text-green-600' : hasUsed ? 'text-blue-600' : 'text-[#733857]'}`}>
                              {user.currentOrderDays}/10 days
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full transition-all ${isEligible ? 'bg-green-500' : hasUsed ? 'bg-blue-500' : 'bg-gradient-to-r from-[#733857] to-[#a05577]'}`}
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-gray-400">{user.daysRemaining} days remaining</span>
                            <span className="text-[10px] text-gray-400">{user.totalClaims} total claims</span>
                          </div>
                        </div>
                        
                        {/* Last Claim */}
                        <div className="text-xs border-t border-gray-100 pt-3 mt-2">
                          <span className="text-gray-500">Last Claim:</span>
                          {user.lastClaim ? (
                            <div className="mt-1 flex items-center gap-2">
                              <span className="font-medium text-[#412434]">{user.lastClaim.productName}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500">{new Date(user.lastClaim.claimedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          ) : (
                            <span className="ml-1 text-gray-400 italic">Never claimed</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Card Footer */}
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                        <button onClick={() => fetchUserDetails(user.userId)} className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-medium bg-[#733857] text-white hover:bg-[#5a2a44] transition-colors">
                          View Details 👁️
                        </button>
                      </div>
                    </div>
                  )})
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-[#733857]">
                Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-[#d9c4cd] rounded-lg text-[#733857] hover:bg-[#f7eef3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 border border-[#d9c4cd] rounded-lg text-[#733857] hover:bg-[#f7eef3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUserDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#733857] to-[#8d4466] p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {selectedUser.user.name}
                    </h2>
                    <p className="text-white/80 text-sm">{selectedUser.user.email}</p>
                  </div>
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Current Status */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-[#412434] mb-4 flex items-center gap-2">
                    <FaCalendarAlt className="text-[#733857]" />
                    Current Month Progress ({selectedUser.currentStatus.currentMonth})
                  </h3>
                  
                  {/* Visual Progress Bar */}
                  {(() => {
                    const progressPercent = Math.min((selectedUser.currentStatus.orderDaysThisMonth / 10) * 100, 100);
                    const isEligible = selectedUser.currentStatus.eligible;
                    const hasUsed = selectedUser.currentStatus.used;
                    
                    return (
                      <div className="bg-gradient-to-br from-[#f7eef3] to-[#f9f4f6] rounded-xl p-5 border border-[#733857]/20 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FaGift className={`text-xl ${isEligible ? 'text-green-500' : hasUsed ? 'text-blue-500' : 'text-[#733857]'}`} />
                            <span className="font-semibold text-[#412434]">Daily Rewards Progress</span>
                          </div>
                          <span className={`text-2xl font-bold ${isEligible ? 'text-green-600' : hasUsed ? 'text-blue-600' : 'text-[#733857]'}`}>
                            {selectedUser.currentStatus.orderDaysThisMonth}/10
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                          <div 
                            className={`h-4 rounded-full transition-all ${isEligible ? 'bg-gradient-to-r from-green-400 to-green-600' : hasUsed ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-[#733857] to-[#a05577]'}`}
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0 days</span>
                          <span className="font-medium">{selectedUser.currentStatus.daysRemaining} days remaining</span>
                          <span>10 days</span>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`rounded-lg p-3 border-2 ${selectedUser.currentStatus.eligible ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                      <p className="text-xs text-gray-600 mb-1">Eligible</p>
                      <p className="font-bold text-sm">
                        {selectedUser.currentStatus.eligible ? (
                          <span className="text-green-600">✓ Yes</span>
                        ) : (
                          <span className="text-gray-500">✗ No</span>
                        )}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 border-2 ${selectedUser.currentStatus.used ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                      <p className="text-xs text-gray-600 mb-1">Claimed</p>
                      <p className="font-bold text-sm">
                        {selectedUser.currentStatus.used ? (
                          <span className="text-blue-600">✓ Yes</span>
                        ) : (
                          <span className="text-gray-500">✗ No</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Last Reward</p>
                      <p className="font-bold text-sm text-[#733857]">
                        {selectedUser.currentStatus.lastRewardMonth || 'None'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Dates - This is what you requested */}
                {selectedUser.currentStatus.orderDaysThisMonth > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-[#412434] mb-3 flex items-center gap-2">
                      📅 Order Dates This Month
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Showing {selectedUser.currentStatus.totalOrderEntries} total order entries on {selectedUser.currentStatus.orderDaysThisMonth} unique days
                    </p>
                    <div className="bg-gradient-to-br from-[#f7eef3] to-[#f9f4f6] rounded-lg p-4 border border-[#733857]/20">
                      {selectedUser.currentStatus.orderDates && selectedUser.currentStatus.orderDates.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {selectedUser.currentStatus.orderDates.map((dateObj, idx) => (
                            <div
                              key={idx}
                              className="text-center text-sm text-[#733857] font-medium bg-white rounded-md p-2 border border-[#733857]/10"
                            >
                              {dateObj.formatted}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-sm text-[#733857] font-medium bg-white rounded-md p-2 border border-[#733857]/10">
                          {selectedUser.currentStatus.orderDaysThisMonth} unique days recorded
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Claim History */}
                {selectedUser.claimHistory && selectedUser.claimHistory.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-[#412434] mb-3 flex items-center gap-2">
                      <FaTrophy className="text-[#733857]" />
                      Claim History
                    </h3>
                    <div className="space-y-3">
                      {selectedUser.claimHistory.map((claim, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-[#412434]">{claim.productName}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(claim.claimedAt).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">{claim.month}</p>
                              {claim.orderNumber && (
                                <p className="text-xs font-mono text-[#733857]">#{claim.orderNumber}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminFreeProductRewards;
