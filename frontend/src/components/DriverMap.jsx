// DriverMap.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from 'socket.io-client';
import MapComponent from './MapComponent'; // Import the MapComponent

const socket = io('http://localhost:5000');
socket.on('connect', () => {
  console.log('Connected to server via WebSocket');
});

const DriverMap = () => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [pickupLocations, setPickupLocations] = useState([]);
  const [nearestLocation, setNearestLocation] = useState(null);

  // 1️⃣ Get Driver's Current Location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDriverLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  }, []);

  // 2️⃣ Fetch Pickup Locations from Backend
  useEffect(() => {
    axios.get("http://localhost:5000/api/pickups")
      .then((res) => {
        // Ensure correct lat/lng extraction
        const formattedLocations = res.data.map((pickup) => ({
          lat: pickup.address.lat,
          lng: pickup.address.lng,
          text: pickup.address.text,
          item: pickup.chooseItem,
        }));

        setPickupLocations(formattedLocations);

        // Find nearest pickup if driver location is available
        if (driverLocation) {
          findNearestLocation(driverLocation, formattedLocations);
        }
      })
      .catch((err) => console.error("Error fetching pickup locations:", err));
  }, [driverLocation]); // ✅ Re-run when driver location updates

  // 3️⃣ Function to Find Nearest Pickup Location
  const findNearestLocation = (driverLoc, locations) => {
    let minDistance = Infinity;
    let nearest = null;

    locations.forEach((loc) => {
      const distance = Math.sqrt(
        Math.pow(driverLoc.lat - loc.lat, 2) + Math.pow(driverLoc.lng - loc.lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = loc;
      }
    });

    setNearestLocation(nearest);
  };

  return (
    <div>
      <h2 className="text-center">Driver Location Map</h2>
      <MapComponent
        driverLocation={driverLocation}
        pickupLocations={pickupLocations}
        nearestLocation={nearestLocation}
      />
    </div>
  );
};

export default DriverMap;