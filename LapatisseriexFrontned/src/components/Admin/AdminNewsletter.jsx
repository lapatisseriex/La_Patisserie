import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaEnvelope, 
  FaExclamationTriangle, 
  FaFilter, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaPaperPlane,
  FaUserCheck,
  FaUserTimes,
  FaTimes,
  FaChartLine
} from 'react-icons/fa';

const AdminNewsletter = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  
  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  
  // Newsletter form
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterTitle, setNewsletterTitle] = useState('');
  const [newsletterBody, setNewsletterBody] = useState('');
  const [newsletterCtaText, setNewsletterCtaText] = useState('');
  const [newsletterCtaLink, setNewsletterCtaLink] = useState('');
  const [sending, setSending] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL;
  
  // Fetch subscribers
  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (statusFilter) params.set('status', statusFilter);
      
      const response = await axios.get(
        `${API_URL}/newsletter/admin/subscribers?${params.toString()}`,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      setSubscribers(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotalSubscribers(response.data.pagination.totalSubscribers);
      setError(null);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
      setError('Failed to load subscribers. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch statistics
  const fetchStats = async () => {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      const response = await axios.get(
        `${API_URL}/newsletter/admin/stats`,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };
  
  // Add subscriber
  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      await axios.post(
        `${API_URL}/newsletter/admin/add`,
        { email: newEmail },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      setSuccess('Subscriber added successfully!');
      setNewEmail('');
      setShowAddModal(false);
      fetchSubscribers();
      fetchStats();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add subscriber');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Update subscriber
  const handleUpdateSubscriber = async (e) => {
    e.preventDefault();
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      await axios.put(
        `${API_URL}/newsletter/admin/${selectedSubscriber._id}`,
        { email: editEmail, status: editStatus },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      setSuccess('Subscriber updated successfully!');
      setShowEditModal(false);
      setSelectedSubscriber(null);
      fetchSubscribers();
      fetchStats();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update subscriber');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Delete subscriber
  const handleDeleteSubscriber = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscriber?')) return;
    
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      await axios.delete(
        `${API_URL}/newsletter/admin/${id}`,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      setSuccess('Subscriber deleted successfully!');
      fetchSubscribers();
      fetchStats();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete subscriber');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Send newsletter
  const handleSendNewsletter = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Send newsletter to all ${stats?.activeSubscribers || 0} active subscribers?`)) return;
    
    setSending(true);
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      const response = await axios.post(
        `${API_URL}/newsletter/admin/send`,
        {
          subject: newsletterSubject,
          title: newsletterTitle,
          body: newsletterBody,
          ctaText: newsletterCtaText,
          ctaLink: newsletterCtaLink
        },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      setSuccess(`Newsletter sent to ${response.data.data.sent} subscribers!`);
      setShowSendModal(false);
      // Reset form
      setNewsletterSubject('');
      setNewsletterTitle('');
      setNewsletterBody('');
      setNewsletterCtaText('');
      setNewsletterCtaLink('');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send newsletter');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSending(false);
    }
  };
  
  // Open edit modal
  const openEditModal = (subscriber) => {
    setSelectedSubscriber(subscriber);
    setEditEmail(subscriber.email);
    setEditStatus(subscriber.status);
    setShowEditModal(true);
  };
  
  // Load subscribers on mount and when filters change
  useEffect(() => {
    fetchSubscribers();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);
  
  // Filter subscribers by search query
  const filteredSubscribers = subscribers.filter(sub => 
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="container mx-auto pl-8 pr-4 py-6 pt-8 font-sans overflow-x-hidden min-w-0">
      {/* Header */}
      <div className="mb-2 md:mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Newsletter Management</h1>
          <p className="text-black font-light">Manage subscribers and send newsletters</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 text-sm"
            onClick={() => setShowFilters((v) => !v)}
          >
            <FaFilter className="text-gray-700" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
          >
            <FaPaperPlane />
            <span>Send Newsletter</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 text-sm font-medium"
          >
            <FaPlus />
            <span className="hidden sm:inline">Add Subscriber</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
      
      {/* Mobile action buttons */}
      <div className="sm:hidden mb-4">
        <button
          onClick={() => setShowSendModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
        >
          <FaPaperPlane />
          <span>Send Newsletter</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Total Subscribers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalSubscribers}</p>
              </div>
              <FaEnvelope className="text-gray-400 text-2xl" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeSubscribers}</p>
              </div>
              <FaUserCheck className="text-green-400 text-2xl" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Unsubscribed</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.unsubscribedCount}</p>
              </div>
              <FaUserTimes className="text-red-400 text-2xl" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Last 30 Days</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.recentSubscribers}</p>
              </div>
              <FaChartLine className="text-purple-400 text-2xl" />
            </div>
          </div>
        </div>
      )}

      {/* Mobile search + filter */}
      <div className="sm:hidden mb-4 flex items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by email..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <button
          className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
          onClick={() => setShowFilters((v) => !v)}
        >
          <FaFilter className="text-gray-700" />
        </button>
      </div>

      {/* Desktop search */}
      <div className="hidden sm:block mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by email..."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
      </div>
      
      {/* Success/Error messages */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <p className="text-green-800 font-medium">{success}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-400 mt-0.5 mr-2" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}
      
      {/* Filters */}
      {showFilters && (
        <div className="mb-4 bg-white border border-gray-100 rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('');
                  setSearchQuery('');
                  setShowFilters(false);
                }}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Subscribers Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      ) : filteredSubscribers.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-8 text-center">
          <FaEnvelope className="mx-auto text-gray-300 text-5xl mb-4" />
          <p className="text-gray-600">No subscribers found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscribed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Email
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaEnvelope className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{subscriber.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        subscriber.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {subscriber.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {subscriber.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(subscriber.subscribedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {subscriber.lastEmailSent 
                        ? new Date(subscriber.lastEmailSent).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(subscriber)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteSubscriber(subscriber._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredSubscribers.map((subscriber) => (
              <div key={subscriber._id} className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <FaEnvelope className="text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{subscriber.email}</span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    subscriber.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {subscriber.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-xs text-gray-600 mb-3">
                  <div className="flex justify-between">
                    <span>Source:</span>
                    <span className="font-medium">{subscriber.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subscribed:</span>
                    <span className="font-medium">{new Date(subscriber.subscribedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Email:</span>
                    <span className="font-medium">
                      {subscriber.lastEmailSent 
                        ? new Date(subscriber.lastEmailSent).toLocaleDateString()
                        : '-'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(subscriber)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSubscriber(subscriber._id)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalSubscribers)} of {totalSubscribers} subscribers
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Add Subscriber Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add New Subscriber</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddSubscriber}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  placeholder="subscriber@example.com"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded text-sm hover:bg-pink-700"
                >
                  Add Subscriber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Subscriber Modal */}
      {showEditModal && selectedSubscriber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Subscriber</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleUpdateSubscriber}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-300"
                >
                  <option value="active">Active</option>
                  <option value="unsubscribed">Unsubscribed</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Send Newsletter Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Send Newsletter</h3>
              <button onClick={() => setShowSendModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSendNewsletter}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  value={newsletterSubject}
                  onChange={(e) => setNewsletterSubject(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="Newsletter Subject"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Title (Optional)</label>
                <input
                  type="text"
                  value={newsletterTitle}
                  onChange={(e) => setNewsletterTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="E.g., SPECIAL ANNOUNCEMENT"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Body (HTML Allowed) *</label>
                <textarea
                  value={newsletterBody}
                  onChange={(e) => setNewsletterBody(e.target.value)}
                  required
                  rows="8"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono"
                  placeholder="<p>Your newsletter content here...</p>"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CTA Button Text (Optional)</label>
                  <input
                    type="text"
                    value={newsletterCtaText}
                    onChange={(e) => setNewsletterCtaText(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="SHOP NOW"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CTA Link (Optional)</label>
                  <input
                    type="url"
                    value={newsletterCtaLink}
                    onChange={(e) => setNewsletterCtaLink(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded p-3 mb-4">
                <p className="text-xs text-purple-800">
                  📧 This will be sent to <strong>{stats?.activeSubscribers || 0}</strong> active subscribers
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  disabled={sending}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane /> Send Newsletter
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletter;
