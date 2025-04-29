import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, Form, Button, Table, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_BASE_URL } from '../config.js';
import PDFDownloadButton from './PDFDownloadButton';
import { FaExclamationTriangle, FaFileDownload } from 'react-icons/fa';
import { PDFDownloadLink } from '@react-pdf/renderer';
import AssignmentReportPDF from './AssignmentReportPDF';
import AssignmentModal from './AssignmentModal';

const PickupAssignment = ({ pickups, drivers, fuelPrice, onOptimizationSuccess }) => {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [showPickupDetails, setShowPickupDetails] = useState(false);
  const [filteredPickupsByDay, setFilteredPickupsByDay] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOptimizeAndAssign = useCallback(async () => {
    setIsSettingUp(true);
    try {
      const token = localStorage.getItem('token');
      let response = await axios.post(
        `${API_BASE_URL}/api/pickups/optimize-and-assign`,
        { date },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.data.success && response.data.performance === undefined) {
        response = await axios.post(
          `${API_BASE_URL}/api/pickups/optimize`,
          { date },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      console.log('Optimization response:', response.data);
      if (response.data.success && response.data.performance && response.data.performance.length > 0) {
        setOptimizationResult(response.data);
        onOptimizationSuccess?.(response.data);
        toast.success('Pickups optimized and assigned successfully!');
      } else {
        toast.error('No assignments found or optimization failed.');
        setOptimizationResult({ performance: [] });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to optimize pickups';
      toast.error(errorMessage);
      setOptimizationResult({ performance: [] });
    } finally {
      setIsSettingUp(false);
    }
  }, [date, onOptimizationSuccess]);

  const handleFilterPickupsByDay = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/pickups/all?date=${date}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFilteredPickupsByDay(response.data || []);
    setShowPickupDetails(true);
      toast.success('Pickups filtered by day!');
    } catch (err) {
      toast.error('Failed to fetch pickups for the selected day.');
      setFilteredPickupsByDay([]);
    }
  }, [date]);

  const filteredPickups = useMemo(() => {
    return pickups.filter(pickup => {
      const pickupDate = new Date(pickup.scheduledTime);
      const selectedDate = new Date(date);
      return pickupDate.toDateString() === selectedDate.toDateString();
    });
  }, [pickups, date]);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_BASE_URL}/api/pickups/assignments?date=${date}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data && response.data.success) {
          setOptimizationResult({ performance: response.data.performance });
        } else {
          setOptimizationResult({ performance: [] });
        }
      } catch (err) {
        setOptimizationResult({ performance: [] });
      }
    };
    fetchAssignments();
  }, [date]);

  // Filtered performance for table and search
  const filteredPerformance = useMemo(() => {
    if (!optimizationResult?.performance) return [];
    if (!searchTerm.trim()) return optimizationResult.performance;
    return optimizationResult.performance.filter(stat =>
      (stat.driverName || stat.name || '').toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
  }, [optimizationResult, searchTerm]);

  // Handler for search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const selectedDriver = filteredPerformance.length > 0 ? filteredPerformance[0] : null;

  return (
    <Card className="mb-4 border-success">
      <Card.Body>
        <Card.Title className="text-success">Pickup Assignment</Card.Title>
        <div className="d-flex gap-3 align-items-center flex-wrap">
          <Form.Control
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ maxWidth: '200px' }}
            aria-label="Select date for pickup assignment"
          />
          <Button
            variant="outline-success"
            onClick={handleFilterPickupsByDay}
            className="me-2"
            aria-label="Filter Pickups by Day"
          >
            <i className="bi bi-filter me-2"></i>
            Filter Pickups by Day
          </Button>
          <Button 
            variant="success" 
            onClick={() => setShowAssignModal(true)}
            className="me-2"
            disabled={isSettingUp}
            aria-label="Optimize and assign pickups"
          >
            <i className={`bi ${isSettingUp ? 'bi-hourglass-split' : 'bi-gear-wide-connected'} me-2`}></i>
            {isSettingUp ? 'Setting Up...' : 'Optimize & Assign Pickups'}
          </Button>

          <PDFDownloadButton
            pickups={filteredPickups}
            drivers={drivers}
            fuelPrice={fuelPrice}
          />
        </div>

        {/* Search bar and date/fuel price line */}
        <div className="d-flex align-items-center justify-content-between mt-4 mb-2">
          <div>
            <strong>Date:</strong> {date} | <strong>Fuel Price:</strong> LKR {fuelPrice || 'N/A'}
          </div>
        </div>

        {/* Driver Performance Table */}
        {filteredPerformance && filteredPerformance.length > 0 && (
          <Card className="mt-4 border-success">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Card.Title className="text-success mb-0">Driver Performance (Optimization Details)</Card.Title>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search driver name..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="form-control"
                    style={{ maxWidth: 220 }}
                  />
                  {filteredPerformance.length > 0 ? (
                    <PDFDownloadLink
                      document={<AssignmentReportPDF performance={filteredPerformance} date={date} fuelPrice={fuelPrice} />}
                      fileName={`Driver_Performance_${date}.pdf`}
                      className="btn btn-outline-secondary"
                    >
                      {({ loading }) => loading ? 'Generating PDF...' : 'View & Download'}
                    </PDFDownloadLink>
                  ) : (
                    <Button variant="outline-secondary" disabled>View & Download</Button>
                  )}
                </div>
              </div>
              <div className="mb-3">
                <strong>Date:</strong> {date} | <strong>Fuel Price:</strong> LKR {fuelPrice || 'N/A'}
              </div>
              <Table striped bordered responsive>
                <thead className="table-success">
                  <tr>
                    <th>Driver</th>
                    <th>Vehicle</th>
                    <th>Total Weight (kg)</th>
                    <th>Total Fuel (L)</th>
                    <th>Total Cost (LKR)</th>
                    <th>Pickup Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPerformance.map((stat, idx) => (
                    <tr key={stat.driverId || idx}>
                      <td>{stat.driverName || stat.name}</td>
                      <td>{stat.vehicleModel || stat.vehicleType} ({stat.vehicleNumber})</td>
                      <td>{stat.totalWeight || 0} kg</td>
                      <td>{stat.totalFuel ? stat.totalFuel.toFixed(2) : '0.00'} L</td>
                      <td className="text-success">LKR {stat.totalCost ? stat.totalCost.toFixed(2) : '0.00'}</td>
                      <td>
                        <Table size="sm" bordered className="mb-0">
                          <thead>
                            <tr>
                              <th>Address</th>
                              <th>Amount (kg)</th>
                              <th>Distance (km)</th>
                              <th>Fuel (L)</th>
                              <th>Cost (LKR)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stat.pickups && stat.pickups.map((pickup, pidx) => (
                              <tr key={`${stat.driverId || idx}-${pickup.pickupId}-${pidx}`}>                                
                                <td>{pickup.address}</td>
                                <td>{pickup.estimatedAmount || pickup.amount || '0'}</td>
                                <td>{pickup.distance ? pickup.distance.toFixed(2) : '0.00'}</td>
                                <td>{pickup.fuel ? pickup.fuel.toFixed(2) : '0.00'}</td>
                                <td>{pickup.cost ? pickup.cost.toFixed(2) : '0.00'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </td>
                      </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}

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
                  <th>Pickup Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredPickupsByDay.map(pickup => (
                  <tr key={pickup._id}>
                    <td>{pickup.user?.name}</td>
                    <td>{pickup.address}</td>
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
      </Card.Body>
      {/* Assignment Modal for Optimize & Assign Pickups */}
      <AssignmentModal
        show={showAssignModal}
        onHide={() => setShowAssignModal(false)}
        date={date}
        assignPickupsToDrivers={handleOptimizeAndAssign}
        pendingPickupsCount={pickups.filter(pickup => {
          const pickupDate = new Date(pickup.scheduledTime);
          const selectedDate = new Date(date);
          return (
            pickupDate.toDateString() === selectedDate.toDateString() &&
            pickup.status === 'pending'
          );
        }).length}
        availableDriversCount={drivers.filter(driver => {
          if (driver.status !== 'available' || !driver.vehicle) return false;
          if (!Array.isArray(driver.attendance)) return false;
          return driver.attendance.some(a => {
            const attDate = new Date(a.date);
            attDate.setHours(0, 0, 0, 0);
            const selDate = new Date(date);
            selDate.setHours(0, 0, 0, 0);
            return attDate.getTime() === selDate.getTime() && a.status === 'available';
          });
        }).length}
        fuelPrice={fuelPrice}
      />
    </Card>
  );
};

export default PickupAssignment; 