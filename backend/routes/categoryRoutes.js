import express from 'express';
import { 
  getCategories,
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  getCategoryProducts,
  updateSpecialImage,
  getSpecialImages,
  deleteSpecialImage
} from '../controllers/categoryController.js';
import { reprocessCategoryImages } from '../controllers/imageReprocessController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/special-images', getSpecialImages);
router.get('/:id', getCategoryById);
router.get('/:id/products', getCategoryProducts);

// Admin only routes
router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);
router.post('/:id/reprocess-images', protect, admin, reprocessCategoryImages);
router.put('/special-image/:type', protect, admin, updateSpecialImage);
router.delete('/special-image/:type', protect, admin, deleteSpecialImage);

export default router;
