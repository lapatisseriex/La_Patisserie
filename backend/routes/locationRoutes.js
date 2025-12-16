import express from 'express';
import { 
  getLocations,
  checkDelivery,
  getGeoLocations
} from '../controllers/locationController.js';

const router = express.Router();

// Public routes
router.get('/', getLocations);
router.post('/check-delivery', checkDelivery);
router.get('/geo', getGeoLocations);

export default router;
