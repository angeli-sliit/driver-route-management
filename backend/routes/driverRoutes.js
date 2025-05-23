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
  getCurrentDriver,
  updateDriverAvailability,
  assignVehicle,
  markAttendance,
  bulkMarkAttendance,
  getDriverAvailability,
  setupDriversForDate
} from '../controllers/driverController.js';
import { protectDriver, protectAdmin } from '../middleware/authMiddleware.js';
import multer from 'multer';
import Driver from '../models/Driver.js';

const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// Public routes
router.post('/login', loginDriver);
router.post('/register', protectAdmin, registerDriver);

// Admin routes
router.get('/', protectAdmin, getDrivers);

// Driver routes
router.get('/me', protectDriver, getCurrentDriver);
router.put('/update-location', protectDriver, updateDriverLocation);
router.post('/upload-profile-picture', protectDriver, upload.single('profilePicture'), uploadProfilePicture);

// Attendance routes
router.post('/mark-attendance', protectAdmin, markAttendance);
router.post('/bulk-mark-attendance', protectAdmin, bulkMarkAttendance);

// Get driver availability - MUST be before /:id routes
router.get('/availability', protectAdmin, getDriverAvailability);

// Setup helper route
router.post('/setup-for-date', protectAdmin, setupDriversForDate);

// Vehicle assignment routes
router.post('/assign-vehicle', protectAdmin, assignVehicle);

// ID-based routes - MUST be after specific routes
router.get('/:id', protectDriver, getDriverById);
router.put('/:id', protectAdmin, updateDriver);
router.delete('/:id', protectAdmin, deleteDriver);
router.put('/:id/availability', protectAdmin, updateDriverAvailability);

// Add attendance route
router.post('/:id/attendance', protectAdmin, async (req, res) => {
  try {
    const { date, status } = req.body;
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ 
        success: false, 
        message: 'Driver not found' 
      });
    }

    await driver.markAttendance(date, status);

    // Also update the driver's overall status
    driver.status = status;
    await driver.save();

    res.json({ 
      success: true, 
      message: 'Attendance marked successfully' 
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error marking attendance' 
    });
  }
});

export default router;
