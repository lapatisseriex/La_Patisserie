import express from 'express';
import { upload, uploadImageToCloudinary, deleteImageFromCloudinary } from '../controllers/uploadController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Upload single image (protected route - admin only)
router.post('/image', protect, admin, upload.single('image'), uploadImageToCloudinary);

// Delete image (protected route - admin only)
router.delete('/image', protect, admin, deleteImageFromCloudinary);

export default router;
