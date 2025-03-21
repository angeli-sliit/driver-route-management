import express from 'express';
import {
  registerDriver,
  loginDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  updateDriverLocation,
  uploadProfilePicture,
  getCurrentDriver 
} from '../controllers/driverController.js';
import { protectDriver } from '../middleware/authMiddleware.js';




const router = express.Router();

// Public routes
router.post('/register', registerDriver);
router.post('/login', loginDriver);

router.get('/me', protectDriver, getCurrentDriver); // New route to get current driver's details
router.get('/', protectDriver, getDrivers);
router.get('/:id', protectDriver, getDriverById);

router.put('/:id', protectDriver, updateDriver);
router.delete('/:id', protectDriver, deleteDriver);

// Add the update-location route
router.post('/update-location', protectDriver, updateDriverLocation);

// Add the upload-profile-picture route
router.post('/upload-profile-picture', protectDriver, uploadProfilePicture);

export default router;
