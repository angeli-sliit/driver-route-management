import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080'];

const RouteVisualizer = ({ routes }) => {
  return (
    <MapContainer 
      center={[6.914574, 79.973150]} 
      zoom={13}
      style={{ height: '600px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      {routes.map((route, index) => (
        <GeoJSON 
          key={route.vehicleId}
          data={route.geometry}
          style={{ color: colors[index % colors.length], weight: 4 }}
        />
      ))}
    </MapContainer>
  );
};

export default RouteVisualizer;