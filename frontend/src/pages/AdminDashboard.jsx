import React, { useState, useEffect } from 'react';
import { Button, Alert, Form, Card, Table, Modal } from 'react-bootstrap';
import axios from 'axios';
import { PDFDownloadLink } from '@react-pdf/renderer';
import AdminPickupListPDF from "../components/AdminPickupListPDF";
import Switch from '../Switch.jsx';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [fuelPrice, setFuelPrice] = useState(0);
  const [pickups, setPickups] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showAssign, setShowAssign] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [showPickupDetails, setShowPickupDetails] = useState(false);
  const [filteredPickups, setFilteredPickups] = useState([]);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null); 
  const [showSummary, setShowSummary] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [pickupsRes, driversRes, fuelRes] = await Promise.all([
          axios.get('http://localhost:5000/api/pickups/all', { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get('http://localhost:5000/api/drivers', { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get('http://localhost:5000/api/fuel-price/current', { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
        ]);

        setPickups(pickupsRes.data);
        setDrivers(driversRes.data || []);
        setFuelPrice(parseFloat(fuelRes.data?.price) || 0);
      } catch (err) {
        setMessage(err.response?.data?.error || err.message);
      }
    };
    fetchData();
  }, []);

  const handleGetSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/pickups/daily-summary/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(response.data);
      setShowSummary(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };
  
  const handleFuelPriceUpdate = async () => {
    try {
      await axios.post(
        'http://localhost:5000/api/fuel-price/update',
        { price: parseFloat(fuelPrice) || 0 },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMessage('Fuel price updated successfully!');
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    }
  };

  const updateDriverAvailability = async (driverId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/drivers/${driverId}/availability`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDrivers(drivers.map(d => 
        d._id === driverId ? { ...d, status } : d
      ));
    } catch (err) {
      console.error('Availability update failed:', err);
    }
  };

  const handleOptimizeAndAssign = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/pickups/optimize-and-assign',
        { date },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage(response.data.message);
      setOptimizationResult(response.data);
      setShowAssign(false);

      const [pickupsRes, driversRes] = await Promise.all([
        axios.get('http://localhost:5000/api/pickups/all', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/drivers', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setPickups(pickupsRes.data);
      setDrivers(driversRes.data);
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    }
  };

  const calculateTotalFuelCost = () => {
    return pickups.reduce((sum, p) => sum + (p.fuelCost || 0), 0);
  };

  const handleFilterPickupsByDay = () => {
    if (!date) {
      setMessage('Please select a date to filter pickups.');
      return;
    }

    const filtered = pickups.filter(pickup => {
      const pickupDate = new Date(pickup.scheduledTime).toISOString().split('T')[0];
      return pickupDate === date;
    });

    if (filtered.length === 0) {
      setMessage(`No pickups found for ${date}.`);
    } else {
      setFilteredPickups(filtered);
      setShowPickupDetails(true);
    }
  };

  const navigateToDriverManagement = () => {
    navigate('/driver-management');
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <div className="container my-5 flex-grow-1" style={{ paddingTop: '50px' }}>
        <h2 className="mb-4 text-success">Admin Dashboard</h2>
  
        {/* Driver Management Button */}
        <div className="mb-4">
          <Button 
            variant="success" 
            onClick={navigateToDriverManagement}
          >
            <i className="bi bi-people-fill me-2"></i>
            Driver Management
          </Button>
        </div>
  
        {/* Fuel Price Section */}
        <Card className="mb-4 border-success">
          <Card.Body>
            <Card.Title className="text-success">Fuel Price Management</Card.Title>
            <div className="d-flex gap-3 align-items-center">
              <Form.Control
                type="number"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(parseFloat(e.target.value))}
                placeholder="Enter fuel price"
                min="0"
                step="0.01"
                style={{ maxWidth: '200px' }}
              />
              <Button 
                onClick={handleFuelPriceUpdate}
                variant="outline-success"
              >
                <i className="bi bi-fuel-pump me-2"></i>
                Update Fuel Price
              </Button>
            </div>
          </Card.Body>
        </Card>
  
        {/* Pickup Assignment Section */}
        <Card className="mb-4 border-success">
          <Card.Body>
            <Card.Title className="text-success">Pickup Assignment</Card.Title>
            <div className="d-flex gap-3 align-items-center flex-wrap">
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ maxWidth: '200px' }}
              />
              <Button 
                variant="outline-success" 
                onClick={handleFilterPickupsByDay}
                className="me-2"
              >
                <i className="bi bi-filter me-2"></i>
                Filter Pickups by Day
              </Button>
              
              <Button 
                variant="success" 
                onClick={() => setShowAssign(true)}
                className="me-2"
              >
                <i className="bi bi-gear-wide-connected me-2"></i>
                Optimize & Assign Pickups
              </Button>

              <Button 
                variant="outline-primary" 
                onClick={handleGetSummary}
                className="me-2"
              >
                <i className="bi bi-file-earmark-text me-2"></i>
                Get Pickup Summary
              </Button>
  
              <PDFDownloadLink
                document={<AdminPickupListPDF pickups={pickups} drivers={drivers} fuelPrice={fuelPrice} />}
                fileName="pickup-report.pdf"
              >
                {({ loading }) => (
                  <Button variant="outline-success" className="ms-auto">
                    <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-file-earmark-pdf'} me-2`}></i>
                    {loading ? 'Generating Report...' : 'Download PDF Report'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </Card.Body>
        </Card>
  
        {/* System Overview */}
        <Card className="mb-4 border-success">
          <Card.Body>
            <Card.Title className="mb-4 text-success">System Overview</Card.Title>
            <Table striped bordered hover className="mb-0">
              <thead className="table-success">
                <tr>
                  <th>Driver</th>
                  <th>Pickups</th>
                  <th>Total Load</th>
                  <th>Fuel Cost</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(driver => {
                  const driverPickups = pickups.filter(p => p.driver === driver._id);
                  const totalLoad = driverPickups.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0);
                  const totalFuel = driverPickups.reduce((sum, p) => sum + (p.fuelCost || 0), 0);
                  
                  return (
                    <tr key={driver._id}>
                      <td>{driver.firstName} {driver.lastName}</td>
                      <td>{driverPickups.length}</td>
                      <td>{totalLoad.toFixed(2)} kg</td>
                      <td className="fw-bold text-success">LKR {totalFuel.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <div className="mt-3 alert alert-success">
              <strong>Total Daily Fuel Cost:</strong> LKR {calculateTotalFuelCost().toFixed(2)}
            </div>
          </Card.Body>
        </Card>
  
        {/* Driver Attendance */}
        <Card className="mb-4 border-success">
          <Card.Body>
            <Card.Title className="mb-4 text-success">Driver Attendance</Card.Title>
            <Table striped bordered hover>
              <thead className="table-success">
                <tr>
                  <th>Driver Name</th>
                  <th>Availability Status</th>
                  <th>Toggle Availability</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(driver => (
                  <tr key={driver._id}>
                    <td>{driver.firstName} {driver.lastName}</td>
                    <td>
                      <span className={`badge ${driver.status === 'available' ? 'bg-success' : 'bg-secondary'}`}>
                        {driver.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <Switch
                        checked={driver.status === 'available'}
                        onChange={(checked) => 
                          updateDriverAvailability(
                            driver._id, 
                            checked ? 'available' : 'unavailable'
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
  
        {/* Optimization Results Section */}
        {optimizationResult && (
          <Card className="mt-4 border-success">
            <Card.Body>
              <Card.Title className="text-success">Optimization Results</Card.Title>
              <Table striped bordered>
                <thead className="table-success">
                  <tr>
                    <th>Driver</th>
                    <th>Vehicle</th>
                    <th>Pickups</th>
                    <th>Total Weight</th>
                    <th>Fuel Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {optimizationResult.assignments.map((assignment, index) => {
                    const driver = drivers.find(d => d._id === assignment.driverId);
                    return (
                      <tr key={index}>
                        <td>{driver?.firstName} {driver?.lastName}</td>
                        <td>{driver?.vehicleType}</td>
                        <td>{assignment.pickups.length}</td>
                        <td>{assignment.totalWeight} kg</td>
                        <td className="text-success">LKR {assignment.fuelCost.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}
  
        <AssignmentModal 
          show={showAssign}
          onHide={() => setShowAssign(false)}
          date={date}
          assignPickupsToDrivers={handleOptimizeAndAssign}
        />
  
        {/* Modal to Display Filtered Pickups */}
        <Modal show={showPickupDetails} onHide={() => setShowPickupDetails(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title className="text-success">Pickups for {date}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Table striped bordered hover>
              <thead className="table-success">
                <tr>
                  <th>User</th>
                  <th>Address</th>
                  <th>Scheduled Time</th>
                  <th>Pickup Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredPickups.map(pickup => (
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

        {/* Modal to Display Daily Summary */}
        <Modal show={showSummary} onHide={() => setShowSummary(false)} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>Daily Summary - {date}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>Completed Pickups</h4>
            <Table striped bordered>
              <thead>
                <tr>
                  <th>Pickup ID</th>
                  <th>User Phone</th>
                  <th>Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {summary?.pickups?.filter(p => p.status === 'completed').map(pickup => (
                  <tr key={pickup._id}>
                    <td>{pickup._id}</td>
                    <td>{pickup.user?.phone}</td>
                    <td>{pickup.address}</td>
                    <td>{pickup.status}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <h4 className="mt-4">Cancelled Pickups</h4>
            <Table striped bordered>
              <thead>
                <tr>
                  <th>Pickup ID</th>
                  <th>User Phone</th>
                  <th>Address</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {summary?.pickups?.filter(p => p.status === 'cancelled').map(pickup => (
                  <tr key={pickup._id}>
                    <td>{pickup._id}</td>
                    <td>{pickup.user?.phone}</td>
                    <td>{pickup.address}</td>
                    <td>{pickup.cancellationReason}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Modal.Body>
          <Modal.Footer>
            {summary?.pdfUrl && (
              <a 
                href={summary.pdfUrl} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-primary"
              >
                <i className="bi bi-file-earmark-pdf me-2"></i>
                View PDF Summary
              </a>
            )}
            <Button variant="secondary" onClick={() => setShowSummary(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
  
        {message && (
          <Alert 
            variant="success" 
            className="mt-3"
            onClose={() => setMessage('')}
            dismissible
          >
            {message}
          </Alert>
        )}

        {error && (
          <Alert 
            variant="danger" 
            className="mt-3"
            onClose={() => setError('')}
            dismissible
          >
            {error}
          </Alert>
        )}
      </div>
      <Footer />
    </div>
  );
};  

const AssignmentModal = ({ show, onHide, date, assignPickupsToDrivers }) => (
  <Modal show={show} onHide={onHide} centered>
    <Modal.Header closeButton className="bg-light">
      <Modal.Title>
        <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
        Confirm Pickup Assignment
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p className="lead">
        Are you sure you want to optimize and assign pickups for <strong>{date || 'selected date'}</strong>?
      </p>
      <div className="alert alert-warning mt-3">
        <i className="bi bi-info-circle-fill me-2"></i>
        This action will automatically assign pickups based on:
        <ul className="mt-2 mb-0">
          <li>Driver availability status</li>
          <li>Vehicle capacity constraints</li>
          <li>Optimal fuel efficiency</li>
        </ul>
      </div>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        <i className="bi bi-x-circle me-2"></i>
        Cancel
      </Button>
      <Button variant="primary" onClick={assignPickupsToDrivers}>
        <i className="bi bi-check2-circle me-2"></i>
        Confirm Assignment
      </Button>
    </Modal.Footer>
  </Modal>
);

export default AdminDashboard;