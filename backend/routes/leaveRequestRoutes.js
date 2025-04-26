import express from 'express';
import {
  createLeaveRequest,
  getDriverLeaveRequests,
  getAllLeaveRequests,
  updateLeaveRequest
} from '../controllers/leaveRequestController.js';
import { protectDriver, protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Driver routes
router.post('/', protectDriver, createLeaveRequest);
router.get('/my-requests', protectDriver, getDriverLeaveRequests);

// Admin routes
router.get('/all', protectAdmin, getAllLeaveRequests);
router.put('/:id', protectAdmin, updateLeaveRequest);

export default router; 