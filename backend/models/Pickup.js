import mongoose from 'mongoose';

const pickupSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  contactNumber: { type: String, required: true },
  estimatedAmount: { type: Number, required: true },
  chooseItem: { type: String, required: true },
  address: { type: String, required: true },
  pickupType: { type: String, required: true },
  scheduledTime: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'assigned', 'completed', 'cancelled'], default: 'pending' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  image: { type: String }, // Stores file path/URL
  weight: { type: Number ,min: [1, 'Weight must be at least 1kg'],max: [10000, 'Weight cannot exceed 10,000kg']}, // Actual collected weight
  amount: { type: Number, min: [0, 'Amount cannot be negative'] }, // Calculated payment amount
  cancellationReason: { type: String }, // For cancelled pickups
  // New fields for optimization details
  optimizationDetails: {
    totalPoints: { type: Number, default: 0 },
    totalWeight: { type: Number, default: 0 },
    totalFuelCost: { type: Number, default: 0 },
    routeSequence: { type: Number, default: 0 },
    estimatedArrivalTime: { type: Date },
    distance: { type: Number, default: 0 }, // in kilometers
    duration: { type: Number, default: 0 }, // in minutes
    assignedAt: { type: Date },
    fuel: { type: Number, default: 0 }, // per-pickup fuel
    fuelCost: { type: Number, default: 0 }, // per-pickup fuel cost
    metalCost: { type: Number, default: 0 }, // per-pickup metal cost
    totalCost: { type: Number, default: 0 } // per-pickup total cost
  }
}, { timestamps: true });


pickupSchema.index({ location: '2dsphere' });

const Pickup = mongoose.model('Pickup', pickupSchema);
export default Pickup;