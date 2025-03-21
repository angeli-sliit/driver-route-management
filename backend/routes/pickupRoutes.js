import express from 'express';
import {
  schedulePickup,
  assignPickup,
  updatePickupStatus,
  listPickups,
  optimizeRoute,
} from '../controllers/pickupController.js';
import { protectUser, protectDriver } from '../middleware/authMiddleware.js'; 
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });



const router = express.Router();

// Protected routes

router.post('/add', protectUser, upload.single('itemImage'), schedulePickup);
router.post('/assign', protectDriver, assignPickup);
router.post('/update-status', protectDriver, updatePickupStatus);
router.get('/me', protectDriver, listPickups);
router.post('/optimize-route', protectDriver, optimizeRoute);

router.get('/', protectDriver, listPickups);

export default router;