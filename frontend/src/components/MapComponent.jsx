import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker issue in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icon for driver location
const createDriverIcon = () => {
  return new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

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
      center={driverLocation} 
      zoom={13} 
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Driver Marker with custom blue icon */}
      {driverLocation && (
        <Marker 
          position={[driverLocation.lat, driverLocation.lng]}
          icon={createDriverIcon()}
        >
          <Popup>You are here</Popup>
        </Marker>
      )}

      {/* Pickup Locations */}
      {pickupLocations.map((loc, index) => (
        <Marker key={index} position={[loc.lat, loc.lng]}>
          <Popup>
            Pickup: {loc.item || 'Location'} <br />
            Address: {loc.text || loc.address || 'No address provided'}
          </Popup>
        </Marker>
      ))}

      {/* Nearest Pickup Location (red marker) */}
      {nearestLocation && (
        <Marker
          position={[nearestLocation.lat, nearestLocation.lng]}
          icon={L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })}
        >
          <Popup>
            Nearest Pickup: {nearestLocation.item || 'Location'} <br />
            Address: {nearestLocation.text || nearestLocation.address || 'No address provided'}
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