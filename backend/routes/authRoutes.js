import express from 'express';
import { verifyToken } from '../controllers/authController.js';

const router = express.Router();

// Verify Firebase ID token route
router.post('/verify', verifyToken);

export default router;
