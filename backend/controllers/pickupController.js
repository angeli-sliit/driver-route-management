import Pickup from '../models/Pickup.js';
import Driver from '../models/Driver.js';
import { PDFDocument } from 'pdf-lib';
import User from '../models/User.js';
import { getOptimizedRoute } from '../utils/googleMaps.js';
import { calculateDistance } from '../utils/distanceCalculator.js';
import FuelPrice from '../models/FuelPrice.js'; 
import { sendEmail } from '../utils/emailService.js';
import { enhancedOptimizePickups } from '../utils/enhancedOptimization.js';
import { optimizeVehicleRoutes } from '../utils/orsOptimizer.js';
import Vehicle from '../models/Vehicle.js';
import { optimizeAndSchedulePickups } from '../services/optimizationService.js';
//import { generateDailySummaryPDF } from '../utils/pdfGenerator.js';



const FUEL_CONSUMPTION = {
  'Toyota Dyna': 0.12,
  'Isuzu Elf': 0.15,
  'Mitsubishi Canter': 0.13,
  'Tata LPT 709/1109': 0.18
};


// Optimize route using Google Maps API
export const optimizeRoute = async (req, res) => {
  try {
    const { origin, destination, waypoints } = req.body;

    // Ensure waypoints are provided if needed
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const optimizedRoute = await getOptimizedRoute(origin, destination, waypoints);
    res.status(200).json({ optimizedRoute });
  } catch (err) {
    res.status(500).json({ error: 'Failed to optimize route: ' + err.message });
  }
};

// Schedule a pickup
export const schedulePickup = async (req, res) => {
  try {
    const { contactNumber, estimatedAmount, chooseItem, address, pickupType, scheduledTime, location } = req.body;

    // Validate location
    if (!location || !location.coordinates || !location.type) {
      return res.status(400).json({ error: 'Location data is required' });
    }

    // Validate coordinates format
    if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return res.status(400).json({ error: 'Invalid coordinates format' });
    }

    // Validate location type
    if (location.type !== 'Point') {
      return res.status(400).json({ error: 'Invalid location type' });
    }

    // Validate scheduledTime is in the future
    const scheduledDateTime = new Date(scheduledTime);
    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    // Validate pickupType
    const validPickupTypes = ['general', 'urgent', 'fragile'];
    if (!validPickupTypes.includes(pickupType)) {
      return res.status(400).json({ error: 'Invalid pickup type' });
    }

    const pickup = new Pickup({ 
      user: req.user._id,
      contactNumber,
      estimatedAmount,
      chooseItem,
      address,
      pickupType,
      scheduledTime: scheduledDateTime,
      location: {
        type: location.type,
        coordinates: location.coordinates
      }
    });

    await pickup.save();
    res.status(201).json(pickup);
  } catch (err) {
    console.error('Error scheduling pickup:', err);
    res.status(400).json({ error: err.message });
  }
};

