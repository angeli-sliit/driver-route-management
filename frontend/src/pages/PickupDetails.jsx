import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Card, Alert, Button, Modal, Form } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix leaflet marker icons
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const PickupDetails = () => {
  const { pickupId } = useParams();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    contactNumber: '',
    chooseItem: '',
    estimatedAmount: '',
    pickupType: 'general',
    address: '',
    scheduledTime: '',
    location: { type: 'Point', coordinates: [6.9271, 79.8612] },
  });
  const [mapCenter, setMapCenter] = useState([6.9271, 79.8612]);
  const [mapZoom] = useState(13);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchPickupDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/pickups/nowShedule/${pickupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.error) {
          setError(response.data.error);
        } else {
          setPickup(response.data);
          setFormData({
            contactNumber: response.data.contactNumber,
            chooseItem: response.data.chooseItem,
            estimatedAmount: response.data.estimatedAmount,
            pickupType: response.data.pickupType,
            address: response.data.address,
            scheduledTime: new Date(response.data.scheduledTime).toISOString().slice(0, 16),
            location: response.data.location || { type: 'Point', coordinates: [6.9271, 79.8612] },
          });
          if (response.data.location?.coordinates) {
            setMapCenter([response.data.location.coordinates[1], response.data.location.coordinates[0]]);
          }
        }
      } catch (err) {
        console.error('Error fetching pickup details:', err);
        setError(err.response?.data?.error || 'Failed to fetch pickup details.');
      } finally {
        setLoading(false);
      }
    };

    fetchPickupDetails();
  }, [pickupId]);

  const handleUpdateClick = () => {
    setShowModal(true);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/pickups/delete/${pickupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage('Pickup deleted successfully!');
      setTimeout(() => {
        setShowDeleteModal(false);
        navigate('/add-pickup'); // Redirect to /add-pickup after deletion
      }, 2000);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || 'Failed to delete pickup.');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setMapCenter([lat, lng]);
    setFormData((prevData) => ({
      ...prevData,
      location: { type: 'Point', coordinates: [lng, lat] },
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        location: {
          type: 'Point',
          coordinates: [mapCenter[1], mapCenter[0]],
        },
      };

      const response = await axios.put(
        `http://localhost:5000/api/pickups/update/${pickupId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPickup(response.data);
      setSuccessMessage('Pickup updated successfully!');
      setTimeout(() => {
        setShowModal(false);
      }, 2000);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Failed to update pickup.');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  if (!pickup) {
    return (
      <div className="container mt-4">
        <Alert variant="warning">Pickup not found.</Alert>
      </div>
    );
  }

  const pickupLocation = pickup.location?.coordinates
    ? [pickup.location.coordinates[1], pickup.location.coordinates[0]]
    : [6.9271, 79.8612];

  return (
    <div className="container mt-4">
      <h2>Pickup Details</h2>
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Pickup Information</Card.Title>
          <Card.Text>
            <strong>Contact Number:</strong> {pickup.contactNumber}
          </Card.Text>
          <Card.Text>
            <strong>Item:</strong> {pickup.chooseItem}
          </Card.Text>
          <Card.Text>
            <strong>Estimated Weight:</strong> KG {pickup.estimatedAmount}
          </Card.Text>
          <Card.Text>
            <strong>Pickup Type:</strong> {pickup.pickupType}
          </Card.Text>
          <Card.Text>
            <strong>Scheduled Time:</strong> {new Date(pickup.scheduledTime).toLocaleString()}
          </Card.Text>
          <Card.Text>
            <strong>Address:</strong> {pickup.address}
          </Card.Text>
          <Card.Text>
            <strong>Status:</strong> {pickup.status}
          </Card.Text>
          <Button variant="primary" onClick={handleUpdateClick}>
            Update
          </Button>
          <Button variant="danger" onClick={handleDeleteClick} className="ms-2">
            Delete
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>Pickup Location</Card.Title>
          <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden' }}>
            <MapContainer center={pickupLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={pickupLocation}>
                <Popup>Pickup Location</Popup>
              </Marker>
            </MapContainer>
          </div>
        </Card.Body>
      </Card>

      {/* Update Pickup Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Update Pickup Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Contact Number</Form.Label>
              <Form.Control
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleFormChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Item Description</Form.Label>
              <Form.Control
                type="text"
                name="chooseItem"
                value={formData.chooseItem}
                onChange={handleFormChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Estimated Value (LKR)</Form.Label>
              <Form.Control
                type="number"
                name="estimatedAmount"
                value={formData.estimatedAmount}
                onChange={handleFormChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Pickup Type</Form.Label>
              <Form.Select
                name="pickupType"
                value={formData.pickupType}
                onChange={handleFormChange}
              >
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="fragile">Fragile</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="address"
                value={formData.address}
                onChange={handleFormChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Scheduled Time</Form.Label>
              <Form.Control
                type="datetime-local"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleFormChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Location (Click map to update)</Form.Label>
              <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden' }}>
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                  onClick={handleMapClick}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={mapCenter}>
                    <Popup>Pickup Location</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this pickup?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            No
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PickupDetails;