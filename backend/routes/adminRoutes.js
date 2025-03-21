import express from 'express';
import { registerAdmin, loginAdmin } from '../controllers/adminController.js';

const router = express.Router();

// Admin registration
router.post('/register', registerAdmin); // Correct endpoint: /api/admins/register

// Admin login
router.post('/login', loginAdmin);

export default router;