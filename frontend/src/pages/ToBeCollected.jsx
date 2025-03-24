import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Spinner, Card, ListGroup, Button, Modal, Form, Alert } from 'react-bootstrap';
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

const ToBeCollected = () => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pickupToDelete, setPickupToDelete] = useState(null);
  const [formData, setFormData] = useState({
    contactNumber: '',
    chooseItem: '',
    estimatedAmount: '',
    pickupType: 'general',
    address: '',
    scheduledTime: '',
    location: { type: 'Point', coordinates: [6.9271, 79.8612] },
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mapCenter, setMapCenter] = useState([6.9271, 79.8612]);
  const [mapZoom] = useState(13);

  useEffect(() => {
    const fetchPickups = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/pickups/user/scheduled-pickups', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Filter out past pickups
        const now = new Date();
        const futurePickups = response.data.filter(pickup => new Date(pickup.scheduledTime) > now);

        setPickups(futurePickups);
      } catch (err) {
        console.error('Error fetching pickups:', err);
        setError('Failed to fetch pickups.');
      } finally {
        setLoading(false);
      }
    };

    fetchPickups();
  }, []);

  const handleUpdateClick = (pickup) => {
    const now = new Date();
    const scheduledTime = new Date(pickup.scheduledTime);
    const timeDifference = scheduledTime - now;

    if (timeDifference < 24 * 60 * 60 * 1000) {
      setError('Cannot update. Pickup time is less than 24 hours away.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSelectedPickup(pickup);
    setFormData({
      contactNumber: pickup.contactNumber,
      chooseItem: pickup.chooseItem,
      estimatedAmount: pickup.estimatedAmount,
      pickupType: pickup.pickupType,
      address: pickup.address,
      scheduledTime: new Date(pickup.scheduledTime).toISOString().slice(0, 16),
      location: pickup.location || { type: 'Point', coordinates: [6.9271, 79.8612] },
    });

    if (pickup.location?.coordinates) {
      setMapCenter([pickup.location.coordinates[1], pickup.location.coordinates[0]]);
    }
    setShowModal(true);
  };

  const handleDeleteClick = (pickup) => {
    const now = new Date();
    const scheduledTime = new Date(pickup.scheduledTime);
    const timeDifference = scheduledTime - now;

    if (timeDifference < 24 * 60 * 60 * 1000) {
      setError('Cannot delete. Pickup time is less than 24 hours away.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setPickupToDelete(pickup);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!pickupToDelete) return;

    const now = new Date();
    const scheduledTime = new Date(pickupToDelete.scheduledTime);
    const timeDifference = scheduledTime - now;

    if (timeDifference < 24 * 60 * 60 * 1000) {
      setError('Cannot delete. Pickup time is less than 24 hours away.');
      setTimeout(() => setError(''), 3000);
      setShowDeleteModal(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/pickups/delete/${pickupToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPickups(pickups.filter((p) => p._id !== pickupToDelete._id));
      setSuccess('Pickup deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || 'Failed to delete pickup.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setShowDeleteModal(false);
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
    if (!selectedPickup) return;

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
        `http://localhost:5000/api/pickups/update/${selectedPickup._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPickups(pickups.map((p) => (p._id === selectedPickup._id ? response.data : p)));
      setSuccess('Pickup updated successfully!');
      setShowModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Failed to update pickup.');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center">To Be Collected</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {pickups.length > 0 ? (
        <ListGroup className="mb-4">
          {pickups.map((pickup) => (
            <ListGroup.Item key={pickup._id} className="mb-3 shadow-sm">
              <Card className="border-0">
                <Card.Body>
                  <h5 className="card-title">Contact: {pickup.contactNumber}</h5>
                  <p>Scheduled: {new Date(pickup.scheduledTime).toLocaleString()}</p>
                  <p>Item: {pickup.chooseItem}</p>
                  <p>Amount: LKR {pickup.estimatedAmount}</p>
                  <p>Type: {pickup.pickupType}</p>
                  <p>Address: {pickup.address}</p>
                  <p>Status: {pickup.status}</p>
                  <div className="d-flex justify-content-start">
                    <Button variant="primary" onClick={() => handleUpdateClick(pickup)} className="me-2">
                      Update
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteClick(pickup)}>
                      Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <p className="text-center">No scheduled pickups found</p>
      )}

      {/* Update Pickup Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
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
                placeholder="Enter contact number"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Item Description</Form.Label>
              <Form.Control
                type="text"
                name="chooseItem"
                value={formData.chooseItem}
                onChange={handleFormChange}
                placeholder="Enter item description"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Estimated Value (LKR)</Form.Label>
              <Form.Control
                type="number"
                name="estimatedAmount"
                value={formData.estimatedAmount}
                onChange={handleFormChange}
                placeholder="Enter estimated amount"
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
                placeholder="Enter address"
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
                    <Popup>Your pickup location</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this pickup?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Confirm Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ToBeCollected;
