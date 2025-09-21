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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[999] pt-24 md:pt-28">
      <div className="bg-white rounded-lg w-full max-w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] shadow-2xl flex flex-col mx-4 sm:mx-6 md:mx-8 lg:mx-10">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex flex-row justify-between items-center gap-3 mb-6 px-6 pt-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-black">
              {banner ? 'Edit Banner' : 'Add New Banner'}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="text-black hover:text-black p-2 rounded-md hover:bg-gray-100 transition-colors duration-200 flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Form Fields */}
              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                    placeholder="e.g., La Patisserie"
                    required
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Subtitle <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => handleInputChange('subtitle', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                    placeholder="e.g., Sweet Perfection Awaits"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors resize-vertical"
                    placeholder="Describe your banner content..."
                  />
                  <p className="text-xs text-gray-500">Provide a detailed description of the banner</p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-800">Features</h3>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <input
                        key={index}
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                        placeholder={`Feature ${index + 1}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Add up to 3 key features to highlight</p>
                </div>

                {/* File Upload */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">📁</span>
                    <h3 className="text-lg font-semibold text-gray-800">Media Upload</h3>
                    <span className="text-red-500 text-sm">*</span>
                  </div>

                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-all duration-200">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-center">
                          <label htmlFor="file-upload" className="cursor-pointer bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                            <span>Choose File</span>
                            <input
                              id="file-upload"
                              ref={fileInputRef}
                              type="file"
                              className="sr-only"
                              accept="image/*,video/*"
                              onChange={(e) => handleFileUpload(e.target.files[0])}
                            />
                          </label>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="font-medium">Upload banner media</p>
                          <p className="text-xs">PNG, JPG, GIF, MP4, MOV up to 50MB</p>
                          <p className="text-xs text-red-500 font-medium">At least one file is required</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {uploading && (
                    <div className="space-y-2">
                      <div className="bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-pink-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 text-center">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                </div>

                {/* Active Status */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-800">Banner Settings</h3>
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      className="h-4 w-4 text-pink-500 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-sm font-medium text-gray-700">Active Banner</span>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500">Active banners are visible on the homepage</p>
                </div>
              </div>

              {/* Right Column - Preview */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">👁️</span>
                  <h3 className="text-lg font-semibold text-gray-800">Live Preview</h3>
                </div>

                {/* Desktop Preview */}
                <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-4 py-3 text-sm text-gray-600 border-b font-medium">
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
                          playsInline
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
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">Upload media to preview</p>
                        </div>
                      </div>
                    )}

                    {/* Content Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60">
                      <div className="absolute top-4 left-4 max-w-xs">
                        <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Dancing Script, serif' }}>
                          {formData.title || 'Title'}
                        </h1>
                        <div className="w-16 h-0.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mb-3"></div>
                        <p className="text-lg text-pink-100 mb-3 italic" style={{ fontFamily: 'Dancing Script, cursive' }}>
                          {formData.subtitle || 'Subtitle'}
                        </p>
                        <p className="text-sm text-gray-200 leading-relaxed mb-4">
                          {formData.description || 'Description'}
                        </p>
                        <div className="space-y-2">
                          {formData.features.filter(f => f.trim()).map((feature, index) => (
                            <div key={index} className="flex items-center text-white/90">
                              <div className="w-1.5 h-1.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mr-3"></div>
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Preview */}
                <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-4 py-3 text-sm text-gray-600 border-b font-medium">
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
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Mobile Preview"
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs">Upload media</p>
                        </div>
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

          {/* Form Actions */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:bg-pink-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center min-w-[140px]"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Uploading...</span>
                </>
              ) : (
                banner ? 'Update Banner' : 'Create Banner'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannerForm;
