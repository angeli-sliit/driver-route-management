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
    default: 'notAssigned'
  },

  joinedDate: { type: Date, required: true },

  status: {  
    type: String, 
    enum: ['available', 'unavailable'],
    default: 'unavailable'
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  vehicleNumber: {
    type: String,
    sparse: true, // This allows multiple null values
    unique: true  // This ensures uniqueness for non-null values
  },
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
      required: true,
      default: 'available'
    }
  }],
  shifts: [{
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['active', 'completed', 'cancelled'],
      default: 'active'
    }
  }],
  vehicleType: {
    type: String,
    enum: ['Toyota Dyna', 'Isuzu Elf', 'Mitsubishi Canter', 'Tata LPT 709/1109'],
    required: true
  },
});

// Add validation to ensure drivers have vehicles when marked as available
driverSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'available') {
    if (!this.vehicle) {
      throw new Error('Driver must have a vehicle assigned to be marked as available');
    }
  }
  next();
});

// Add method to check if driver is available for a specific date
driverSchema.methods.isAvailableForDate = function(date) {
  const targetDate = new Date(date);
  const attendance = this.attendance.find(a => 
    new Date(a.date).toDateString() === targetDate.toDateString()
  );
  
  return this.status === 'available' && 
         this.employeeStatus === 'notAssigned' &&
         attendance?.status === 'available' &&
         !!this.vehicle;
};

// Add method to mark attendance for a date
driverSchema.methods.markAttendance = async function(date, status) {
  try {
    // Ensure date is a proper Date object
    const targetDate = new Date(date);
    
    // Set time to midnight to ensure consistent date comparison
    targetDate.setHours(0, 0, 0, 0);
    
    // Find existing attendance for this date
    const existingAttendance = this.attendance.find(a => {
      const attendanceDate = new Date(a.date);
      attendanceDate.setHours(0, 0, 0, 0);
      return attendanceDate.getTime() === targetDate.getTime();
    });

    if (existingAttendance) {
      existingAttendance.status = status;
    } else {
      this.attendance.push({
        date: targetDate,
        status: status
      });
    }
    
    return this.save();
  } catch (error) {
    console.error('Error in markAttendance:', error);
    throw error;
  }
};

driverSchema.index({ currentLocation: '2dsphere' });

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;