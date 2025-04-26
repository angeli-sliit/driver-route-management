import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  adminResponse: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to check if request is made at least 24 hours before
leaveRequestSchema.pre('save', function(next) {
  const now = new Date();
  const startDate = new Date(this.startDate);
  const hoursDiff = (startDate - now) / (1000 * 60 * 60);
  
  if (hoursDiff < 24) {
    next(new Error('Leave requests must be made at least 24 hours in advance'));
  }
  next();
});

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

export default LeaveRequest; 