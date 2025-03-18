import express from 'express';
import Pickup from '../models/Pickup.js';
import { getOptimizedRoute } from '../utils/googleMaps.js';
import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// Controller Functions
export const optimizeRoute = async (req, res) => {
  try {
    const { origin, destination } = req.body;
    const optimizedRoute = await getOptimizedRoute(origin, destination);
    res.status(200).json({ optimizedRoute });
  } catch (err) {
    res.status(500).json({ error: 'Failed to optimize route: ' + err.message });
  }
};


export const schedulePickup = async (req, res) => {
  try {
    const { user, address, pickupType, scheduledTime } = req.body;
    const pickup = new Pickup({ user, address, pickupType, scheduledTime });
    await pickup.save();
    res.status(201).json(pickup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const assignPickup = async (req, res) => {
  try {
    const { pickupId, driverId } = req.body;
    const pickup = await Pickup.findById(pickupId);
    if (!pickup) return res.status(404).json({ error: "Pickup not found" });
    pickup.driver = driverId;
    pickup.status = 'assigned';
    await pickup.save();
    res.status(200).json(pickup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePickupStatus = async (req, res) => {
  try {
    const { pickupId, status } = req.body;
    const pickup = await Pickup.findById(pickupId);
    if (!pickup) return res.status(404).json({ error: "Pickup not found" });
    pickup.status = status;
    await pickup.save();
    res.status(200).json(pickup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listPickups = async (req, res) => {
  try {
    const pickups = await Pickup.find().populate('driver');
    res.status(200).json(pickups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Routes
router.post('/optimize-route', protect, optimizeRoute);
router.post('/assign', protect, assignPickup);
router.post('/update-status', protect, updatePickupStatus);
router.get('/', protect, listPickups);

export default router;
