import express from 'express';
import { registerAdmin, loginAdmin, verifyAdminPassword } from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin registration
router.post('/register', registerAdmin); 

// Admin login
router.post('/login', loginAdmin);

// Verify admin token
router.get('/verify', protectAdmin, (req, res) => {
  res.status(200).json({ message: 'Valid admin token' });
});

router.post('/verify-password', protectAdmin, verifyAdminPassword);

export default router;