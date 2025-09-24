import express from 'express';
import { uploadMedia, getUploadSignature, uploadProfilePhoto, testCloudinaryConfig } from '../controllers/uploadController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Test route
router.get('/test', protect, testCloudinaryConfig);

// Admin only routes
router.post('/', protect, admin, uploadMedia);
router.get('/signature', protect, admin, getUploadSignature);

// User routes - any authenticated user can use
router.post('/profile', protect, uploadProfilePhoto);

export default router;
