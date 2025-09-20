import express from 'express';
import { reprocessCategoryImages } from '../controllers/imageReprocessController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin only routes
router.post('/:id/reprocess-images', protect, admin, reprocessCategoryImages);

export default router;