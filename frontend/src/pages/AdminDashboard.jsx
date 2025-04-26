import React, { useState, useEffect } from 'react';
import { Button, Alert, Form, Card, Table, Modal, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';
import { PDFDownloadLink } from '@react-pdf/renderer';
import AdminPickupListPDF from "../components/AdminPickupListPDF";
import Switch from '../Switch.jsx';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config.js';
import { FaExclamationTriangle, FaFileDownload } from 'react-icons/fa';

const AdminDashboard = () => {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
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
  const [isSettingUp, setIsSettingUp] = useState(false);
  const navigate = useNavigate();
  const [systemOverview, setSystemOverview] = useState({
    totalPickups: 0,
    assignedPickups: 0,
    pendingPickups: 0,
    completedPickups: 0,
    cancelledPickups: 0,
    totalWeight: 0,
    totalDistance: 0,
    totalFuelCost: 0
  });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveRequestsLoading, setLeaveRequestsLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectRequestId, setRejectRequestId] = useState(null);
  const [leaveFilterDate, setLeaveFilterDate] = useState('');
  const [showLeaveDriversModal, setShowLeaveDriversModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [pickupsRes, driversRes, fuelRes, leaveRequestsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/pickups/all`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get(`${API_BASE_URL}/api/drivers`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get(`${API_BASE_URL}/api/fuel-price/current`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get(`${API_BASE_URL}/api/leave-requests/all`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setPickups(pickupsRes.data);
        setDrivers(driversRes.data || []);
        setFuelPrice(parseFloat(fuelRes.data?.price) || 0);
        setLeaveRequests(leaveRequestsRes.data.data || []);
        calculateSystemOverview(pickupsRes.data, driversRes.data || []);
      } catch (err) {
        setMessage(err.response?.data?.error || err.message);
      } finally {
        setLeaveRequestsLoading(false);
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
        `${API_BASE_URL}/api/fuel-price/update`,
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
      
      // Update driver's overall availability status
      await axios.put(
        `${API_BASE_URL}/api/drivers/${driverId}/availability`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Also mark attendance for the selected date if it exists
      if (date) {
        await axios.post(
          `${API_BASE_URL}/api/drivers/${driverId}/attendance`,
          { 
            date: date,
            status: status 
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setDrivers(drivers.map(d => 
        d._id === driverId ? { ...d, status } : d
      ));
    } catch (err) {
      console.error('Availability update failed:', err);
      toast.error('Failed to update driver availability');
    }
  };

  const handleSetupDrivers = async () => {
    if (!date) {
      toast.error('Please select a date first');
      return;
    }

    setIsSettingUp(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/drivers/setup-for-date`,
        { date },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh drivers list
      const driversRes = await axios.get(`${API_BASE_URL}/api/drivers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDrivers(driversRes.data || []);

      toast.success('Drivers setup completed successfully');
      return true;
    } catch (error) {
      console.error('Error setting up drivers:', error);
      toast.error(error.response?.data?.message || 'Failed to set up drivers');
      return false;
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleOptimizeAndAssign = () => {
    if (!date) {
      toast.error('Please select a date first');
      return;
    }
    setShowAssign(true);
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

  const handleOptimizationSuccess = (result) => {
    setOptimizationResult(result);
    refreshData();
    toast.success('Routes have been optimized and assigned successfully!');
  };

  const refreshData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [pickupsRes, driversRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/pickups/all`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get(`${API_BASE_URL}/api/drivers`, { 
          headers: { Authorization: `Bearer ${token}` } 
        })
      ]);

      setPickups(pickupsRes.data);
      setDrivers(driversRes.data || []);
      calculateSystemOverview(pickupsRes.data, driversRes.data || []);
    } catch (err) {
      toast.error('Failed to refresh data');
      console.error('Error refreshing data:', err);
    }
  };

  const calculateSystemOverview = (pickupsData, driversData) => {
    const overview = {
      totalPickups: pickupsData.length,
      assignedPickups: pickupsData.filter(p => p.status === 'assigned').length,
      pendingPickups: pickupsData.filter(p => p.status === 'pending').length,
      completedPickups: pickupsData.filter(p => p.status === 'completed').length,
      cancelledPickups: pickupsData.filter(p => p.status === 'cancelled').length,
      totalWeight: pickupsData.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0),
      totalDistance: pickupsData.reduce((sum, p) => sum + (p.routeDetails?.distance || 0), 0),
      totalFuelCost: pickupsData.reduce((sum, p) => sum + (p.routeDetails?.fuelCost || 0), 0)
    };
    setSystemOverview(overview);
  };

  const getDriverStatistics = () => {
    // Get today's date and selected date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDate = date ? new Date(date) : today;
    selectedDate.setHours(0, 0, 0, 0);

    const isToday = selectedDate.getTime() === today.getTime();

    return drivers.map(driver => {
      // Filter pickups that are assigned to this driver and scheduled for selected date
      const driverPickups = pickups.filter(p => {
        const pickupDate = new Date(p.scheduledTime);
        pickupDate.setHours(0, 0, 0, 0);
        return (
          p.assignedDriver === driver._id && // Check assigned driver
          pickupDate.getTime() === selectedDate.getTime() && // Check date
          p.status === 'assigned' // Check if pickup is assigned
        );
      });

      // Calculate metrics from routeDetails
      const totalLoad = driverPickups.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0);
      
      // Get route details from the driver's current route if it exists
      const driverRoute = driver.currentRoute;
      let totalDistance = 0;
      let totalFuelCost = 0;

      if (driverRoute && new Date(driverRoute.date).getTime() === selectedDate.getTime()) {
        totalDistance = driverRoute.metrics?.totalDistance || 0;
        totalFuelCost = driverRoute.metrics?.fuelCost || 0;
      } else {
        // Fallback to individual pickup route details if no current route
        totalDistance = driverPickups.reduce((sum, p) => sum + (p.routeDetails?.distance || 0), 0);
        totalFuelCost = driverPickups.reduce((sum, p) => sum + (p.routeDetails?.fuelCost || 0), 0);
      }

      return {
        driver,
        pickups: driverPickups,
        totalLoad,
        totalDistance,
        totalFuelCost,
        hasAssignments: driverPickups.length > 0
      };
    }).filter(stat => stat.hasAssignments);
  };

  const handleLeaveRequestAction = async (requestId, action, response = '') => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/leave-requests/${requestId}`,
        { 
          status: action,
          adminResponse: response
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setLeaveRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === requestId 
            ? { ...req, status: action, adminResponse: response }
            : req
        )
      );

      toast.success(`Leave request ${action.toLowerCase()} successfully`);
    } catch (error) {
      toast.error('Failed to update leave request');
      console.error('Error updating leave request:', error);
    }
  };

  const handleOpenRejectModal = (requestId) => {
    setRejectRequestId(requestId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    if (rejectRequestId && rejectReason.trim()) {
      handleLeaveRequestAction(rejectRequestId, 'Rejected', rejectReason.trim());
      setShowRejectModal(false);
      setRejectRequestId(null);
      setRejectReason('');
    }
  };

  // Helper to get drivers with approved leave on selected date
  const getDriversWithLeaveOnDate = (dateStr) => {
    if (!dateStr) return [];
    const selected = new Date(dateStr);
    selected.setHours(0, 0, 0, 0);
    return leaveRequests
      .filter(req => req.status === 'Approved')
      .filter(req => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return selected >= start && selected <= end;
      })
      .map(req => req.driver?.firstName + ' ' + (req.driver?.lastName || ''));
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
            className="me-2"
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
                onClick={handleOptimizeAndAssign}
                className="me-2"
                disabled={isSettingUp}
              >
                <i className={`bi ${isSettingUp ? 'bi-hourglass-split' : 'bi-gear-wide-connected'} me-2`}></i>
                {isSettingUp ? 'Setting Up...' : 'Optimize & Assign Pickups'}
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
                className="ms-auto text-decoration-none"
              >
                {({ loading }) => (
                  <Button variant="outline-success">
                    <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-file-earmark-pdf'} me-2`}></i>
                    {loading ? 'Generating Report...' : 'Download PDF Report'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </Card.Body>
        </Card>
  
        {/* Updated System Overview with both views */}
        <Card className="mb-4 border-success">
          <Card.Body>
            <Card.Title className="mb-4 text-success">System Overview</Card.Title>
            
            {/* New Statistics View */}
            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <div className="overview-section">
                  <h5 className="text-success mb-3">Pickup Statistics</h5>
                  <Table striped bordered hover>
                    <tbody>
                      <tr>
                        <td>Total Pickups</td>
                        <td className="text-end">{systemOverview.totalPickups}</td>
                      </tr>
                      <tr>
                        <td>Assigned Pickups</td>
                        <td className="text-end">{systemOverview.assignedPickups}</td>
                      </tr>
                      <tr>
                        <td>Pending Pickups</td>
                        <td className="text-end">{systemOverview.pendingPickups}</td>
                      </tr>
                      <tr>
                        <td>Completed Pickups</td>
                        <td className="text-end">{systemOverview.completedPickups}</td>
                      </tr>
                      <tr>
                        <td>Cancelled Pickups</td>
                        <td className="text-end">{systemOverview.cancelledPickups}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </div>
              <div className="col-md-6">
                <div className="overview-section">
                  <h5 className="text-success mb-3">Performance Metrics</h5>
                  <Table striped bordered hover>
                    <tbody>
                      <tr>
                        <td>Total Weight</td>
                        <td className="text-end">{systemOverview.totalWeight.toFixed(2)} kg</td>
                      </tr>
                      <tr>
                        <td>Total Distance</td>
                        <td className="text-end">{systemOverview.totalDistance.toFixed(2)} km</td>
                      </tr>
                      <tr>
                        <td>Total Fuel Cost</td>
                        <td className="text-end">LKR {systemOverview.totalFuelCost.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>Current Fuel Price</td>
                        <td className="text-end">LKR {fuelPrice.toFixed(2)}/L</td>
                      </tr>
                      <tr>
                        <td>Active Drivers</td>
                        <td className="text-end">
                          {drivers.filter(d => d.status === 'available').length} / {drivers.length}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Driver Performance Section */}
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="text-success mb-0">
                  Driver Performance {date ? `(${new Date(date).toLocaleDateString()})` : '(Today)'}
                </h5>
                {date && new Date(date).toDateString() !== new Date().toDateString() && (
                  <div className="alert alert-info py-1 px-2 mb-0">
                    <small>
                      <i className="bi bi-info-circle me-1"></i>
                      Showing assignments for {new Date(date).toLocaleDateString()}. 
                      <Button 
                        variant="link" 
                        className="p-0 ms-1" 
                        onClick={() => setDate(new Date().toISOString().split('T')[0])}
                      >
                        View Today
                      </Button>
                    </small>
                  </div>
                )}
              </div>
              <Table striped bordered hover className="mb-0">
                <thead className="table-success">
                  <tr>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>Assigned Pickups</th>
                    <th>Total Load</th>
                    <th>Route Distance</th>
                    <th>Estimated Fuel Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {getDriverStatistics().length > 0 ? (
                    getDriverStatistics().map(({ driver, pickups, totalLoad, totalDistance, totalFuelCost }) => (
                      <tr key={driver._id}>
                        <td>{driver.firstName} {driver.lastName}</td>
                        <td>
                          <span className={`badge ${driver.status === 'available' ? 'bg-success' : 'bg-secondary'}`}>
                            {driver.status.toUpperCase()}
                          </span>
                        </td>
                        <td>{pickups.length}</td>
                        <td>{totalLoad.toFixed(2)} kg</td>
                        <td>{totalDistance.toFixed(2)} km</td>
                        <td className="fw-bold text-success">LKR {totalFuelCost.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        {date ? (
                          <>
                            <i className="bi bi-calendar-x me-2"></i>
                            No assignments found for {new Date(date).toLocaleDateString()}
                          </>
                        ) : (
                          <>
                            <i className="bi bi-calendar-x me-2"></i>
                            No assignments found for today
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
                {getDriverStatistics().length > 0 && (
                  <tfoot className="table-success">
                    <tr>
                      <td colSpan="2"><strong>Total</strong></td>
                      <td>{getDriverStatistics().reduce((sum, stat) => sum + stat.pickups.length, 0)}</td>
                      <td>{getDriverStatistics().reduce((sum, stat) => sum + stat.totalLoad, 0).toFixed(2)} kg</td>
                      <td>{getDriverStatistics().reduce((sum, stat) => sum + stat.totalDistance, 0).toFixed(2)} km</td>
                      <td className="fw-bold text-success">
                        LKR {getDriverStatistics().reduce((sum, stat) => sum + stat.totalFuelCost, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </Table>
            </div>
          </Card.Body>
        </Card>
  
        {/* Driver Attendance */}
        <Card className="bg-gray-800 text-white border-0 mb-4">
          <Card.Header className="bg-gray-700">
            <h5 className="mb-0">Driver Attendance</h5>
          </Card.Header>
          <Card.Body>
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
                    <th>Utilization</th>
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
                        <td>{assignment.utilizationPercentage.toFixed(1)}%</td>
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
          drivers={drivers}
          onSuccess={handleOptimizationSuccess}
          onUpdate={refreshData}
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
  
        {/* Leave Requests Section */}
        <Card className="mb-4 border-success">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Card.Title className="text-success mb-0">Leave Requests</Card.Title>
              <div className="d-flex gap-2 align-items-center">
                <Form.Control
                  type="date"
                  value={leaveFilterDate}
                  onChange={e => setLeaveFilterDate(e.target.value)}
                  style={{ maxWidth: '200px' }}
                  placeholder="Filter by date"
                />
                <Button
                  variant="outline-success"
                  size="sm"
                  disabled={!leaveFilterDate}
                  onClick={() => setShowLeaveDriversModal(true)}
                  style={{ fontSize: '0.85rem', padding: '0.15rem 0.5rem', borderRadius: '0.5rem', fontWeight: 500 }}
                >
                  <i className="bi bi-person-check-fill me-1"></i>View Drivers on Leave
                </Button>
              </div>
            </div>
            {leaveRequestsLoading ? (
              <div className="text-center p-3">
                <Spinner animation="border" variant="success" />
              </div>
            ) : leaveRequests.length === 0 ? (
              <Alert variant="info">No leave requests found.</Alert>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((request) => (
                    <tr key={request._id}>
                      <td>{request.driver?.firstName} {request.driver?.lastName || 'Unknown Driver'}</td>
                      <td>{new Date(request.startDate).toLocaleString()}</td>
                      <td>{new Date(request.endDate).toLocaleString()}</td>
                      <td>{request.reason}</td>
                      <td>
                        <Badge
                          bg={
                            request.status === 'Approved'
                              ? 'success'
                              : request.status === 'Rejected'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {request.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          {request.status === 'Pending' && (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleLeaveRequestAction(request._id, 'Approved')}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleOpenRejectModal(request._id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {request.status !== 'Pending' && (
                            <span className="text-muted">
                              {request.status === 'Approved' ? 'Accepted' : 'Rejected'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
  
        {/* Reject Reason Modal */}
        <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Reject Leave Request</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="rejectReason">
                <Form.Label>Please provide a reason for rejection:</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Enter reason..."
                  autoFocus
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmReject}
              disabled={!rejectReason.trim()}
            >
              Reject
            </Button>
          </Modal.Footer>
        </Modal>
  
        {/* Modal for drivers on leave for selected date */}
        <Modal show={showLeaveDriversModal} onHide={() => setShowLeaveDriversModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Drivers on Leave for {leaveFilterDate ? new Date(leaveFilterDate).toLocaleDateString('en-GB') : ''}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {getDriversWithLeaveOnDate(leaveFilterDate).length === 0 ? (
              <div className="text-muted">No drivers on leave for this date.</div>
            ) : (
              <ul className="mb-0 ps-3" style={{ fontSize: '0.98rem', lineHeight: 1.7 }}>
                {getDriversWithLeaveOnDate(leaveFilterDate).map((name, idx) => (
                  <li key={idx} style={{ listStyle: 'disc', color: '#222' }}>{name}</li>
                ))}
              </ul>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowLeaveDriversModal(false)}>
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

const AssignmentModal = ({ show, onHide, date, drivers, onSuccess, onUpdate }) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState('');
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [reportUrl, setReportUrl] = useState(null);
  const [pendingPickups, setPendingPickups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch pending pickups when date changes
  useEffect(() => {
    const fetchPendingPickups = async () => {
      if (!date) return;
      
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/pickups/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Filter pickups for the selected date and pending status
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);

        const filtered = response.data.filter(pickup => {
          const pickupDate = new Date(pickup.scheduledTime);
          pickupDate.setHours(0, 0, 0, 0);
          return pickupDate.getTime() === selectedDate.getTime() && pickup.status === 'pending';
        });

        setPendingPickups(filtered);
      } catch (err) {
        console.error('Error fetching pending pickups:', err);
        toast.error('Failed to fetch pending pickups');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingPickups();
  }, [date]);

  const validateBeforeOptimize = () => {
    if (!date) {
      toast.error('Please select a date first');
      return false;
    }

    // Check for pending pickups
    if (!pendingPickups || pendingPickups.length === 0) {
      toast.error('No pending pickups found for the selected date. Please ensure there are unassigned pickups scheduled.');
      return false;
    }

    // Check if all pending pickups have valid locations
    const invalidPickups = pendingPickups.filter(pickup => 
      !pickup.location || 
      !pickup.location.coordinates || 
      !Array.isArray(pickup.location.coordinates) ||
      pickup.location.coordinates.length !== 2
    );

    if (invalidPickups.length > 0) {
      setError(`Some pickups are missing valid location data. Please update the following pickups:\n${
        invalidPickups.map(p => `- Pickup ID: ${p._id}, Address: ${p.address}`).join('\n')
      }`);
      return false;
    }

    // Normalize the selected date to match the format in attendance records
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const availableDrivers = drivers.filter(d => {
      // Check general availability
      if (d.status !== 'available') return false;

      // Check attendance records
      return d.attendance?.some(a => {
        const attendanceDate = new Date(a.date);
        attendanceDate.setHours(0, 0, 0, 0);
        return attendanceDate.getTime() === selectedDate.getTime() && a.status === 'available';
      });
    });
    
    if (availableDrivers.length === 0) {
      toast.error('No available drivers for the selected date. Please ensure drivers are marked as available and have attendance records.');
      return false;
    }

    // Check if all available drivers have valid locations
    const invalidDrivers = availableDrivers.filter(driver => 
      !driver.currentLocation || 
      !driver.currentLocation.coordinates || 
      !Array.isArray(driver.currentLocation.coordinates) ||
      driver.currentLocation.coordinates.length !== 2
    );

    if (invalidDrivers.length > 0) {
      setError(`Some drivers are missing valid location data. Please update the following drivers:\n${
        invalidDrivers.map(d => `- ${d.firstName} ${d.lastName}`).join('\n')
      }`);
      return false;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication token missing. Please log in again.');
      return false;
    }

    return true;
  };

  const handleOptimize = async () => {
    if (!validateBeforeOptimize()) {
      return;
    }

    setIsOptimizing(true);
    setError('');
    setOptimizationResult(null);
    setReportUrl(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/pickups/optimize`,
        { date },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOptimizationResult(response.data);
      if (response.data.report) {
        setReportUrl(`${API_BASE_URL}/${response.data.report.url}`);
      }
      toast.success('Routes optimized successfully!');
      if (onSuccess) onSuccess(response.data);
      if (onUpdate) onUpdate();
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(message);
      toast.error(`Optimization failed: ${message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
          Confirm Pickup Assignment
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="optimization-details">
          <h5>Optimization Details</h5>
          <div className="details-list">
            <div className="detail-item">
              <span className="detail-label">Selected Date:</span>
              <span className="detail-value">{date || 'Not selected'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Pending Pickups:</span>
              <span className="detail-value">
                {isLoading ? (
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  <>
                    {pendingPickups.length}
                    {pendingPickups.length > 0 && (
                      <span className="text-muted ms-2">
                        (Total Weight: {pendingPickups.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0)} kg)
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Available Drivers:</span>
              <span className="detail-value">
                {(() => {
                  if (!date) return 0;
                  const selectedDate = new Date(date);
                  selectedDate.setHours(0, 0, 0, 0);
                  return drivers.filter(d => 
                    d.status === 'available' && 
                    d.attendance?.some(a => {
                      const attendanceDate = new Date(a.date);
                      attendanceDate.setHours(0, 0, 0, 0);
                      return attendanceDate.getTime() === selectedDate.getTime() && a.status === 'available';
                    })
                  ).length;
                })()}
              </span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <FaExclamationTriangle />
              <div>
                <strong>Error:</strong>
                <div className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>
                  {error}
                </div>
              </div>
            </div>
          )}

          <div className="alert alert-info mt-3">
            <i className="bi bi-info-circle-fill me-2"></i>
            <strong>Requirements:</strong>
            <ul className="mt-2 mb-0">
              <li>There must be pending (unassigned) pickups for the selected date</li>
              <li>All pickups must have valid location coordinates</li>
              <li>All drivers must have valid current location</li>
              <li>At least one driver must be marked as available for the selected date</li>
              <li>All drivers must have assigned vehicles</li>
              <li>System must have current fuel price set</li>
            </ul>
          </div>
        </div>

        {reportUrl && (
          <div className="report-download mt-3">
            <a 
              href={reportUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              <FaFileDownload />
              Download Assignment Report
            </a>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={onHide} 
          disabled={isOptimizing}
        >
          Cancel
        </Button>
        <Button 
          variant="success" 
          onClick={handleOptimize}
          disabled={isOptimizing || isLoading || !pendingPickups.length}
        >
          {isOptimizing ? (
            <>
              <div className="spinner" />
              Optimizing...
            </>
          ) : (
            'Optimize & Assign'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AdminDashboard;