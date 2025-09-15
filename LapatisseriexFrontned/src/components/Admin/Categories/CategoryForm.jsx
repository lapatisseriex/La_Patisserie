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
    <div className="category-form">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {isEditing ? 'Edit Category' : 'Add New Category'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-black hover:text-black"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Category {isEditing ? 'updated' : 'created'} successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Category Name */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
            Category Name*
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            required
          />
        </div>

        {/* Category Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-black mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
          />
        </div>

        {/* Active Status */}
        <div className="mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-pink-500 focus:ring-pink-400 border-white rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-black">
              Active Category (visible to customers)
            </label>
          </div>
        </div>

        {/* Category Images */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-black mb-2">
            Category Images <span className="text-red-500">*</span>
          </label>
          
          {formData.images.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 text-sm text-black flex items-center">
                <span className="mr-2">✅</span> {formData.images.length} image{formData.images.length !== 1 ? 's' : ''} uploaded
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MediaPreview 
                  mediaUrls={formData.images} 
                  onRemove={handleRemoveImage}
                />
              </div>
            </div>
          )}
          
          <div className="border-2 border-dashed border-white rounded-md p-6 bg-gray-100">
            <MediaUploader
              onUploadComplete={handleImageUpload}
              onError={setError}
              folder="la_patisserie/categories"
              multiple={true}
              accept="image/*"
            />
            <p className="text-xs text-black mt-3 text-center">
              Add category images for display in the app.<br />
              <span className="text-red-500">At least one image is required.</span>
            </p>
          </div>
        </div>

        {/* Category Videos */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-black mb-2">
            Category Videos (Optional)
          </label>
          
          {formData.videos.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 text-sm text-black flex items-center">
                <span className="mr-2">✅</span> {formData.videos.length} video{formData.videos.length !== 1 ? 's' : ''} uploaded
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MediaPreview 
                  mediaUrls={formData.videos} 
                  onRemove={handleRemoveVideo}
                />
              </div>
            </div>
          )}
          
          <div className="border-2 border-dashed border-white rounded-md p-6 bg-gray-100">
            <MediaUploader
              onUploadComplete={handleVideoUpload}
              onError={setError}
              folder="la_patisserie/categories/videos"
              multiple={true}
              accept="video/*"
            />
            <p className="text-xs text-black mt-3 text-center">
              Add promotional videos for this category (optional)
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-white rounded-md text-black mr-2 hover:bg-gray-100"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 disabled:bg-pink-300 flex items-center justify-center min-w-[140px]"
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





