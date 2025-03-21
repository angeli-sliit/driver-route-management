import express from 'express';
import { registerUser, authUser } from '../controllers/userController.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', authUser);

export default router;