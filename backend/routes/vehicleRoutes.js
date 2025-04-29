import express from 'express';
import Vehicle from '../models/Vehicle.js';
const router = express.Router();

// GET /api/vehicles?registrationNumber=XXX
router.get('/', async (req, res) => {
  try {
    const { registrationNumber } = req.query;
    if (!registrationNumber) {
      return res.status(400).json({ error: 'registrationNumber is required' });
    }
    const vehicle = await Vehicle.findOne({ registrationNumber });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ vehicle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add this route to get all vehicles
router.get('/all', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({});
    res.json({ vehicles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 