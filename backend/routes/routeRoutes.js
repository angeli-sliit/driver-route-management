import express from 'express';
import { optimizeRoute } from '../controllers/routeController.js'; // Import optimizeRoute

const router = express.Router();
router.post('/optimize-fleet', optimizeRoute); // Use optimizeRoute here

export default router;