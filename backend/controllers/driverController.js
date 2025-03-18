import Driver from '../models/Driver.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Register a new driver
export const registerDriver = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if driver already exists
    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ error: 'Driver already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new driver
    const driver = new Driver({
      name,
      email,
      password: hashedPassword,
    });

    // Save the driver to the database
    await driver.save();

    // Generate JWT token
    const token = jwt.sign({ id: driver._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Return the driver and token
    res.status(201).json({ driver, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login driver
export const loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the driver by email
    const driver = await Driver.findOne({ email });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: driver._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Return the token
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all drivers (protected route)
export const getDrivers = async (req, res) => {
  try {
    // Fetch all drivers from the database
    const drivers = await Driver.find().select('-password'); // Exclude passwords
    res.status(200).json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single driver by ID (protected route)
export const getDriverById = async (req, res) => {
  try {
    const driverId = req.params.id;

    // Find the driver by ID
    const driver = await Driver.findById(driverId).select('-password'); // Exclude password
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.status(200).json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update driver details (protected route)
export const updateDriver = async (req, res) => {
  try {
    const driverId = req.params.id;
    const updates = req.body;

    // Update the driver
    const updatedDriver = await Driver.findByIdAndUpdate(driverId, updates, {
      new: true,
    }).select('-password'); // Exclude password

    if (!updatedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.status(200).json(updatedDriver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add this to your existing exports
export const updateDriverLocation = async (req, res) => {
    try {
      const { driverId, lat, lng } = req.body;
      const driver = await Driver.findByIdAndUpdate(
        driverId,
        { currentLocation: { lat, lng } },
        { new: true }
      );
      res.status(200).json(driver);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

// Delete a driver (protected route)
export const deleteDriver = async (req, res) => {
  try {
    const driverId = req.params.id;

    // Delete the driver
    const deletedDriver = await Driver.findByIdAndDelete(driverId);
    if (!deletedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.status(200).json({ message: 'Driver deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};