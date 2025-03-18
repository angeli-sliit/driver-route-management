import mongoose from 'mongoose';

const pickupSchema = new mongoose.Schema({
  user: { type: String, required: true },
  address: { type: String, required: true },
  pickupType: { type: String, required: true },
  scheduledTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'assigned', 'in-progress', 'completed'], 
    default: 'pending' 
  },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  proofImage: { type: String } // URL for pickup completion proof image
}, { timestamps: true });

const Pickup = mongoose.model('Pickup', pickupSchema);
export default Pickup; 