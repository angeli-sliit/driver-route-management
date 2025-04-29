import LeaveRequest from '../models/LeaveRequest.js';
import Driver from '../models/Driver.js';

// Create a new leave request
export const createLeaveRequest = async (req, res) => {
  try {
    const { startDate, endDate, reason, type } = req.body;
    const driverId = req.user._id; // Assuming user info is attached by auth middleware

    const leaveRequest = new LeaveRequest({
      driver: driverId,
      startDate,
      endDate,
      reason,
      type,
      status: 'Pending'
    });

    await leaveRequest.save();
    // Populate driver before sending response
    await leaveRequest.populate('driver', 'firstName lastName');

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

    console.log(`Updating leave request with ID: ${id}, Status: ${status}, Admin Response: ${adminResponse}`);

    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      console.log(`Leave request not found with ID: ${id}`);
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
        console.log(`Updating driver availability for driver ID: ${driver._id}`);
        // Mark the driver as unavailable for the leave period
        const startDate = new Date(leaveRequest.startDate);
        const endDate = new Date(leaveRequest.endDate);
        
        // Create an array of dates between start and end
        const dates = [];
        let currentDate = new Date(startDate);
        
        // Ensure we're working with date objects, not strings
        while (currentDate <= endDate) {
          // Create a new Date object for each date to avoid reference issues
          const dateToAdd = new Date(currentDate);
          dates.push(dateToAdd);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Mark attendance for each date with error handling
        const attendanceErrors = [];
        for (const date of dates) {
          try {
            await driver.markAttendance(date, 'unavailable');
          } catch (err) {
            console.error(`Error marking attendance for date ${date}:`, err);
            attendanceErrors.push({
              date: date.toISOString(),
              error: err.message
            });
          }
        }
        
        // If there were any errors marking attendance, include them in the response
        if (attendanceErrors.length > 0) {
          console.warn('Some attendance markings failed:', attendanceErrors);
          // You might want to handle these errors appropriately
          // For now, we'll continue with the leave request update
        }
      } else {
        console.log(`Driver not found for leave request ID: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Driver not found for this leave request'
        });
      }
    }

    await leaveRequest.save();
    // Populate driver before sending response
    await leaveRequest.populate('driver', 'firstName lastName');

    res.json({
      success: true,
      data: leaveRequest
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 