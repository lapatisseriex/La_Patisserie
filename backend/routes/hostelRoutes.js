import express from 'express';
import {
  getHostelsByLocation,
  getAllHostels,
  getHostelsByLocationAdmin,
  createHostel,
  updateHostel,
  deleteHostel,
  toggleHostelStatus,
  getHostelDetails
} from '../controllers/hostelController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/location/:locationId', getHostelsByLocation);

// Admin routes (protected)
router.use(protect); // Apply auth middleware to all routes below

router.get('/', getAllHostels);
router.get('/:id/details', getHostelDetails);
router.get('/location/:locationId/admin', getHostelsByLocationAdmin);
router.post('/', createHostel);
router.put('/:id', updateHostel);
router.delete('/:id', deleteHostel);
router.patch('/:id/toggle', toggleHostelStatus);

export default router;
