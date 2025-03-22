import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import { optimizePickups } from '../utils/optimizePickups.js';
import Pickup from '../models/Pickup.js';
import Driver from '../models/Driver.js';

// Admin registration
export const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password, // Password will be hashed by the pre-save hook
    });

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Send response
    res.status(201).json({
      token,
      _id: admin._id,
      name: admin.name,
      email: admin.email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin login
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Check password
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Send response
    res.status(200).json({
      token,
      _id: admin._id,
      name: admin.name,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate optimized pickup list and PDF
