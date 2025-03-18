import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import driverRoutes from './routes/driverRoutes.js'; // Ensure this is imported
import pickupRoutes from './routes/pickupRoutes.js'; // Ensure this is imported
import { Server } from 'socket.io';
import http from 'http';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

// WebSocket for real-time tracking
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('driverLocationUpdate', (data) => {
    const { driverId, location } = data;
    io.emit('locationUpdate', { driverId, location });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes
app.use('/api/drivers', driverRoutes); // Ensure this is used
app.use('/api/pickups', pickupRoutes); // Ensure this is used

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));