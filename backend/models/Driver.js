import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  email: { 
    type: String, 
    unique: true, 
    required: true, 
    match: /^\S+@\S+\.\S+$/ 
  },
  password: { type: String, required: true },
  birthday: { type: Date, required: true },
  nationality: { type: String, required: true },
  employeeId: { type: String, unique: true, required: true },
  employeeType: { 
    type: String, 
    enum: ['Permanent', 'Contract', 'Trainee'], 
    required: true 
  },
  nic: { type: String, unique: true, required: true },
  employeeStatus: { 
    type: String, 
    enum: ['Active', 'Inactive', 'On Leave'], 
    default: 'Active' 
  },
  joinedDate: { type: Date, required: true },
  status: {  
    type: String, 
    enum: ['available', 'on-route', 'unavailable'], 
    default: 'available' 
  },
  vehicleType: { type: String },
  vehicleNumber: { type: String, unique: true },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  profilePicture: { type: String }
}, { timestamps: true });

driverSchema.index({ currentLocation: '2dsphere' });

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;