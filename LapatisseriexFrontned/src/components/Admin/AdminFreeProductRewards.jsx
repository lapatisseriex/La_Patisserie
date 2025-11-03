import React, { useState, useEffect } from 'react';
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
  const [viewMode, setViewMode] = useState('claims'); // 'claims' or 'all-users'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'eligible', 'used', 'progress'

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#412434] mb-2">
            🎁 Free Product Rewards Dashboard
          </h1>
          <p className="text-[#733857]">
            Track user rewards, claims, and monthly progress
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          <div className="flex flex-col md:flex-row gap-4">
            {/* Month Filter - Only for Claims view */}
            {viewMode === 'claims' && (
              <div className="flex-1">
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
              <div className="flex-1">
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
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#733857] mb-2">
                Search by Email
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="user@example.com"
                  className="flex-1 px-4 py-2 border border-[#d9c4cd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#733857]"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-gradient-to-r from-[#733857] to-[#8d4466] text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <FaSearch />
                </button>
              </div>
            </div>

            {/* Export */}
            <div className="flex items-end">
              <button
                onClick={exportToCSV}
                disabled={claims.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-[#8d4466] to-[#a05577] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    <tr
                      key={index}
                      className="hover:bg-[#f9f4f6] transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-[#412434]">
                        {claim.userName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#733857]">
                        {claim.userEmail}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[#412434]">
                        {claim.productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#733857]">
                        {new Date(claim.claimedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#733857]">
                        {claim.month}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-[#733857]">
                        {claim.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <button
                          onClick={() => fetchUserDetails(claim.userId)}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f7eef3] text-[#733857] hover:bg-[#733857] hover:text-white transition-colors cursor-pointer"
                        >
                          {claim.currentOrderDays} days 👁️
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {claim.currentEligible ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Eligible
                          </span>
                        ) : claim.currentUsed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Used
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#733857] to-[#8d4466] text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Current Days</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Days Remaining</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Last Claim</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Total Claims</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#733857]"></div>
                        <span className="ml-3 text-[#733857]">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : allUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-[#733857]">
                      No users found
                    </td>
                  </tr>
                ) : (
                  allUsers.map((user, index) => (
                    <tr
                      key={index}
                      className="hover:bg-[#f9f4f6] transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-[#412434]">
                        {user.userName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#733857]">
                        {user.userEmail}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <button
                          onClick={() => fetchUserDetails(user.userId)}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f7eef3] text-[#733857] hover:bg-[#733857] hover:text-white transition-colors cursor-pointer"
                        >
                          {user.currentOrderDays}/10 days
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-[#733857]">
                        {user.daysRemaining} days
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {user.status === 'eligible' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Eligible
                          </span>
                        ) : user.status === 'used' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Used
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            In Progress
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#733857]">
                        {user.lastClaim ? (
                          <div>
                            <div className="font-medium">{user.lastClaim.productName}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(user.lastClaim.claimedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {user.totalClaims}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                  <h3 className="text-lg font-bold text-[#412434] mb-3 flex items-center gap-2">
                    <FaCalendarAlt className="text-[#733857]" />
                    Current Month Progress ({selectedUser.currentStatus.currentMonth})
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gradient-to-br from-[#f7eef3] to-[#f9f4f6] rounded-lg p-4 border border-[#733857]/10">
                      <p className="text-sm text-[#733857] font-medium">Order Days</p>
                      <p className="text-2xl font-bold text-[#412434]">
                        {selectedUser.currentStatus.orderDaysThisMonth}/10
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-[#f7eef3] to-[#f9f4f6] rounded-lg p-4 border border-[#733857]/10">
                      <p className="text-sm text-[#733857] font-medium">Days Remaining</p>
                      <p className="text-2xl font-bold text-[#412434]">
                        {selectedUser.currentStatus.daysRemaining}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Eligible</p>
                      <p className="font-bold text-sm">
                        {selectedUser.currentStatus.eligible ? (
                          <span className="text-green-600">✓ Yes</span>
                        ) : (
                          <span className="text-gray-500">✗ No</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Used</p>
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
