import express from 'express';
import { getDynamicCategories } from '../controllers/dynamicCategoryController.js';

const router = express.Router();

// Public route to get dynamic category images
router.get('/', getDynamicCategories);

export default router;