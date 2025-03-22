import Pickup from '../models/Pickup.js';
import Driver from '../models/Driver.js';
import { PDFDocument } from 'pdf-lib';
import User from '../models/User.js';
import { getOptimizedRoute } from '../utils/googleMaps.js';

import { optimizePickups } from '../utils/optimizePickups.js';

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

// Assign a pickup to a driver (ADD THIS EXPORT)
// export const assignPickup = async (req, res) => {
//   try {
//     const { pickupId, driverId } = req.body;

//     const pickup = await Pickup.findById(pickupId);
//     const driver = await Driver.findById(driverId);

//     if (!pickup) return res.status(404).json({ error: "Pickup not found" });
//     if (!driver) return res.status(404).json({ error: "Driver not found" });
//     if (driver.status !== 'available') {
//       return res.status(400).json({ error: "Driver is not available" });
//     }

//     // Check if pickup is already assigned
//     if (pickup.driver) {
//       return res.status(400).json({ error: "Pickup is already assigned to a driver" });
//     }

//     pickup.driver = driverId;
//     pickup.status = 'assigned';
//     await pickup.save();

//     // Update driver status to busy
//     driver.status = 'busy';
//     await driver.save();

//     res.status(200).json(pickup);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
// controllers/pickupController.js
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
            update: { $set: { driver: assignedDriver._id, status: 'assigned' } },
          },
        });

        // Update driver status to busy
        driverUpdates.push({
          updateOne: {
            filter: { _id: assignedDriver._id },
            update: { $set: { status: 'busy' } },
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
export const listPickups = async (req, res) => {
  try {
    const filter = req.originalUrl.includes('/me') 
      ? { driver: req.user._id, status: 'assigned' } // Remove date filter
      : { status: 'assigned' };

    const pickups = await Pickup.find(filter)
      .populate('driver', 'firstName lastName')
      .populate('user', 'name');

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
// Route


export const generatePickupPDF = async (req, res) => {
  try {
    const { date } = req.query;
    const query = date ? { scheduledTime: { $gte: new Date(date) } } : {};
    const pickups = await Pickup.find(query)
      .populate('driver', 'firstName lastName vehicleType')
      .populate('user', 'name');

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;

    let y = height - 50;
    page.drawText('Pickup Schedule Report', { x: 50, y, size: fontSize + 4, bold: true });
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




// Helper function to calculate distance using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Assign pickups to drivers
export const assignPickups = async (req, res) => {
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

    // Assign pickups to drivers
    for (const pickup of pickups) {
      let minDistance = Infinity;
      let assignedDriver = null;

      // Find the nearest driver for this pickup
      for (const driver of drivers) {
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
        pickup.driver = assignedDriver._id;
        pickup.status = 'assigned';
        await pickup.save();

        // Update driver status to busy
        assignedDriver.status = 'busy';
        await assignedDriver.save();
      }
    }

    res.status(200).json({ message: 'Pickups assigned successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const optimizedAssignment = async (req, res) => {
  try {
    const { date } = req.body;
    const fuelPrice = await FuelPrice.findOne().sort({ effectiveDate: -1 });

    // Fetch all pending pickups for the given date
    const pickups = await Pickup.find({
      scheduledTime: { $gte: new Date(date) },
      status: 'pending'
    });

    // Fetch all available drivers
    const drivers = await Driver.find({ status: 'available' });

    // Optimize pickups
    const assignments = optimizePickups(pickups, drivers, fuelPrice.price);

    // Save assignments to the database
    for (const assignment of assignments) {
      await Pickup.findByIdAndUpdate(assignment.pickup, {
        driver: assignment.driver,
        status: 'assigned',
        fuelCost: assignment.fuelCost
      });

      await Driver.findByIdAndUpdate(assignment.driver, {
        status: 'busy'
      });
    }

    res.status(200).json({ message: `${assignments.length} pickups assigned optimally` });
  } catch (err) {
    res.status(500).json({ error: err.message });
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


