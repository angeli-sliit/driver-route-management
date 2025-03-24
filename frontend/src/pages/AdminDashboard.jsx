import React, { useState, useEffect } from 'react';
import { Button, Alert, Form, Card, Table, Modal } from 'react-bootstrap';
import axios from 'axios';
import { PDFDownloadLink } from '@react-pdf/renderer';
import AdminPickupListPDF from "../components/AdminPickupListPDF";
import Switch from '../Switch.jsx';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AdminDashboard = () => {
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [fuelPrice, setFuelPrice] = useState(0);
  const [pickups, setPickups] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showAssign, setShowAssign] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showUpdateDriver, setShowUpdateDriver] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [newDriver, setNewDriver] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    vehicleType: '',
    employeeId: '',
    nic: '',
    birthday: '',
    nationality: '',
    employeeType: '',
  });

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
      await axios.put(
        `http://localhost:5000/api/drivers/${driverId}/availability`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setDrivers(drivers.map(d => 
        d._id === driverId ? { ...d, status } : d
      ));
    } catch (err) {
      console.error('Availability update failed:', err);
    }
  };

  const assignPickupsToDrivers = async () => {
    try {
      const token = localStorage.getItem('token'); // Get the token from localStorage
      if (!token) {
        setMessage('No token found. Please log in again.');
        return;
      }
  
      const { data } = await axios.post(
        'http://localhost:5000/api/pickups/assign-pickups',
        { date },
        { 
          headers: { 
            Authorization: `Bearer ${token}` // Include the token in the request headers
          } 
        }
      );
      setMessage(data.message);
      setShowAssign(false);
  
      // Refresh the pickups data
      const pickupsRes = await axios.get('http://localhost:5000/api/pickups/all', {
        headers: { 
          Authorization: `Bearer ${token}` // Include the token here as well
        }
      });
      setPickups(pickupsRes.data);
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    }
  };

  const handleAddDriver = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/drivers/register',
        newDriver,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Driver added successfully!');
      setShowAddDriver(false);
      setDrivers([...drivers, response.data.driver]);
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    }
  };

  const handleUpdateDriver = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/drivers/${selectedDriver._id}`,
        selectedDriver,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Driver updated successfully!');
      setShowUpdateDriver(false);
      setDrivers(drivers.map(d => d._id === selectedDriver._id ? response.data : d));
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    }
  };

  const calculateTotalFuelCost = () => {
    return pickups.reduce((sum, p) => sum + (p.fuelCost || 0), 0);
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <div className="container my-5 flex-grow-1"  style={{ paddingTop: '50px' }}>
        <h2 className="mb-4">Admin Dashboard</h2>

        {/* Driver Management Buttons */}
        <div className="mb-4">
          <Button 
            variant="primary" 
            className="me-2"
            onClick={() => setShowAddDriver(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add Driver
          </Button>
          <Button 
            variant="warning" 
            onClick={() => setShowUpdateDriver(true)}
          >
            <i className="bi bi-pencil-square me-2"></i>
            Update Driver
          </Button>
        </div>

        {/* Fuel Price Section */}
        <Card className="mb-4">
          <Card.Body>
            <Card.Title>Fuel Price Management</Card.Title>
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
                variant="outline-primary"
              >
                <i className="bi bi-fuel-pump me-2"></i>
                Update Fuel Price
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Pickup Assignment Section */}
        <Card className="mb-4">
          <Card.Body>
            <Card.Title>Pickup Assignment</Card.Title>
            <div className="d-flex gap-3 align-items-center">
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ maxWidth: '200px' }}
              />
              
              <Button 
                variant="primary" 
                onClick={() => setShowAssign(true)}
                className="me-2"
              >
                <i className="bi bi-gear-wide-connected me-2"></i>
                Optimize & Assign Pickups
              </Button>

              <PDFDownloadLink
                document={<AdminPickupListPDF pickups={pickups} drivers={drivers} fuelPrice={fuelPrice} />}
                fileName="pickup-report.pdf"
              >
                {({ loading }) => (
                  <Button variant="success" className="ms-auto">
                    <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-file-earmark-pdf'} me-2`}></i>
                    {loading ? 'Generating Report...' : 'Download PDF Report'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </Card.Body>
        </Card>

        {/* System Overview */}
        <Card className="mb-4">
          <Card.Body>
            <Card.Title className="mb-4">System Overview</Card.Title>
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
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
                      <td className="fw-bold">LKR {totalFuel.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <div className="mt-3 alert alert-info">
              <strong>Total Daily Fuel Cost:</strong> LKR {calculateTotalFuelCost().toFixed(2)}
            </div>
          </Card.Body>
        </Card>

        {/* Driver Attendance */}
        <Card className="mb-4">
          <Card.Body>
            <Card.Title className="mb-4">Driver Attendance</Card.Title>
            <Table striped bordered hover>
              <thead className="table-dark">
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

        {/* Modals */}
        <AddDriverModal 
          show={showAddDriver}
          onHide={() => setShowAddDriver(false)}
          newDriver={newDriver}
          setNewDriver={setNewDriver}
          handleAddDriver={handleAddDriver}
        />

        <UpdateDriverModal 
          show={showUpdateDriver}
          onHide={() => setShowUpdateDriver(false)}
          drivers={drivers}
          selectedDriver={selectedDriver}
          setSelectedDriver={setSelectedDriver}
          handleUpdateDriver={handleUpdateDriver}
        />

        <AssignmentModal 
          show={showAssign}
          onHide={() => setShowAssign(false)}
          date={date}
          assignPickupsToDrivers={assignPickupsToDrivers}
        />

        {message && (
          <Alert 
            variant="info" 
            className="mt-3"
            onClose={() => setMessage('')}
            dismissible
          >
            {message}
          </Alert>
        )}
      </div>
      <Footer />
    </div>
  );
};

