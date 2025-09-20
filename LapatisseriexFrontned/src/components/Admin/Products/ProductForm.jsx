import React, { useState, useEffect } from 'react';
import { useProduct } from '../../../context/ProductContext/ProductContext';
import { useCategory } from '../../../context/CategoryContext/CategoryContext';
import MediaUploader from '../../common/MediaUpload/MediaUploader';
import MediaPreview from '../../common/MediaUpload/MediaPreview';

// Custom hook to detect admin sidebar state
const useAdminSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Check if we're in admin context and get initial state
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      const stored = localStorage.getItem('adminSidebarOpen');
      return stored ? stored === 'true' : true; // Default to true for desktop
    }
    return false;
  });

  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'adminSidebarOpen') {
        setIsSidebarOpen(e.newValue === 'true');
      }
    };

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile, sidebar is always closed initially
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    // Listen for storage changes (sidebar toggle)
    window.addEventListener('storage', handleStorageChange);

    // Listen for resize
    window.addEventListener('resize', handleResize);

    // Also listen for custom events from the sidebar
    const handleSidebarToggle = (e) => {
      setIsSidebarOpen(e.detail.isOpen);
    };
    window.addEventListener('adminSidebarToggle', handleSidebarToggle);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('adminSidebarToggle', handleSidebarToggle);
    };
  }, []);

  return { isSidebarOpen, isMobile };
};

/**
 * Form for creating or editing a product
 */
