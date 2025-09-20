import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getAuth } from 'firebase/auth';
import { useSidebar } from './AdminDashboardLayout';
import BannerForm from './BannerForm';
import BannerPreview from './BannerPreview';

// Sortable Item Component
const SortableBannerItem = ({ banner, onEdit, onDelete, onToggleStatus, onPreview }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow-sm border p-4 ${isDragging ? 'z-50' : ''}`}
    >
      <div className="flex items-center space-x-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a1 1 0 011-1h14a1 1 0 011 1v4M4 8v8M4 8h16v8a1 1 0 01-1 1H5a1 1 0 01-1-1V8z" />
          </svg>
        </div>

        {/* Banner Thumbnail */}
        <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
          {banner.src && (
            banner.type === 'video' ? (
              <video
                src={banner.src}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <img
                src={banner.src}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
            )
          )}
        </div>

        {/* Banner Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {banner.title}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {banner.subtitle}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              banner.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {banner.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {banner.type}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPreview(banner)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Preview"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={() => onToggleStatus(banner._id, banner.isActive)}
            className={`transition-colors ${
              banner.isActive 
                ? 'text-red-600 hover:text-red-800' 
                : 'text-green-600 hover:text-green-800'
            }`}
            title={banner.isActive ? 'Deactivate' : 'Activate'}
          >
            {banner.isActive ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L9.88 9.88m-.002-.002L9.876 9.88m.002-.002L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => onEdit(banner)}
            className="text-yellow-600 hover:text-yellow-800 transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(banner._id)}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminBannerManagement = () => {
  const { closeSidebarIfOpen } = useSidebar();
  const [banners, setBanners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [stats, setStats] = useState({ videos: 0, images: 0, total: 0 });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const auth = getAuth();

  // Helper function to get fresh Firebase token
  const getAuthToken = async () => {
    try {
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken(true);
      }
      throw new Error('No authenticated user');
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw error;
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch banners from API
  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/banners/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBanners(data.banners || []);
        setStats(data.stats || { videos: 0, images: 0, total: 0 });
      } else {
        console.error('Failed to fetch banners');
        setBanners([]);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (bannerList) => {
    const videos = bannerList.filter(b => b.type === 'video').length;
    const images = bannerList.filter(b => b.type === 'image').length;
    setStats({ videos, images, total: bannerList.length });
  };

  const handleSaveBanner = async (bannerData) => {
    try {
      const token = await getAuthToken();
      const url = editingBanner 
        ? `${API_URL}/banners/admin/${editingBanner._id}`
        : `${API_URL}/banners/admin`;
      
      const method = editingBanner ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bannerData)
      });

      if (response.ok) {
        setShowForm(false);
        setEditingBanner(null);
        fetchBanners();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error saving banner');
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Error saving banner. Please try again.');
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/banners/admin/${bannerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchBanners();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error deleting banner');
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Error deleting banner. Please try again.');
    }
  };

  const toggleBannerStatus = async (bannerId, currentStatus) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/banners/admin/${bannerId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        fetchBanners();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error updating banner status');
      }
    } catch (error) {
      console.error('Error toggling banner status:', error);
      alert('Error updating banner status. Please try again.');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = banners.findIndex(banner => banner._id === active.id);
    const newIndex = banners.findIndex(banner => banner._id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newBanners = arrayMove(banners, oldIndex, newIndex);
    setBanners(newBanners);
    updateStats(newBanners);

    // Update order in backend
    try {
      const token = await getAuthToken();
      await fetch(`${API_URL}/banners/admin/reorder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          banners: newBanners.map((banner, index) => ({ 
            id: banner._id, 
            order: index 
          }))
        })
      });
    } catch (error) {
      console.error('Error reordering banners:', error);
      // Revert on error
      fetchBanners();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Banner Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto pl-8 pr-4 sm:px-6 lg:px-8">
          {/* Tweak left padding: change pl-8 to desired value (e.g., pl-6 for less, pl-10 for more) */}
          {/* Tweak right padding: change pr-4 to desired value (e.g., pr-6 for more, pr-2 for less) */}
          <div className="flex justify-between items-center py-6 mb-0 md:mb-8">
            {/* Tweak header margin: change mb-0 md:mb-8 to desired values (e.g., mb-2 md:mb-6 for less spacing) */}
            {/* Tweak header padding: change py-6 to desired value (e.g., py-4 for less, py-8 for more) */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Banner Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage homepage advertisement banners with drag & drop reordering
              </p>
            </div>
            <button
              onClick={() => {
                closeSidebarIfOpen(); // Close sidebar only if it's open
                setEditingBanner(null);
                setShowForm(true);
              }}
              className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 font-medium"
            >
              Add New Banner
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Video Banners</p>
                <p className="text-2xl font-bold text-gray-900">{stats.videos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Image Banners</p>
                <p className="text-2xl font-bold text-gray-900">{stats.images}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Banners</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Banner List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Current Banners</h2>
            <p className="mt-1 text-sm text-gray-500">Drag and drop to reorder banners</p>
          </div>

          {banners.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No banners</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first banner.</p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    closeSidebarIfOpen(); // Close sidebar only if it's open
                    setShowForm(true);
                  }}
                  className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 font-medium"
                >
                  Add New Banner
                </button>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={banners.map(b => b._id)} strategy={verticalListSortingStrategy}>
                <div className="divide-y divide-gray-200">
                  {banners.map((banner) => (
                    <SortableBannerItem
                      key={banner._id}
                      banner={banner}
                      onEdit={(banner) => {
                        setEditingBanner(banner);
                        setShowForm(true);
                      }}
                      onDelete={handleDeleteBanner}
                      onToggleStatus={toggleBannerStatus}
                      onPreview={setPreviewBanner}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Banner Form Modal */}
      {showForm && (
        <BannerForm
          banner={editingBanner}
          onSave={handleSaveBanner}
          onCancel={() => {
            setShowForm(false);
            setEditingBanner(null);
          }}
        />
      )}

      {/* Banner Preview Modal */}
      {previewBanner && (
        <BannerPreview
          banner={previewBanner}
          onClose={() => setPreviewBanner(null)}
        />
      )}
    </div>
  );
};

export default AdminBannerManagement;
