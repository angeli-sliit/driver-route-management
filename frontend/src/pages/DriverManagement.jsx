import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Alert, ListGroup, InputGroup, Row, Col, Badge } from 'react-bootstrap';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    joinedDate: '',
    vehicleNumber: ''
  });

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/drivers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDrivers(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  const filteredDrivers = drivers.filter(driver => 
    `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDriver = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/drivers/register',
        newDriver,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDrivers([...drivers, response.data.driver]);
      setMessage('Driver added successfully!');
      setShowAddModal(false);
      setNewDriver({
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
        joinedDate: '',
        vehicleNumber: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDriver = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/drivers/${selectedDriver._id}`,
        selectedDriver,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDrivers(drivers.map(d => d._id === selectedDriver._id ? response.data : d));
      setMessage('Driver updated successfully!');
      setShowUpdateModal(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDriver = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const verifyResponse = await axios.post(
        'http://localhost:5000/api/admins/verify-password',
        { password: adminPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!verifyResponse.data.isValid) {
        setError('Invalid admin password');
        return;
      }

      await axios.delete(
        `http://localhost:5000/api/drivers/${selectedDriver._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDrivers(drivers.filter(d => d._id !== selectedDriver._id));
      setMessage('Driver deleted successfully!');
      setShowDeleteModal(false);
      setAdminPassword('');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <div className="container my-5 flex-grow-1" style={{ paddingTop: '50px' }}>
        <Card className="mb-4 border-success shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <Card.Title className="text-success mb-0">
                  <i className="bi bi-people-fill me-2"></i>
                  Driver Management
                </Card.Title>
              </div>
              <Button 
                variant="success"
                onClick={() => setShowAddModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add New Driver
              </Button>
            </div>
          </Card.Body>
        </Card>

        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible className="mt-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </Alert>
        )}

        {message && (
          <Alert variant="success" onClose={() => setMessage('')} dismissible className="mt-3">
            <i className="bi bi-check-circle-fill me-2"></i>
            {message}
          </Alert>
        )}

        <Card className="mb-4 border-success shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div style={{ width: '350px' }}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search drivers by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-success"
                  />
                  <Button variant="outline-success">
                    <i className="bi bi-search"></i>
                  </Button>
                </InputGroup>
              </div>
              <div className="text-muted">
                Showing {filteredDrivers.length} of {drivers.length} drivers
              </div>
            </div>

            {filteredDrivers.length > 0 ? (
              <Row xs={1} md={2} lg={3} className="g-4">
                {filteredDrivers.map(driver => (
                  <Col key={driver._id}>
                    <Card className="h-100 border-success shadow-sm">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <Card.Title className="text-success mb-1">
                              {driver.firstName} {driver.lastName}
                            </Card.Title>
                            <Card.Subtitle className="text-muted small">
                              ID: {driver.employeeId}
                            </Card.Subtitle>
                          </div>
                          <Badge bg={driver.status === 'available' ? 'success' : 'secondary'} className="align-self-start">
                            {driver.status.toUpperCase()}
                          </Badge>
                        </div>
                        <ListGroup variant="flush" className="small">
                          <ListGroup.Item className="d-flex align-items-center">
                            <i className="bi bi-envelope text-success me-2"></i>
                            <span className="text-truncate">{driver.email || 'N/A'}</span>
                          </ListGroup.Item>
                          <ListGroup.Item className="d-flex align-items-center">
                            <i className="bi bi-car-front text-success me-2"></i>
                            {driver.vehicleType} - {driver.vehicleNumber}
                          </ListGroup.Item>
                          <ListGroup.Item className="d-flex align-items-center">
                            <i className="bi bi-calendar-check text-success me-2"></i>
                            Joined: {new Date(driver.joinedDate).toLocaleDateString()}
                          </ListGroup.Item>
                        </ListGroup>
                      </Card.Body>
                      <Card.Footer className="bg-white border-top-0">
                        <div className="d-flex justify-content-between">
                          <Button 
                            variant="outline-success"
                            size="sm"
                            onClick={() => {
                              setSelectedDriver(driver);
                              setShowDetailsModal(true);
                            }}
                          >
                            <i className="bi bi-eye me-1"></i> View
                          </Button>
                          <Button 
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                              setSelectedDriver(driver);
                              setShowUpdateModal(true);
                            }}
                          >
                            <i className="bi bi-pencil me-1"></i> Edit
                          </Button>
                          <Button 
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setSelectedDriver(driver);
                              setShowDeleteModal(true);
                            }}
                          >
                            <i className="bi bi-trash me-1"></i> Delete
                          </Button>
                        </div>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }}></i>
                <h5 className="mt-3 text-muted">No drivers found</h5>
                <p className="text-muted">Try adjusting your search or add a new driver</p>
                <Button 
                  variant="success"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="bi bi-plus-circle me-1"></i> Add Driver
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Driver Details Modal */}
        <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
          <Modal.Header closeButton className="border-success">
            <Modal.Title className="text-success">
              <i className="bi bi-person-badge me-2"></i>
              Driver Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedDriver && (
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-4">
                    <h5 className="text-success border-bottom pb-2">
                      <i className="bi bi-person-lines-fill me-2"></i>
                      Personal Information
                    </h5>
                    <div className="ms-3">
                      <p>
                        <strong className="text-success">Name:</strong><br />
                        {selectedDriver.firstName} {selectedDriver.lastName}
                      </p>
                      <p>
                        <strong className="text-success">Email:</strong><br />
                        {selectedDriver.email}
                      </p>
                      <p>
                        <strong className="text-success">NIC:</strong><br />
                        {selectedDriver.nic}
                      </p>
                      <p>
                        <strong className="text-success">Birthday:</strong><br />
                        {new Date(selectedDriver.birthday).toLocaleDateString()}
                      </p>
                      <p>
                        <strong className="text-success">Nationality:</strong><br />
                        {selectedDriver.nationality}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-4">
                    <h5 className="text-success border-bottom pb-2">
                      <i className="bi bi-briefcase-fill me-2"></i>
                      Employment Details
                    </h5>
                    <div className="ms-3">
                      <p>
                        <strong className="text-success">Employee ID:</strong><br />
                        {selectedDriver.employeeId}
                      </p>
                      <p>
                        <strong className="text-success">Employee Type:</strong><br />
                        {selectedDriver.employeeType}
                      </p>
                      <p>
                        <strong className="text-success">Joined Date:</strong><br />
                        {new Date(selectedDriver.joinedDate).toLocaleDateString()}
                      </p>
                      <p>
                        <strong className="text-success">Status:</strong><br />
                        <Badge bg={selectedDriver.status === 'available' ? 'success' : 'secondary'}>
                          {selectedDriver.status.toUpperCase()}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-success border-bottom pb-2">
                      <i className="bi bi-truck me-2"></i>
                      Vehicle Information
                    </h5>
                    <div className="ms-3">
                      <p>
                        <strong className="text-success">Vehicle Type:</strong><br />
                        {selectedDriver.vehicleType}
                      </p>
                      <p>
                        <strong className="text-success">Vehicle Number:</strong><br />
                        {selectedDriver.vehicleNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-top-0">
            <Button variant="outline-secondary" onClick={() => setShowDetailsModal(false)}>
              <i className="bi bi-x-circle me-1"></i> Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Update Driver Modal */}
        <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} size="lg" centered>
          <Modal.Header closeButton className="border-success">
            <Modal.Title className="text-success">
              <i className="bi bi-pencil-square me-2"></i>
              Update Driver
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedDriver && (
              <Form>
                <Row>
                  <Col md={6}>
                    <h6 className="text-success mb-3 border-bottom pb-2">Personal Information</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={selectedDriver.firstName}
                        onChange={(e) => setSelectedDriver({...selectedDriver, firstName: e.target.value})}
                        className="border-success"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={selectedDriver.lastName}
                        onChange={(e) => setSelectedDriver({...selectedDriver, lastName: e.target.value})}
                        className="border-success"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={selectedDriver.email}
                        onChange={(e) => setSelectedDriver({...selectedDriver, email: e.target.value})}
                        className="border-success"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>NIC</Form.Label>
                      <Form.Control
                        type="text"
                        value={selectedDriver.nic}
                        onChange={(e) => setSelectedDriver({...selectedDriver, nic: e.target.value})}
                        className="border-success"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-success mb-3 border-bottom pb-2">Employment Details</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>Employee ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={selectedDriver.employeeId}
                        onChange={(e) => setSelectedDriver({...selectedDriver, employeeId: e.target.value})}
                        className="border-success"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Employee Type</Form.Label>
                      <Form.Select
                        value={selectedDriver.employeeType}
                        onChange={(e) => setSelectedDriver({...selectedDriver, employeeType: e.target.value})}
                        className="border-success"
                      >
                        <option value="Permanent">Permanent</option>
                        <option value="Contract">Contract</option>
                        <option value="Trainee">Trainee</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Vehicle Type</Form.Label>
                      <Form.Select
                        value={selectedDriver.vehicleType}
                        onChange={(e) => setSelectedDriver({...selectedDriver, vehicleType: e.target.value})}
                        className="border-success"
                      >
                        <option value="Toyota Dyna">Toyota Dyna</option>
                        <option value="Isuzu Elf">Isuzu Elf</option>
                        <option value="Mitsubishi Canter">Mitsubishi Canter</option>
                        <option value="Tata LPT 709/1109">Tata LPT 709/1109</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Vehicle Number</Form.Label>
                      <Form.Control
                        type="text"
                        value={selectedDriver.vehicleNumber}
                        onChange={(e) => setSelectedDriver({...selectedDriver, vehicleNumber: e.target.value})}
                        className="border-success"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer className="border-top-0">
            <Button variant="outline-secondary" onClick={() => setShowUpdateModal(false)}>
              <i className="bi bi-x-circle me-1"></i> Cancel
            </Button>
            <Button variant="success" onClick={handleUpdateDriver} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-save me-1"></i> Save Changes
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Driver Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton className="border-danger">
            <Modal.Title className="text-danger">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Confirm Deletion
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to permanently delete driver: <strong>{selectedDriver?.firstName} {selectedDriver?.lastName}</strong>?</p>
            <p className="text-danger">This action cannot be undone.</p>
            <Form.Group className="mb-3">
              <Form.Label>Enter Admin Password to Confirm</Form.Label>
              <Form.Control
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Your admin password"
                className="border-danger"
              />
            </Form.Group>
            {error && <Alert variant="danger" className="mt-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </Alert>}
          </Modal.Body>
          <Modal.Footer className="border-top-0">
            <Button variant="outline-secondary" onClick={() => {
              setShowDeleteModal(false);
              setAdminPassword('');
              setError('');
            }}>
              <i className="bi bi-x-circle me-1"></i> Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteDriver} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="bi bi-trash me-1"></i> Delete Driver
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Add Driver Modal */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered>
          <Modal.Header closeButton className="border-success">
            <Modal.Title className="text-success">
              <i className="bi bi-person-plus me-2"></i>
              Add New Driver
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <h6 className="text-success mb-3 border-bottom pb-2">Personal Information</h6>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={newDriver.firstName}
                      onChange={(e) => setNewDriver({...newDriver, firstName: e.target.value})}
                      className="border-success"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={newDriver.lastName}
                      onChange={(e) => setNewDriver({...newDriver, lastName: e.target.value})}
                      className="border-success"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={newDriver.email}
                      onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                      className="border-success"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={newDriver.password}
                      onChange={(e) => setNewDriver({...newDriver, password: e.target.value})}
                      className="border-success"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <h6 className="text-success mb-3 border-bottom pb-2">Employment Details</h6>
                  <Form.Group className="mb-3">
                    <Form.Label>Employee ID</Form.Label>
                    <Form.Control
                      type="text"
                      value={newDriver.employeeId}
                      onChange={(e) => setNewDriver({...newDriver, employeeId: e.target.value})}
                      className="border-success"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Employee Type</Form.Label>
                    <Form.Select
                      value={newDriver.employeeType}
                      onChange={(e) => setNewDriver({...newDriver, employeeType: e.target.value})}
                      className="border-success"
                    >
                      <option value="">Select Type</option>
                      <option value="Permanent">Permanent</option>
                      <option value="Contract">Contract</option>
                      <option value="Trainee">Trainee</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Vehicle Type</Form.Label>
                    <Form.Select
                      value={newDriver.vehicleType}
                      onChange={(e) => setNewDriver({...newDriver, vehicleType: e.target.value})}
                      className="border-success"
                    >
                      <option value="">Select Vehicle</option>
                      <option value="Toyota Dyna">Toyota Dyna</option>
                      <option value="Isuzu Elf">Isuzu Elf</option>
                      <option value="Mitsubishi Canter">Mitsubishi Canter</option>
                      <option value="Tata LPT 709/1109">Tata LPT 709/1109</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Vehicle Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={newDriver.vehicleNumber}
                      onChange={(e) => setNewDriver({...newDriver, vehicleNumber: e.target.value})}
                      className="border-success"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>NIC</Form.Label>
                    <Form.Control
                      type="text"
                      value={newDriver.nic}
                      onChange={(e) => setNewDriver({...newDriver, nic: e.target.value})}
                      className="border-success"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nationality</Form.Label>
                    <Form.Control
                      type="text"
                      value={newDriver.nationality}
                      onChange={(e) => setNewDriver({...newDriver, nationality: e.target.value})}
                      className="border-success"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Birthday</Form.Label>
                    <Form.Control
                      type="date"
                      value={newDriver.birthday}
                      onChange={(e) => setNewDriver({...newDriver, birthday: e.target.value})}
                      className="border-success"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Joined Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={newDriver.joinedDate}
                      onChange={(e) => setNewDriver({...newDriver, joinedDate: e.target.value})}
                      className="border-success"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-top-0">
            <Button variant="outline-secondary" onClick={() => setShowAddModal(false)}>
              <i className="bi bi-x-circle me-1"></i> Cancel
            </Button>
            <Button variant="success" onClick={handleAddDriver} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Adding...
                </>
              ) : (
                <>
                  <i className="bi bi-plus-circle me-1"></i> Add Driver
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
      <Footer />
    </div>
  );
};

export default DriverManagement;