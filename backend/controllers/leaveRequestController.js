import LeaveRequest from '../models/LeaveRequest.js';
import Driver from '../models/Driver.js';

// Create a new leave request
export const createLeaveRequest = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    const driverId = req.user._id; // Assuming user info is attached by auth middleware

    const leaveRequest = new LeaveRequest({
      driver: driverId,
      startDate,
      endDate,
      reason,
      status: 'Pending'
    });

    await leaveRequest.save();

    res.status(201).json({
      success: true,
      data: leaveRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get driver's leave requests
export const getDriverLeaveRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ driver: req.user._id })
      .sort('-createdAt');

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all leave requests (admin only)
export const getAllLeaveRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({})
      .populate('driver', 'firstName lastName')
      .sort('-createdAt');

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update leave request status (admin only)
export const updateLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Update the leave request
    leaveRequest.status = status;
    if (adminResponse) {
      leaveRequest.adminResponse = adminResponse;
    }

    // If the request is approved, update the driver's availability for the leave period
    if (status === 'Approved') {
      const driver = await Driver.findById(leaveRequest.driver);
      if (driver) {
        // Mark the driver as unavailable for the leave period
        const startDate = new Date(leaveRequest.startDate);
        const endDate = new Date(leaveRequest.endDate);
        
        // Create an array of dates between start and end
        const dates = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Mark attendance for each date
        for (const date of dates) {
          await driver.markAttendance(date, 'unavailable');
        }
      }
    }

    await leaveRequest.save();

    res.json({
      success: true,
      data: leaveRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 