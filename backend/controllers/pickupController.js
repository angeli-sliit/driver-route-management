import Pickup from '../models/Pickup.js';
import Driver from '../models/Driver.js';
import User from '../models/User.js';
import { getOptimizedRoute } from '../utils/googleMaps.js';

// Optimize route using Google Maps API
export const optimizeRoute = async (req, res) => {
  try {
    const { origin, destination, waypoints } = req.body;

    // Ensure waypoints are provided if needed
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const optimizedRoute = await getOptimizedRoute(origin, destination, waypoints);
    res.status(200).json({ optimizedRoute });
  } catch (err) {
    res.status(500).json({ error: 'Failed to optimize route: ' + err.message });
  }
};

// Schedule a pickup
export const schedulePickup = async (req, res) => {
  try {
    const { contactNumber, estimatedAmount, chooseItem, address, pickupType, scheduledTime, location } = req.body;

    // Validate location
    if (!location || !location.coordinates || !location.type) {
      return res.status(400).json({ error: 'Location data is required' });
    }

    // Validate coordinates format
    if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return res.status(400).json({ error: 'Invalid coordinates format' });
    }

    // Validate location type
    if (location.type !== 'Point') {
      return res.status(400).json({ error: 'Invalid location type' });
    }

    // Validate scheduledTime is in the future
    const scheduledDateTime = new Date(scheduledTime);
    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    // Validate pickupType
    const validPickupTypes = ['general', 'urgent', 'fragile'];
    if (!validPickupTypes.includes(pickupType)) {
      return res.status(400).json({ error: 'Invalid pickup type' });
    }

    const pickup = new Pickup({ 
      user: req.user._id,
      contactNumber,
      estimatedAmount,
      chooseItem,
      address,
      pickupType,
      scheduledTime: scheduledDateTime,
      location: {
        type: location.type,
        coordinates: location.coordinates
      }
    });

    await pickup.save();
    res.status(201).json(pickup);
  } catch (err) {
    console.error('Error scheduling pickup:', err);
    res.status(400).json({ error: err.message });
  }
};

// Assign a pickup to a driver (ADD THIS EXPORT)
export const assignPickup = async (req, res) => {
  try {
    const { pickupId, driverId } = req.body;

    const pickup = await Pickup.findById(pickupId);
    const driver = await Driver.findById(driverId);

    if (!pickup) return res.status(404).json({ error: "Pickup not found" });
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    if (driver.status !== 'available') {
      return res.status(400).json({ error: "Driver is not available" });
    }

    // Check if pickup is already assigned
    if (pickup.driver) {
      return res.status(400).json({ error: "Pickup is already assigned to a driver" });
    }

    pickup.driver = driverId;
    pickup.status = 'assigned';
    await pickup.save();

    // Update driver status to busy
    driver.status = 'busy';
    await driver.save();

    res.status(200).json(pickup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update pickup status
export const updatePickupStatus = async (req, res) => {
  try {
    const { pickupId, status } = req.body;

    const validStatuses = ['pending', 'assigned', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const pickup = await Pickup.findById(pickupId);
    if (!pickup) return res.status(404).json({ error: "Pickup not found" });

    // Additional status transition checks
    if (status === 'completed' && pickup.status !== 'assigned') {
      return res.status(400).json({ error: "Pickup must be assigned before completion" });
    }
    if (status === 'cancelled' && pickup.status === 'completed') {
      return res.status(400).json({ error: "Completed pickups cannot be cancelled" });
    }

    // Check 24-hour modification window
    const timeDiff = pickup.scheduledTime - Date.now();
    if (timeDiff < 24 * 60 * 60 * 1000) {
      return res.status(400).json({ 
        error: "Cannot modify within 24 hours of scheduled time" 
      });
    }

    pickup.status = status;
    await pickup.save();
    res.status(200).json(pickup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List all pickups
export const listPickups = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filter = req.originalUrl.includes('/me') 
      ? { driver: req.user._id, scheduledTime: { $gte: today }, status: 'assigned' }
      : { status: 'assigned' };

    // Add pagination and filtering options
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const query = { ...filter };

    if (status) query.status = status;
    if (startDate && endDate) {
      query.scheduledTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const pickups = await Pickup.find(query)
      .populate('driver', 'firstName lastName')
      .populate('user', 'name')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json(pickups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};