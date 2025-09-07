import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const UploadImage = ({ 
  onImageUpload, 
  currentImage = null, 
  placeholder = "Drag & drop an image here, or click to select",
  maxSize = 5 * 1024 * 1024 // 5MB default
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File is too large. Maximum size is 5MB.');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Only image files are allowed.');
      } else {
        setError('Invalid file.');
      }
      return;
    }

    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);
    setUploading(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('image', file);

      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Upload to backend
      const response = await fetch('http://localhost:3000/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Clean up preview URL
        URL.revokeObjectURL(previewUrl);
        
        // Set the Cloudinary URL as preview
        setPreview(data.data.url);
        
        // Call parent callback with upload result
        if (onImageUpload) {
          onImageUpload(data.data);
        }
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload image');
      setPreview(currentImage); // Revert to original image
    } finally {
      setUploading(false);
    }
  }, [onImageUpload, currentImage]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize,
    multiple: false
  });

  const removeImage = () => {
    setPreview(null);
    setError(null);
    if (onImageUpload) {
      onImageUpload(null);
    }
  };

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative group">
          <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                <button
                  onClick={() => {
                    setPreview(null);
                    setError(null);
                  }}
                  className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                  type="button"
                >
                  Change Image
                </button>
                <button
                  onClick={removeImage}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
            flex flex-col items-center justify-center text-center p-6
            ${isDragActive && !isDragReject 
              ? 'border-cakePink bg-cakePink-light border-solid' 
              : isDragReject 
              ? 'border-red-500 bg-red-50' 
              : 'border-gray-300 hover:border-cakePink hover:bg-gray-50'
            }
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cakePink mb-3"></div>
              <p className="text-gray-600">Uploading...</p>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-4">
                {isDragActive ? '📤' : '🖼️'}
              </div>
              <p className="text-gray-600 mb-2 font-medium">
                {isDragActive
                  ? isDragReject
                    ? 'Invalid file type'
                    : 'Drop the image here'
                  : placeholder
                }
              </p>
              <p className="text-sm text-gray-500">
                Supports: JPG, PNG, GIF, WebP (max {Math.round(maxSize / (1024 * 1024))}MB)
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default UploadImage;
