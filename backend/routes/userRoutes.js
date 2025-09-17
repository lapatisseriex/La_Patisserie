import express from 'express';
import { 
  getCurrentUser, 
  updateUser, 
  getAllUsers, 
  getUserById,
  deleteUser,
  addToFavorites,
  removeFromFavorites,
  getFavorites
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

// Admin routes - require admin role
router.get('/', admin, getAllUsers);
router.get('/:id', admin, getUserById);

export default router;
