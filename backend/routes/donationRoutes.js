import express from 'express';
import {
  getUserDonations,
  getUserDonationSummary,
  getAllDonations,
  getDonationStats,
  updateDonationStatus,
  exportDonations
} from '../controllers/donationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// User routes (Protected)
router.get('/user', protect, getUserDonations);
router.get('/user/summary', protect, getUserDonationSummary);

// Admin routes (Protected + Admin)
router.get('/admin/all', protect, admin, getAllDonations);
router.get('/admin/stats', protect, admin, getDonationStats);
router.get('/admin/export', protect, admin, exportDonations);
router.patch('/admin/:id', protect, admin, updateDonationStatus);

export default router;