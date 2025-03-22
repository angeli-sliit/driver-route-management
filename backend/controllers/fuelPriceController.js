import FuelPrice from '../models/FuelPrice.js';

// Update fuel price
export const updateFuelPrice = async (req, res) => {
  try {
    const { price } = req.body;

    const updatedFuelPrice = await FuelPrice.findOneAndUpdate(
      {}, // match any document
      { price }, 
      { new: true, upsert: true } // create if not exists
    );

    res.status(200).json(updatedFuelPrice);
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