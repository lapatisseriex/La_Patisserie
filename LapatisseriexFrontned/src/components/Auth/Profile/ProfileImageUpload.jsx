import React, { useState, useRef, useEffect } from 'react';
import { Camera, Trash2, Upload, X } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
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
    config} = useProfileImageUpload();
  
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
    <div className="flex flex-col items-center space-y-4" style={{  }}>
      <div className="relative group">
        <div 
          className={`overflow-hidden border-4 transition-all duration-300 ${size === 'small' ? 'w-16 h-16' : 'w-36 h-36'}`}
          style={{ 
            borderColor: isEditMode ? '#BE185D' : '#E5E7EB',
            borderRadius: '8px',
            boxShadow: isEditMode ? '0 8px 24px rgba(190, 24, 93, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}
        >
          <img 
            key={profilePhoto}
            src={profilePhoto} 
            alt="Profile" 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = UPLOAD_CONFIG.DEFAULT_IMAGES.PROFILE_AVATAR_FALLBACK;
            }}
          />
        </div>
        
        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white" style={{ backgroundColor: 'rgba(40, 28, 32, 0.85)' }}>
            <div className="w-20 h-2 bg-gray-600 overflow-hidden">
              <div 
                className="h-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%`, backgroundColor: '#BE185D' }} 
              />
            </div>
            <span className="text-xs mt-2 font-semibold">{uploadProgress}%</span>
          </div>
        )}
        
        {/* Camera icon for upload - only shown in edit mode */}
        {isEditMode && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute -bottom-2 -right-2 p-3 text-white transition-all duration-300 shadow-lg disabled:opacity-50"
            style={{ backgroundColor: '#BE185D', borderRadius: '8px' }}
            onMouseEnter={(e) => !isUploading && (e.currentTarget.style.backgroundColor = '#9F1239')}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#BE185D'}
            title="Upload new profile photo"
          >
            <Camera size={18} />
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
        <div className="flex space-x-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 shadow-sm"
            style={{ backgroundColor: '#281c20', color: '#FFFFFF' }}
            onMouseEnter={(e) => !isUploading && (e.currentTarget.style.backgroundColor = '#1f1719')}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#281c20'}
            title={`Max size: ${config.maxSize / (1024 * 1024)}MB`}
          >
            <Upload size={14} className="mr-2" /> Change Photo
          </button>
          
          {user?.profilePhoto?.url && (
            <button
              onClick={handleDeletePhoto}
              disabled={isUploading}
              className="flex items-center px-4 py-2 text-sm font-medium border transition-all disabled:opacity-50"
              style={{ backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FCA5A5' }}
              onMouseEnter={(e) => !isUploading && (e.currentTarget.style.backgroundColor = '#FEE2E2')}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
              title="Remove profile photo"
            >
              <Trash2 size={14} className="mr-2" /> Remove
            </button>
          )}
        </div>
      )}
      
      {/* Upload status info */}
      {isEditMode && isUploading && (
        <div className="text-xs text-center font-medium px-4 py-2 border" style={{ color: '#BE185D', backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }}>
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 border-2 border-pink-600 border-t-transparent animate-spin" style={{ borderRadius: '50%' }}></div>
            Uploading... Please don't navigate away
          </div>
        </div>
      )}
      
      {/* Error and success messages - only shown in edit mode */}
      {isEditMode && error && (
        <div className="border px-4 py-3 max-w-sm shadow-sm" style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm flex-1" style={{ color: '#DC2626' }}>{error}</span>
            <button 
              onClick={() => resetUpload()}
              className="ml-2 transition-colors flex-shrink-0"
              style={{ color: '#DC2626' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#991B1B'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#DC2626'}
              title="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
          {error.includes('503') || error.includes('unavailable') || error.includes('Server error') ? (
            <div className="text-xs mt-2 pt-2 border-t border-red-200" style={{ color: '#991B1B' }}>
              <p className="font-medium mb-1">Troubleshooting tips:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Wait a few moments and try again</li>
                <li>Check if backend server is running</li>
                <li>Verify upload endpoint is accessible</li>
                <li>Contact support if issue persists</li>
              </ul>
            </div>
          ) : null}
        </div>
      )}
      
      {isEditMode && success && (
        <div className="border px-4 py-3 flex items-start justify-between max-w-sm shadow-sm" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
          <span className="text-sm flex-1" style={{ color: '#166534' }}>{success}</span>
          <button 
            onClick={() => resetUpload()}
            className="ml-2 transition-colors"
            style={{ color: '#16A34A' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#15803D'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#16A34A'}
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