const ProductForm = ({ product = null, onClose, preSelectedCategory = '' }) => {
  const { createProduct, updateProduct } = useProduct();
  const { categories, fetchCategories } = useCategory();
  const { isSidebarOpen, isMobile } = useAdminSidebar();
  const [isEditing] = useState(!!product);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: preSelectedCategory || '',
    images: [],
    videos: [],
    isVeg: true,
    hasEgg: false, // Added hasEgg default
    isActive: true,
    id: '',
    badge: '',
    tags: [],
    cancelOffer: false,
    importantField: { name: '', value: '' },
    extraFields: {}
  });

  // Variants state
  const [variants, setVariants] = useState([
    { quantity: '', measuringUnit: 'g', price: '', stock: '', discount: { type: null, value: 0 }, isActive: true }
  ]);

  // State for managing extra fields and tags
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [extraFieldsArray, setExtraFieldsArray] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // Load categories
  useEffect(() => {
    if (categories.length === 0) fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize form when editing
  useEffect(() => {
    if (product) {
      const extraFieldsArr = [];
      if (product.extraFields) {
        if (product.extraFields instanceof Map) {
          for (const [key, value] of product.extraFields.entries()) {
            extraFieldsArr.push({ key, value });
          }
        } else if (typeof product.extraFields === 'object') {
          for (const key in product.extraFields) {
            extraFieldsArr.push({ key, value: product.extraFields[key] });
          }
        }
      }

      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category?._id || product.category || '',
        images: product.images || [],
        videos: product.videos || [],
        isVeg: product.isVeg !== undefined ? product.isVeg : true,
        hasEgg: product.hasEgg !== undefined ? product.hasEgg : false, // Added hasEgg initialization
        isActive: product.isActive !== undefined ? product.isActive : true,
        id: product.id || '',
        badge: product.badge || '',
        tags: product.tags || [],
        cancelOffer: product.cancelOffer || false,
        importantField: product.importantField || { name: '', value: '' }
      });

      setExtraFieldsArray(extraFieldsArr);

      // Initialize variants
      setVariants(product.variants && product.variants.length > 0
        ? product.variants.map(v => ({
            ...v,
            stock: v.stock !== undefined && v.stock !== null ? v.stock : ''
          }))
        : [{ quantity: '', measuringUnit: 'g', price: '', stock: '', discount: { type: null, value: 0 }, isActive: true }]
      );
    } else if (preSelectedCategory) {
      setFormData(prev => ({ ...prev, category: preSelectedCategory }));
    }
  }, [product, preSelectedCategory]);

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: type === 'number' ? Number(value) : value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
      }));
    }
  };

  const handleImageUpload = (imageUrls) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...(Array.isArray(imageUrls) ? imageUrls : [imageUrls])]
    }));
  };

  const handleVideoUpload = (videoUrls) => {
    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, ...(Array.isArray(videoUrls) ? videoUrls : [videoUrls])]
    }));
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleRemoveVideo = (index) => {
    setFormData(prev => ({ ...prev, videos: prev.videos.filter((_, i) => i !== index) }));
  };

  // Extra fields
  const handleAddExtraField = () => {
    if (!newFieldName.trim()) return;
    setExtraFieldsArray(prev => [...prev, { key: newFieldName, value: newFieldValue }]);
    setNewFieldName(''); setNewFieldValue('');
  };
  const handleRemoveExtraField = (index) => {
    setExtraFieldsArray(prev => prev.filter((_, i) => i !== index));
  };

  // Tags
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!formData.tags.includes(tagInput)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput] }));
    }
    setTagInput('');
  };
  const handleRemoveTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  // Variants handlers
  const handleAddVariant = () => {
    setVariants(prev => [
      ...prev, 
      { quantity: '', measuringUnit: 'g', price: '', stock: '', discount: { type: null, value: 0 }, isActive: true }
    ]);
  };
  
  const handleRemoveVariant = (index) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };
  const handleVariantChange = (index, field, value) => {
    setVariants(prev => {
      const updated = [...prev];
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        updated[index][parent][child] = value;
      } else {
        updated[index][field] = value;
      }
      return updated;
    });
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true); setError(null);

      if (!formData.name.trim()) throw new Error('Product name is required');
      if (!formData.description.trim()) throw new Error('Product description is required');
      if (!formData.category) throw new Error('Please select a category');
      if (formData.images.length === 0) throw new Error('At least one product image is required');

      // Extra fields
      const extraFields = {};
      extraFieldsArray.forEach(field => { extraFields[field.key] = field.value; });

      // Prepare final data - handle optional stock field
      const finalData = {
        ...formData,
        extraFields,
        variants: variants.map(v => ({
          ...v,
          quantity: Number(v.quantity),
          price: Number(v.price),
          stock: v.stock === '' ? undefined : Number(v.stock),
          discount: { type: v.discount.type || null, value: Number(v.discount.value) || 0 }
        }))
      };

      if (isEditing) await updateProduct(product._id, finalData);
      else await createProduct(finalData);

      setSuccess(true);
      setTimeout(() => onClose(), 1500);

    } catch (err) {
      console.error('Form submission error:', err);
      if (err.response && err.response.status === 413) setError('Image file is too large. Please use an image under 5MB.');
      else if (err.response && err.response.data && err.response.data.message) setError(err.response.data.message);
      else if (err.message) setError(err.message);
      else setError('Failed to save product. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setLoading(false); }
  };

  return (
    <div className="product-form">
      {/* Header - Responsive layout with proper spacing */}
      <div className="flex flex-row justify-between items-center gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-black">
          {isEditing ? 'Edit Product' : 'Add New Product'}
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
          <span className="text-sm">Product {isEditing ? 'updated' : 'created'} successfully!</span>
        </div>
      )}

      {/* Tabs - Responsive Design */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex flex-wrap -mb-px gap-1 sm:gap-0">
          {[
            { key: 'basic', label: 'Basic Info', icon: '📝' },
            { key: 'media', label: 'Media', icon: '🖼️' },
            { key: 'pricing', label: 'Pricing & Stock', icon: '💰' },
            { key: 'details', label: 'Details', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center py-3 px-3 sm:px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                activeTab === tab.key
                  ? 'border-b-2 border-pink-500 text-pink-600 bg-pink-50'
                  : 'text-gray-600 hover:text-pink-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2 text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* RULE: To adjust vertical spacing between form elements, change space-y-8 */}
        {/* Increased spacing for better spacious mobile layout */}
        {/* Increase for more space: space-y-10, reduce for less space: space-y-6 */}
        {/* Add responsive spacing with sm:space-y-8 to customize per screen size */}
        {/* BASIC TAB */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            {/* Product Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                placeholder="Enter product name"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors resize-vertical"
                placeholder="Describe your product in detail"
                required
              />
              <p className="text-xs text-gray-500">Provide a detailed description of the product</p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors bg-white"
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Product Properties */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Product Properties</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="isVeg"
                    checked={formData.isVeg}
                    onChange={handleChange}
                    className="h-4 w-4 text-pink-500 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">🥬</span>
                    <span className="text-sm font-medium text-gray-700">Vegetarian</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="hasEgg"
                    checked={formData.hasEgg}
                    onChange={handleChange}
                    className="h-4 w-4 text-pink-500 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-600">🥚</span>
                    <span className="text-sm font-medium text-gray-700">Contains Egg</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-pink-500 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✅</span>
                    <span className="text-sm font-medium text-gray-700">Active Product</span>
                  </div>
                </label>
              </div>
              <p className="text-xs text-gray-500">Select all properties that apply to this product</p>
            </div>
          </div>
        )}

        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <div className="space-y-8">
            {/* Product Images Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🖼️</span>
                <h3 className="text-lg font-semibold text-gray-800">Product Images</h3>
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
                  <MediaUploader type="image" onUploadComplete={handleImageUpload} />
                  <div className="mt-4 text-sm text-gray-600 space-y-1">
                    <p className="font-medium">Upload product images</p>
                    <p className="text-xs">PNG, JPG, GIF up to 5MB each</p>
                    <p className="text-xs text-red-500 font-medium">At least one image is required</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Videos Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🎥</span>
                <h3 className="text-lg font-semibold text-gray-800">Product Videos</h3>
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
                  <MediaUploader type="video" onUploadComplete={handleVideoUpload} />
                  <div className="mt-4 text-sm text-gray-600 space-y-1">
                    <p className="font-medium">Upload promotional videos</p>
                    <p className="text-xs">MP4, MOV, AVI up to 50MB each</p>
                    <p className="text-xs text-gray-500">Optional - enhances product presentation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRICING & STOCK TAB */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">💰</span>
                <h3 className="text-lg font-semibold text-gray-800">Pricing & Stock</h3>
                <span className="text-red-500 text-sm">*</span>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="flex items-center space-x-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Variant</span>
              </button>
            </div>

            {/* Variants */}
            {variants.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-lg font-medium mb-2">No variants added yet</p>
                <p className="text-sm">Add at least one variant with quantity, unit, and price</p>
              </div>
            ) : (
              <div className="space-y-4">
                {variants.map((variant, idx) => (
                  <div key={idx} className="relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    {/* Variant Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold text-gray-800">Variant {idx + 1}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-sm">Remove</span>
                      </button>
                    </div>

                    {/* Basic Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={variant.quantity}
                          onChange={(e) => handleVariantChange(idx, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                          placeholder="e.g., 500"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Unit <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={variant.measuringUnit}
                          onChange={(e) => handleVariantChange(idx, 'measuringUnit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors bg-white"
                          required
                        >
                          <option value="">Select unit</option>
                          <option value="g">Grams (g)</option>
                          <option value="kg">Kilograms (kg)</option>
                          <option value="lb">Pounds (lb)</option>
                          <option value="oz">Ounces (oz)</option>
                          <option value="ml">Milliliters (ml)</option>
                          <option value="l">Liters (l)</option>
                          <option value="pcs">Pieces (pcs)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Price <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">₹</span>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stock and Discount */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Stock Quantity
                        </label>
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                          placeholder="Leave empty for unlimited"
                          min="0"
                        />
                        <p className="text-xs text-gray-500">Leave empty for unlimited stock</p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Discount Type
                        </label>
                        <select
                          value={variant.discount.type || ''}
                          onChange={(e) => handleVariantChange(idx, 'discount.type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors bg-white"
                        >
                          <option value="">No Discount</option>
                          <option value="flat">Flat Amount (₹)</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>

                      {variant.discount.type && (
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Discount Value
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">
                              {variant.discount.type === 'percentage' ? '%' : '₹'}
                            </span>
                            <input
                              type="number"
                              value={variant.discount.value}
                              onChange={(e) => handleVariantChange(idx, 'discount.value', e.target.value)}
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                              placeholder="0"
                              min="0"
                              step={variant.discount.type === 'percentage' ? '1' : '0.01'}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {variants.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Variant Summary</h4>
                <p className="text-sm text-gray-600">
                  {variants.length} variant{variants.length !== 1 ? 's' : ''} configured
                </p>
              </div>
            )}
          </div>
        )}

        {/* ADDITIONAL DETAILS TAB */}
        {activeTab === 'details' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-black">Extra Fields</label>
              {extraFieldsArray.map((field, idx) => (
                <div key={idx} className="flex items-center space-x-2 mb-1">
                  <span className="px-2 py-1 border rounded w-32 bg-white">{field.key}</span>
                  <input type="text" value={field.value} onChange={(e) => {
                    const val = e.target.value;
                    setExtraFieldsArray(prev => {
                      const updated = [...prev]; updated[idx].value = val; return updated;
                    });
                  }} className="px-2 py-1 border rounded w-48"/>
                  <button type="button" onClick={() => handleRemoveExtraField(idx)}
                    className="text-red-500 hover:text-red-700">Remove</button>
                </div>
              ))}
              <div className="flex items-center space-x-2 mt-2">
                <input type="text" placeholder="Field Name" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)}
                  className="px-2 py-1 border rounded w-32"/>
                <input type="text" placeholder="Field Value" value={newFieldValue} onChange={(e) => setNewFieldValue(e.target.value)}
                  className="px-2 py-1 border rounded w-48"/>
                <button type="button" onClick={handleAddExtraField} className="px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600">Add</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black">Tags</label>
              <div className="flex items-center space-x-2 mt-2">
                <input type="text" placeholder="Tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  className="px-2 py-1 border rounded w-48"/>
                <button type="button" onClick={handleAddTag} className="px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600">Add Tag</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-white rounded flex items-center space-x-1">
                    <span>{tag}</span>
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="text-red-500 hover:text-red-700">x</button>
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="mt-6">
          <button type="submit" disabled={loading} className="px-6 py-2 bg-pink-500 text-white rounded hover:bg-pink-600">
            {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
