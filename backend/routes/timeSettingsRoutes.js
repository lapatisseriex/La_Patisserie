import express from 'express';
import {
  getTimeSettings,
  updateTimeSettings,
  addSpecialDay,
  removeSpecialDay,
  checkShopStatus
} from '../controllers/timeSettingsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/status', checkShopStatus);

// Admin routes (protected)
router.get('/', protect, admin, getTimeSettings);
router.put('/', protect, admin, updateTimeSettings);
router.post('/special-day', protect, admin, addSpecialDay);
router.delete('/special-day/:date', protect, admin, removeSpecialDay);

export default router;