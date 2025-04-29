import express from 'express';
import multer from 'multer'; // Add this import for multer
import {
  schedulePickup,
  assignPickup,
  updatePickupStatus,
  listPickups,
  getPickupById,
  getAllPickups,
  generatePickupPDF,
  getUserScheduledPickups,
  optimizeRoute,
  updatePickupDetails,
  deletePickup,
  assignDailyPickups,
  confirmPickup, 
  cancelPickup,
  getDailySummary,
  optimizeAndAssignPickups,
  getAssignmentsByDate,
  getDriverRouteForToday
} from '../controllers/pickupController.js';

import { protectUser, protectDriver, protectAny, protectAdmin } from '../middleware/authMiddleware.js';


const router = express.Router();

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // specify the folder to store uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // specify the filename
  },
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

// Protected routes
router.post('/add', protectAny, upload.single('itemImage'), schedulePickup);
router.post('/assign', protectAdmin, assignPickup);
router.post('/assignDailyPickups', protectAdmin, assignDailyPickups);
router.post('/update-status', protectDriver, updatePickupStatus);
router.get('/driver/:driverId', protectDriver, listPickups);
router.post('/optimize-route', protectDriver, optimizeRoute);
router.get('/user/scheduled-pickups', protectUser, getUserScheduledPickups);
router.get('/nowShedule/:id', protectAny, getPickupById);
router.put('/pickup/:id', protectUser, updatePickupStatus);
router.get('/all', protectAdmin, getAllPickups);
router.get('/generate-pdf', protectDriver, generatePickupPDF);
router.put('/update/:id', protectUser, updatePickupDetails);
router.delete('/delete/:id', protectUser, deletePickup);
router.put('/:id/confirm', protectDriver, upload.single('image'), confirmPickup);
router.put('/:id/cancel', protectDriver, cancelPickup);
router.get('/daily-summary/:date', protectAdmin, getDailySummary);

// Optimize and assign pickups (admin only)
router.post('/optimize-and-assign', protectAdmin, optimizeAndAssignPickups);

// Admin routes
router.post('/optimize', protectAdmin, optimizeAndAssignPickups);

router.get('/assignments', protectAdmin, getAssignmentsByDate);

// Add this route for driver route
router.get('/driver-today-route', protectDriver, getDriverRouteForToday);

export default router;
