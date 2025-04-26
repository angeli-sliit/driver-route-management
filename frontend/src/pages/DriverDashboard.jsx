import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import MapComponent from '../components/MapComponent';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PickupConfirmationModal from '../components/PickupConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import DriverPickupListPDF from '../components/DriverPickupListPDF';
import emailjs from 'emailjs-com';

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
        // Get driver ID from token
        const driverRes = await axios.get('http://localhost:5000/api/drivers/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const response = await axios.get(`http://localhost:5000/api/pickups/driver/${driverRes.data._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const todayPickups = response.data.filter(pickup => {
          const pickupDate = new Date(pickup.scheduledTime);
          return pickupDate >= startOfDay && pickupDate <= endOfDay;
        });

        setPickups(todayPickups);
      } catch (error) {
        console.error('Fetch error:', error);
        setError('Failed to load pickups');
      }
    };
    
    fetchDriverPickups();

    // Get initial location when component mounts
    const getInitialLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.error('Error getting initial location:', error);
            setCurrentLocation({ lat: 0, lng: 0 });
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
        setCurrentLocation({ lat: 0, lng: 0 });
      }
    };

    getInitialLocation();
  }, [navigate]);

  const sendEmail = async (templateParams) => {
    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        templateParams.templateId,
        templateParams.params,
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Email sending error:', error);
    }
  };

  const handleConfirmPickup = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', data.image);
      formData.append('weight', data.weight);
      formData.append('amount', data.amount);
  
      const response = await axios.put(
        `http://localhost:5000/api/pickups/${currentPickup._id}/confirm`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
  
      if (response.status === 200) {
        const updatedResponse = await axios.get('http://localhost:5000/api/pickups/me', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setPickups(updatedResponse.data);
        setShowModal(false);
        setImage(null);

        // Send confirmation email
        const emailParams = {
          templateId: process.env.REACT_APP_EMAILJS_CONFIRM_TEMPLATE,
          params: {
            userName: currentPickup.user?.name || 'Customer',
            pickupDetails: `${currentPickup.address}, ${currentPickup.scheduledTime}`,
          }
        };
        sendEmail(emailParams);
      }
    } catch (err) {
      console.error('Confirmation error:', err);
      setError(err.response?.data?.message || 'Failed to confirm pickup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPickup = async (reason) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/pickups/${currentPickup._id}/cancel`, 
        { reason }, 
        {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.status === 200) {
        const updated = await axios.get('http://localhost:5000/api/pickups/me', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setPickups(updated.data);
        setShowModal(false);

        // Send cancellation email
        const emailParams = {
          templateId: process.env.REACT_APP_EMAILJS_CANCEL_TEMPLATE,
          params: {
            userName: currentPickup.user?.name || 'Customer',
            reason,
            pickupDetails: `${currentPickup.address}, ${currentPickup.scheduledTime}`,
          }
        };
        sendEmail(emailParams);
      }
    } catch (err) {
      console.error('Cancellation error:', err);
      setError(err.response?.data?.message || 'Failed to cancel pickup');
    }
  };

  if (loading && !currentLocation) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  const updateLocation = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  
    try {
      setLoading(true);
      setError('');
  
      // Get the current location from the geolocation API
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
  
      const { latitude: lat, longitude: lng } = position.coords;
  
  
      setCurrentLocation({ lat, lng });
  
      
      const response = await axios.put(
        'http://localhost:5000/api/drivers/update-location', 
        { lat, lng },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          }
        }
      );
  
      if (response.status === 200) {
        console.log('Location updated successfully');
    
      } else {
        setError('Failed to update location.');
      }
    } catch (error) {
      console.error('Location update error:', error);
      setError(error.response?.data?.error || 'Failed to update location. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="container py-5">
        <div className="bg-gray-800 rounded p-4">
          <div className="row mb-4 justify-content-center text-center">
           <div className="col-md-8">
            <h1 className="text-center fw-bold mb-3" style={{ color: '#0f5132' }}>Driver Dashboard</h1>
            <p className="text-success fw-bold">Welcome back! Here's your schedule for today.</p>
          </div>
        </div>
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
            <Button 
              variant="link" 
              onClick={() => setError('')}
              className="p-0 ms-2"
            >
              Dismiss
            </Button>
          </Alert>
        )}

        <div className="mb-4">
          <Button 
            onClick={updateLocation} 
            variant="primary" 
            className="mb-3" 
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update My Location'}
          </Button>

          <MapComponent
            driverLocation={currentLocation}
            pickupLocations={pickups.map(p => ({
              lat: p.location?.coordinates[1] || 0,
              lng: p.location?.coordinates[0] || 0,
              id: p._id,
              status: p.status
            }))}
            loading={loading}
          />
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
                      <Badge bg={pickup.status === 'assigned' ? 'warning' : 'success'}>
                        {pickup.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="d-flex flex-column flex-md-row gap-2">
                    <Button
                      variant="success"
                      onClick={() => {
                        setCurrentPickup(pickup);
                        setShowModal(true);
                        setActionMode('confirm');
                      }}
                      disabled={pickup.status !== 'assigned'}
                    >
                      ✓ Confirm
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        setCurrentPickup(pickup);
                        setShowModal(true);
                        setActionMode('cancel');
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

        <PickupConfirmationModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmPickup}
          onCancel={handleCancelPickup}
          pickup={currentPickup}
          mode={actionMode}
          setImage={setImage}
          image={image}
        />
      </div>
      <Footer />
    </div>
    </div>
  );
};

export default DriverDashboard;