const AddDriverModal = ({ show, onHide, newDriver, setNewDriver, handleAddDriver }) => {
  const vehicleOptions = ['Toyota Dyna', 'Isuzu Elf', 'Mitsubishi Canter', 'Tata LPT 709/1109'];
  const employeeTypeOptions = ['Permanent', 'Contract', 'Trainee'];

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add New Driver</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              type="text"
              value={newDriver.firstName}
              onChange={(e) => setNewDriver({ ...newDriver, firstName: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              value={newDriver.lastName}
              onChange={(e) => setNewDriver({ ...newDriver, lastName: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={newDriver.email}
              onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={newDriver.password}
              onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Employee ID</Form.Label>
            <Form.Control
              type="text"
              value={newDriver.employeeId}
              onChange={(e) => setNewDriver({ ...newDriver, employeeId: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>NIC</Form.Label>
            <Form.Control
              type="text"
              value={newDriver.nic}
              onChange={(e) => setNewDriver({ ...newDriver, nic: e.target.value })}
              placeholder="Format: XXXXXX-XXXXXX"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Birthday</Form.Label>
            <Form.Control
              type="date"
              value={newDriver.birthday}
              onChange={(e) => setNewDriver({ ...newDriver, birthday: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Nationality</Form.Label>
            <Form.Control
              type="text"
              value={newDriver.nationality}
              onChange={(e) => setNewDriver({ ...newDriver, nationality: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Vehicle Type</Form.Label>
            <Form.Select
              value={newDriver.vehicleType}
              onChange={(e) => setNewDriver({ ...newDriver, vehicleType: e.target.value })}
              required
            >
              <option value="">Select Vehicle Type</option>
              {vehicleOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Employee Type</Form.Label>
            <Form.Select
              value={newDriver.employeeType}
              onChange={(e) => setNewDriver({ ...newDriver, employeeType: e.target.value })}
              required
            >
              <option value="">Select Employee Type</option>
              {employeeTypeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Joined Date</Form.Label>
            <Form.Control
              type="date"
              value={newDriver.joinedDate}
              onChange={(e) => setNewDriver({ ...newDriver, joinedDate: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Vehicle Number</Form.Label>
            <Form.Control
              type="text"
              value={newDriver.vehicleNumber}
              onChange={(e) => setNewDriver({ ...newDriver, vehicleNumber: e.target.value })}
              required
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleAddDriver}>Add Driver</Button>
      </Modal.Footer>
    </Modal>
  );
};

const UpdateDriverModal = ({ show, onHide, drivers, selectedDriver, setSelectedDriver, handleUpdateDriver }) => {
  const vehicleOptions = ['Toyota Dyna', 'Isuzu Elf', 'Mitsubishi Canter', 'Tata LPT 709/1109'];
  const employeeTypeOptions = ['Permanent', 'Contract', 'Trainee'];

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Update Driver</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Select Driver</Form.Label>
            <Form.Select 
              onChange={(e) => setSelectedDriver(drivers.find(d => d._id === e.target.value))}
              value={selectedDriver?._id || ''}
            >
              <option value="">Select a driver</option>
              {drivers.map(driver => (
                <option key={driver._id} value={driver._id}>
                  {driver.firstName} {driver.lastName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {selectedDriver && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedDriver.firstName}
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, firstName: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedDriver.lastName}
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, lastName: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={selectedDriver.email}
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, email: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter new password"
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, password: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Employee ID</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedDriver.employeeId}
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, employeeId: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>NIC</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedDriver.nic}
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, nic: e.target.value })}
                  placeholder="Format: XXXXXX-XXXXXX"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Birthday</Form.Label>
                <Form.Control
                  type="date"
                  value={new Date(selectedDriver.birthday).toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, birthday: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Nationality</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedDriver.nationality}
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, nationality: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Vehicle Type</Form.Label>
                <Form.Select
                  value={selectedDriver.vehicleType}
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, vehicleType: e.target.value })}
                  required
                >
                  {vehicleOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Employee Type</Form.Label>
                <Form.Select
                  value={selectedDriver.employeeType}
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, employeeType: e.target.value })}
                  required
                >
                  {employeeTypeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Joined Date</Form.Label>
                <Form.Control
                  type="date"
                  value={new Date(selectedDriver.joinedDate).toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, joinedDate: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Vehicle Number</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedDriver.vehicleNumber}
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, vehicleNumber: e.target.value })}
                  required
                />
              </Form.Group>
            </>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleUpdateDriver}>Update Driver</Button>
      </Modal.Footer>
    </Modal>
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