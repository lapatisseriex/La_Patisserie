import express from 'express';
import { uploadMedia, getUploadSignature } from '../controllers/uploadController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin only routes
router.post('/', protect, admin, uploadMedia);
router.get('/signature', protect, admin, getUploadSignature);

export default router;
