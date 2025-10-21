import React, { useState, useEffect } from 'react';
import { Upload, Image, Video, Trash2, Edit2, Eye, EyeOff, GripVertical, Save, X } from 'lucide-react';
import api from '../../services/apiService';
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
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Media Item Component
const SortableMediaItem = ({ item, editingId, editForm, setEditForm, handleSaveEdit, handleCancelEdit, handleEdit, handleToggleActive, handleDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 shadow-sm overflow-hidden relative">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-white border border-gray-200 p-1 hover:bg-gray-50 transition-colors"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" style={{ color: '#733857' }} />
      </div>

      {/* Media Preview */}
      <div className="aspect-video bg-gray-100 relative">
        {item.type === 'image' ? (
          <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <video src={item.url} className="w-full h-full object-cover" controls />
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          <span className="px-2 py-1 text-xs font-semibold bg-white border border-gray-200" style={{ color: '#281c20' }}>
            {item.type.toUpperCase()}
          </span>
          {!item.isActive && (
            <span className="px-2 py-1 text-xs font-semibold bg-white border border-gray-200" style={{ color: 'rgba(40, 28, 32, 0.5)' }}>
              HIDDEN
            </span>
          )}
        </div>
      </div>

      {/* Media Info */}
      <div className="p-4">
        {editingId === item._id ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 text-sm focus:border-[#733857] focus:outline-none"
              placeholder="Title"
            />
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 text-sm resize-none focus:border-[#733857] focus:outline-none"
              rows="2"
              placeholder="Description"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveEdit(item._id)}
                className="flex-1 bg-[#733857] hover:bg-[#5e2c46] text-white py-2 text-sm font-semibold flex items-center justify-center gap-1"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 bg-white border border-gray-200 py-2 text-sm font-semibold flex items-center justify-center gap-1"
                style={{ color: '#281c20' }}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-semibold tracking-wide mb-1" style={{ color: '#281c20' }}>
              {item.title || 'Untitled'}
            </h3>
            <p className="text-xs tracking-wide mb-3" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>
              {item.description || 'No description'}
            </p>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(item)}
                className="flex-1 bg-white border border-gray-200 hover:border-[#733857] py-2 text-sm font-semibold flex items-center justify-center gap-1 transition-colors"
                style={{ color: '#281c20' }}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleToggleActive(item._id, item.isActive)}
                className="flex-1 bg-white border border-gray-200 hover:border-[#733857] py-2 text-sm font-semibold flex items-center justify-center gap-1 transition-colors"
                style={{ color: '#281c20' }}
              >
                {item.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {item.isActive ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={() => handleDelete(item._id)}
                className="bg-white border border-red-200 hover:bg-red-50 px-3 py-2 text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const AdminNGOMedia = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // Upload form state
  const [uploadType, setUploadType] = useState('image');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ngo-media');
      setMedia(response.data);
    } catch (error) {
      console.error('Error fetching NGO media:', error);
      alert('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle Drag End - Reorder media
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = media.findIndex((item) => item._id === active.id);
    const newIndex = media.findIndex((item) => item._id === over.id);

    // Reorder the media array
    const reorderedMedia = arrayMove(media, oldIndex, newIndex);
    setMedia(reorderedMedia);

    // Update order on backend
    try {
      // Update order field for all affected items
      const updatePromises = reorderedMedia.map((item, index) => 
        api.put(`/ngo-media/${item._id}`, { order: index })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order. Please refresh the page.');
      // Revert to original order if failed
      fetchMedia();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if ((uploadType === 'image' && !isImage) || (uploadType === 'video' && !isVideo)) {
      alert(`Please select a ${uploadType} file`);
      return;
    }

    // File size limit (50MB for video, 10MB for image)
    const maxSize = uploadType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File size must be less than ${uploadType === 'video' ? '50MB' : '10MB'}`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile(reader.result);
      setPreviewUrl(URL.createObjectURL(file));
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const response = await api.post('/ngo-media', {
        file: selectedFile,
        type: uploadType,
        title: uploadTitle,
        description: uploadDescription
      });

      setMedia([response.data, ...media]);
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl('');
      setUploadTitle('');
      setUploadDescription('');
      document.getElementById('fileInput').value = '';
      
      alert('Media uploaded successfully!');
    } catch (error) {
      console.error('Error uploading media:', error);
      alert(error.response?.data?.message || 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      title: item.title,
      description: item.description,
      order: item.order,
      isActive: item.isActive
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      const response = await api.put(`/ngo-media/${id}`, editForm);
      setMedia(media.map(m => m._id === id ? response.data : m));
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating media:', error);
      alert('Failed to update media');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const response = await api.put(`/ngo-media/${id}`, {
        isActive: !currentStatus
      });
      setMedia(media.map(m => m._id === id ? response.data : m));
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return;

    try {
      await api.delete(`/ngo-media/${id}`);
      setMedia(media.filter(m => m._id !== id));
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-[#733857] border-t-transparent animate-spin mx-auto mb-4"></div>
          <p style={{ color: '#281c20', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-light tracking-wide" style={{ color: '#281c20' }}>
            NGO Media Management
          </h1>
          <p className="text-sm tracking-wide mt-2" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>
            Upload and manage images and videos for the NGO donation section
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="bg-gray-50 border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold tracking-wide mb-4" style={{ color: '#281c20' }}>
            Upload New Media
          </h2>
          
          <form onSubmit={handleUpload} className="space-y-4">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-semibold tracking-wide mb-2" style={{ color: '#281c20' }}>
                Media Type
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setUploadType('image')}
                  className={`flex items-center gap-2 px-4 py-2 border transition-colors ${
                    uploadType === 'image' 
                      ? 'bg-[#733857] text-white border-[#733857]' 
                      : 'bg-white border-gray-200 hover:border-[#733857]'
                  }`}
                  style={uploadType !== 'image' ? { color: '#281c20' } : {}}
                >
                  <Image className="w-4 h-4" />
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('video')}
                  className={`flex items-center gap-2 px-4 py-2 border transition-colors ${
                    uploadType === 'video' 
                      ? 'bg-[#733857] text-white border-[#733857]' 
                      : 'bg-white border-gray-200 hover:border-[#733857]'
                  }`}
                  style={uploadType !== 'video' ? { color: '#281c20' } : {}}
                >
                  <Video className="w-4 h-4" />
                  Video
                </button>
              </div>
            </div>

            {/* File Input */}
            <div>
              <label className="block text-sm font-semibold tracking-wide mb-2" style={{ color: '#281c20' }}>
                Select {uploadType === 'image' ? 'Image' : 'Video'}
              </label>
              <input
                id="fileInput"
                type="file"
                accept={uploadType === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileSelect}
                className="w-full px-4 py-2 border border-gray-200 focus:border-[#733857] focus:outline-none"
              />
              <p className="text-xs tracking-wide mt-1" style={{ color: 'rgba(40, 28, 32, 0.5)' }}>
                Max size: {uploadType === 'video' ? '50MB' : '10MB'}
              </p>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="border border-gray-200 p-4">
                <p className="text-sm font-semibold tracking-wide mb-2" style={{ color: '#281c20' }}>Preview:</p>
                {uploadType === 'image' ? (
                  <img src={previewUrl} alt="Preview" className="max-w-full h-auto max-h-64 object-contain" />
                ) : (
                  <video src={previewUrl} controls className="max-w-full h-auto max-h-64" />
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold tracking-wide mb-2" style={{ color: '#281c20' }}>
                Title (optional)
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 focus:border-[#733857] focus:outline-none"
                placeholder="Enter a title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold tracking-wide mb-2" style={{ color: '#281c20' }}>
                Description (optional)
              </label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 focus:border-[#733857] focus:outline-none resize-none"
                rows="3"
                placeholder="Enter a description"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className={`w-full py-3 flex items-center justify-center gap-2 font-semibold tracking-wide transition-colors ${
                !selectedFile || uploading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#733857] hover:bg-[#5e2c46] text-white'
              }`}
              style={!selectedFile || uploading ? { color: 'rgba(40, 28, 32, 0.5)' } : {}}
            >
              <Upload className="w-5 h-5" />
              {uploading ? 'Uploading...' : 'Upload Media'}
            </button>
          </form>
        </div>

        {/* Media List */}
        <div>
          <h2 className="text-xl font-semibold tracking-wide mb-4" style={{ color: '#281c20' }}>
            Uploaded Media ({media.length})
          </h2>

          {media.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-gray-200">
              <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(40, 28, 32, 0.3)' }} />
              <p style={{ color: 'rgba(40, 28, 32, 0.7)' }}>No media uploaded yet</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={media.map(item => item._id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {media.map((item) => (
                    <SortableMediaItem
                      key={item._id}
                      item={item}
                      editingId={editingId}
                      editForm={editForm}
                      setEditForm={setEditForm}
                      handleSaveEdit={handleSaveEdit}
                      handleCancelEdit={handleCancelEdit}
                      handleEdit={handleEdit}
                      handleToggleActive={handleToggleActive}
                      handleDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNGOMedia;
