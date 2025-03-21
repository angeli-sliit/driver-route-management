import mongoose from 'mongoose';

const pickupSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  itemImage: { 
    type: String,
    required: false 
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(v) {
          return v.length === 2 && 
            v[0] >= -180 && v[0] <= 180 &&
            v[1] >= -90 && v[1] <= 90;
        },
        message: props => `Invalid coordinates [${props.value}]`
      }
    }
  },
  contactNumber: { 
    type: String, 
    required: true 
  },
  estimatedAmount: { 
    type: Number, 
    required: true 
  },
  chooseItem: { 
    type: String, 
    required: true 
  },
  address: { 
    type: String, 
    required: true 
  },
  pickupType: { 
    type: String, 
    required: true 
  },
  scheduledTime: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(v) {
        return v > Date.now();
      },
      message: 'Scheduled time must be in the future'
    }
  },
  status: { 
    type: String, 
    enum: ['pending', 'assigned', 'completed', 'cancelled'],
    default: 'pending' 
  },
  driver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Driver' 
  }
}, { 
  timestamps: true 
});

pickupSchema.index({ location: '2dsphere' });

const Pickup = mongoose.model('Pickup', pickupSchema);

export default Pickup; 
