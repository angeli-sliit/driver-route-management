import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['available', 'on-route', 'unavailable'], 
    default: 'available' 
  },
  currentLocation: { lat: Number, lng: Number },
}, { timestamps: true });

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;