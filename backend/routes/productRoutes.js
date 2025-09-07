import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory
} from '../controllers/productController.js';
import { getCategories, getPublicCategories } from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/', getProducts);
router.get('/categories', getPublicCategories); // Public categories endpoint
router.get('/:id', getProductById);
router.get('/category/:categoryId', getProductsByCategory);

// Protected routes - require authentication
router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

export default router;
