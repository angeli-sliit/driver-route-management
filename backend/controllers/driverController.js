import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Driver from '../models/Driver.js';
import multer from 'multer';
import path from 'path';
import Vehicle from '../models/Vehicle.js';

// Register a new driver
export const registerDriver = async (req, res) => {
  try {
    const { firstName, lastName, email, password, vehicleType, employeeId, nic, 
            birthday, nationality, employeeType, joinedDate, vehicleNumber } = req.body;

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'vehicleType', 
                           'employeeId', 'nic', 'birthday', 'nationality', 
                           'employeeType', 'joinedDate'];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields 
      });
    }

    // Check for duplicates
    const existingDriver = await Driver.findOne({ 
      $or: [
        { email },
        { employeeId },
        { nic },
        { vehicleNumber }
      ]
    });
    
    if (existingDriver) {
      let conflictField = '';
      if (existingDriver.email === email) conflictField = 'email';
      else if (existingDriver.employeeId === employeeId) conflictField = 'employee ID';
      else if (existingDriver.nic === nic) conflictField = 'NIC';
      else if (existingDriver.vehicleNumber === vehicleNumber) conflictField = 'vehicle number';
      
      return res.status(400).json({ 
        error: `Driver with this ${conflictField} already exists` 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const driver = new Driver({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      vehicleType,
      employeeId,
      nic,
      birthday: new Date(birthday),
      nationality,
      employeeType,
      joinedDate: new Date(joinedDate),
      vehicleNumber,
      status: 'available',
    });

    await driver.save();

    res.status(201).json({ 
      driver: {
        _id: driver._id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        employeeId: driver.employeeId,
        vehicleType: driver.vehicleType,
        status: driver.status
      }
    });
  } catch (err) {
    console.error('Error in registerDriver:', err);
    res.status(500).json({ 
      error: 'Server error',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Get all drivers
export const getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().select('-password');
    res.status(200).json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login driver
export const loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body;

    const driver = await Driver.findOne({ email });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: driver._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({
      token,
      driver: {
        id: driver._id,
        name: `${driver.firstName} ${driver.lastName}`,
        email: driver.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get current driver
export const getCurrentDriver = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const driver = await Driver.findById(req.user.id).select('-password');
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driverObj = driver.toObject();
    driverObj.fullName = `${driver.firstName} ${driver.lastName}`;

    res.status(200).json(driverObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get driver by ID
export const getDriverById = async (req, res) => {
  try {
    const driverId = req.params.id;
    const driver = await Driver.findById(driverId).select('-password');
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.status(200).json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update driver details
export const updateDriver = async (req, res) => {
  try {
    const driverId = req.params.id;
    const updates = req.body;
    const updatedDriver = await Driver.findByIdAndUpdate(driverId, updates, {
      new: true,
    }).select('-password');
    if (!updatedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.status(200).json(updatedDriver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update driver location
export const updateDriverLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        status: 'error',
        error: 'Latitude and longitude are required.'
      });
    }

    const driver = await Driver.findByIdAndUpdate(
      req.user.id,
      {
        currentLocation: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        lastUpdated: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!driver) {
      return res.status(404).json({
        status: 'error',
        error: 'Driver not found.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        id: driver._id,
        location: driver.currentLocation,
        lastUpdated: driver.lastUpdated
      }
    });
  } catch (err) {
    console.error('Location Update Error:', err);
    res.status(500).json({
      status: 'error',
      error: 'Failed to update location. Please try again.'
    });
  }
};


// Delete a driver
export const deleteDriver = async (req, res) => {
  try {
    const driverId = req.params.id;
    const deletedDriver = await Driver.findByIdAndDelete(driverId);
    if (!deletedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.status(200).json({ message: 'Driver deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Upload Profile Picture
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload profile picture handler
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const driver = await Driver.findByIdAndUpdate(
      req.user.id,
      { profilePicture: req.file.path.replace(/\\/g, '/') },
      { new: true }
    ).select('-password');

    res.status(200).json({
      profilePicture: driver.profilePicture,
      message: 'Profile picture updated successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark attendance for driver
export const markAttendance = async (req, res) => {
  try {
    const { driverId, date, status } = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Use the markAttendance method we added to the Driver model
    await driver.markAttendance(date, status);

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      driver: await Driver.findById(driverId).populate('vehicle')
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk mark attendance for multiple drivers
export const bulkMarkAttendance = async (req, res) => {
  try {
    const { date, driverIds, status } = req.body;

    // Validate inputs
    if (!date || !Array.isArray(driverIds) || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide date, driverIds array, and status' 
      });
    }

    // Mark attendance for each driver
    const results = await Promise.all(
      driverIds.map(async (driverId) => {
        try {
          const driver = await Driver.findById(driverId);
          if (!driver) return { driverId, success: false, message: 'Driver not found' };
          
          await driver.markAttendance(date, status);
          return { 
            driverId, 
            success: true, 
            message: 'Attendance marked successfully',
            name: `${driver.firstName} ${driver.lastName}`
          };
        } catch (error) {
          return { driverId, success: false, message: error.message };
        }
      })
    );

    res.status(200).json({
      success: true,
      message: 'Bulk attendance marking completed',
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get driver availability status
export const getDriverAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    
    const drivers = await Driver.find({}).populate('vehicle');
    
    const availability = drivers.map(driver => ({
      id: driver._id,
      name: `${driver.firstName} ${driver.lastName}`,
      status: driver.status,
      employeeStatus: driver.employeeStatus,
      hasVehicle: !!driver.vehicle,
      vehicleDetails: driver.vehicle ? {
        id: driver.vehicle._id,
        type: driver.vehicle.vehicleType,
        regNo: driver.vehicle.registrationNumber
      } : null,
      attendance: driver.attendance?.find(a => 
        new Date(a.date).toDateString() === new Date(date).toDateString()
      ),
      isAvailable: driver.isAvailableForDate(date)
    }));

    res.status(200).json({
      success: true,
      drivers: availability
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get available drivers
export const getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ 
      status: 'available',
      'attendance.date': { $gte: new Date().setHours(0,0,0,0) }
    });
    res.status(200).json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update driver availability
export const updateDriverAvailability = async (req, res) => {
  try {
    const { status } = req.body;
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Update driver's status
    driver.status = status;

    // If the driver is being marked as available, ensure they have a vehicle
    if (status === 'available' && !driver.vehicle) {
      return res.status(400).json({
        success: false,
        message: 'Driver must have a vehicle assigned to be marked as available'
      });
    }

    // Save the updated driver
    await driver.save();

    // If there's a date in the request, also update attendance
    if (req.body.date) {
      await driver.markAttendance(req.body.date, status);
    }

    res.json({
      success: true,
      message: 'Driver availability updated successfully',
      driver: {
        _id: driver._id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        status: driver.status
      }
    });
  } catch (error) {
    console.error('Error updating driver availability:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating driver availability'
    });
  }
};

// Assign vehicle to driver
export const assignVehicle = async (req, res) => {
  try {
    const { driverId, vehicleId } = req.body;

    // Find the driver and vehicle
    const [driver, vehicle] = await Promise.all([
      Driver.findById(driverId),
      Vehicle.findById(vehicleId)
    ]);

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Check if vehicle is already assigned
    const existingDriver = await Driver.findOne({ vehicle: vehicleId });
    if (existingDriver && existingDriver._id.toString() !== driverId) {
      return res.status(400).json({ 
        success: false, 
        message: `Vehicle is already assigned to driver ${existingDriver.firstName} ${existingDriver.lastName}` 
      });
    }

    // Assign vehicle to driver
    driver.vehicle = vehicleId;
    await driver.save();

    // Return updated driver with vehicle details
    const updatedDriver = await Driver.findById(driverId).populate('vehicle');

    res.status(200).json({
      success: true,
      message: 'Vehicle assigned successfully',
      driver: {
        id: updatedDriver._id,
        name: `${updatedDriver.firstName} ${updatedDriver.lastName}`,
        vehicle: updatedDriver.vehicle
      }
    });
  } catch (error) {
    console.error('Error in assignVehicle:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Helper function to set up drivers with vehicles and attendance
export const setupDriversForDate = async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // First, create vehicles if none exist
    const existingVehicles = await Vehicle.find({});
    let vehicles = existingVehicles;
    
    if (existingVehicles.length === 0) {
      const defaultVehicles = [
        {
          vehicleType: 'Toyota Dyna',
          registrationNumber: 'ABC-1234',
          maxCapacity: 2000,
          fuelConsumption: 12
        },
        {
          vehicleType: 'Isuzu Elf',
          registrationNumber: 'DEF-5678',
          maxCapacity: 3000,
          fuelConsumption: 15
        },
        {
          vehicleType: 'Mitsubishi Canter',
          registrationNumber: 'GHI-9012',
          maxCapacity: 2500,
          fuelConsumption: 13
        }
      ];

      vehicles = await Vehicle.create(defaultVehicles);
      console.log('Created default vehicles:', vehicles);
    }

    // Get all drivers
    const drivers = await Driver.find({});
    
    if (drivers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No drivers found in the system'
      });
    }

    // Track setup results
    const results = {
      success: [],
      failed: []
    };

    // Assign vehicles and mark attendance for each driver
    for (const driver of drivers) {
      try {
        // Assign vehicle if driver doesn't have one
        if (!driver.vehicle && vehicles.length > 0) {
          // Find an unassigned vehicle
          const availableVehicle = vehicles.find(v => 
            !drivers.some(d => d.vehicle && d.vehicle.toString() === v._id.toString())
          );
          
          if (availableVehicle) {
            driver.vehicle = availableVehicle._id;
          }
        }

        // Set status to available and mark attendance
        driver.status = 'available';
        driver.employeeStatus = 'notAssigned';
        
        // Mark attendance for the date
        await driver.markAttendance(date, 'available');
        await driver.save();

        results.success.push({
          driverId: driver._id,
          name: `${driver.firstName} ${driver.lastName}`,
          vehicleAssigned: !!driver.vehicle
        });
      } catch (error) {
        console.error(`Error setting up driver ${driver._id}:`, error);
        results.failed.push({
          driverId: driver._id,
          name: `${driver.firstName} ${driver.lastName}`,
          error: error.message
        });
      }
    }

    // Get final driver availability
    const availability = await Promise.all(drivers.map(async (driver) => {
      const updatedDriver = await Driver.findById(driver._id).populate('vehicle');
      return {
        id: updatedDriver._id,
        name: `${updatedDriver.firstName} ${updatedDriver.lastName}`,
        status: updatedDriver.status,
        employeeStatus: updatedDriver.employeeStatus,
        hasVehicle: !!updatedDriver.vehicle,
        vehicleDetails: updatedDriver.vehicle ? {
          id: updatedDriver.vehicle._id,
          type: updatedDriver.vehicle.vehicleType,
          regNo: updatedDriver.vehicle.registrationNumber
        } : null,
        attendance: updatedDriver.attendance?.find(a => 
          new Date(a.date).toDateString() === new Date(date).toDateString()
        ),
        isAvailable: updatedDriver.isAvailableForDate(date)
      };
    }));

    const availableCount = availability.filter(d => d.isAvailable).length;

    res.status(200).json({
      success: true,
      message: `Setup completed. ${availableCount} drivers available for ${new Date(date).toLocaleDateString()}`,
      results,
      availability
    });
  } catch (error) {
    console.error('Error in setupDriversForDate:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

