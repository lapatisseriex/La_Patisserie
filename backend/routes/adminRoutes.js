import express from 'express';
import { getUsers } from '../controllers/userController.js';
import { 
  getAllLocations, 
  createLocation, 
  updateLocation, 
  toggleLocationStatus 
} from '../controllers/locationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin user routes
router.get('/users', protect, admin, getUsers);

// Admin location routes
router.get('/locations', protect, admin, getAllLocations);
router.post('/locations', protect, admin, createLocation);
router.put('/locations/:id', protect, admin, updateLocation);
router.patch('/locations/:id/toggle', protect, admin, toggleLocationStatus);

export default router;
