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
    { quantity: '', measuringUnit: 'g', price: '', stock: 0, discount: { type: null, value: 0 }, isActive: true }
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
        ? product.variants
        : [{ quantity: '', measuringUnit: 'g', price: '', stock: 0, discount: { type: null, value: 0 }, isActive: true }]
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
      { quantity: '', measuringUnit: 'g', price: '', stock: 0, discount: { type: null, value: 0 }, isActive: true }
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

      // Prepare final data
      const finalData = {
        ...formData,
        extraFields,
        variants: variants.map(v => ({
          ...v,
          quantity: Number(v.quantity),
          price: Number(v.price),
          stock: Number(v.stock),
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Error/Success */}
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center">Product {isEditing ? 'updated' : 'created'} successfully!</div>}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          {['basic', 'media', 'pricing', 'details'].map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === tab ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'basic' ? 'Basic Info' : tab === 'media' ? 'Media' : tab === 'pricing' ? 'Pricing & Stock' : 'Additional Details'}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BASIC TAB */}
        {activeTab === 'basic' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name*</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                className="mt-1 block w-full border px-3 py-2 rounded-md" placeholder="Product Name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description*</label>
              <textarea name="description" value={formData.description} onChange={handleChange}
                className="mt-1 block w-full border px-3 py-2 rounded-md" rows="3" placeholder="Product Description"></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category*</label>
              <select name="category" value={formData.category} onChange={handleChange}
                className="mt-1 block w-full border px-3 py-2 rounded-md">
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
            </div>

            <div className="flex items-center space-x-4 mt-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="isVeg" checked={formData.isVeg} onChange={handleChange} className="h-4 w-4"/>
                <span className="text-sm">Vegetarian</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="hasEgg" checked={formData.hasEgg} onChange={handleChange} className="h-4 w-4"/>
                <span className="text-sm">Contains Egg</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4"/>
                <span className="text-sm">Active</span>
              </label>
            </div>
          </>
        )}

        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Images*</label>
              <MediaUploader type="image" onUploadComplete={handleImageUpload} />
              <MediaPreview media={formData.images} onRemove={handleRemoveImage} type="image"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mt-4">Videos</label>
              <MediaUploader type="video" onUploadComplete={handleVideoUpload} />
              <MediaPreview media={formData.videos} onRemove={handleRemoveVideo} type="video"/>
            </div>
          </>
        )}

        {/* PRICING & STOCK TAB */}
        {activeTab === 'pricing' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Variants*</label>
            {variants.map((variant, idx) => (
              <div key={idx} className="flex items-center space-x-2 mb-2 flex-wrap">
                <input type="number" placeholder="Quantity" value={variant.quantity}
                  onChange={(e) => handleVariantChange(idx, 'quantity', e.target.value)}
                  className="px-2 py-1 border rounded w-20"/>
                <select value={variant.measuringUnit} onChange={(e) => handleVariantChange(idx, 'measuringUnit', e.target.value)}
                  className="px-2 py-1 border rounded w-24">
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                </select>
                <input type="number" placeholder="Price" value={variant.price}
                  onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                  className="px-2 py-1 border rounded w-24"/>
                <input type="number" placeholder="Stock" value={variant.stock}
                  onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                  className="px-2 py-1 border rounded w-20"/>
                <select value={variant.discount.type || ''} onChange={(e) => handleVariantChange(idx, 'discount.type', e.target.value)}
                  className="px-2 py-1 border rounded w-28">
                  <option value="">No Discount</option>
                  <option value="flat">Flat</option>
                  <option value="percentage">Percentage</option>
                </select>
                {variant.discount.type && (
                  <input type="number" placeholder="Value" value={variant.discount.value}
                    onChange={(e) => handleVariantChange(idx, 'discount.value', e.target.value)}
                    className="px-2 py-1 border rounded w-20"/>
                )}
                <button type="button" onClick={() => handleRemoveVariant(idx)}
                  className="text-red-500 hover:text-red-700">Remove</button>
              </div>
            ))}
            <button type="button" onClick={handleAddVariant}
              className="mt-2 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600">Add Variant</button>
          </div>
        )}

        {/* ADDITIONAL DETAILS TAB */}
        {activeTab === 'details' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Extra Fields</label>
              {extraFieldsArray.map((field, idx) => (
                <div key={idx} className="flex items-center space-x-2 mb-1">
                  <span className="px-2 py-1 border rounded w-32 bg-gray-100">{field.key}</span>
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
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <div className="flex items-center space-x-2 mt-2">
                <input type="text" placeholder="Tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  className="px-2 py-1 border rounded w-48"/>
                <button type="button" onClick={handleAddTag} className="px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600">Add Tag</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-200 rounded flex items-center space-x-1">
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
