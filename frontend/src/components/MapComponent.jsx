import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import { io } from 'socket.io-client';

// Fix marker issue in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

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
      <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: "500px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Driver Marker */}
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* Pickup Locations */}
        {pickupLocations.map((loc, index) => (
          <Marker key={index} position={[loc.lat, loc.lng]}>
            <Popup>
              Pickup: {loc.item} <br />
              Address: {loc.text}
            </Popup>
          </Marker>
        ))}

        {/* Nearest Pickup Location */}
        {nearestLocation && (
          <Marker
            position={[nearestLocation.lat, nearestLocation.lng]}
            icon={L.icon({
              iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-red.png",
              iconSize: [25, 41],
            })}
          >
            <Popup>
              Nearest Pickup: {nearestLocation.item} <br />
              Address: {nearestLocation.text}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default DriverMap;
