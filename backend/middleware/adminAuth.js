const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('AdminAuth token:', token);
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('AdminAuth decoded token:', decoded);
    
    const admin = await Admin.findOne({ _id: decoded._id });
    console.log('AdminAuth found admin:', admin ? 'Yes' : 'No');

    if (!admin) {
      throw new Error('Admin not found');
    }

    req.token = token;
    req.admin = admin;
    next();
  } catch (error) {
    console.error('AdminAuth error:', error);
    res.status(401).json({ error: 'Please authenticate as admin' });
  }
};

module.exports = adminAuth; 