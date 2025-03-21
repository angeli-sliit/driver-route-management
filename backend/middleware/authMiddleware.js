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
    return res.status(401).json({
      status: 'fail',
      error: 'Not authorized, no token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentDriver = await Driver.findById(decoded.id).select('-password');

    if (!currentDriver) {
      return res.status(401).json({
        status: 'fail',
        error: 'Driver belonging to this token no longer exists',
      });
    }

    req.driver = currentDriver;
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