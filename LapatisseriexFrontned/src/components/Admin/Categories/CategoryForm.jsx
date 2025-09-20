import React, { useState, useEffect } from 'react';
import { useCategory } from '../../../context/CategoryContext/CategoryContext';
import MediaUploader from '../../common/MediaUpload/MediaUploader';
import MediaPreview from '../../common/MediaUpload/MediaPreview';

/**
 * Form for creating or editing a category
 */
const CategoryForm = ({ category = null, onClose }) => {
  const { createCategory, updateCategory } = useCategory();
  const [isEditing] = useState(!!category);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    images: [],
    videos: [],
    isActive: true
  });

  // Initialize form data when editing
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        images: category.images || [],
        videos: category.videos || [],
        isActive: category.isActive !== undefined ? category.isActive : true
      });
    }
  }, [category]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle image uploads
  const handleImageUpload = (imageUrls) => {
    if (Array.isArray(imageUrls)) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrls]
      }));
    }
  };

  // Handle video uploads
  const handleVideoUpload = (videoUrls) => {
    if (Array.isArray(videoUrls)) {
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, ...videoUrls]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, videoUrls]
      }));
    }
  };

  // Handle removing an image
  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Handle removing a video
  const handleRemoveVideo = (index) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Enhanced validation for required fields
      if (!formData.name.trim()) {
        throw new Error('Category name is required');
      }
      
      if (!formData.description.trim()) {
        throw new Error('Category description is required');
      }
      
      if (formData.images.length === 0) {
        throw new Error('At least one category image is required');
      }
      
      if (isEditing) {
        await updateCategory(category._id, formData);
      } else {
        await createCategory(formData);
      }
      
      setSuccess(true);
      
      // Close the form after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('Form submission error:', err);
      
      // Improved error handling with more user-friendly messages
      if (err.response && err.response.status === 413) {
        setError('Image file is too large. Please use an image under 5MB.');
      } else if (err.response && err.response.data && err.response.data.message) {
        // Extract error message from API response if available
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to save category. Please try again.');
      }
      
      // Scroll to the top of the form to show the error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="category-form" style={{ fontFamily: 'sans-serif' }}>
      {/* Header - Responsive layout with proper spacing */}
      <div className="flex flex-row justify-between items-center gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-black">
          {isEditing ? 'Edit Category' : 'Add New Category'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-black hover:text-black p-2 rounded-md hover:bg-gray-100 transition-colors duration-200 flex-shrink-0"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
          <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start">
          <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Category {isEditing ? 'updated' : 'created'} successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-semibold text-gray-800">
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
            placeholder="Enter category name"
            required
          />
        </div>

        {/* Category Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-semibold text-gray-800">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors resize-vertical"
            placeholder="Describe this category in detail"
            required
          />
          <p className="text-xs text-gray-500">Provide a detailed description of the category</p>
        </div>

        {/* Active Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Category Settings</h3>
          <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-pink-500 focus:ring-pink-500 border-gray-300 rounded"
            />
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="text-sm font-medium text-gray-700">Active Category</span>
            </div>
          </label>
          <p className="text-xs text-gray-500">Active categories are visible to customers in the app</p>
        </div>

        {/* Category Images Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🖼️</span>
            <h3 className="text-lg font-semibold text-gray-800">Category Images</h3>
            <span className="text-red-500 text-sm">*</span>
          </div>

          {/* Uploaded Images Display */}
          {formData.images.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-green-600 font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{formData.images.length} image{formData.images.length !== 1 ? 's' : ''} uploaded</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg border">
                <MediaPreview
                  mediaUrls={formData.images}
                  onRemove={handleRemoveImage}
                />
              </div>
            </div>
          )}

          {/* Image Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-all duration-200">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <MediaUploader
                onUploadComplete={handleImageUpload}
                onError={setError}
                folder="la_patisserie/categories"
                multiple={true}
                accept="image/*"
              />
              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p className="font-medium">Upload category images</p>
                <p className="text-xs">PNG, JPG, GIF up to 5MB each</p>
                <p className="text-xs text-red-500 font-medium">At least one image is required</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Videos Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🎥</span>
            <h3 className="text-lg font-semibold text-gray-800">Category Videos</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
          </div>

          {/* Uploaded Videos Display */}
          {formData.videos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-blue-600 font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{formData.videos.length} video{formData.videos.length !== 1 ? 's' : ''} uploaded</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
                <MediaPreview
                  mediaUrls={formData.videos}
                  onRemove={handleRemoveVideo}
                />
              </div>
            </div>
          )}

          {/* Video Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-all duration-200">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <MediaUploader
                onUploadComplete={handleVideoUpload}
                onError={setError}
                folder="la_patisserie/categories/videos"
                multiple={true}
                accept="video/*"
              />
              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p className="font-medium">Upload promotional videos</p>
                <p className="text-xs">MP4, MOV, AVI up to 50MB each</p>
                <p className="text-xs text-gray-500">Optional - enhances category presentation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-white rounded-md text-black mr-2 hover:bg-gray-100 font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 disabled:bg-pink-300 flex items-center justify-center min-w-[140px] font-bold"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : isEditing ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;
