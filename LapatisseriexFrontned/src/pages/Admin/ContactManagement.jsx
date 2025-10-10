import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiMail, 
  FiEye, 
  FiAirplay, 
  FiTrash2, 
  FiArchive, 
  FiCheck, 
  FiX, 
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiSend,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiInbox
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const ContactManagement = () => {
  const { user, token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedContact, setSelectedContact] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});
  const [selectedContacts, setSelectedContacts] = useState([]);

  // Fetch contacts
  const fetchContacts = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/contact?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setContacts(result.contacts);
        setPagination(result.pagination);
        setStats(result.stats);
      } else {
        toast.error('Failed to fetch contacts');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to fetch contacts');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Update contact status
  const updateContactStatus = async (contactId, status) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/contact/${contactId}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setContacts(prev => prev.map(contact => 
          contact._id === contactId ? { ...contact, status } : contact
        ));
        toast.success(`Contact marked as ${status}`);
      } else {
        toast.error('Failed to update contact status');
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
      toast.error('Failed to update contact status');
    }
  };

  // Send reply
  const sendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    setSendingReply(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/contact/${selectedContact._id}/reply`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            reply: replyMessage,
            markAsResolved: true
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setContacts(prev => prev.map(contact => 
          contact._id === selectedContact._id ? result.contact : contact
        ));
        setSelectedContact(result.contact);
        setShowReplyModal(false);
        setReplyMessage('');
        toast.success('Reply sent successfully!');
      } else {
        toast.error('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Delete contact
  const deleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/contact/${contactId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setContacts(prev => prev.filter(contact => contact._id !== contactId));
        if (selectedContact?._id === contactId) {
          setSelectedContact(null);
        }
        toast.success('Contact deleted successfully');
      } else {
        toast.error('Failed to delete contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  // Bulk update contacts
  const bulkUpdateContacts = async (action, status = null) => {
    if (selectedContacts.length === 0) {
      toast.error('Please select contacts first');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/contact/bulk-update`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contactIds: selectedContacts,
            action,
            ...(status && { status })
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        fetchContacts(false);
        setSelectedContacts([]);
        toast.success(`Bulk ${action} completed successfully`);
      } else {
        toast.error(`Failed to perform bulk ${action}`);
      }
    } catch (error) {
      console.error(`Error in bulk ${action}:`, error);
      toast.error(`Failed to perform bulk ${action}`);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [filters]);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusStyles = {
      unread: 'bg-red-100 text-red-800',
      read: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };

    const statusIcons = {
      unread: FiAlertCircle,
      read: FiEye,
      resolved: FiCheckCircle,
      archived: FiArchive
    };

    const Icon = statusIcons[status];

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${statusStyles[status]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
          <span>Loading contacts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contact Management</h1>
              <p className="text-gray-600 mt-1">Manage user inquiries and messages</p>
            </div>
            
            <button
              onClick={() => fetchContacts()}
              className="flex items-center px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 p-4">
              <div className="flex items-center">
                <FiInbox className="w-5 h-5 text-gray-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold">{stats.total || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4">
              <div className="flex items-center">
                <FiAlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <p className="text-sm text-red-600">Unread</p>
                  <p className="text-xl font-bold text-red-600">{stats.unread || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4">
              <div className="flex items-center">
                <FiCheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-green-600">Resolved</p>
                  <p className="text-xl font-bold text-green-600">{stats.resolved || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4">
              <div className="flex items-center">
                <FiClock className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-blue-600">Today</p>
                  <p className="text-xl font-bold text-blue-600">{stats.today || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedContacts.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedContacts.length} selected
              </span>
              <button
                onClick={() => bulkUpdateContacts('updateStatus', 'read')}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                Mark as Read
              </button>
              <button
                onClick={() => bulkUpdateContacts('updateStatus', 'resolved')}
                className="px-3 py-1 text-sm bg-green-100 text-green-800 hover:bg-green-200"
              >
                Mark as Resolved
              </button>
              <button
                onClick={() => bulkUpdateContacts('archive')}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                Archive
              </button>
              <button
                onClick={() => bulkUpdateContacts('delete')}
                className="px-3 py-1 text-sm bg-red-100 text-red-800 hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Contacts List */}
          <div className="flex-1">
            {contacts.length === 0 ? (
              <div className="bg-white p-8 text-center">
                <FiInbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No contacts found</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200">
                <div className="divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <div
                      key={contact._id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        selectedContact?._id === contact._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact._id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedContacts(prev =>
                                e.target.checked
                                  ? [...prev, contact._id]
                                  : prev.filter(id => id !== contact._id)
                              );
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                              <StatusBadge status={contact.status} />
                            </div>
                            <p className="text-sm text-gray-600">{contact.email}</p>
                            {contact.phone && (
                              <p className="text-xs text-gray-500">📞 {contact.phone}</p>
                            )}
                            <p className="text-sm font-medium text-gray-900 mt-1">{contact.subject}</p>
                            <p className="text-sm text-gray-600 truncate">{contact.messagePreview}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(contact.createdAt).toLocaleDateString()} at{' '}
                              {new Date(contact.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} results
                      </p>
                      <div className="flex gap-2">
                        <button
                          disabled={!pagination.hasPrevPage}
                          onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                          className="px-3 py-1 text-sm border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
                        >
                          Previous
                        </button>
                        <button
                          disabled={!pagination.hasNextPage}
                          onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                          className="px-3 py-1 text-sm border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contact Details */}
          {selectedContact && (
            <div className="w-96 bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Contact Details</h3>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{selectedContact.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{selectedContact.email}</p>
                </div>

                {selectedContact.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{selectedContact.phone}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Subject</label>
                  <p className="text-gray-900">{selectedContact.subject}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    <StatusBadge status={selectedContact.status} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <p className="text-gray-900">
                    {new Date(selectedContact.createdAt).toLocaleDateString()} at{' '}
                    {new Date(selectedContact.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <div className="mt-1 p-3 bg-gray-50 border">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedContact.message}</p>
                  </div>
                </div>

                {selectedContact.adminReply && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Admin Reply</label>
                    <div className="mt-1 p-3 bg-blue-50 border border-blue-200">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedContact.adminReply}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Replied on {new Date(selectedContact.repliedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-4">
                  <button
                    onClick={() => setShowReplyModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <FiSend className="w-4 h-4 mr-2" />
                    Reply
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    {selectedContact.status === 'unread' ? (
                      <button
                        onClick={() => updateContactStatus(selectedContact._id, 'read')}
                        className="flex items-center justify-center px-3 py-2 bg-green-600 text-white hover:bg-green-700"
                      >
                        <FiEye className="w-4 h-4 mr-1" />
                        Mark Read
                      </button>
                    ) : (
                      <button
                        onClick={() => updateContactStatus(selectedContact._id, 'resolved')}
                        className="flex items-center justify-center px-3 py-2 bg-green-600 text-white hover:bg-green-700"
                      >
                        <FiCheck className="w-4 h-4 mr-1" />
                        Resolve
                      </button>
                    )}

                    <button
                      onClick={() => updateContactStatus(selectedContact._id, 'archived')}
                      className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white hover:bg-gray-700"
                    >
                      <FiArchive className="w-4 h-4 mr-1" />
                      Archive
                    </button>
                  </div>

                  <button
                    onClick={() => deleteContact(selectedContact._id)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white hover:bg-red-700"
                  >
                    <FiTrash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white max-w-lg w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reply to {selectedContact?.name}</h3>
              <button
                onClick={() => setShowReplyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Original Message:</p>
              <div className="p-3 bg-gray-50 border text-sm">
                <p className="font-medium">{selectedContact?.subject}</p>
                <p className="text-gray-600 mt-1">{selectedContact?.message}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Reply
              </label>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                placeholder="Type your reply here..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReplyModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={sendReply}
                disabled={sendingReply}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {sendingReply ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4 mr-2" />
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ContactManagement;