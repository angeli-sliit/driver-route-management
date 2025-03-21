import FuelPrice from '../models/FuelPrice.js';

// Update fuel price
export const updateFuelPrice = async (req, res) => {
  try {
    const { price } = req.body;
    const newFuelPrice = new FuelPrice({ price });
    await newFuelPrice.save();
    res.status(201).json(newFuelPrice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get current fuel price
export const getCurrentFuelPrice = async (req, res) => {
  try {
    const fuelPrice = await FuelPrice.findOne().sort({ effectiveDate: -1 });
    res.status(200).json(fuelPrice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};