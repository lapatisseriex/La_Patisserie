import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  Eye,
  Search
} from 'lucide-react';

const AdminDonations = () => {
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    paymentMethod: '',
    paymentStatus: '',
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Responsive rendering
  const [useTableView, setUseTableView] = useState(true);
  const listWidthRef = useRef(null);

  const fetchDonations = async (page = 1) => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication required');
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/donations/admin/all?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`}}
      );

      if (!response.ok) {
        throw new Error('Failed to fetch donations');
      }

      const data = await response.json();
      if (data.success) {
        setDonations(data.data.donations);
        setTotalPages(data.data.pagination.pages);
        setCurrentPage(data.data.pagination.page);
      } else {
        throw new Error(data.message || 'Failed to fetch donations');
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;

      const queryParams = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      );

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/donations/admin/stats?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`}}
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching donation stats:', error);
    }
  };

  const exportDonations = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      );

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/donations/admin/export?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`}}
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `donations-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting donations:', error);
    }
  };

  useEffect(() => {
    fetchDonations(currentPage);
    fetchStats();
  }, [filters, currentPage]);

  // Decide between table or cards based on available width/overflow
  useEffect(() => {
    const decide = () => {
      const el = listWidthRef.current;
      if (window.innerWidth < 1024) {
        setUseTableView(false);
        return;
      }
      const estimatedRequired = 1100; // columns + padding heuristic
      if (el && el.clientWidth < estimatedRequired) {
        setUseTableView(false);
      } else {
        setUseTableView(true);
      }
    };
    decide();
    window.addEventListener('resize', decide);
    return () => window.removeEventListener('resize', decide);
  }, [donations, filters, currentPage]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      paymentMethod: '',
      paymentStatus: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
  };

  if (loading && !donations.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#733857]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pt-16 md:pt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <div className="min-w-0">
          <h1 className="pl-4 md:pl-2 text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="text-[#733857]" />
            Education Initiative Donations
          </h1>
          <p className="pl-4 md:pl-2 text-gray-600 mt-1">கற்பிப்போம் பயிலகம் - Supporting Student Education</p>
        </div>
        <div className="md:self-auto self-start pl-4 md:pl-2">
          <button
            onClick={exportDonations}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#733857] to-[#8d4466] text-white rounded-lg hover:shadow-md hover:brightness-105 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#733857] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <Download className="h-4 w-4" />
            <span className="font-semibold tracking-wide">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-6 shadow-md border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Donations</p>
                <p className="text-2xl font-bold text-[#733857]">
                  ₹{stats.overallStats?.overall?.totalAmount?.toLocaleString() || 0}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-[#733857]" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-6 shadow-md border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contributors</p>
                <p className="text-2xl font-bold text-[#8d4466]">
                  {stats.overallStats?.overall?.donationCount || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-[#8d4466]" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-6 shadow-md border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Donation</p>
                <p className="text-2xl font-bold text-[#412434]">
                  ₹{Math.round(stats.overallStats?.overall?.avgDonation) || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#412434]" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-6 shadow-md border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.dailyTrends?.length || 0} days
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 items-end">
          <div className="min-w-[220px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Name, email, or order..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#733857]"
              />
            </div>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#733857]"
            >
              <option value="">All Methods</option>
              <option value="cod">Cash on Delivery</option>
              <option value="razorpay">Online Payment</option>
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#733857]"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#733857]"
            />
          </div>
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#733857]"
            />
          </div>
          <div className="sm:col-span-2 xl:col-span-1 flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => fetchDonations(currentPage)}
              className="mt-4 px-4 py-2 bg-[#733857] text-white rounded-lg hover:bg-[#8d4466] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : donations.length === 0 ? (
          <div className="p-8 text-center">
            <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Donations Found</h3>
            <p className="text-gray-600">No donations match your current filters.</p>
          </div>
        ) : (
          <div ref={listWidthRef} className="w-full">
            {useTableView ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {donations.map((donation) => (
                      <motion.tr key={donation._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-[#f7eef3] flex items-center justify-center">
                                <span className="text-sm font-medium text-[#733857]">{donation.userName?.charAt(0)?.toUpperCase() || 'U'}</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{donation.userName || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{donation.userEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-lg font-bold text-[#733857]">₹{donation.donationAmount}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">#{donation.orderNumber}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium capitalize text-gray-900">{donation.paymentMethod}</span>
                            <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${donation.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{donation.paymentStatus}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(donation.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">{donation.deliveryLocation}</div>
                          {donation.hostelName && (<div className="text-xs text-blue-600 font-medium">🏠 {donation.hostelName}</div>)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                {donations.map((donation) => (
                  <motion.div key={donation._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-[#f7eef3] flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-[#733857]">{donation.userName?.charAt(0)?.toUpperCase() || 'U'}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{donation.userName || 'Unknown'}</div>
                          <div className="text-xs text-gray-500 truncate">{donation.userEmail}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-[#733857]">₹{donation.donationAmount}</div>
                        <div className="text-xs text-gray-500">#{donation.orderNumber}</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-700">
                      <div><span className="text-gray-500">Payment:</span> <span className="font-medium capitalize">{donation.paymentMethod}</span></div>
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${donation.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{donation.paymentStatus}</span>
                      </div>
                      <div><span className="text-gray-500">Date:</span> {new Date(donation.createdAt).toLocaleDateString()}</div>
                      <div className="truncate"><span className="text-gray-500">Location:</span> <span className="font-medium">{donation.deliveryLocation}</span></div>
                      {donation.hostelName && (
                        <div className="col-span-2 text-blue-700 font-medium">🏠 {donation.hostelName}</div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDonations;