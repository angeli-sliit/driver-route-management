// components/MapComponent.jsx
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Ensure Leaflet CSS is imported

// Fix marker issue in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapComponent = ({ 
  driverLocation = { lat: 6.9271, lng: 79.8612 }, // Default to Colombo coordinates
  pickupLocations = [], 
  nearestLocation = null,
  optimizedRoute = null
}) => {
  // Debugging logs
  console.log('Driver Location:', driverLocation);
  console.log('Pickup Locations:', pickupLocations);
  console.log('Nearest Location:', nearestLocation);
  console.log('Optimized Route:', optimizedRoute);

  return (
    <MapContainer 
      center={driverLocation || [7.8731, 80.7718]} 
      zoom={13} 
      style={{ height: '500px', width: '100%' }} // Ensure height is defined
    >
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

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

      {/* Optimized Route */}
      {optimizedRoute?.geometry?.coordinates && (
        <Polyline
          positions={optimizedRoute.geometry.coordinates.map(c => [c[1], c[0]])}
          color="blue"
        />
      )}
    </MapContainer>
  );
};

export default MapComponent;