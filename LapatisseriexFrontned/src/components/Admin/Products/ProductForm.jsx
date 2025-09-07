import React, { useState, useEffect } from 'react';
import { useProduct } from '../../../context/ProductContext/ProductContext';
import { useCategory } from '../../../context/CategoryContext/CategoryContext';
import MediaUploader from '../../common/MediaUpload/MediaUploader';
import MediaPreview from '../../common/MediaUpload/MediaPreview';

/**
 * Form for creating or editing a product
 */
const ProductForm = ({ product = null, onClose, preSelectedCategory = '' }) => {
  const { createProduct, updateProduct } = useProduct();
  const { categories, fetchCategories } = useCategory();
  const [isEditing] = useState(!!product);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    weight: '',
    weightUnit: 'g',
    stock: 0,
    category: preSelectedCategory || '',
    images: [],
    videos: [],
    isVeg: true,
    isActive: true,
    id: '',
    badge: '',
    tags: [],
    discount: {
      type: null,
      value: 0
    },
    cancelOffer: false,
    importantField: {
      name: '',
      value: ''
    },
    extraFields: {}
  });

  // State for managing extra fields
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [extraFieldsArray, setExtraFieldsArray] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // Load categories only once
  useEffect(() => {
    // If categories are already loaded, no need to fetch them again
    if (categories.length === 0) {
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize form data when editing
  useEffect(() => {
    if (product) {
      // Convert extraFields Map to array for UI
      const extraFieldsArr = [];
      if (product.extraFields) {
        // If it's a Map (from MongoDB)
        if (product.extraFields instanceof Map) {
          for (const [key, value] of product.extraFields.entries()) {
            extraFieldsArr.push({ key, value });
          }
        } 
        // If it's an object (from API)
        else if (typeof product.extraFields === 'object') {
          for (const key in product.extraFields) {
            extraFieldsArr.push({ key, value: product.extraFields[key] });
          }
        }
      }
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: typeof product.price === 'number' ? product.price : 0,
        weight: product.weight || '',
        weightUnit: product.weightUnit || 'g',
        stock: product.stock !== undefined ? product.stock : 0,
        category: product.category?._id || product.category || '',
        images: product.images || [],
        videos: product.videos || [],
        isVeg: product.isVeg !== undefined ? product.isVeg : true,
        isActive: product.isActive !== undefined ? product.isActive : true,
        id: product.id || '',
        badge: product.badge || '',
        tags: product.tags || [],
        discount: product.discount || { type: null, value: 0 },
        cancelOffer: product.cancelOffer || false,
        importantField: product.importantField || { name: '', value: '' }
      });
      
      setExtraFieldsArray(extraFieldsArr);
    } else if (preSelectedCategory) {
      // Set the preselected category for new products
      setFormData(prev => ({
        ...prev,
        category: preSelectedCategory
      }));
    }
  }, [product, preSelectedCategory]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects like discount.type
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'number' ? Number(value) : value
        }
      }));
    } else {
      // Handle regular inputs
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' 
          ? checked 
          : type === 'number' 
            ? Number(value) 
            : value
      }));
    }
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

  // Handle adding a new extra field
  const handleAddExtraField = () => {
    if (!newFieldName.trim()) return;
    
    setExtraFieldsArray(prev => [...prev, { key: newFieldName, value: newFieldValue }]);
    setNewFieldName('');
    setNewFieldValue('');
  };

  // Handle removing an extra field
  const handleRemoveExtraField = (index) => {
    setExtraFieldsArray(prev => prev.filter((_, i) => i !== index));
  };

  // Handle adding a new tag
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    if (!formData.tags.includes(tagInput)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput]
      }));
    }
    
    setTagInput('');
  };

  // Handle removing a tag
  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
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
        throw new Error('Product name is required');
      }
      
      if (!formData.description.trim()) {
        throw new Error('Product description is required');
      }
      
      if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
        throw new Error('Valid price is required (must be greater than 0)');
      }
      
      if (!formData.category) {
        throw new Error('Please select a category');
      }
      
      if (formData.images.length === 0) {
        throw new Error('At least one product image is required');
      }

      // Convert extraFieldsArray to object for storage
      const extraFields = {};
      extraFieldsArray.forEach(field => {
        extraFields[field.key] = field.value;
      });
      
      // Prepare final data for submission
      const finalData = {
        ...formData,
        // Ensure price is sent as a number
        price: Number(formData.price),
        extraFields
      };
      
      // Create or update product
      if (isEditing) {
        await updateProduct(product._id, finalData);
      } else {
        await createProduct(finalData);
      }
      
      setSuccess(true);
      
      // Close the form after a short delay
      // This gives user feedback that the action was successful
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
        setError('Failed to save product. Please try again.');
      }
      
      // Scroll to the top of the form to show the error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
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
          <span>Product {isEditing ? 'updated' : 'created'} successfully!</span>
        </div>
      )}

      {/* Tabs for form sections */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'basic'
                ? 'border-b-2 border-pink-500 text-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'media'
                ? 'border-b-2 border-pink-500 text-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Media
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'pricing'
                ? 'border-b-2 border-pink-500 text-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pricing & Stock
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'details'
                ? 'border-b-2 border-pink-500 text-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Additional Details
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div>
            {/* Product Name */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Product Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>

            {/* Category */}
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category*
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            
            {/* Product ID */}
            <div className="mb-4">
              <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">
                Product ID (Optional)
              </label>
              <input
                type="text"
                id="id"
                name="id"
                value={formData.id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                placeholder="Will be auto-generated if empty"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank for auto-generation based on category name
              </p>
            </div>

            {/* Badge */}
            <div className="mb-4">
              <label htmlFor="badge" className="block text-sm font-medium text-gray-700 mb-1">
                Badge (Optional)
              </label>
              <input
                type="text"
                id="badge"
                name="badge"
                value={formData.badge}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                placeholder="e.g., Best Seller, New, Popular"
              />
            </div>

            {/* Vegetarian Option */}
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isVeg"
                  name="isVeg"
                  checked={formData.isVeg}
                  onChange={handleChange}
                  className="h-4 w-4 text-pink-500 focus:ring-pink-400 border-gray-300 rounded"
                />
                <label htmlFor="isVeg" className="ml-2 block text-sm text-gray-700">
                  Vegetarian
                </label>
              </div>
            </div>

            {/* Active Status */}
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-pink-500 focus:ring-pink-400 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active Product (visible to customers)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div>
            {/* Product Images */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images <span className="text-red-500">*</span>
              </label>
              
              {formData.images.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 text-sm text-gray-700 flex items-center">
                    <span className="mr-2">✅</span> {formData.images.length} image{formData.images.length !== 1 ? 's' : ''} uploaded
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MediaPreview 
                      mediaUrls={formData.images} 
                      onRemove={handleRemoveImage}
                    />
                  </div>
                </div>
              )}
              
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 bg-gray-50">
                <MediaUploader
                  onUploadComplete={handleImageUpload}
                  onError={setError}
                  folder="la_patisserie/products"
                  multiple={true}
                  accept="image/*"
                />
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Add product images for display in the app. First image will be used as the main image.<br />
                  <span className="text-red-500">At least one image is required.</span>
                </p>
              </div>
            </div>

            {/* Product Videos */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Videos (Optional)
              </label>
              
              {formData.videos.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 text-sm text-gray-700 flex items-center">
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
              
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 bg-gray-50">
                <MediaUploader
                  onUploadComplete={handleVideoUpload}
                  onError={setError}
                  folder="la_patisserie/products/videos"
                  multiple={true}
                  accept="video/*"
                />
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Add product videos for enhanced product detail view (optional)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing & Stock Tab */}
        {activeTab === 'pricing' && (
          <div>
            {/* Price */}
            <div className="mb-4">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹)*
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>

            {/* Discount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount (Optional)
              </label>
              
              <div className="flex items-center space-x-2 mb-2">
                <select
                  id="discount.type"
                  name="discount.type"
                  value={formData.discount.type || ''}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="">No Discount</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
                
                {formData.discount.type && (
                  <input
                    type="number"
                    id="discount.value"
                    name="discount.value"
                    value={formData.discount.value}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    required
                  />
                )}
              </div>
              
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="cancelOffer"
                  name="cancelOffer"
                  checked={formData.cancelOffer}
                  onChange={handleChange}
                  className="h-4 w-4 text-pink-500 focus:ring-pink-400 border-gray-300 rounded"
                />
                <label htmlFor="cancelOffer" className="ml-2 block text-sm text-gray-700">
                  Cancel discount (overrides discount settings)
                </label>
              </div>
            </div>

            {/* Weight */}
            <div className="mb-4">
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                Weight
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                />
                <select
                  id="weightUnit"
                  name="weightUnit"
                  value={formData.weightUnit}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                </select>
              </div>
            </div>

            {/* Stock */}
            <div className="mb-4">
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>
        )}

        {/* Additional Details Tab */}
        {activeTab === 'details' && (
          <div>
            {/* Important Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Important Field
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Field Name (e.g., Type)"
                  value={formData.importantField.name}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      importantField: {
                        ...prev.importantField,
                        name: e.target.value
                      }
                    }));
                  }}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                />
                <input
                  type="text"
                  placeholder="Value (e.g., Eggless)"
                  value={formData.importantField.value}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      importantField: {
                        ...prev.importantField,
                        value: e.target.value
                      }
                    }));
                  }}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This field will be highlighted on the product detail page
              </p>
            </div>

            {/* Extra Fields */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extra Fields
              </label>
              
              {/* Add new field */}
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  placeholder="Field Name (e.g., Flavor)"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                />
                <input
                  type="text"
                  placeholder="Value (e.g., Chocolate)"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                />
                <button
                  type="button"
                  onClick={handleAddExtraField}
                  className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
                >
                  Add Field
                </button>
              </div>
              
              {/* List of extra fields */}
              {extraFieldsArray.length > 0 ? (
                <div className="space-y-2">
                  {extraFieldsArray.map((field, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="w-1/3 text-gray-700">{field.key}:</span>
                      <span className="w-1/3 text-gray-700">{field.value}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExtraField(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No extra fields added yet</p>
              )}
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Add a tag (e.g., birthday, chocolate)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
                >
                  Add Tag
                </button>
              </div>
              
              {/* Display tags */}
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1.5 inline-flex text-pink-500 hover:text-pink-700"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button (always visible) */}
        <div className="flex justify-end mt-6 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 disabled:bg-pink-300 flex items-center justify-center min-w-[120px]"
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
            ) : isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
