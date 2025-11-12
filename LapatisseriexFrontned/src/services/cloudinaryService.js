import axios from 'axios';

/**
 * Service to handle Cloudinary uploads from the frontend
 */
class CloudinaryService {
  constructor() {
    this.API_URL = import.meta.env.VITE_API_URL;
    this.CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    this.CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!this.CLOUDINARY_CLOUD_NAME || !this.CLOUDINARY_UPLOAD_PRESET) {
      console.warn('Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your environment variables.');
    }
  }
  
  /**
   * Get Firebase auth token
   * @returns {Promise<string>} Auth token
   */
  async getAuthToken() {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('User not logged in');
    }
    return auth.currentUser.getIdToken(true);
  }
  
  /**
   * Upload file directly to Cloudinary using unsigned upload
   * @param {File} file - File object
   * @param {object} options - Upload options
   * @returns {Promise<object>} Upload result
   */
  async uploadMedia(file, options = {}) {
    try {
      await this.getAuthToken(); // Just to verify the user is logged in
      
      if (!this.CLOUDINARY_CLOUD_NAME || !this.CLOUDINARY_UPLOAD_PRESET) {
        throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
      }
      
      // File size validation
      const MAX_FILE_SIZE_MB = options.resourceType === 'video' ? 100 : 10; // 100MB for video, 10MB for images
      const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
      
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      }
      
      // Create FormData for multipart/form-data upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', options.folder || 'la_patisserie');
      
      // Set the resource type for the Cloudinary API URL
      const resourceType = options.resourceType || 'auto';
      
      // Upload directly to Cloudinary
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'},
          onUploadProgress: (progressEvent) => {
            if (options.onProgress && progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              options.onProgress(percentCompleted);
            }
          },
          timeout: 120000 // 120 seconds timeout for larger files
        }
      );
      
      if (!response.data || !response.data.secure_url) {
        throw new Error('Invalid response from Cloudinary');
      }
      
      return {
        url: response.data.secure_url,
        public_id: response.data.public_id,
        resource_type: response.data.resource_type,
        format: response.data.format
      };
      
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout - please try with a smaller file or better connection');
      }
      throw new Error(error.response?.data?.message || error.message || 'Something went wrong with the upload');
    }
  }
}

export default new CloudinaryService();





