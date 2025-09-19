import express from 'express';
import { 
  getCurrentUser, 
  updateUser, 
  getAllUsers, 
  getUserById,
  deleteUser,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  addRecentlyViewed,
  getRecentlyViewed,
  updateProfilePhoto,
  deleteProfilePhoto
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes - require authentication
router.use(protect);

// Current user route
router.get('/me', getCurrentUser);

// Update user route
router.put('/:id', updateUser);

// Delete user route (works for admins or users deleting their own accounts)
router.delete('/:id', deleteUser);

// Favorites routes
router.get('/favorites', getFavorites);
router.post('/favorites/:productId', addToFavorites);
router.delete('/favorites/:productId', removeFromFavorites);

// Recently viewed routes
router.get('/recently-viewed', getRecentlyViewed);
router.post('/recently-viewed/:productId', addRecentlyViewed);

// Profile photo routes
router.put('/me/photo', updateProfilePhoto);
router.delete('/me/photo', deleteProfilePhoto);

// Admin routes - require admin role
router.get('/', admin, getAllUsers);
router.get('/:id', admin, getUserById);

export default router;
