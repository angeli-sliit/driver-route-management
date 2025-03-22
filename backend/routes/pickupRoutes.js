import express from 'express';
import multer from 'multer'; // Add this import for multer
import {
  schedulePickup,
  assignPickup,
  assignPickups,
  updatePickupStatus,
  listPickups,
  getPickupById,
  getAllPickups,
  generatePickupPDF,
  getUserScheduledPickups,
  optimizeRoute,
  updatePickupDetails,
  deletePickup,
  optimizedAssignment
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
router.post('/assign',  protectAdmin,assignPickup);
router.post('/update-status', protectDriver, updatePickupStatus);
router.get('/me', protectDriver, listPickups);
router.post('/optimize-route', protectDriver, optimizeRoute);
router.get('/user/scheduled-pickups', protectUser, getUserScheduledPickups);
router.get('/nowShedule/:id', protectAny, getPickupById);
router.get('/', protectDriver, listPickups);
router.put('/pickup/:id', protectUser, updatePickupStatus);
router.get('/all', protectAdmin, getAllPickups);
router.get('/generate-pdf', protectDriver, generatePickupPDF);
router.put('/update/:id', protectUser, updatePickupDetails);
router.delete('/delete/:id', protectUser, deletePickup);

router.post('/assign-pickups',protectAdmin, getAllPickups );
router.post('/optimized-assignment', protectAdmin, optimizedAssignment);


export default router;
