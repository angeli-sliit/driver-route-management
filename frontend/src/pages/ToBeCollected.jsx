import React, { useState, useEffect } from 'react';
import { Button, Alert, Form, Card, Table, Modal } from 'react-bootstrap';
import axios from 'axios';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PickupListPDF from '../components/AdminPickupListPDF.jsx';

const AdminDashboard = () => {
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [fuelPrice, setFuelPrice] = useState(0);
  const [pickups, setPickups] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showPickupDetails, setShowPickupDetails] = useState(false);
  const [selectedDatePickups, setSelectedDatePickups] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const [pickupsRes, driversRes, fuelRes] = await Promise.all([
          axios.get('http://localhost:5000/api/pickups/all', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/drivers', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/fuel-price/current', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setPickups(pickupsRes.data);
        setDrivers(driversRes.data || []);
        setFuelPrice(parseFloat(fuelRes.data?.price) || 0);
      } catch (err) {
        console.error('Fetch error:', err);
        setMessage(err.response?.data?.error || err.message || 'Failed to load data');
      }
    };
    fetchData();
  }, []);

  const handleAssignPickups = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // Fetch pickups for the selected date
      const response = await axios.get(`http://localhost:5000/api/pickups/all?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Set the pickups for the selected date
      setSelectedDatePickups(response.data);
      setShowPickupDetails(true); // Show the modal with pickup details
      setMessage(`Found ${response.data.length} pickups for ${date}`);
    } catch (err) {
      console.error('Assignment error:', err);
      setMessage(err.response?.data?.error || err.message || 'Failed to fetch pickups');
    }
  };

  const handleFuelPriceUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      await axios.post(
        'http://localhost:5000/api/fuel-price/update',
        { price: parseFloat(fuelPrice) || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Fuel price updated successfully!');
    } catch (err) {
      console.error('Fuel price error:', err);
      setMessage(err.response?.data?.error || err.message || 'Failed to update fuel price');
    }
  };

  // Ensure drivers is always an array
  const driverData = Array.isArray(drivers) ? drivers : [];

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Admin Dashboard</h2>

      {/* Fuel Price Section */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Fuel Price Management</Card.Title>
          <div className="d-flex gap-3">
            <Form.Control
              type="number"
              value={fuelPrice}
              onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 0)}
              placeholder="Enter fuel price"
              min="0"
              step="0.01"
            />
            <Button onClick={handleFuelPriceUpdate}>Update Fuel Price</Button>
          </div>
        </Card.Body>
      </Card>

      {/* Pickup Assignment Section */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Pickup Assignment</Card.Title>
          <div className="d-flex gap-3 mb-3">
            <Form.Control
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Button onClick={handleAssignPickups}>Assign Pickups</Button>
          </div>

          <PDFDownloadLink
            document={<PickupListPDF 
              pickups={pickups} 
              drivers={driverData}
              fuelPrice={parseFloat(fuelPrice)}
            />}
            fileName="optimized_pickups.pdf"
          >
            {({ loading }) => (
              <Button variant="success" className="me-2">
                {loading ? 'Generating Report...' : 'Download Report'}
              </Button>
            )}
          </PDFDownloadLink>
        </Card.Body>
      </Card>

      {/* Modal to display pickup details for the selected date */}
      <Modal show={showPickupDetails} onHide={() => setShowPickupDetails(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Pickup Details for {date}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>User</th>
                <th>Address</th>
                <th>Scheduled Time</th>
                <th>Pickup Type</th>
              </tr>
            </thead>
            <tbody>
              {selectedDatePickups.map((pickup) => (
                <tr key={pickup._id}>
                  <td>{pickup.user?.name}</td>
                  <td>{pickup.address}</td>
                  <td>{new Date(pickup.scheduledTime).toLocaleString()}</td>
                  <td>{pickup.pickupType}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPickupDetails(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* System Overview */}
      <Card>
        <Card.Body>
          <Card.Title>System Overview</Card.Title>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Pickups</th>
                <th>Total Load</th>
                <th>Fuel Cost</th>
              </tr>
            </thead>
            <tbody>
              {driverData.map(driver => {
                const driverPickups = pickups.filter(p => p.driver?._id === driver._id);
                const totalLoad = driverPickups.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0);
                const totalFuelCost = driverPickups.reduce((sum, p) => sum + (p.fuelCost || 0), 0);

                return (
                  <tr key={driver._id}>
                    <td>{driver.firstName} {driver.lastName}</td>
                    <td>{driverPickups.length}</td>
                    <td>{totalLoad.toFixed(2)} kg</td>
                    <td>LKR {totalFuelCost.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {message && <Alert variant="info" className="mt-3">{message}</Alert>}
    </div>
  );
};

export default AdminDashboard;