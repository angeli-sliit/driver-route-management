import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';

const LocationMarker = ({ setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return null;
};

const AddPickup = () => {
  const [position, setPosition] = useState(null);
  const [formData, setFormData] = useState({
    contactNumber: '',
    estimatedAmount: '',
    chooseItem: '',
    pickupType: 'general',
    scheduledTime: '',
    itemImage: null,
    address: '',
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all required fields
    if (!position) return alert('Please select location on map');
    if (
      !formData.contactNumber ||
      !formData.estimatedAmount ||
      !formData.chooseItem ||
      !formData.pickupType ||
      !formData.scheduledTime ||
      !formData.address
    ) {
      return alert('Please fill out all required fields.');
    }

    setShowConfirmation(true); // Show confirmation popup
  };

  const handleConfirmation = async () => {
    if (!termsAccepted) {
      alert('Please accept the terms and conditions.');
      return;
    }
  
    if (!position) {
      alert('Please select a location on the map.');
      return;
    }
  
    try {
      const formPayload = {
        ...formData,
        location: {
          type: 'Point', // Required
          coordinates: [position.lng, position.lat], // [longitude, latitude]
        },
      };
  
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/pickups/add', formPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.data.error) {
        alert(response.data.error);
        return;
      }
  
      const pickupId = response.data._id;
      navigate(`/pickup-details/${pickupId}`); // Navigate to PickupDetails page
    } catch (err) {
      console.error('Error scheduling pickup:', err);
      if (err.response) {
        alert(err.response.data.error || 'Failed to schedule pickup. Please try again.');
      } else {
        alert('Network error. Please check your connection.');
      }
    }
  };

  const handleToBeCollectedClick = () => {
    navigate('/to-be-collected'); // Adjust the route as needed
  };

  return (
    <div className="container mt-4">
      <h2>Schedule New Pickup</h2>
      <Button variant="primary" onClick={handleToBeCollectedClick}>
        To Be Collected
      </Button>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Contact Number</label>
          <input
            type="text"
            className="form-control"
            value={formData.contactNumber}
            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
            required
          />
        </div>

        <div className="mb-3">
          <label>Estimated Wight</label>
          <input
            type="number"
            className="form-control"
            value={formData.estimatedAmount}
            onChange={(e) => setFormData({ ...formData, estimatedAmount: e.target.value })}
            required
          />
        </div>

        <div className="mb-3">
          <label>Choose Item</label>
          <select
            className="form-select"
            value={formData.chooseItem}
            onChange={(e) => setFormData({ ...formData, chooseItem: e.target.value })}
            required
          >
            <option value="">Select Item</option>
            <option value="electronics">Electronics</option>
            <option value="furniture">Furniture</option>
            <option value="documents">Documents</option>
          </select>
        </div>

        <div className="mb-3">
          <label>Pickup Type</label>
          <select
            className="form-select"
            value={formData.pickupType}
            onChange={(e) => setFormData({ ...formData, pickupType: e.target.value })}
            required
          >
            <option value="general">General</option>
            <option value="urgent">Urgent</option>
            <option value="fragile">Fragile</option>
          </select>
        </div>

        <div className="mb-3">
          <label>Scheduled Date</label>
          <input
            type="date" // Only allow date selection
            className="form-control"
            value={formData.scheduledTime.split('T')[0]} // Extract only the date part
            onChange={(e) => {
              const selectedDate = e.target.value; // Format: YYYY-MM-DD
              setFormData({ ...formData, scheduledTime: selectedDate }); // Send only the date
            }}
            required
          />
        </div>

        <div className="mb-3">
          <label>Address</label>
          <input
            type="text"
            className="form-control"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
        </div>

        <div className="mb-3">
          <label>Pickup Location</label>
          <div style={{ height: '300px', width: '100%', marginBottom: '20px' }}>
            <MapContainer center={[6.9271, 79.8612]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker setPosition={setPosition} />
              {position && <Marker position={position} />}
            </MapContainer>
          </div>
        </div>

        <button type="submit" className="btn btn-primary">Schedule Pickup</button>
      </form>

      {/* Confirmation Popup */}
      <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Pickup</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to confirm this pickup?</p>
          <Form.Group>
            <Form.Check
              type="checkbox"
              label={
                <>
                  I agree to the{' '}
                  <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">
                    terms and conditions
                  </a>
                </>
              }
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmation(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmation} disabled={!termsAccepted}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AddPickup;
