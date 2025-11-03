import express from 'express';
import { sendTestEmailHandler } from '../controllers/testEmailController.js';

const router = express.Router();

/**
 * Test Email Route
 * NO AUTHENTICATION REQUIRED - FOR TESTING ONLY
 * 
 * Usage: GET /api/test-email?email=your@email.com
 * 
 * ⚠️ WARNING: Remove this route in production!
 * This endpoint bypasses authentication for testing purposes.
 */
router.get('/', sendTestEmailHandler);

export default router;
