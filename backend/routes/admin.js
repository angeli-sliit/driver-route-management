const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');

// Verify admin token endpoint
router.get('/verify', adminAuth, (req, res) => {
  res.status(200).json({ message: 'Valid admin token' });
});

module.exports = router; 