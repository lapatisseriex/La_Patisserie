import express from 'express';
import { 
  getProducts,
  getProduct,
  createProduct, 
  updateProduct, 
  deleteProduct,
  updateProductDiscount
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Admin only routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.put('/:id/discount', protect, admin, updateProductDiscount);

export default router;
