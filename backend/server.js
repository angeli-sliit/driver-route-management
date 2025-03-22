import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import driverRoutes from './routes/driverRoutes.js';
import pickupRoutes from './routes/pickupRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import fuelPriceRoutes from './routes/fuelPriceRoutes.js';
import { protectUser } from './middleware/authMiddleware.js';

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app); 
const io = new Server(httpServer, {   
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/drivers', driverRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/fuel-price', fuelPriceRoutes);

// Protected route example
app.get('/api/protected', protectUser, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));