import React, { useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

export const AuthProvider = ({ children }) => {
  useEffect(() => {
    socket.on('driverLocationUpdated', (data) => {
      console.log('Driver location updated:', data);
    });

    socket.on('pickupStatusUpdated', (data) => {
      console.log('Pickup status updated:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return <>{children}</>;
};