// Assign pickups to drivers
export const assignPickup = async (req, res) => {
  try {
    const { date } = req.body;

    // Fetch all pending pickups for the given date
    const pickups = await Pickup.find({
      scheduledTime: { $gte: new Date(date) },
      status: 'pending',
    });

    // Fetch all available drivers
    const drivers = await Driver.find({ status: 'available' });

    if (drivers.length === 0) {
      return res.status(400).json({ error: 'No available drivers' });
    }

    // Start timing the assignment process
    console.time('Assign pickups');

    // Start timeout tracking
    const startTime = Date.now();
    const timeout = 10000; // 10 seconds

    // Batch updates
    const pickupUpdates = [];
    const driverUpdates = [];

    // Assign pickups to drivers
    for (const pickup of pickups) {
      // Check if the process has exceeded the timeout
      if (Date.now() - startTime > timeout) {
        throw new Error('Assignment process timed out');
      }

      console.log(`Processing pickup: ${pickup._id}`); // Log pickup ID
      let minDistance = Infinity;
      let assignedDriver = null;

      // Find the nearest driver for this pickup
      for (const driver of drivers) {
        console.log(`Checking driver: ${driver._id}`); // Log driver ID

        const distance = calculateDistance(
          driver.currentLocation.coordinates[1],
          driver.currentLocation.coordinates[0],
          pickup.location.coordinates[1],
          pickup.location.coordinates[0]
        );

        if (distance < minDistance) {
          minDistance = distance;
          assignedDriver = driver;
        }
      }

      if (assignedDriver) {
        // Assign pickup to the nearest driver
        pickupUpdates.push({
          updateOne: {
            filter: { _id: pickup._id },
            update: { $set: { driver: assignedDriver._id, employeeStatus: 'assigned' } },
          },
        });

        // Update driver status to busy
        driverUpdates.push({
          updateOne: {
            filter: { _id: assignedDriver._id },
            update: { $set: { employeeStatus: 'employeeStatus' } },
          },
        });
      }
    }

    // Perform batch updates
    await Pickup.bulkWrite(pickupUpdates);
    await Driver.bulkWrite(driverUpdates);

    // End timing the assignment process
    console.timeEnd('Assign pickups');

    res.status(200).json({ message: 'Pickups assigned successfully' });
  } catch (err) {
    console.error('Error in assignPickups:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update pickup status
export const updatePickupStatus = async (req, res) => {
  try {
    const { pickupId, status } = req.body;

    const validStatuses = ['pending', 'assigned', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const pickup = await Pickup.findById(pickupId);
    if (!pickup) return res.status(404).json({ error: "Pickup not found" });

    // Additional status transition checks
    if (status === 'completed' && pickup.status !== 'assigned') {
      return res.status(400).json({ error: "Pickup must be assigned before completion" });
    }
    if (status === 'cancelled' && pickup.status === 'completed') {
      return res.status(400).json({ error: "Completed pickups cannot be cancelled" });
    }

    // Check 24-hour modification window
    const timeDiff = pickup.scheduledTime.getTime() - Date.now();
      if (timeDiff < 24 * 60 * 60 * 1000) {
        return res.status(400).json({ 
          error: "Cannot modify within 24 hours of scheduled time" 
        });
    }

    pickup.status = status;
    await pickup.save();
    res.status(200).json(pickup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List all pickups
// In pickupController.js
export const listPickups = async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const pickups = await Pickup.find({ 
      driver: driverId,
      status: 'assigned'
    }).populate('user driver');
    
    res.status(200).json(pickups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// pickupController.js
export const getPickupById = async (req, res) => {
  try {
    console.log('Pickup ID from request:', req.params.id); // Debugging log

    const pickup = await Pickup.findById(req.params.id)
      .populate('user', 'name email')
      .populate('driver', 'firstName lastName');

    if (!pickup) return res.status(404).json({ error: 'Pickup not found' });

    // Authorization checks
    if (req.role === 'user' && !pickup.user.equals(req.user._id)) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    if (req.role === 'driver' && (!pickup.driver || !pickup.driver.equals(req.driver._id))) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    res.status(200).json(pickup);
  } catch (error) {
    console.error('Error fetching pickup details:', error); // Debugging log
    res.status(500).json({ error: error.message });
  }
};

// Controller
export const getAllPickups = async (req, res) => {
  try {
    const { date } = req.query;

    // If a date is provided, filter pickups for that specific date
    const query = date ? { 
      scheduledTime: { 
        $gte: new Date(new Date(date).setHours(0, 0, 0, 0)), // Start of the day
        $lt: new Date(new Date(date).setHours(23, 59, 59, 999)) // End of the day
      } 
    } : {};

    const pickups = await Pickup.find(query)
      .populate('driver', 'firstName lastName')
      .populate('user', 'name');

    res.status(200).json(pickups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const generatePickupPDF = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Start of today
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // End of today

    const query = { 
      scheduledTime: { 
        $gte: startOfDay, 
        $lt: endOfDay 
      } 
    };

    const pickups = await Pickup.find(query)
      .populate('driver', 'firstName lastName vehicleType')
      .populate('user', 'name');

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;

    let y = height - 50;
    page.drawText('Today\'s Pickup Schedule Report', { x: 50, y, size: fontSize + 4, bold: true });
    y -= 30;

    pickups.forEach(pickup => {
      const text = `
        User: ${pickup.user.name}
        Address: ${pickup.address}
        Scheduled Time: ${pickup.scheduledTime.toLocaleString()}
        Driver: ${pickup.driver.firstName} ${pickup.driver.lastName}
        Vehicle: ${pickup.driver.vehicleType}
        Fuel Cost: Rs. ${pickup.fuelCost.toFixed(2)}
      `;
      page.drawText(text, { x: 50, y, size: fontSize });
      y -= 80; // Move down for the next pickup
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBytes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserScheduledPickups = async (req, res) => {
  try {
    const userId = req.user._id;

    const pickups = await Pickup.find({ user: userId })
      .populate('driver', 'firstName lastName')
      .sort({ scheduledTime: 1 });

    res.status(200).json(pickups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update pickup details

export const updatePickupDetails = async (req, res) => {
  try {
    const { contactNumber, chooseItem, estimatedAmount, pickupType, address, scheduledTime, location } = req.body;
    const pickup = await Pickup.findById(req.params.id);

    if (!pickup) return res.status(404).json({ error: "Pickup not found" });

    // Validate location coordinates format
    if (location?.coordinates) {
      if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
        return res.status(400).json({ error: 'Invalid coordinates format' });
      }
      // Ensure coordinates are numbers
      if (typeof location.coordinates[0] !== 'number' || typeof location.coordinates[1] !== 'number') {
        return res.status(400).json({ error: 'Coordinates must be numbers' });
      }
    }

    // Update pickup details including location
    const updatedPickup = await Pickup.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          contactNumber,
          chooseItem,
          estimatedAmount,
          pickupType,
          address,
          scheduledTime: new Date(scheduledTime),
          location: location // Expects { type: 'Point', coordinates: [lng, lat] }
        }
      },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedPickup);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};

export const deletePickup = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) return res.status(404).json({ error: 'Pickup not found' });

    // Check if the pickup is within 24 hours of scheduled time
    const timeDiff = pickup.scheduledTime - Date.now();
    if (timeDiff < 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: 'Cannot delete. Pickup time is less than 24 hours away.' });
    }

    // If the pickup is assigned, set the driver's status back to 'available'
    if (pickup.driver) {
      const driver = await Driver.findById(pickup.driver);
      if (driver) {
        driver.status = 'available';
        await driver.save();
      }
    }

    await Pickup.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Pickup deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};


// Assign pickups to drivers
export const assignPickups = async (req, res) => {
  try {
    const { date } = req.body;
    const fuelPrice = await FuelPrice.findOne().sort({ effectiveDate: -1 });
    
    const [pickups, drivers] = await Promise.all([
      Pickup.find({
        scheduledTime: { $gte: new Date(date) },
        status: 'pending'
      }),
      Driver.find({ status: 'available' })
    ]);

    const assignments = [];
    const sortedPickups = [...pickups].sort((a, b) => b.estimatedAmount - a.estimatedAmount);

    drivers.forEach(driver => {
      let capacity = TRUCK_CAPACITY[driver.vehicleType] || 0;
      
      sortedPickups.forEach(pickup => {
        if (capacity >= pickup.estimatedAmount && !pickup.driver) {
          const distance = calculateDistance(
            driver.currentLocation.coordinates[1],
            driver.currentLocation.coordinates[0],
            pickup.location.coordinates[1],
            pickup.location.coordinates[0]
          );
          
          assignments.push({
            pickupId: pickup._id,
            driverId: driver._id,
            fuelCost: distance * FUEL_CONSUMPTION * fuelPrice.price
          });
          
          capacity -= pickup.estimatedAmount;
          pickup.driver = driver._id;
        }
      });
    });

    // Bulk update pickups
    await Pickup.bulkWrite(assignments.map(assn => ({
      updateOne: {
        filter: { _id: assn.pickupId },
        update: { 
          $set: { 
            driver: assn.driverId,
            status: 'assigned',
            fuelCost: assn.fuelCost
          }
        }
      }
    })));

    // Update driver statuses (fixed section)
    await Driver.bulkWrite(drivers.map(driver => ({
      updateOne: {
        filter: { _id: driver._id },
        update: { $set: { status: 'busy' } }
      }
    })));

    res.status(200).json({ 
      message: `Assigned ${assignments.length} pickups successfully`,
      assignments
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




export const optimizeAndAssignPickups = async (req, res) => {
    try {
        const { date } = req.body;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required for optimization'
            });
        }

        // Validate date format
        const selectedDate = new Date(date);
        if (isNaN(selectedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        // Call the optimization service
        const result = await optimizeAndSchedulePickups(date);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(200).json({
            success: true,
            message: 'Pickups optimized and assigned successfully',
            data: {
                assignments: result.assignments,
                unassignedPickups: result.unassignedPickups
            }
        });
    } catch (error) {
        console.error('Error in optimizeAndAssignPickups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to optimize and assign pickups',
            error: error.message
        });
    }
};


export const assign = async (req, res) => {
  try {
    const { date } = req.body;

    // Fetch all pending pickups for the given date
    const pickups = await Pickup.find({
      scheduledTime: { $gte: new Date(date) },
      status: 'pending',
    });

    // Fetch all available drivers
    const drivers = await Driver.find({ status: 'available' });

    if (drivers.length === 0) {
      return res.status(400).json({ error: 'No available drivers' });
    }

    // Optimize pickups
    const optimizedSchedule = optimizePickups(pickups, drivers);

    // Save assignments to the database
    for (const pickup of optimizedSchedule) {
      await Pickup.findByIdAndUpdate(pickup._id, {
        driver: pickup.driver._id,
        status: 'assigned',
        fuelCost: pickup.fuelCost,
      });

      await Driver.findByIdAndUpdate(pickup.driver._id, {
        status: 'busy',
      });
    }

    res.status(200).json({ message: 'Pickups assigned successfully', optimizedSchedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const assignDailyPickups = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's pickups
    const pickups = await Pickup.find({
      scheduledTime: { $gte: today },
      status: 'pending'
    }).populate('user', 'name');

    // Get available drivers
    const drivers = await Driver.find({
      status: 'available',
      'attendance.date': { $gte: today }
    });

    // Add your assignment logic here
    const assignments = optimizePickups(pickups, drivers);

    // Update database records
    for (const assignment of assignments) {
      await Pickup.findByIdAndUpdate(assignment.pickupId, {
        driver: assignment.driverId,
        status: 'assigned'
      });

      await Driver.findByIdAndUpdate(assignment.driverId, {
        status: 'on-route'
      });
    }

    res.status(200).json({ message: `${assignments.length} pickups assigned` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// pickupController.js
export const completePickup = async (req, res) => {
  try {
    const pickup = await Pickup.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'completed',
        completedAt: new Date(),
        image: req.file ? `/uploads/${req.file.filename}` : null 
      },
      { new: true }
    );
    res.json(pickup);
  } catch (err) {
    res.status(500).json({ error: 'Completion failed' });
  }
};

export const confirmPickup = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate('user', 'email phone')
      .populate('driver', 'firstName lastName');

    if (!pickup) return res.status(404).json({ error: 'Pickup not found' });

    // Update pickup details
    pickup.status = 'completed';
    pickup.weight = req.body.weight;
    pickup.amount = req.body.amount;
    pickup.image = req.file?.path;
    await pickup.save();

    // Send email notification with improved message
    const emailSent = await sendEmail({
      to: pickup.user.email,
      subject: '📦 Pickup Confirmed - Your Order is on its Way!',
      html: `
        <p>Dear <strong>${pickup.user.email}</strong>,</p>
        <p>We are pleased to inform you that your pickup request has been confirmed successfully!</p>
        ... 
      `,
      text: `
        Dear ${pickup.user.email},
    
        We are pleased to inform you that your pickup request has been confirmed successfully!
    
        Driver Information:
        Name: ${pickup.driver.firstName} ${pickup.driver.lastName}
    
        Pickup Details:
        Weight: ${req.body.weight} kg
        Amount: Rs.${req.body.amount}
    
        Thank you for choosing our service! We will keep you updated with any further notifications.
    
        If you have any questions, feel free to contact us at any time.
    
        Best regards,
        The Driver Route Management Team
      `
    });
    

    if (!emailSent) {
      console.warn('Email failed to send, but pickup was confirmed');
    }

    res.status(200).json({
      message: 'Pickup confirmed successfully',
      pickup
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const cancelPickup = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate('user', 'email phone')
      .populate('driver', 'firstName lastName');

    if (!pickup) return res.status(404).json({ error: 'Pickup not found' });

    pickup.status = 'cancelled';
    pickup.cancellationReason = req.body.reason;
    await pickup.save();

    // Send email notification with improved message
    const emailSent = await sendEmail({
      to: pickup.user.email,
      subject: '🚫 Pickup Cancelled - We Apologize for the Inconvenience',
      text: `
        Dear ${pickup.user.email},
    
        We regret to inform you that your pickup request has been cancelled.
    
        Reason for Cancellation:
        ${req.body.reason}
    
        We sincerely apologize for the inconvenience this may have caused. If you have any questions or would like to reschedule the pickup, please do not hesitate to reach out to us.
    
        Thank you for your understanding.
    
        Best regards,
        The Driver Route Management Team
      `
    });
    

    if (!emailSent) {
      console.warn('Email failed to send, but pickup was cancelled');
    }

    res.status(200).json({
      message: 'Pickup cancelled successfully',
      pickup
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getDailySummary = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const pickups = await Pickup.find({
      scheduledTime: { $gte: startOfDay, $lte: endOfDay }
    }).populate('user driver');

    const pdfUrl = await generateDailySummaryPDF(date, pickups);

    res.status(200).json({
      pickups,
      pdfUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



