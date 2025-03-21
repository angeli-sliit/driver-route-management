import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import driverRoutes from './routes/driverRoutes.js';
import pickupRoutes from './routes/pickupRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { protectUser } from './middleware/authMiddleware.js'; // Import protectUser

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/drivers', driverRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/users', userRoutes);

// Protected route example
app.get('/api/protected', protectUser, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));