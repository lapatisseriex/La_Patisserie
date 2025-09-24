import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext/AuthContext';
import axios from 'axios';
import { UPLOAD_CONFIG } from '../config/uploadConfig';

/**
 * Profile image upload hook with single-transaction support
 * This combines upload and user update into a single operation to avoid orphaned files
 */
export const useProfileImageUpload = () => {
  const { user, updateUser } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;
  
  // Local state management
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Refs for cleanup
  const cancelTokenRef = useRef(null);
  const isMountedRef = useRef(true);
  const timeoutRef = useRef(null);

  // Get config for profile images
  const config = {
    maxSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.PROFILE_IMAGE,
    supportedFormats: UPLOAD_CONFIG.SUPPORTED_FORMATS.PROFILE_IMAGE,
    timeout: UPLOAD_CONFIG.TIMEOUTS.PROFILE_IMAGE,
  };

  // Validate file function
  const validateFile = useCallback((file) => {
    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }

    // Check file size
    if (file.size > config.maxSize) {
      return {
        isValid: false,
        error: UPLOAD_CONFIG.ERROR_MESSAGES.FILE_TOO_LARGE(file.size, config.maxSize)
      };
    }

    // Check file format
    if (!config.supportedFormats.includes(file.type.toLowerCase())) {
      return {
        isValid: false,
        error: UPLOAD_CONFIG.ERROR_MESSAGES.INVALID_FORMAT(config.supportedFormats)
      };
    }

    return { isValid: true };
  }, [config]);

  // Reset upload state
  const resetUpload = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setError('');
    setSuccess('');
    setUploadProgress(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Cancel any ongoing requests
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
      }
      
      // Clear timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Single-transaction profile image upload
  const uploadProfileImage = useCallback(async (file) => {
    if (!isMountedRef.current) return false;

    if (!file) {
      setError('No file selected');
      return false;
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      setError(validation.error);
      return false;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      
      if (!auth.currentUser) {
        setError('Please log in to upload a profile photo');
        return false;
      }

      const idToken = await auth.currentUser.getIdToken(true);

      // Create cancel token
      const source = axios.CancelToken.source();
      cancelTokenRef.current = source;
      
      // Set timeout
      timeoutRef.current = setTimeout(() => {
        if (cancelTokenRef.current) {
          cancelTokenRef.current.cancel(UPLOAD_CONFIG.ERROR_MESSAGES.TIMEOUT_ERROR);
        }
      }, config.timeout);

      try {
        // Read file as data URL
        const fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onloadstart = () => {
            if (isMountedRef.current) {
              setUploadProgress(UPLOAD_CONFIG.PROGRESS.FILE_READ_START);
            }
          };

          reader.onprogress = (e) => {
            if (isMountedRef.current && e.lengthComputable) {
              const progress = UPLOAD_CONFIG.PROGRESS.FILE_READ_START + 
                ((e.loaded / e.total) * (UPLOAD_CONFIG.PROGRESS.FILE_READ_COMPLETE - UPLOAD_CONFIG.PROGRESS.FILE_READ_START));
              setUploadProgress(Math.round(progress));
            }
          };

          reader.onload = () => {
            if (isMountedRef.current) {
              setUploadProgress(UPLOAD_CONFIG.PROGRESS.FILE_READ_COMPLETE);
              resolve(reader.result);
            }
          };

          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.onabort = () => reject(new Error('File reading was aborted'));
          reader.readAsDataURL(file);
        });

        if (!isMountedRef.current) return false;

        // Validate base64 data
        if (!fileData || !fileData.startsWith('data:image/')) {
          throw new Error('Invalid file format after reading');
        }

        setUploadProgress(60);

        // Call single-transaction endpoint that handles both upload and user update
        const response = await axios.post(
          `${API_URL}/upload/profile-complete`,
          { 
            file: fileData
          },
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              'Content-Type': 'application/json'
            },
            timeout: config.timeout,
            cancelToken: source.token,
            onUploadProgress: (progressEvent) => {
              if (isMountedRef.current && progressEvent.total) {
                const uploadPercent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                const progress = 60 + (uploadPercent * 0.3); // 60-90% range
                setUploadProgress(Math.round(progress));
              }
            }
          }
        );

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (!isMountedRef.current) return false;

        if (!response.data?.url || !response.data?.public_id) {
          throw new Error('Invalid response from upload service');
        }

        setUploadProgress(95);

        // Update local user state
        updateUser({ 
          profilePhoto: { 
            url: response.data.url, 
            public_id: response.data.public_id 
          } 
        });

        setUploadProgress(100);
        setSuccess('Profile photo updated successfully');

        // Reset progress after delay
        setTimeout(() => {
          if (isMountedRef.current) {
            setUploadProgress(0);
          }
        }, 2000);

        return {
          url: response.data.url,
          public_id: response.data.public_id
        };

      } catch (uploadError) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        throw uploadError;
      }

    } catch (error) {
      if (!isMountedRef.current) return false;

      console.error('Profile image upload error:', error);

      if (axios.isCancel(error)) {
        setError('Upload was cancelled');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setError(UPLOAD_CONFIG.ERROR_MESSAGES.TIMEOUT_ERROR);
      } else if (error.response?.status === 413) {
        setError('File too large. Please choose a smaller image.');
      } else if (error.response?.status === 400) {
        setError(error.response.data?.message || 'Invalid file format.');
      } else if (error.response?.status === 500) {
        setError(UPLOAD_CONFIG.ERROR_MESSAGES.SERVER_ERROR);
      } else if (!error.response) {
        setError(UPLOAD_CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
      } else {
        setError(error.response?.data?.message || error.message || UPLOAD_CONFIG.ERROR_MESSAGES.GENERIC_ERROR);
      }
      
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
      }
    }
  }, [user, updateUser, API_URL, validateFile, config]);

  // Delete profile photo
  const deleteProfileImage = useCallback(async () => {
    if (!user?.profilePhoto?.public_id) {
      setError('No profile photo to delete');
      return false;
    }

    resetUpload();

    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);

      const response = await axios.delete(
        `${API_URL}/users/me/photo`,
        { 
          headers: { Authorization: `Bearer ${idToken}` },
          timeout: UPLOAD_CONFIG.TIMEOUTS.USER_UPDATE
        }
      );

      // Update local user state
      updateUser({ profilePhoto: { url: '', public_id: '' } });
      setSuccess('Profile photo deleted successfully');
      
      return true;

    } catch (error) {
      console.error('Error deleting profile photo:', error);
      setError(error.response?.data?.message || 'Failed to delete profile photo');
      return false;
    }
  }, [user, updateUser, API_URL, resetUpload, setError, setSuccess]);

  // Cancel upload function
  const cancelUpload = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Upload cancelled by user');
      cancelTokenRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isMountedRef.current) {
      setIsUploading(false);
      setUploadProgress(0);
      setError('Upload cancelled');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounting');
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isUploading,
    uploadProgress,
    error,
    success,
    uploadProfileImage,
    deleteProfileImage,
    cancelUpload,
    resetUpload,
    config,
  };
};