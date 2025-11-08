import express from 'express';
import { body } from 'express-validator';
import {
  getBanners,
  getAllBannersAdmin,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  reorderBanners
} from '../controllers/bannerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules for banner
const bannerValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must be between 1-100 characters'),
  body('subtitle')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subtitle is required and must be between 1-200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('type')
    .isIn(['image', 'video'])
    .withMessage('Type must be either "image" or "video"'),
  body('src')
    .trim()
    .notEmpty()
    .withMessage('Source URL is required')
    .isURL()
    .withMessage('Source must be a valid URL'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('leftContent.features')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Features must be an array with maximum 10 items'),
  body('leftContent.features.*')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Each feature must not exceed 100 characters')
];

// Public routes
router.get('/', getBanners);
router.get('/:id', getBanner);

// Admin routes (require authentication and admin role)
router.get('/admin/all', protect, admin, getAllBannersAdmin);
router.post('/admin', protect, admin, bannerValidation, createBanner);
router.put('/admin/:id', protect, admin, bannerValidation, updateBanner);
router.delete('/admin/:id', protect, admin, deleteBanner);
router.put('/admin/:id/toggle', protect, admin, toggleBannerStatus);
router.put('/admin/reorder', protect, admin, reorderBanners);

export default router;
