import React, { useState, useEffect } from 'react';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import { toast } from 'react-toastify';
import { normalizeImageUrl } from '../../utils/imageUtils';

const CategoryImageProcessor = () => {
  const { categories, loading, fetchCategories, reprocessCategoryImages } = useCategory();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchCategories(showInactive);
  }, [fetchCategories, showInactive]);

  const handleReprocess = async () => {
    if (!selectedCategory) {
      toast.warning('Please select a category first');
      return;
    }

    try {
      setProcessing(true);
      const result = await reprocessCategoryImages(selectedCategory);
      toast.success(`Successfully reprocessed images for category: ${result.category.name}`);
      setProcessing(false);
      // Refresh categories to show updated images
      fetchCategories(showInactive);
    } catch (error) {
      toast.error(`Error: ${error.message || 'Failed to reprocess images'}`);
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Category Image Processor</h2>
      
      <div className="mb-4">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="showInactive"
            checked={showInactive}
            onChange={() => setShowInactive(!showInactive)}
            className="mr-2 h-4 w-4"
          />
          <label htmlFor="showInactive" className="text-gray-700">Show inactive categories</label>
        </div>

        <label htmlFor="category" className="block text-gray-700 mb-2">Select Category:</label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          disabled={loading || processing}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
        >
          <option value="">-- Select a category --</option>
          {categories.map(category => (
            <option key={category._id} value={category._id}>
              {category.name} {!category.isActive && '(Inactive)'}
            </option>
          ))}
        </select>
        
        {selectedCategory && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Selected Category Preview:</p>
            <div className="flex flex-wrap gap-4">
              {categories.find(c => c._id === selectedCategory)?.images.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={normalizeImageUrl(img)}
                    alt={`Category image ${index + 1}`}
                    className="w-24 h-24 object-contain rounded-md bg-gray-50"
                  />
                  <span className="absolute bottom-0 right-0 bg-white px-1 rounded-tl-md text-xs">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleReprocess}
        disabled={!selectedCategory || loading || processing}
        className={`w-full p-3 rounded-md text-white font-medium
          ${(!selectedCategory || loading || processing) 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {processing ? 'Processing...' : 'Reprocess Background'}
      </button>
      
      <p className="text-sm text-gray-500 mt-4">
        This tool will reprocess all images for the selected category using the remove.bg API to
        remove backgrounds. The original images on Cloudinary will be replaced with processed versions.
      </p>
    </div>
  );
};

export default CategoryImageProcessor;