import React, { useState, useEffect } from 'react';
import { useCategory } from '../../../context/CategoryContext/CategoryContext';
import { toast } from 'react-toastify';
import { normalizeImageUrl } from '../../../utils/imageUtils';
import { FaTrash, FaUpload, FaImage, FaStar, FaNewspaper } from 'react-icons/fa';

/**
 * SpecialCategoryImages component for managing Best Seller and Newly Launched category images
 */
const SpecialCategoryImages = () => {
  const { getSpecialImages, updateSpecialImage, deleteSpecialImage, refreshSpecialImages, loading } = useCategory();
  const [specialImages, setSpecialImages] = useState({ bestSeller: null, newlyLaunched: null });
  const [localLoading, setLocalLoading] = useState(false);
  const [uploading, setUploading] = useState({ bestSeller: false, newlyLaunched: false });

  // Load special images on component mount
  useEffect(() => {
    const loadSpecialImages = async () => {
      try {
        setLocalLoading(true);
        const images = await getSpecialImages();
        setSpecialImages(images);
      } catch (err) {
        console.error("Error loading special images:", err);
        toast.error("Failed to load special images");
      } finally {
        setLocalLoading(false);
      }
    };

    loadSpecialImages();
  }, [getSpecialImages]);

  // Handle image upload
  const handleImageUpload = async (type, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(prev => ({ ...prev, [type]: true }));

      // Create FormData and upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image to Cloudinary');
      }

      const data = await response.json();
      const imageUrl = data.secure_url;

      // Update special image via API
      await updateSpecialImage(type, imageUrl);
      
      // Force refresh special images across the app
      refreshSpecialImages();
      
      // Refresh special images locally
      const updatedImages = await getSpecialImages();
      setSpecialImages(updatedImages);

      toast.success(`${type === 'bestSeller' ? 'Best Seller' : 'Newly Launched'} image updated successfully`);
    } catch (err) {
      console.error(`Error uploading ${type} image:`, err);
      toast.error(`Failed to upload ${type === 'bestSeller' ? 'Best Seller' : 'Newly Launched'} image`);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  // Handle image deletion
  const handleImageDelete = async (type) => {
    if (!window.confirm(`Are you sure you want to delete the ${type === 'bestSeller' ? 'Best Seller' : 'Newly Launched'} image?`)) {
      return;
    }

    try {
      setLocalLoading(true);
      await deleteSpecialImage(type);
      
      // Force refresh special images across the app
      refreshSpecialImages();
      
      // Refresh special images locally
      const updatedImages = await getSpecialImages();
      setSpecialImages(updatedImages);

      toast.success(`${type === 'bestSeller' ? 'Best Seller' : 'Newly Launched'} image deleted successfully`);
    } catch (err) {
      console.error(`Error deleting ${type} image:`, err);
      toast.error(`Failed to delete ${type === 'bestSeller' ? 'Best Seller' : 'Newly Launched'} image`);
    } finally {
      setLocalLoading(false);
    }
  };

  if (loading || localLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 overflow-x-hidden pb-6 md:pb-10 min-w-0"
      style={{ paddingBottom: 'var(--admin-mobile-bottom-gap)' }}
    >
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
          <FaImage className="mr-3 text-pink-600" />
          Special Category Images
        </h2>
        
        <p className="text-gray-600 mb-6">
          Manage images for Best Seller and Newly Launched categories. If no manual image is uploaded, 
          the system will automatically use the first product image from each category.
        </p>

        <div className="grid md:grid-cols-2 gap-6 w-full min-w-0">
          {/* Best Seller Image */}
          <div className="border rounded-lg p-4 space-y-4 overflow-hidden w-full min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800 flex items-center">
                <FaStar className="mr-2 text-yellow-500" />
                Best Seller
              </h3>
              {specialImages.bestSeller && (
                <button
                  onClick={() => handleImageDelete('bestSeller')}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Delete image"
                >
                  <FaTrash />
                </button>
              )}
            </div>

            {specialImages.bestSeller ? (
              <div className="space-y-3">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={normalizeImageUrl(specialImages.bestSeller)}
                    alt="Best Seller Category"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/images/placeholder-image.jpg";
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {specialImages.isManual?.bestSeller ? 'Manually uploaded image' : 'Auto-generated from first product'}
                </p>
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <FaImage className="mx-auto mb-2 text-2xl" />
                  <p>No image uploaded</p>
                  <p className="text-xs">Will use first best seller product image</p>
                </div>
              </div>
            )}

            <div className="relative">
              <input
                type="file"
                id="bestSellerUpload"
                accept="image/*"
                onChange={(e) => handleImageUpload('bestSeller', e)}
                className="hidden"
                disabled={uploading.bestSeller}
              />
              <label
                htmlFor="bestSellerUpload"
                className={`w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 cursor-pointer transition-colors ${
                  uploading.bestSeller ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading.bestSeller ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload className="mr-2" />
                    Upload Best Seller Image
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Newly Launched Image */}
          <div className="border rounded-lg p-4 space-y-4 overflow-hidden w-full min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800 flex items-center">
                <FaNewspaper className="mr-2 text-blue-500" />
                Newly Launched
              </h3>
              {specialImages.newlyLaunched && (
                <button
                  onClick={() => handleImageDelete('newlyLaunched')}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Delete image"
                >
                  <FaTrash />
                </button>
              )}
            </div>

            {specialImages.newlyLaunched ? (
              <div className="space-y-3">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={normalizeImageUrl(specialImages.newlyLaunched)}
                    alt="Newly Launched Category"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/images/placeholder-image.jpg";
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {specialImages.isManual?.newlyLaunched ? 'Manually uploaded image' : 'Auto-generated from first product'}
                </p>
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <FaImage className="mx-auto mb-2 text-2xl" />
                  <p>No image uploaded</p>
                  <p className="text-xs">Will use first newly launched product image</p>
                </div>
              </div>
            )}

            <div className="relative">
              <input
                type="file"
                id="newlyLaunchedUpload"
                accept="image/*"
                onChange={(e) => handleImageUpload('newlyLaunched', e)}
                className="hidden"
                disabled={uploading.newlyLaunched}
              />
              <label
                htmlFor="newlyLaunchedUpload"
                className={`w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors ${
                  uploading.newlyLaunched ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading.newlyLaunched ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload className="mr-2" />
                    Upload Newly Launched Image
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Important Notes:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Images will be automatically processed with background removal</li>
            <li>• If no manual image is uploaded, the first product image from each category will be used</li>
            <li>• Supported formats: JPG, PNG, WebP (max 5MB)</li>
            <li>• Recommended aspect ratio: 16:9 for best display</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpecialCategoryImages;