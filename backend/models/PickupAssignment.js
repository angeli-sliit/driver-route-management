import mongoose from 'mongoose';

const pickupAssignmentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  pickups: [{
    pickup: { type: mongoose.Schema.Types.ObjectId, ref: 'Pickup', required: true },
    sequence: { type: Number, required: true },
    estimatedArrivalTime: { type: Date, required: true },
    distance: { type: Number, default: 0 }, // in kilometers
    duration: { type: Number, default: 0 }, // in minutes
  }],
  routeDetails: {
    totalPoints: { type: Number, required: true },
    totalWeight: { type: Number, required: true },
    totalFuelCost: { type: Number, required: true },
    totalDistance: { type: Number, required: true }, // in kilometers
    totalDuration: { type: Number, required: true }, // in minutes
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    vehicleType: { type: String, required: true },
    vehiclePlateNumber: { type: String, required: true }
  },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  assignedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  notes: { type: String }
}, { timestamps: true });

// Index for efficient querying
pickupAssignmentSchema.index({ date: 1, driver: 1 });
pickupAssignmentSchema.index({ 'pickups.pickup': 1 });

const PickupAssignment = mongoose.model('PickupAssignment', pickupAssignmentSchema);
export default PickupAssignment; 