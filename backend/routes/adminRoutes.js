import express from 'express';
import { registerAdmin, loginAdmin ,verifyAdminPassword} from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';


const router = express.Router();

// Admin registration
router.post('/register', registerAdmin); // Correct endpoint: /api/admins/register

// Admin login
router.post('/login', loginAdmin);
router.post('/verify-password', protectAdmin, verifyAdminPassword);

export default router;