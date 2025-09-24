import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { UPLOAD_CONFIG, formatFileSize, validateFileSize, validateFileFormat } from '../config/uploadConfig';

/**
 * Enhanced upload hook with request cancellation and proper cleanup
 * @param {string} uploadType - Type of upload (PROFILE_IMAGE, BANNER_IMAGE, etc.)
 * @returns {object} Upload utilities and state
 */
export const useUpload = (uploadType = 'PROFILE_IMAGE') => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Refs for cleanup
  const cancelTokenRef = useRef(null);
  const fileReaderRef = useRef(null);
  const isMountedRef = useRef(true);
  const timeoutRef = useRef(null);

  // Get upload configuration for this type
  const config = UPLOAD_CONFIG.FILE_SIZE_LIMITS[uploadType] 
    ? {
        maxSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS[uploadType],
        supportedFormats: UPLOAD_CONFIG.SUPPORTED_FORMATS[uploadType],
        timeout: UPLOAD_CONFIG.TIMEOUTS[uploadType] || UPLOAD_CONFIG.TIMEOUTS.GENERAL_UPLOAD,
      }
    : {
        maxSize: UPLOAD_CONFIG.FILE_SIZE_LIMITS.GENERAL_IMAGE,
        supportedFormats: UPLOAD_CONFIG.SUPPORTED_FORMATS.GENERAL_IMAGE,
        timeout: UPLOAD_CONFIG.TIMEOUTS.GENERAL_UPLOAD,
      };

  // Validate file
  const validateFile = useCallback((file) => {
    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }

    // Check file size
    if (!validateFileSize(file, uploadType)) {
      return {
        isValid: false,
        error: UPLOAD_CONFIG.ERROR_MESSAGES.FILE_TOO_LARGE(file.size, config.maxSize)
      };
    }

    // Check file format
    if (!validateFileFormat(file, uploadType)) {
      return {
        isValid: false,
        error: UPLOAD_CONFIG.ERROR_MESSAGES.INVALID_FORMAT(config.supportedFormats)
      };
    }

    return { isValid: true };
  }, [uploadType, config]);

  // Read file as data URL with progress tracking
  const readFileAsDataURL = useCallback((file) => {
    return new Promise((resolve, reject) => {
      if (!isMountedRef.current) {
        reject(new Error(UPLOAD_CONFIG.ERROR_MESSAGES.COMPONENT_UNMOUNTED));
        return;
      }

      const reader = new FileReader();
      fileReaderRef.current = reader;

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

      reader.onerror = () => {
        if (isMountedRef.current) {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onabort = () => {
        if (isMountedRef.current) {
          reject(new Error('File reading was aborted'));
        }
      };

      reader.readAsDataURL(file);
    });
  }, []);

  // Upload file with cancellation support
  const uploadFile = useCallback(async (file, endpoint, additionalData = {}) => {
    if (!isMountedRef.current) return null;

    // Validate file first
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    setIsUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      // Create cancel token
      const source = axios.CancelToken.source();
      cancelTokenRef.current = source;

      // Set timeout
      timeoutRef.current = setTimeout(() => {
        if (cancelTokenRef.current) {
          cancelTokenRef.current.cancel(UPLOAD_CONFIG.ERROR_MESSAGES.TIMEOUT_ERROR);
        }
      }, config.timeout);

      // Read file
      const fileData = await readFileAsDataURL(file);
      
      if (!isMountedRef.current) {
        throw new Error(UPLOAD_CONFIG.ERROR_MESSAGES.COMPONENT_UNMOUNTED);
      }

      // Get auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      
      if (!auth.currentUser) {
        throw new Error('Please log in to upload files');
      }

      const idToken = await auth.currentUser.getIdToken(true);

      // Upload file
      setUploadProgress(UPLOAD_CONFIG.PROGRESS.UPLOAD_START);
      
      const response = await axios.post(
        endpoint,
        { 
          file: fileData,
          ...additionalData 
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
              const progress = UPLOAD_CONFIG.PROGRESS.UPLOAD_START + 
                (uploadPercent * (UPLOAD_CONFIG.PROGRESS.UPLOAD_COMPLETE - UPLOAD_CONFIG.PROGRESS.UPLOAD_START) / 100);
              setUploadProgress(Math.round(progress));
            }
          }
        }
      );

      if (!isMountedRef.current) {
        throw new Error(UPLOAD_CONFIG.ERROR_MESSAGES.COMPONENT_UNMOUNTED);
      }

      setUploadProgress(UPLOAD_CONFIG.PROGRESS.UPLOAD_COMPLETE);
      return response.data;

    } catch (error) {
      if (!isMountedRef.current) return null;

      if (axios.isCancel(error)) {
        throw new Error('Upload was cancelled');
      }

      // Handle specific error types
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error(UPLOAD_CONFIG.ERROR_MESSAGES.TIMEOUT_ERROR);
      } else if (error.response?.status === 413) {
        throw new Error('File too large. Please choose a smaller file.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Invalid file format.');
      } else if (error.response?.status === 500) {
        throw new Error(UPLOAD_CONFIG.ERROR_MESSAGES.SERVER_ERROR);
      } else if (!error.response) {
        throw new Error(UPLOAD_CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
      } else {
        throw new Error(error.response?.data?.message || error.message || UPLOAD_CONFIG.ERROR_MESSAGES.GENERIC_ERROR);
      }
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (isMountedRef.current) {
        setIsUploading(false);
      }
    }
  }, [uploadType, config, validateFile, readFileAsDataURL]);

  // Cancel upload
  const cancelUpload = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Upload cancelled by user');
    }
    if (fileReaderRef.current) {
      fileReaderRef.current.abort();
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

  // Reset state
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
      
      // Abort file reading
      if (fileReaderRef.current) {
        fileReaderRef.current.abort();
      }
      
      // Clear timeouts
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
    uploadFile,
    cancelUpload,
    resetUpload,
    validateFile,
    setError,
    setSuccess,
    formatFileSize,
    config,
  };
};