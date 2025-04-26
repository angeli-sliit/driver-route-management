import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicleType: {
    type: String,
    required: true,
    enum: ['Toyota Dyna', 'Isuzu Elf', 'Mitsubishi Canter', 'Tata LPT 709/1109']
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  maxCapacity: {
    type: Number,
    required: true
  },
  currentLoad: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['available', 'in-use', 'maintenance'],
    default: 'available'
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  fuelConsumption: {
    type: Number,
    required: true
  },
  lastMaintenanceDate: {
    type: Date
  },
  nextMaintenanceDate: {
    type: Date
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  }
}, {
  timestamps: true
});

// Create geospatial index
vehicleSchema.index({ currentLocation: '2dsphere' });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle; 