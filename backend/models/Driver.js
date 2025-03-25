import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  routes: [{
    date: Date,
    pickups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pickup' }],
    totalDistance: Number,
    fuelCost: Number
  }],
  
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
    enum: ['assigned', 'notAssigned'],  
  },

  joinedDate: { type: Date, required: true },

  status: {  
    type: String, 
    enum: ['available', 'unavailable'],
    default: 'unavailable'
  },
  vehicleType: { 
    type: String, 
    enum: ['Toyota Dyna', 'Isuzu Elf', 'Mitsubishi Canter', 'Tata LPT 709/1109'],
    required: true
  },
  vehicleNumber: { type: String, unique: true },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(v) {
          return v[0] >= -180 && v[0] <= 180 && 
                 v[1] >= -90 && v[1] <= 90;
        },
        message: props => `Invalid coordinates!`
      },
      default: [79.8612, 6.9271] // Default to Colombo coordinates
    }
  },
  profilePicture: { type: String },
  
  attendance: [{
    date: { 
      type: Date, 
      required: true,
      default: Date.now
    },
    status: { 
      type: String, 
      enum: ['available', 'unavailable'],
      required: true
    }
  }]
}, { timestamps: true }); // Moved timestamps to the correct position

driverSchema.index({ currentLocation: '2dsphere' });

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;