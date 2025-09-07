import express from 'express';
import { getUsers } from '../controllers/userController.js';
import { 
  getAllLocations, 
  createLocation, 
  updateLocation, 
  toggleLocationStatus 
} from '../controllers/locationController.js';
import {
  getCategories,
  getAdminCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategory
} from '../controllers/categoryController.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin user routes
router.get('/users', protect, admin, getUsers);

// Admin location routes
router.get('/locations', protect, admin, getAllLocations);
router.post('/locations', protect, admin, createLocation);
router.put('/locations/:id', protect, admin, updateLocation);
router.patch('/locations/:id/toggle', protect, admin, toggleLocationStatus);

// Admin category routes
router.get('/categories', protect, admin, getAdminCategories);
router.get('/categories/:id', protect, admin, getCategoryById);
router.post('/categories', protect, admin, createCategory);
router.put('/categories/:id', protect, admin, updateCategory);
router.delete('/categories/:id', protect, admin, deleteCategory);
router.get('/categories/:id/products', protect, admin, getProductsByCategory);

// Admin product routes
router.get('/products', protect, admin, getProducts);
router.get('/products/:id', protect, admin, getProductById);
router.post('/products', protect, admin, createProduct);
router.put('/products/:id', protect, admin, updateProduct);
router.delete('/products/:id', protect, admin, deleteProduct);

export default router;
