import React, { useState, useRef, useEffect } from 'react';
import { Camera, Trash2, Upload, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import cloudinaryService from '../../../services/cloudinaryService';
import axios from 'axios';

const ProfileImageUpload = ({ isEditMode = false, size = 'large' }) => {
  const { user, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  
  const API_URL = import.meta.env.VITE_API_URL;
  
  // Log component mount
  console.log('🖼️ ProfileImageUpload component loaded');
  
  // Profile photo or default avatar
  console.log('User object in ProfileImageUpload:', user);
  console.log('Profile photo data:', user?.profilePhoto);
  const [profilePhoto, setProfilePhoto] = useState(
    user?.profilePhoto?.url || 'https://res.cloudinary.com/demo/image/upload/v1580294137/samples/people/smiling-man.jpg'
  );
  
  // Update profilePhoto when user object changes
  useEffect(() => {
    console.log('User changed, updating profile photo URL:', user?.profilePhoto?.url);
    setProfilePhoto(user?.profilePhoto?.url || 'https://res.cloudinary.com/demo/image/upload/v1580294137/samples/people/smiling-man.jpg');
  }, [user?.profilePhoto?.url]);

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Handle file selection
  const handleFileChange = async (e) => {
    try {
      console.log('🎯 === PROFILE IMAGE UPLOAD STARTED ===');
      setError('');
      setSuccess('');
      const file = e.target.files?.[0];
      
      if (!file) {
        console.log('❌ No file selected');
        return;
      }
      
      console.log('📁 Selected file details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });
      console.log('🔧 API_URL:', API_URL);
      
      // Validate file type - be more specific
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`File size too large (${formatFileSize(file.size)}). Maximum size is 5MB.`);
        return;
      }
      
      setIsUploading(true);
      setUploadProgress(0);
      
      // Get Firebase auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      
      if (!auth.currentUser) {
        setError('Please log in to upload a profile photo');
        setIsUploading(false);
        return;
      }
      
      const idToken = await auth.currentUser.getIdToken(true);
      
      // Convert file to base64 for our backend API
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          console.log('🚀 File read successfully, starting upload...');
          console.log('📁 File size in bytes:', file.size);
          console.log('📄 File type:', file.type);
          console.log('👤 User ID:', user?.uid);
          setUploadProgress(25);
          
          // Validate base64 data
          const base64Data = reader.result;
          if (!base64Data || !base64Data.startsWith('data:image/')) {
            throw new Error('Invalid file format after reading');
          }
          
          console.log('✅ Base64 data validated');
          console.log('📊 Base64 data prefix:', base64Data.substring(0, 50));
          console.log('📏 Base64 data length:', base64Data.length);
          setUploadProgress(50);
          
          console.log('🌐 Making request to:', `${API_URL}/upload/profile`);
          console.log('🔑 Auth token length:', idToken.length);
          
          // Show message for large files
          if (file.size > 1024 * 1024) { // > 1MB
            console.log('📋 Large file detected, upload may take longer...');
          }
          
          // Upload to our backend endpoint with longer timeout for large files
          const uploadResponse = await axios.post(
            `${API_URL}/upload/profile`,
            { file: base64Data },
            { 
              headers: { 
                Authorization: `Bearer ${idToken}`,
                'Content-Type': 'application/json'
              },
              timeout: 120000, // 2 minute timeout for large image uploads
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const uploadPercent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                  console.log(`📤 Upload progress: ${uploadPercent}%`);
                  // Show progress between 50-90% during actual upload
                  setUploadProgress(50 + (uploadPercent * 0.4));
                }
              }
            }
          );
          
          console.log('✅ Upload response received:', uploadResponse);
          console.log('📦 Upload response data:', uploadResponse.data);
          console.log('📊 Response status:', uploadResponse.status);
          setUploadProgress(75);
          
          const { url, public_id } = uploadResponse.data;
          
          if (!url || !public_id) {
            throw new Error('Invalid response from upload service');
          }
          
          // Update user profile with the photo
          const updateResponse = await axios.put(
            `${API_URL}/users/me/photo`,
            { url, public_id },
            { 
              headers: { Authorization: `Bearer ${idToken}` },
              timeout: 10000 // 10 second timeout
            }
          );
          
          console.log('Profile photo update response:', updateResponse.data);
          setUploadProgress(100);
          
          // Update local user state with the profilePhoto object
          updateUser({ profilePhoto: { url, public_id } });
          
          setSuccess('Profile photo updated successfully');
          
          // Reset progress after a short delay
          setTimeout(() => setUploadProgress(0), 2000);
          
        } catch (error) {
          console.error('❌ Error in profile photo upload:', error);
          console.error('🔍 Error details:');
          console.error('  - Message:', error.message);
          console.error('  - Code:', error.code);
          console.error('  - Status:', error.response?.status);
          console.error('  - Status Text:', error.response?.statusText);
          console.error('  - Response Data:', error.response?.data);
          console.error('  - Request URL:', error.config?.url);
          console.error('  - Request Method:', error.config?.method);
          console.error('  - Request Headers:', error.config?.headers);
          
          if (error.response?.data) {
            console.error('🔍 Server response details:', JSON.stringify(error.response.data, null, 2));
          }
          
          // Provide specific error messages
          if (error.code === 'ECONNABORTED') {
            console.log('⏰ Upload timeout detected - this might be due to large file size');
            setError('Upload is taking longer than expected. Please try with a smaller image (under 2MB) or check your internet connection.');
          } else if (error.response?.status === 413) {
            setError('File too large. Please choose a smaller image.');
          } else if (error.response?.status === 400) {
            setError(error.response.data?.message || 'Invalid file format. Please try a different image.');
          } else if (error.response?.status === 500) {
            console.error('🚨 500 Server Error - Backend Issue');
            setError('Server error during upload. Please try again in a moment.');
          } else {
            setError(error.response?.data?.message || error.message || 'Failed to upload profile photo');
          }
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error('❌ FileReader error:', error);
        setError('Failed to read the selected file. Please try again.');
        setIsUploading(false);
      };
      
      // Start reading the file
      console.log('📖 Starting to read file as DataURL...');
      reader.readAsDataURL(file);
      
    } catch (err) {
      console.error('❌ Error handling file upload:', err);
      console.error('🔍 Full error object:', JSON.stringify(err, null, 2));
      setError('Error preparing file for upload. Please try again.');
      setIsUploading(false);
    }
  };

  // Handle delete photo
  const handleDeletePhoto = async () => {
    try {
      setError('');
      setSuccess('');
      
      if (!user?.profilePhoto?.public_id) {
        setError('No profile photo to delete');
        return;
      }
      
      setIsUploading(true);
      
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      // Call API to delete the photo
      const response = await axios.delete(
        `${API_URL}/users/me/photo`,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      console.log('Profile photo delete response:', response.data);
      
      // Update local user state
      updateUser({ profilePhoto: { url: '', public_id: '' } });
      
      setSuccess('Profile photo deleted successfully');
    } catch (err) {
      console.error('Error deleting profile photo:', err);
      setError(err.response?.data?.message || 'Failed to delete profile photo');
    } finally {
      setIsUploading(false);
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
              e.target.src = 'https://res.cloudinary.com/demo/image/upload/v1580294137/samples/people/smiling-man.jpg';
            }}
          />
        </div>
        
        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex flex-col items-center justify-center text-white">
            <div className="w-20 h-2 bg-gray-500 rounded-full overflow-hidden">
              <div 
                className="h-full bg-pink-500" 
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
            className="absolute bottom-0 right-0 p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 disabled:bg-gray-400"
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
      />
      
      {/* Action buttons - only shown in edit mode */}
      {isEditMode && (
        <div className="flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center px-2 py-1 bg-gray-100 text-sm rounded hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400"
          >
            <Upload size={14} className="mr-1" /> Change
          </button>
          
          {user?.profilePhoto?.url && (
            <button
              onClick={handleDeletePhoto}
              disabled={isUploading}
              className="flex items-center px-2 py-1 bg-red-100 text-sm text-red-600 rounded hover:bg-red-200 disabled:bg-gray-200 disabled:text-gray-400"
            >
              <Trash2 size={14} className="mr-1" /> Remove
            </button>
          )}
        </div>
      )}
      
      {/* Error and success messages - only shown in edit mode */}
      {isEditMode && error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError('')}>
            <X size={16} />
          </button>
        </div>
      )}
      
      {isEditMode && success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded flex items-center justify-between">
          <span className="text-sm">{success}</span>
          <button onClick={() => setSuccess('')}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;
