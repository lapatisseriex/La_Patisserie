import React, { useState, useRef, useCallback } from 'react';
import cloudinaryService from '../../../services/cloudinaryService';
import { UPLOAD_CONFIG, formatFileSize } from '../../../config/uploadConfig';

/**
 * MediaUploader component for handling image/video uploads to Cloudinary
 * Uses direct unsigned upload to Cloudinary for better performance with large files
 */
const MediaUploader = ({ onUploadComplete, onError, folder = 'la_patisserie', multiple = false, accept = 'image/*,video/*' }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  // Update progress callback for a specific file
  const updateFileProgress = useCallback((fileIndex, fileProgress, totalFiles) => {
    // Calculate overall progress based on all files
    const fileWeight = 1 / totalFiles;
    const overallProgress = Math.round((fileIndex / totalFiles) * 100 + fileProgress * fileWeight);
    setProgress(overallProgress);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = async (selectedFiles) => {
    if (!selectedFiles.length) return;

    // If multiple is false, only process the first file
    const filesToProcess = multiple ? selectedFiles : [selectedFiles[0]];

    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      const uploads = [];
      let hasErrors = false;
      let errorMessages = [];

      // Process each file one by one
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        try {
          // Determine resource type and upload config
          const resourceType = file.type.startsWith('image/') ? 'image' : 'video';
          const uploadType = resourceType === 'video' ? 'BANNER_VIDEO' : 'BANNER_IMAGE';
          const maxSize = UPLOAD_CONFIG.FILE_SIZE_LIMITS[uploadType];
          
          // File type validation
          if (!file.type.match(/^(image|video)/)) {
            throw new Error(`Invalid file type: ${file.type}. Please upload only images or videos.`);
          }
          
          // File size validation with consistent limits
          if (file.size > maxSize) {
            throw new Error(UPLOAD_CONFIG.ERROR_MESSAGES.FILE_TOO_LARGE(file.size, maxSize));
          }
          
          // File format validation
          const supportedFormats = UPLOAD_CONFIG.SUPPORTED_FORMATS[uploadType];
          if (!supportedFormats.includes(file.type.toLowerCase())) {
            throw new Error(UPLOAD_CONFIG.ERROR_MESSAGES.INVALID_FORMAT(supportedFormats));
          }
        
          // Upload to Cloudinary with progress tracking
          try {
            const result = await cloudinaryService.uploadMedia(file, { 
              folder, 
              resourceType,
              onProgress: (fileProgress) => updateFileProgress(i, fileProgress / 100, filesToProcess.length)
            });
            
            uploads.push(result);
          } catch (fileError) {
            console.error(`Error uploading ${file.name}:`, fileError);
            throw fileError;
          }
        } catch (err) {
          hasErrors = true;
          errorMessages.push(`Error with file ${file.name}: ${err.message}`);
        }
      } // Close the for loop
      
      if (uploads.length === 0 && hasErrors) {
        throw new Error(errorMessages.join('\n'));
      }
      
      setUploadedFiles(prev => [...prev, ...uploads]);
      
      // Call onUploadComplete with all uploaded files
      if (uploads.length > 0) {
        if (multiple) {
          onUploadComplete(uploads.map(file => file.url));
        } else {
          // If not multiple, just return the first file's URL
          onUploadComplete(uploads[0].url);
        }
      }
      
      // If there were any errors but some files uploaded successfully
      if (hasErrors) {
        setError(errorMessages.join('\n'));
        if (onError) {
          onError(errorMessages.join('\n'));
        }
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
      if (onError) {
        onError(err.message || 'Failed to upload file');
      }
    } finally {
      setLoading(false);
      // Reset the file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="media-uploader">
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center border-2 border-dashed p-5 rounded-lg transition-all ${
          loading 
            ? 'bg-gray-100 border-white' 
            : dragOver 
              ? 'bg-pink-50 border-pink-500' 
              : 'bg-white border-white hover:border-pink-400 hover:bg-pink-50'
        } ${error ? 'border-red-300 bg-red-50' : ''}`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={loading}
          multiple={multiple}
          accept={accept}
        />
        
        {loading ? (
          <div className="text-center py-6">
            <div className="mb-3">
              <svg className="animate-spin h-10 w-10 text-pink-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-black font-medium">Uploading... {progress}%</p>
          </div>
        ) : (
          <div 
            className="text-center py-6 cursor-pointer"
            onClick={() => fileInputRef.current.click()}
          >
            {uploadedFiles.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="text-green-500 mb-2">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-green-700 font-medium mb-1">
                  {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'} uploaded
                </p>
                <p className="text-sm text-black">Click or drop to upload {multiple ? 'more' : 'another'}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-white mb-2">
                  <svg className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="font-medium text-black mb-1">Drag & drop or click to upload</p>
                <p className="text-xs text-black">
                  {accept.includes('video') ? 'Images (up to 10MB) and videos (up to 100MB)' : 'Images up to 10MB'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm whitespace-pre-line">
          {error}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;





