import { useState } from 'react';
import { Button, Alert, Spinner, Card } from 'react-bootstrap';
import axios from 'axios';
import RouteMap from '../components/RouteVisualizer';

const RouteOptimizer = () => {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOptimize = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get today's pickups from your existing state/API
      const response = await axios.get('/api/pickups?status=assigned');
      const pickups = response.data;

      // Send to optimization endpoint
      const optimizationResponse = await axios.post('/api/routes/optimize', {
        pickups: pickups
      });

      setRouteData(optimizationResponse.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to optimize route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary text-white">
          <h3 className="mb-0">Route Optimization</h3>
        </Card.Header>
        
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <div className="mb-4">
            <RouteMap routeGeometry={routeData?.geometry} />
          </div>

          <div className="d-flex justify-content-between align-items-center">
            {routeData && (
              <div className="text-muted">
                <p>Total Distance: {(routeData.distance / 1000).toFixed(1)} km</p>
                <p>Estimated Duration: {Math.round(routeData.duration / 60)} mins</p>
              </div>
            )}
            
            <Button 
              variant="success" 
              onClick={handleOptimize}
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Optimizing Route...
                </>
              ) : "Optimize Today's Route"}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RouteOptimizer;