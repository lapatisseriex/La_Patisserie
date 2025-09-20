import React, { useState, useRef } from 'react';
import cloudinaryService from '../../services/cloudinaryService';

const BannerForm = ({ banner, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    description: banner?.description || '',
    type: banner?.type || 'image',
    src: banner?.src || '',
    isActive: banner?.isActive ?? true,
    features: banner?.leftContent?.features || ['', '', '']
  });
  
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(banner?.src || '');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({
      ...prev,
      features: newFeatures
    }));
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Determine resource type
      const isVideo = file.type.startsWith('video/');
      const resourceType = isVideo ? 'video' : 'image';
      
      // Upload using cloudinary service
      const result = await cloudinaryService.uploadMedia(file, {
        resourceType: resourceType,
        folder: 'la_patisserie/banners',
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });
      
      if (result.url) {
        setFormData(prev => ({
          ...prev,
          src: result.url,
          type: isVideo ? 'video' : 'image'
        }));
        setPreviewUrl(result.url);
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}. Please try again.`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.subtitle || !formData.src) {
      alert('Please fill in all required fields and upload a file.');
      return;
    }

    // Prepare data for saving
    const bannerData = {
      ...formData,
      leftContent: {
        features: formData.features.filter(f => f.trim() !== '')
      }
    };

    onSave(bannerData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onCancel}></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                    {banner ? 'Edit Banner' : 'Add New Banner'}
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Form Fields */}
                    <div className="space-y-6">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="e.g., La Patisserie"
                          required
                        />
                      </div>

                      {/* Subtitle */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subtitle *
                        </label>
                        <input
                          type="text"
                          value={formData.subtitle}
                          onChange={(e) => handleInputChange('subtitle', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="e.g., Sweet Perfection Awaits"
                          required
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Describe your banner content..."
                        />
                      </div>

                      {/* Features */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Features (3 items max)
                        </label>
                        {formData.features.map((feature, index) => (
                          <input
                            key={index}
                            type="text"
                            value={feature}
                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent mb-2"
                            placeholder={`Feature ${index + 1}`}
                          />
                        ))}
                      </div>

                      {/* File Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Video/Image *
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-pink-500">
                                <span>Upload a file</span>
                                <input
                                  id="file-upload"
                                  ref={fileInputRef}
                                  type="file"
                                  className="sr-only"
                                  accept="image/*,video/*"
                                  onChange={(e) => handleFileUpload(e.target.files[0])}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF, MP4, MOV up to 50MB
                            </p>
                          </div>
                        </div>

                        {/* Upload Progress */}
                        {uploading && (
                          <div className="mt-4">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">Uploading... {uploadProgress}%</p>
                          </div>
                        )}
                      </div>

                      {/* Active Status */}
                      <div className="flex items-center">
                        <input
                          id="isActive"
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => handleInputChange('isActive', e.target.checked)}
                          className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                          Active (visible on homepage)
                        </label>
                      </div>
                    </div>

                    {/* Right Column - Preview */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900">Preview</h4>
                      
                      {/* Desktop Preview */}
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-3 py-2 text-sm text-gray-600 border-b">
                          Desktop Preview
                        </div>
                        <div className="relative h-48 bg-black">
                          {previewUrl ? (
                            formData.type === 'video' ? (
                              <video
                                src={previewUrl}
                                className="w-full h-full object-cover"
                                controls={false}
                                muted
                                loop
                                autoPlay
                              />
                            ) : (
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            )
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              No media uploaded
                            </div>
                          )}
                          
                          {/* Content Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60">
                            <div className="absolute top-4 left-4 max-w-xs">
                              <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Dancing Script, serif' }}>
                                {formData.title || 'Title'}
                              </h1>
                              <div className="w-16 h-0.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mb-3"></div>
                              <p className="text-lg text-pink-100 mb-2 italic" style={{ fontFamily: 'Dancing Script, cursive' }}>
                                {formData.subtitle || 'Subtitle'}
                              </p>
                              <p className="text-sm text-gray-200 leading-relaxed mb-3">
                                {formData.description || 'Description'}
                              </p>
                              <div className="space-y-1">
                                {formData.features.filter(f => f.trim()).map((feature, index) => (
                                  <div key={index} className="flex items-center text-white/90">
                                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mr-2"></div>
                                    <span className="text-xs">{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Preview */}
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-3 py-2 text-sm text-gray-600 border-b">
                          Mobile Preview
                        </div>
                        <div className="relative h-32 bg-black">
                          {previewUrl ? (
                            formData.type === 'video' ? (
                              <video
                                src={previewUrl}
                                className="w-full h-full object-cover"
                                controls={false}
                                muted
                                loop
                              />
                            ) : (
                              <img
                                src={previewUrl}
                                alt="Mobile Preview"
                                className="w-full h-full object-cover"
                              />
                            )
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                              No media
                            </div>
                          )}
                          
                          {/* Mobile Content Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60">
                            <div className="absolute top-2 left-2 max-w-xs">
                              <h1 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Dancing Script, serif' }}>
                                {formData.title || 'Title'}
                              </h1>
                              <div className="w-12 h-0.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mb-2"></div>
                              <p className="text-sm text-pink-100 italic" style={{ fontFamily: 'Dancing Script, cursive' }}>
                                {formData.subtitle || 'Subtitle'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={uploading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : (banner ? 'Update Banner' : 'Create Banner')}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BannerForm;