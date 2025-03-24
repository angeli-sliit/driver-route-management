import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!position) return alert('Please select location on map');
    const fieldsFilled = Object.values(formData).every(val => val !== '');
    if (!fieldsFilled) return alert('Please fill out all required fields.');

    setShowConfirmation(true);
  };

  const handleConfirmation = async () => {
    if (!termsAccepted) return alert('Please accept the terms and conditions.');
    if (!position) return alert('Please select a location on the map.');

    try {
      const formPayload = {
        ...formData,
        location: {
          type: 'Point',
          coordinates: [position.lng, position.lat],
        },
      };

      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/pickups/add', formPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.error) return alert(response.data.error);

      navigate(`/pickup-details/${response.data._id}`);
    } catch (err) {
      console.error('Error scheduling pickup:', err);
      const msg = err.response?.data?.error || 'Network error. Please try again.';
      alert(msg);
    }
  };

  const handleToBeCollectedClick = () => {
    navigate('/to-be-collected');
  };

  return (
    <>
    <div className="container mt-5" style={{ paddingTop: '50px' }}>
      <Navbar />

      <div className="d-flex justify-content-between align-items-center mb-4" >
        <h2 className="fw-bold">Schedule New Pickup</h2>
        <Button variant="primary" onClick={handleToBeCollectedClick}>
          To Be Collected
        </Button>
      </div>

      <div className="p-4 bg-light rounded shadow-sm mb-4">
        <Form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Contact Number</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  required
                />
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Estimated Weight (kg)</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.estimatedAmount}
                  onChange={(e) => setFormData({ ...formData, estimatedAmount: e.target.value })}
                  required
                />
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Choose Item</Form.Label>
                <Form.Select
                  value={formData.chooseItem}
                  onChange={(e) => setFormData({ ...formData, chooseItem: e.target.value })}
                  required
                >
                  <option value="">Select Item</option>
                  <option value="electronics">Electronics</option>
                  <option value="furniture">Furniture</option>
                  <option value="documents">Documents</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Pickup Type</Form.Label>
                <Form.Select
                  value={formData.pickupType}
                  onChange={(e) => setFormData({ ...formData, pickupType: e.target.value })}
                  required
                >
                  <option value="general">General</option>
                  <option value="urgent">Urgent</option>
                  <option value="fragile">Fragile</option>
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Scheduled Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  required
                />
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-4">
            <Form.Label>Select Pickup Location</Form.Label>
            <div className="border rounded" style={{ height: '300px' }}>
              <MapContainer center={[6.9271, 79.8612]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker setPosition={setPosition} />
                {position && <Marker position={position} />}
              </MapContainer>
            </div>
          </Form.Group>

          <Button type="submit" variant="success" className="w-100">
            Schedule Pickup
          </Button>
        </Form>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Pickup</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to confirm this pickup?</p>
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
    <Footer />
    </>
  );
};

export default AddPickup;
