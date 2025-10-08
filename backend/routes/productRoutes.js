import express from 'express';
import { 
  getProducts,
  getProduct,
  createProduct, 
  updateProduct, 
  deleteProduct,
  updateProductDiscount,
  getProductOrderStats,
  getBestSellingProducts,
  checkBestSellers,
  updateProductOrderCount,
  bulkUpdateOrderCounts
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/bestsellers', getBestSellingProducts);
router.get('/bestsellers/check', checkBestSellers);
router.get('/:id', getProduct);

// Admin only routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.put('/:id/discount', protect, admin, updateProductDiscount);

// Order tracking routes
router.get('/stats/orders', protect, admin, getProductOrderStats);
router.put('/:id/order-count', protect, admin, updateProductOrderCount);
router.post('/bulk-update-order-counts', protect, admin, bulkUpdateOrderCounts);

export default router;
