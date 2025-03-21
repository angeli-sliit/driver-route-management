import mongoose from 'mongoose';

const fuelPriceSchema = new mongoose.Schema({
  price: { type: Number, required: true },
  effectiveDate: { type: Date, default: Date.now }
});

const FuelPrice = mongoose.model('FuelPrice', fuelPriceSchema);
export default FuelPrice;