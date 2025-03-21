import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Driver from '../models/Driver.js';

// Middleware to protect USER routes
export const protectUser = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      error: 'Not authorized, no token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id).select('-password');

    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        error: 'User belonging to this token no longer exists',
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    const message = error.name === 'TokenExpiredError' 
      ? 'Token expired, please login again' 
      : 'Invalid token, please login again';
    
    res.status(401).json({
      status: 'fail',
      error: message,
    });
  }
};

// Middleware to protect DRIVER routes

export const protectDriver = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const driver = await Driver.findById(decoded.id).select('-password');

    if (!driver) {
      return res.status(401).json({ error: 'Driver not found' });
    }

    req.user = driver; // Attach the driver to the request object
    next();
  } catch (error) {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

const authenticate = async (token, model, type) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const entity = await model.findById(decoded.id).select('-password');
  return { entity, decoded };
};

const sendAuthError = (res, message) => res.status(401).json({
  status: 'fail',
  error: message
});

//admin protection middleware
export const protectAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
// Universal protection middleware
export const protectAny = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return sendAuthError(res, 'No token provided');

    // Try User first
    try {
      const { entity: user } = await authenticate(token, User, 'user');
      if (user) {
        req.user = user;
        req.role = 'user';
        return next();
      }
    } catch (userErr) {}

    // Try Driver next
    try {
      const { entity: driver } = await authenticate(token, Driver, 'driver');
      if (driver) {
        req.driver = driver;
        req.role = 'driver';
        return next();
      }
    } catch (driverErr) {}

    sendAuthError(res, 'Invalid token');
  } catch (error) {
    const message = error.name === 'TokenExpiredError' 
      ? 'Token expired' 
      : 'Invalid token';
    sendAuthError(res, message);
  }
};