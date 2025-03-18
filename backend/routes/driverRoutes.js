import express from 'express';
import {
  registerDriver,
  loginDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  updateDriverLocation, // Ensure this is imported
} from '../controllers/driverController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerDriver);
router.post('/login', loginDriver);

// Protected routes (require JWT authentication)
router.get('/', protect, getDrivers);
router.get('/:id', protect, getDriverById);
router.put('/:id', protect, updateDriver);
router.delete('/:id', protect, deleteDriver);

// Add the update-location route
router.post('/update-location', protect, updateDriverLocation);

export default router;