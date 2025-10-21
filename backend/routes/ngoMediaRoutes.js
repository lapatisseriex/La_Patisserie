import express from 'express';
import {
  getNGOMedia,
  getNGOMediaById,
  uploadNGOMedia,
  updateNGOMedia,
  deleteNGOMedia,
  reorderNGOMedia
} from '../controllers/ngoMediaController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getNGOMedia);
router.get('/:id', getNGOMediaById);

// Admin routes
router.post('/', protect, admin, uploadNGOMedia);
router.put('/reorder', protect, admin, reorderNGOMedia);
router.put('/:id', protect, admin, updateNGOMedia);
router.delete('/:id', protect, admin, deleteNGOMedia);

export default router;
