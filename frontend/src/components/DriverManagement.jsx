import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Alert, ListGroup, InputGroup, Row, Col, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState({
    _id: '',
    firstName: '',
    lastName: '',
    email: '',
    employeeId: '',
    nic: '',
    birthday: '',
    nationality: '',
    employeeType: '',
    joinedDate: '',
    status: 'unavailable',
    vehicleType: '',
    vehicleNumber: ''
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    fetchDrivers();
  }, []);

  const filteredDrivers = drivers.filter(driver => 
    `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateDriverData = (data) => {
    const errors = {};
    
    // Required fields
    const requiredFields = [
      'firstName', 'lastName', 'email', 'password', 
      'vehicleType', 'employeeId', 'nic', 'birthday', 
      'nationality', 'employeeType', 'joinedDate', 'vehicleNumber'
    ];
    
    requiredFields.forEach(field => {
      if (!data[field]) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    // Email validation
    if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // NIC validation (assuming Sri Lankan NIC format)
    if (data.nic && !/^[0-9]{9}[vVxX]$|^[0-9]{12}$/.test(data.nic)) {
      errors.nic = 'Please enter a valid NIC number';
    }

    // Date validations
    const today = new Date();
    const birthDate = new Date(data.birthday);
    const joinDate = new Date(data.joinedDate);

    if (birthDate > today) {
      errors.birthday = 'Birthday cannot be in the future';
    }

    if (joinDate > today) {
      errors.joinedDate = 'Join date cannot be in the future';
    }

    // Age validation (must be at least 18)
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      errors.birthday = 'Driver must be at least 18 years old';
    }

    return errors;
  };

  const handleAddDriver = async () => {
    setIsSubmitting(true);
    setError('');
    setMessage('');

    // Validate form data
    const validationErrors = validateDriverData(newDriver);
    if (Object.keys(validationErrors).length > 0) {
      setError('Please fix the following errors:\n' + 
        Object.values(validationErrors).join('\n'));
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to perform this action');
        return;
      }

      // Validate dates
      const today = new Date();
      const birthDate = new Date(newDriver.birthday);
      const joinDate = new Date(newDriver.joinedDate);
      if (birthDate > today) {
        setError('Birthday cannot be in the future');
        toast.error('Birthday cannot be in the future');
        setIsSubmitting(false);
        return;
      }
      if (joinDate > today) {
        setError('Join date cannot be in the future');
        toast.error('Join date cannot be in the future');
        setIsSubmitting(false);
        return;
      }
      // Age validation (must be at least 18)
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        setError('Driver must be at least 18 years old');
        toast.error('Driver must be at least 18 years old');
        setIsSubmitting(false);
        return;
      }
      // Vehicle number validation
      if (!newDriver.vehicleNumber || newDriver.vehicleNumber.trim() === '') {
        setError('Vehicle number is required');
        toast.error('Vehicle number is required');
        setIsSubmitting(false);
        return;
      }

      // Create a clean driver data object with all fields
      const driverData = {
        firstName: newDriver.firstName,
        lastName: newDriver.lastName,
        email: newDriver.email,
        password: newDriver.password,
        employeeId: newDriver.employeeId,
        nic: newDriver.nic,
        birthday: newDriver.birthday,
        nationality: newDriver.nationality,
        employeeType: newDriver.employeeType,
        joinedDate: newDriver.joinedDate,
        status: 'unavailable',
        employeeStatus: 'notAssigned',
        vehicleType: newDriver.vehicleType // always required now
      };

      // Only add vehicleNumber if it's not empty
      if (newDriver.vehicleNumber && newDriver.vehicleNumber.trim() !== '') {
        driverData.vehicleNumber = newDriver.vehicleNumber.trim();
      }

      // 1. Register the driver
      const response = await axios.post(
        'http://localhost:5000/api/drivers/register',
        driverData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      const createdDriver = response.data.driver;

      // 2. Assign vehicle (always, since vehicleNumber is required)
      const vehicleRes = await axios.get(
        `http://localhost:5000/api/vehicles?registrationNumber=${encodeURIComponent(newDriver.vehicleNumber.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const vehicle = vehicleRes.data?.vehicle;
      if (!vehicle) {
        setError('Vehicle not found. Please check the vehicle number.');
        toast.error('Vehicle not found. Please check the vehicle number.');
        setIsSubmitting(false);
        return;
      }
      await axios.post(
        'http://localhost:5000/api/drivers/assign-vehicle',
        { driverId: createdDriver._id, vehicleId: vehicle._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // 3. Refresh driver list
      await fetchDrivers();

      // Show success message
      setMessage('Driver added and vehicle assigned successfully!');
      // Reset form
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
      setShowAddModal(false);
      toast.success('Driver added successfully!');
    } catch (err) {
      console.error('Add driver error:', err);
      console.error('Error response:', err.response);
      console.error('Error details:', err.response?.data);
      let errorMessage = 'Failed to add driver. ';
      if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.response?.data?.missingFields) {
        errorMessage += 'Missing required fields: ' + 
          err.response.data.missingFields.join(', ');
      } else if (err.message) {
        errorMessage += err.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a new function to handle vehicle assignment
  const handleAssignVehicle = async (driverId, vehicleId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to perform this action');
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/drivers/assign-vehicle',
        { driverId, vehicleId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update the driver in the list
      setDrivers(prevDrivers =>
        prevDrivers.map(driver =>
          driver._id === driverId
            ? { ...driver, vehicle: response.data.driver.vehicle }
            : driver
        )
      );

      setMessage('Vehicle assigned successfully!');
      toast.success('Vehicle assigned successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign vehicle');
      toast.error(err.response?.data?.message || 'Failed to assign vehicle');
    }
  };

  const handleUpdateDriver = async () => {
    if (!selectedDriver._id) {
      setError('No driver selected for update');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to perform this action');
        return;
      }

      // Validate dates
      const today = new Date();
      const birthDate = new Date(selectedDriver.birthday);
      const joinDate = new Date(selectedDriver.joinedDate);
      if (birthDate > today) {
        setError('Birthday cannot be in the future');
        toast.error('Birthday cannot be in the future');
        setIsSubmitting(false);
        return;
      }
      if (joinDate > today) {
        setError('Join date cannot be in the future');
        toast.error('Join date cannot be in the future');
        setIsSubmitting(false);
        return;
      }
      // Age validation (must be at least 18)
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        setError('Driver must be at least 18 years old');
        toast.error('Driver must be at least 18 years old');
        setIsSubmitting(false);
        return;
      }
      // Vehicle number validation
      if (!selectedDriver.vehicleNumber || selectedDriver.vehicleNumber.trim() === '') {
        setError('Vehicle number is required');
        toast.error('Vehicle number is required');
        setIsSubmitting(false);
        return;
      }

      // Create update data object with all fields
      const updateData = {
        firstName: selectedDriver.firstName,
        lastName: selectedDriver.lastName,
        email: selectedDriver.email,
        employeeId: selectedDriver.employeeId,
        nic: selectedDriver.nic,
        birthday: selectedDriver.birthday,
        nationality: selectedDriver.nationality,
        employeeType: selectedDriver.employeeType,
        joinedDate: selectedDriver.joinedDate,
        status: selectedDriver.status,
        vehicleType: selectedDriver.vehicleType,
        vehicleNumber: selectedDriver.vehicleNumber || undefined // Only include if not empty
      };

      // 1. Update the driver
      const response = await axios.put(
        `http://localhost:5000/api/drivers/${selectedDriver._id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // 2. Assign vehicle if vehicleNumber is changed or present
      if (selectedDriver.vehicleNumber && selectedDriver.vehicleNumber.trim() !== '') {
        // Find the vehicle by number
        const vehicleRes = await axios.get(
          `http://localhost:5000/api/vehicles?registrationNumber=${encodeURIComponent(selectedDriver.vehicleNumber.trim())}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const vehicle = vehicleRes.data?.vehicle;
        if (!vehicle) {
          setError('Vehicle not found. Please check the vehicle number.');
          toast.error('Vehicle not found. Please check the vehicle number.');
          setIsSubmitting(false);
          return;
        }
        await axios.post(
          'http://localhost:5000/api/drivers/assign-vehicle',
          { driverId: selectedDriver._id, vehicleId: vehicle._id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // 3. Refresh driver list
      await fetchDrivers();

      setMessage('Driver updated and vehicle assigned successfully!');
      toast.success('Driver updated successfully!');
      setShowUpdateModal(false);
    } catch (err) {
      console.error('Update driver error:', err);
      console.error('Error response:', err.response);
      console.error('Error details:', err.response?.data);

      let errorMessage = 'Failed to update driver. ';
      
      if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.message) {
        errorMessage += err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDriver = async () => {
    try {
      setIsDeleting(true);
      setDeleteError("");
      
      const token = localStorage.getItem('token');
      if (!token) {
        setDeleteError('You must be logged in to perform this action');
        return;
      }

      // Verify admin password before deletion
      if (!adminPassword) {
        setDeleteError('Please enter your admin password to confirm deletion');
        return;
      }

      console.log('Attempting to delete driver with ID:', selectedDriverId);
      console.log('Current drivers list:', drivers);

      // Make the delete request directly to the drivers endpoint
      const response = await axios.delete(
        `http://localhost:5000/api/drivers/${selectedDriverId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: { adminPassword } // Send password in request body
        }
      );

      if (response.data.success) {
        // Update drivers list by removing the deleted driver
        setDrivers(prevDrivers => 
          prevDrivers.filter(driver => driver._id !== selectedDriverId)
        );
        
        setMessage('Driver deleted successfully');
        toast.success('Driver deleted successfully!');
        setShowDeleteModal(false);
        setAdminPassword(''); // Clear admin password
        setSelectedDriverId(null);
        await fetchDrivers();
      }

    } catch (err) {
      console.error('Delete error:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = 'Failed to delete driver. ';
      
      if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.message) {
        errorMessage += err.message;
      }

      setDeleteError(errorMessage);
      toast.error(errorMessage);
      await fetchDrivers();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (driver) => {
    setSelectedDriver({
      _id: driver._id || '',
      firstName: driver.firstName || '',
      lastName: driver.lastName || '',
      email: driver.email || '',
      employeeId: driver.employeeId || '',
      nic: driver.nic || '',
      birthday: driver.birthday ? new Date(driver.birthday).toISOString().split('T')[0] : '',
      nationality: driver.nationality || '',
      employeeType: driver.employeeType || '',
      joinedDate: driver.joinedDate ? new Date(driver.joinedDate).toISOString().split('T')[0] : '',
      status: driver.status || 'unavailable',
      vehicleType: driver.vehicleType || '',
      vehicleNumber: driver.vehicleNumber || ''
    });
    setShowUpdateModal(true);
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
                            handleEditClick(driver);
                          }}
                        >
                          <i className="bi bi-pencil me-1"></i> Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedDriverId(driver._id);
                            setShowDeleteModal(true);
                          }}
                        >
                          Delete
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

      {/* Edit Driver Modal */}
      <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Driver</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedDriver.firstName}
                    onChange={(e) => setSelectedDriver({...selectedDriver, firstName: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedDriver.lastName}
                    onChange={(e) => setSelectedDriver({...selectedDriver, lastName: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={selectedDriver.email}
                    onChange={(e) => setSelectedDriver({...selectedDriver, email: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Employee ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedDriver.employeeId}
                    onChange={(e) => setSelectedDriver({...selectedDriver, employeeId: e.target.value})}
                    required
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
                    value={selectedDriver.nic}
                    onChange={(e) => setSelectedDriver({...selectedDriver, nic: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nationality</Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedDriver.nationality}
                    onChange={(e) => setSelectedDriver({...selectedDriver, nationality: e.target.value})}
                    required
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
                    value={selectedDriver.birthday}
                    onChange={(e) => setSelectedDriver({...selectedDriver, birthday: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Joined Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={selectedDriver.joinedDate}
                    onChange={(e) => setSelectedDriver({...selectedDriver, joinedDate: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Employee Type</Form.Label>
                  <Form.Select
                    value={selectedDriver.employeeType}
                    onChange={(e) => setSelectedDriver({...selectedDriver, employeeType: e.target.value})}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="Trainee">Trainee</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vehicle Type</Form.Label>
                  <Form.Select
                    value={selectedDriver.vehicleType}
                    onChange={(e) => setSelectedDriver({...selectedDriver, vehicleType: e.target.value})}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Toyota Dyna">Toyota Dyna</option>
                    <option value="Isuzu Elf">Isuzu Elf</option>
                    <option value="Mitsubishi Canter">Mitsubishi Canter</option>
                    <option value="Tata LPT 709/1109">Tata LPT 709/1109</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vehicle Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedDriver.vehicleNumber}
                    onChange={(e) => setSelectedDriver({...selectedDriver, vehicleNumber: e.target.value})}
                    placeholder="Optional"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowUpdateModal(false); toast.info('Edit driver cancelled.'); }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateDriver} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Updating...
              </>
            ) : (
              'Update Driver'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => {
        setShowDeleteModal(false);
        setAdminPassword("");
        setDeleteError("");
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this driver? This action cannot be undone.</p>
          {deleteError && <Alert variant="danger">{deleteError}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Enter Admin Password to Confirm</Form.Label>
            <Form.Control
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter your admin password"
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowDeleteModal(false);
            setAdminPassword("");
            setDeleteError("");
            toast.info('Driver deletion cancelled.');
          }}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={() => { toast.info('Deleting driver...'); handleDeleteDriver(); }}
            disabled={!adminPassword || isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : (
              'Delete Driver'
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
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z\s'-]/g, '');
                      setNewDriver({...newDriver, firstName: value});
                    }}
                    className="border-success"
                    pattern="[A-Za-z\s\-']+"
                    title="Only letters, spaces, hyphens, and apostrophes allowed"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newDriver.lastName}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z\s'-]/g, '');
                      setNewDriver({...newDriver, lastName: value});
                    }}
                    className="border-success"
                    pattern="[A-Za-z\s\-']+"
                    title="Only letters, spaces, hyphens, and apostrophes allowed"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={newDriver.email}
                    onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                    className="border-success"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={newDriver.password}
                    onChange={(e) => setNewDriver({...newDriver, password: e.target.value})}
                    className="border-success"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>NIC</Form.Label>
                  <Form.Control
                    type="text"
                    value={newDriver.nic}
                    onChange={(e) => setNewDriver({...newDriver, nic: e.target.value})}
                    className="border-success"
                    required
                  />
                </Form.Group>
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
              <Col md={6}>
                <h6 className="text-success mb-3 border-bottom pb-2">Employment Details</h6>
                <Form.Group className="mb-3">
                  <Form.Label>Employee ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={newDriver.employeeId}
                    onChange={(e) => setNewDriver({...newDriver, employeeId: e.target.value})}
                    className="border-success"
                    required
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
                  <Form.Label>Joined Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={newDriver.joinedDate}
                    onChange={(e) => setNewDriver({...newDriver, joinedDate: e.target.value})}
                    className="border-success"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Birthday</Form.Label>
                  <Form.Control
                    type="date"
                    value={newDriver.birthday}
                    onChange={(e) => setNewDriver({...newDriver, birthday: e.target.value})}
                    className="border-success"
                  />
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
                    placeholder="Enter vehicle number"
                    required
                  />
                  <Form.Text className="text-muted">
                    Vehicle number is required. Assign a valid vehicle number.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button variant="outline-secondary" onClick={() => { setShowAddModal(false); toast.info('Add driver cancelled.'); }}>
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
  );
};

export default DriverManagement;