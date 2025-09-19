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
      setError('');
      setSuccess('');
      const file = e.target.files?.[0];
      
      if (!file) return;
      
      // Validate file type
      if (!file.type.includes('image/')) {
        setError('Please select an image file (JPEG, PNG, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`File size too large (${formatFileSize(file.size)}). Maximum size is 5MB.`);
        return;
      }
      
      setIsUploading(true);
      
      // Upload to Cloudinary via our backend
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      
      // First, upload the file using our backend endpoint
      const fileData = new FormData();
      fileData.append('file', file);
      
      // Convert file to base64 for our backend API
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          // Upload to our backend endpoint
          const uploadResponse = await axios.post(
            `${API_URL}/upload/profile`,
            { file: reader.result },
            { 
              headers: { Authorization: `Bearer ${idToken}` },
            }
          );
          
          const { url, public_id } = uploadResponse.data;
          
          // Update user profile with the photo
          const updateResponse = await axios.put(
            `${API_URL}/users/me/photo`,
            { url, public_id },
            { headers: { Authorization: `Bearer ${idToken}` } }
          );
          
          console.log('Profile photo update response:', updateResponse.data);
          
          // Update local user state with the profilePhoto object
          updateUser({ profilePhoto: { url, public_id } });
          
          setSuccess('Profile photo updated successfully');
          setUploadProgress(0);
        } catch (error) {
          console.error('Error in profile photo upload:', error);
          setError(error.response?.data?.message || 'Failed to upload profile photo');
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
        setIsUploading(false);
      };
      
    } catch (err) {
      console.error('Error handling file upload:', err);
      setError('Error uploading file. Please try again.');
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
