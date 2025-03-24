import { useState } from 'react';
import { Button, Alert, Spinner, Card, Table, Form } from 'react-bootstrap';
import axios from 'axios';
import RouteVisualizer from '../components/RouteVisualizer';

const FleetOptimizer = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    vehicles: [
      {
        id: 1,
        capacity: 1000,
        start_lon: 79.973150,
        start_lat: 6.914574,
        working_hours: [0, 28800] // 8am to 5pm in seconds
      }
    ],
    jobs: []
  });

  const handleOptimize = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/routes/optimize-fleet', formData);
      setRoutes(response.data.routes);
    } catch (err) {
      setError(err.response?.data?.error || 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = () => {
    setFormData(prev => ({
      ...prev,
      vehicles: [
        ...prev.vehicles,
        {
          id: prev.vehicles.length + 1,
          capacity: 1000,
          start_lon: 79.973150,
          start_lat: 6.914574,
          working_hours: [0, 28800]
        }
      ]
    }));
  };

  return (
    <div className="container mt-4">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary text-white">
          <h3 className="mb-0">Fleet Route Optimization</h3>
        </Card.Header>
        
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <div className="mb-4">
            <RouteVisualizer routes={routes} />
          </div>

          <div className="mb-4">
            <h5>Vehicles</h5>
            {formData.vehicles.map((vehicle, index) => (
              <div key={vehicle.id} className="mb-3 border p-3">
                <Form.Group className="mb-2">
                  <Form.Label>Vehicle {index + 1} Capacity (kg)</Form.Label>
                  <Form.Control 
                    type="number"
                    value={vehicle.capacity}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      vehicles: prev.vehicles.map(v => 
                        v.id === vehicle.id ? {...v, capacity: e.target.value} : v
                      )
                    }))}
                  />
                </Form.Group>
              </div>
            ))}
            <Button variant="secondary" onClick={addVehicle}>
              Add Another Vehicle
            </Button>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <Button 
              variant="success" 
              onClick={handleOptimize}
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Optimizing Routes...
                </>
              ) : 'Optimize Fleet Routes'}
            </Button>
          </div>

          {routes.length > 0 && (
            <div className="mt-4">
              <h5>Optimized Routes</h5>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Total Distance</th>
                    <th>Total Duration</th>
                    <th>Total Weight</th>
                    <th>Stops</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map(route => (
                    <tr key={route.vehicleId}>
                      <td>Vehicle {route.vehicleId}</td>
                      <td>{(route.totalDistance / 1000).toFixed(2)} km</td>
                      <td>{Math.floor(route.totalDuration / 3600)}h {Math.floor((route.totalDuration % 3600)/60)}m</td>
                      <td>{route.totalWeight} kg</td>
                      <td>{route.steps.filter(step => step.type === 'job').length}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default FleetOptimizer;