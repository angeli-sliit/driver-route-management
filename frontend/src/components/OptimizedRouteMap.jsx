import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons for markers
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const OptimizedRouteMap = ({ route }) => {
  if (!route || route.length === 0) return null;

  // Extract coordinates for the route
  const positions = route.map(stop => [stop.lat, stop.lng]);
  const driverLocation = positions[0];
  const pickupPoints = positions.slice(1);

  return (
    <div className="optimized-route-map" style={{ height: '400px', width: '100%', marginBottom: '20px' }}>
      <MapContainer 
        center={driverLocation} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Driver's location (green marker) */}
        <Marker position={driverLocation} icon={greenIcon}>
          <Popup>Driver Location</Popup>
        </Marker>

        {/* Pickup points (blue markers) */}
        {pickupPoints.map((pos, idx) => (
          <Marker key={idx} position={pos} icon={blueIcon}>
            <Popup>Pickup Point {idx + 1}</Popup>
          </Marker>
        ))}

        {/* Route line (blue polyline) */}
        <Polyline 
          positions={positions} 
          color="blue" 
          weight={3}
          opacity={0.7}
        />
      </MapContainer>
    </div>
  );
};

export default OptimizedRouteMap; 