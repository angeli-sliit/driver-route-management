import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import MapComponent from '../components/MapComponent';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PickupConfirmationModal from '../components/PickupConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import DriverPickupListPDF from '../components/DriverPickupListPDF';

const DriverDashboard = () => {
  const [pickups, setPickups] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPickup, setCurrentPickup] = useState(null);
  const [actionMode, setActionMode] = useState('confirm');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [image, setImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDriverPickups = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Start of today
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // End of today

        const response = await fetch('http://localhost:5000/api/pickups/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();

        // Filter pickups for today
        const todayPickups = responseData.filter(pickup => {
          const pickupDate = new Date(pickup.scheduledTime);
          return pickupDate >= startOfDay && pickupDate <= endOfDay;
        });

        setPickups(todayPickups);
      } catch (error) {
        console.error('Fetch error:', error);
        setPickups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverPickups();
  }, [navigate]);

  const updateLocation = async () => {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;

      await axios.put(
        'http://localhost:5000/api/drivers/update-location',
        { lat, lng },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setCurrentLocation({ lat, lng });
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setError(error.response?.data?.error || 'Location update failed');
    }
  };

  const handleConfirmPickup = async (data) => {
    try {
      const formData = new FormData();
      formData.append('image', data.image); // Append the image file
      formData.append('weight', data.weight);
      formData.append('amount', data.amount);

      await axios.put(`http://localhost:5000/api/pickups/${currentPickup._id}/confirm`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        }
      });

      const response = await axios.get('http://localhost:5000/api/pickups/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPickups(response.data);
      setShowModal(false);
      setImage(null); // Reset image after confirmation
    } catch (err) {
      console.error('Confirmation error:', err);
      setError('Failed to confirm pickup. Please try again.');
    }
  };

  const handleCancelPickup = async (reason) => {
    try {
      await axios.put(`http://localhost:5000/api/pickups/${currentPickup._id}/cancel`, { reason }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const response = await axios.get('http://localhost:5000/api/pickups/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPickups(response.data);
      setShowModal(false);
    } catch (err) {
      console.error('Cancellation error:', err);
      setError('Failed to cancel pickup. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <main className="flex-grow-1 container py-4">
        <h1 className="text-center text-primary fw-bold mb-4">Driver Dashboard</h1>
        
        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        <div className="mb-4">
          <Button onClick={updateLocation} variant="primary" className="mb-3" type="button">
            Update My Location
          </Button>

          {currentLocation && (
            <MapComponent 
              driverLocation={currentLocation} 
              pickupLocations={pickups.map(p => ({
                lat: p.location?.coordinates[1] || 0,
                lng: p.location?.coordinates[0] || 0
              }))} 
            />
          )}
        </div>

        <div className="text-center mt-4">
          <PDFDownloadLink
            document={<DriverPickupListPDF pickups={pickups} />}
            fileName="today_pickups.pdf"
          >
            {({ loading }) => (
              <Button variant="danger" className="px-4 py-2">
                {loading ? 'Generating PDF...' : 'Download Today\'s Pickup List'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>

        <div className="mt-4">
          {pickups.length === 0 ? (
            <Alert variant="info" className="text-center">
              No pickups assigned to you today.
            </Alert>
          ) : (
            pickups.map(pickup => (
              <Card key={pickup._id} className="mb-3 shadow-sm rounded-lg">
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <div>
                    <Card.Title>{pickup.user?.name || 'Customer'}</Card.Title>
                    <Card.Text className="mb-0">{pickup.address}</Card.Text>
                    <small className="text-muted">
                      Scheduled: {new Date(pickup.scheduledTime).toLocaleString()}
                    </small>
                    <div className="mt-2">
                      <span className={`badge ${pickup.status === 'assigned' ? 'bg-warning' : 'bg-success'}`}>
                        {pickup.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Button 
                      variant="success" 
                      className="me-2"
                      onClick={() => {
                        setCurrentPickup(pickup);
                        setActionMode('confirm');
                        setShowModal(true);
                      }}
                      disabled={pickup.status !== 'assigned'}
                    >
                      ✓ Confirm
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        setCurrentPickup(pickup);
                        setActionMode('cancel');
                        setShowModal(true);
                      }}
                      disabled={pickup.status !== 'assigned'}
                    >
                      ✗ Cancel
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))
          )}
        </div>
      </main>
      <Footer />
      
      <PickupConfirmationModal
        show={showModal}
        onConfirm={handleConfirmPickup}
        onCancel={handleCancelPickup}
        onClose={() => setShowModal(false)}
        mode={actionMode}
        image={image}
        setImage={setImage}
      />
    </div>
  );
};

export default DriverDashboard;
