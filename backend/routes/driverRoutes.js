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
  getCurrentDriver ,
  updateDriverAvailability
  
} from '../controllers/driverController.js';
import { protectDriver, protectAdmin } from '../middleware/authMiddleware.js';




const router = express.Router();

// Public routes
router.post('/login', loginDriver);
router.post('/register', protectAdmin, registerDriver);
router.put('/:id', protectAdmin, updateDriver);
router.get('/', protectAdmin, getDrivers);

router.get('/me', protectDriver, getCurrentDriver); // New route to get current driver's details
router.put('/update-location', protectDriver, updateDriverLocation);
router.post('/upload-profile-picture', protectDriver, uploadProfilePicture);

router.get('/:id', protectDriver, getDriverById);
router.delete('/:id', protectDriver, deleteDriver);
router.put('/:id/availability', protectAdmin, );
router.put('/:id/availability', protectAdmin, updateDriverAvailability)
// router.put('/:id', protectDriver, updateDriver);


// Add the update-location route


// Add the upload-profile-picture route


export default router;
