import React, { useState, useRef, useEffect } from 'react';
import { Camera, Trash2, Upload, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { useProfileImageUpload } from '../../../hooks/useProfileImageUpload';
import { UPLOAD_CONFIG } from '../../../config/uploadConfig';

const ProfileImageUpload = ({ isEditMode = false, size = 'large' }) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  // Use the enhanced profile upload hook
  const {
    isUploading,
    uploadProgress,
    error,
    success,
    uploadProfileImage,
    deleteProfileImage,
    resetUpload,
    config,
  } = useProfileImageUpload();
  
  // Log component mount
  console.log('🖼️ ProfileImageUpload component loaded');
  
  // Profile photo or default avatar
  console.log('User object in ProfileImageUpload:', user);
  console.log('Profile photo data:', user?.profilePhoto);
  const [profilePhoto, setProfilePhoto] = useState(
    user?.profilePhoto?.url || UPLOAD_CONFIG.DEFAULT_IMAGES.PROFILE_AVATAR_FALLBACK
  );
  
  // Update profilePhoto when user object changes
  useEffect(() => {
    console.log('User changed, updating profile photo URL:', user?.profilePhoto?.url);
    const newPhotoUrl = user?.profilePhoto?.url || UPLOAD_CONFIG.DEFAULT_IMAGES.PROFILE_AVATAR_FALLBACK;
    setProfilePhoto(newPhotoUrl);
  }, [user?.profilePhoto?.url]);

  // Handle file selection with enhanced error handling and cancellation
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }
    
    console.log('🎯 === PROFILE IMAGE UPLOAD STARTED ===');
    console.log('📁 Selected file details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });
    
    // Reset the file input to allow selecting the same file again
    e.target.value = '';
    
    // Use the enhanced upload hook
    const result = await uploadProfileImage(file);
    
    if (result) {
      console.log('✅ Profile image upload completed successfully');
      // Update the display photo
      setProfilePhoto(result.url);
    } else {
      console.log('❌ Profile image upload failed');
    }
  };

  // Handle delete photo using the hook
  const handleDeletePhoto = async () => {
    const result = await deleteProfileImage();
    
    if (result) {
      console.log('✅ Profile image deleted successfully');
      // Update the display photo to default
      setProfilePhoto(UPLOAD_CONFIG.DEFAULT_IMAGES.PROFILE_AVATAR_FALLBACK);
    } else {
      console.log('❌ Profile image deletion failed');
    }
  };


  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className={`rounded-full overflow-hidden border-2 border-pink-300 ${size === 'small' ? 'w-16 h-16' : 'w-32 h-32'}`}>
          <img 
            key={profilePhoto} // Add key to force re-render when the source changes
            src={profilePhoto} 
            alt="Profile" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = UPLOAD_CONFIG.DEFAULT_IMAGES.PROFILE_AVATAR_FALLBACK;
            }}
          />
        </div>
        
        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex flex-col items-center justify-center text-white">
            <div className="w-20 h-2 bg-gray-500 rounded-full overflow-hidden">
              <div 
                className="h-full bg-pink-500 transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }} 
              />
            </div>
            <span className="text-xs mt-1">{uploadProgress}%</span>
          </div>
        )}
        
        {/* Camera icon for upload - only shown in edit mode */}
        {isEditMode && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 disabled:bg-gray-400 transition-colors"
            title="Upload new profile photo"
          >
            <Camera size={16} />
          </button>
        )}
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
      
      {/* Action buttons - only shown in edit mode */}
      {isEditMode && (
        <div className="flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center px-3 py-2 bg-gray-100 text-sm rounded-md hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
            title={`Max size: ${config.maxSize / (1024 * 1024)}MB`}
          >
            <Upload size={14} className="mr-1" /> Change Photo
          </button>
          
          {user?.profilePhoto?.url && (
            <button
              onClick={handleDeletePhoto}
              disabled={isUploading}
              className="flex items-center px-3 py-2 bg-red-100 text-sm text-red-600 rounded-md hover:bg-red-200 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
              title="Remove profile photo"
            >
              <Trash2 size={14} className="mr-1" /> Remove
            </button>
          )}
        </div>
      )}
      
      {/* Upload status info */}
      {isEditMode && isUploading && (
        <div className="text-xs text-gray-600 text-center">
          Uploading... Please don't navigate away from this page.
        </div>
      )}
      
      {/* Error and success messages - only shown in edit mode */}
      {isEditMode && error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-start justify-between max-w-sm">
          <span className="text-sm flex-1">{error}</span>
          <button 
            onClick={() => resetUpload()}
            className="ml-2 text-red-500 hover:text-red-700 transition-colors"
            title="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {isEditMode && success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md flex items-start justify-between max-w-sm">
          <span className="text-sm flex-1">{success}</span>
          <button 
            onClick={() => resetUpload()}
            className="ml-2 text-green-500 hover:text-green-700 transition-colors"
            title="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;
