import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Driver from '../models/Driver.js';
import multer from 'multer';
import path from 'path';

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

// Mark attendance
export const markAttendance = async (req, res) => {
  try {
    const { date, driverId, status } = req.body;
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    driver.attendance = driver.attendance || [];
    driver.attendance.push({ date, status });
    await driver.save();

    res.status(200).json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
// export const updateDriverAvailability = async (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;

//   try {
//     const driver = await Driver.findByIdAndUpdate(id, { status }, { new: true });
//     if (!driver) {
//       return res.status(404).json({ error: 'Driver not found' });
//     }
//     res.json(driver);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };



// Update driver availability
export const updateDriverAvailability = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Get current date (just the date part, no time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check if there's already an entry for today
    const existingEntryIndex = driver.attendance.findIndex(entry => 
      new Date(entry.date).setHours(0, 0, 0, 0) === today.getTime()
    );

    if (existingEntryIndex >= 0) {
      // Update existing entry
      driver.attendance[existingEntryIndex].status = status;
    } else {
      // Add new entry
      driver.attendance.push({ date: today, status });
    }

    // Update the driver's overall status
    driver.status = status;

    await driver.save();

    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

