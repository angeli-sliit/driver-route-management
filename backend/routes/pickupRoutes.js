import express from 'express';
import { schedulePickup, assignPickup, updatePickupStatus, listPickups, optimizeRoute } from '../controllers/pickupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/schedule', schedulePickup);
router.post('/assign', protect, assignPickup);
router.post('/update-status', protect, updatePickupStatus);
router.post('/optimize-route', protect, optimizeRoute); // Added route for optimization
router.get('/', protect, listPickups);

export default router;
