import React, { useState, useEffect, useCallback } from 'react';
import { Button, Alert, Form, Card, Table, Modal, Spinner, Badge, Container, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import AdminPickupListPDF from "../components/AdminPickupListPDF";
import Switch from '../Switch.jsx';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config.js';
import { FaExclamationTriangle, FaFileDownload, FaUserCog, FaTruck, FaChartBar, FaClipboardList, FaCalendarAlt, FaGasPump } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PDFDownloadButton from '../components/PDFDownloadButton';
import useApiError from '../hooks/useApiError';
import { api } from '../services/api';
import DriverManagement from '../components/DriverManagement';
import PickupAssignment from '../components/PickupAssignment';
import AnalyticsDashboard from '../components/dashboard/AnalyticsDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `http://localhost:5000/${imagePath.replace(/^uploads[\\/]/, 'uploads/')}`;
};

const SidebarNav = ({ activeView, setActiveView }) => (
  <nav className="sidebar bg-success text-white vh-100 p-3" style={{ minWidth: 220, position: 'fixed', left: 0, top: 0, zIndex: 1000 }}>
    <h4 className="mb-4">Admin Panel</h4>
    <ul className="nav flex-column">
      <li className="nav-item mb-2">
        <button 
          className={`nav-link text-white d-flex align-items-center ${activeView === 'driver-management' ? 'active' : ''}`}
          onClick={() => setActiveView('driver-management')}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <FaUserCog className="me-2" />Driver Management
        </button>
      </li>
      <li className="nav-item mb-2">
        <button 
          className={`nav-link text-white d-flex align-items-center ${activeView === 'pickup-assignment' ? 'active' : ''}`}
          onClick={() => setActiveView('pickup-assignment')}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <FaTruck className="me-2" />Pickup Assignment
        </button>
      </li>
      <li className="nav-item mb-2">
        <button 
          className={`nav-link text-white d-flex align-items-center ${activeView === 'pickup-summary' ? 'active' : ''}`}
          onClick={() => setActiveView('pickup-summary')}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <FaClipboardList className="me-2" />Pickup Summary
        </button>
      </li>
      <li className="nav-item mb-2">
        <button 
          className={`nav-link text-white d-flex align-items-center ${activeView === 'analytics-dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('analytics-dashboard')}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <FaChartBar className="me-2" />Analytics Dashboard
        </button>
      </li>
      <li className="nav-item mb-2">
        <button 
          className={`nav-link text-white d-flex align-items-center ${activeView === 'system-overview' ? 'active' : ''}`}
          onClick={() => setActiveView('system-overview')}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <FaClipboardList className="me-2" />System Overview
        </button>
      </li>
      <li className="nav-item mb-2">
        <button 
          className={`nav-link text-white d-flex align-items-center ${activeView === 'driver-attendance' ? 'active' : ''}`}
          onClick={() => setActiveView('driver-attendance')}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <FaCalendarAlt className="me-2" />Driver Attendance
        </button>
      </li>
      <li className="nav-item mb-2">
        <button 
          className={`nav-link text-white d-flex align-items-center ${activeView === 'leave-requests' ? 'active' : ''}`}
          onClick={() => setActiveView('leave-requests')}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <FaCalendarAlt className="me-2" />Leave Requests
        </button>
      </li>
      <li className="nav-item mb-2">
        <button 
          className={`nav-link text-white d-flex align-items-center ${activeView === 'fuel-management' ? 'active' : ''}`}
          onClick={() => setActiveView('fuel-management')}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <FaGasPump className="me-2" />Fuel Management
        </button>
      </li>
    </ul>
  </nav>
);

const AdminDashboard = () => {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [activeView, setActiveView] = useState('driver-management');
  const [message, setMessage] = useState('');
  const [fuelPrice, setFuelPrice] = useState(null);
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
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [performance, setPerformance] = useState([]);
  const { handleError } = useApiError();
  const [summaryStatusFilter, setSummaryStatusFilter] = useState('');

  const refreshData = useCallback(async () => {
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

      setPickups(pickupsRes.data?.data || pickupsRes.data || []);
      setDrivers(driversRes.data?.data || driversRes.data || []);
      calculateSystemOverview(pickupsRes.data?.data || pickupsRes.data || [], 
                            driversRes.data?.data || driversRes.data || []);
    } catch (err) {
      toast.error('Failed to refresh data');
      console.error('Error refreshing data:', err);
    }
  }, []);

  const handleOptimizationSuccess = useCallback((result) => {
    setOptimizationResult(result);
    refreshData();
    toast.success('Routes have been optimized and assigned successfully!');
  }, [refreshData]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLeaveRequestsLoading(true);
      const [pickupsRes, driversRes, fuelRes, leaveRequestsRes] = await Promise.all([
        api.getPickups(),
        api.getDrivers(),
        api.getCurrentFuelPrice(),
        api.getLeaveRequests()
      ]);

      setPickups(pickupsRes.data?.data || pickupsRes.data || []);
      setDrivers(driversRes.data?.data || driversRes.data || []);
      setFuelPrice(parseFloat(fuelRes.data?.price) || 0);
      setLeaveRequests(leaveRequestsRes.data?.data || leaveRequestsRes.data || []);

      calculateSystemOverview(pickupsRes.data?.data || pickupsRes.data || [], 
                            driversRes.data?.data || driversRes.data || []);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
      setLeaveRequestsLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        await api.verifyAdmin();
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('adminData');
        toast.error('Admin session expired. Please log in again');
        navigate('/login');
      }
    };

    checkAdminAccess();
    fetchData();
  }, [navigate, fetchData]);

  useEffect(() => {
    const fetchFuelPrice = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/fuel-price/current`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFuelPrice(response.data?.price ?? null);
      } catch (err) {
        setFuelPrice(null);
      }
    };
    fetchFuelPrice();
  }, []);

  // Update driver attendance fetch
  useEffect(() => {
    const fetchDriversWithAttendance = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_BASE_URL}/api/drivers/availability?date=${attendanceDate.toISOString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success && Array.isArray(response.data.data)) {
          const driversWithAttendance = response.data.data.map(driver => {
            let attendanceRecord = { status: 'unavailable', date: attendanceDate };
            if (Array.isArray(driver.attendance)) {
              const found = driver.attendance.find(a => {
                if (!a || !a.date) return false;
                const attDate = new Date(a.date);
                attDate.setHours(0, 0, 0, 0);
                return attDate.getTime() === attendanceDate.getTime();
              });
              if (found) attendanceRecord = found;
            }
            return {
              ...driver,
              attendance: attendanceRecord
            };
          });
          setDrivers(driversWithAttendance);
        }
      } catch (err) {
        console.error('Error fetching drivers availability:', err);
        setError(err.response?.data?.error || err.message);
      }
    };
    
    fetchDriversWithAttendance();
  }, [attendanceDate]);

  const handleGetSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/pickups/daily-summary/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(response.data);
      setShowSummary(true);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      toast.error(`Summary fetch error: ${errorMsg}`);
    }
  };
  
  const handleFuelPriceUpdate = async () => {
    try {
      if (fuelPrice < 0 || isNaN(fuelPrice)) {
        toast.error('Please enter a valid positive number for fuel price');
        return;
      }
      const response = await axios.post(
        `${API_BASE_URL}/api/fuel-price/update`,
        { price: parseFloat(fuelPrice) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data) {
        toast.success('Fuel price updated successfully!');
        setMessage('Fuel price updated successfully!');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update fuel price. Please try again.';
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const updateDriverAvailability = async (driverId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/drivers/${driverId}/availability`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (date) {
        await axios.post(
          `${API_BASE_URL}/api/drivers/${driverId}/attendance`,
          { date: date, status: status },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setDrivers(drivers.map(d => d._id === driverId ? { ...d, status } : d));
      toast.success('Driver availability updated!');
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update driver availability.';
      setError(message);
      toast.error(message);
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
      await axios.post(
        `${API_BASE_URL}/api/drivers/setup-for-date`,
        { date },
        { headers: { Authorization: `Bearer ${token}` } }
      );

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

  const handleOptimizeAndAssign = async () => {
    if (!date) {
      toast.error('Please select a date first');
      return;
    }
    setIsSettingUp(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/pickups/optimize-and-assign`,
        { date },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPerformance(Array.isArray(response.data.performance) ? response.data.performance : []);
      setOptimizationResult(response.data);
      refreshData();
      toast.success('Routes have been optimized and assigned successfully!');
    } catch (err) {
      setPerformance([]);
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to optimize and assign pickups.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleFilterPickupsByDay = async () => {
    if (!date) {
      setMessage('Please select a date to filter pickups.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/pickups/all`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const allPickups = response.data?.data || response.data || [];
      const filtered = allPickups.filter(pickup => {
        const pickupDate = new Date(pickup.scheduledTime).toISOString().split('T')[0];
        return pickupDate === date;
      });

      if (filtered.length === 0) {
        setMessage(`No pickups found for ${date}.`);
      } else {
        setFilteredPickups(filtered);
        setShowPickupDetails(true);
      }
    } catch (err) {
      console.error('Error fetching pickups:', err);
      toast.error('Failed to fetch pickups for filtering');
    }
  };

  const calculateSystemOverview = (pickupsData, driversData) => {
    const overview = {
      totalPickups: pickupsData.length,
      assignedPickups: pickupsData.filter(p => p.status === 'assigned').length,
      pendingPickups: pickupsData.filter(p => p.status === 'pending').length,
      completedPickups: pickupsData.filter(p => p.status === 'completed').length,
      cancelledPickups: pickupsData.filter(p => p.status === 'cancelled').length,
      totalWeight: pickupsData.reduce((sum, p) => sum + (parseFloat(p.estimatedAmount) || 0), 0),
      totalDistance: pickupsData.reduce((sum, p) => sum + (p.optimizationDetails?.distance || 0), 0),
      totalFuelCost: pickupsData.reduce((sum, p) => sum + (p.optimizationDetails?.fuelCost || 0), 0)
    };
    setSystemOverview(overview);
  };

  const getDriverStatistics = () => {
    // Trip Completion Trend: group by date, count completed/cancelled
    const tripTrendsMap = {};
    pickups.forEach(p => {
      const date = new Date(p.scheduledTime).toISOString().slice(0, 10);
      if (!tripTrendsMap[date]) tripTrendsMap[date] = { date, completed: 0, cancelled: 0 };
      if (p.status === 'completed') tripTrendsMap[date].completed++;
      if (p.status === 'cancelled') tripTrendsMap[date].cancelled++;
    });
    const tripTrends = Object.values(tripTrendsMap).sort((a, b) => a.date.localeCompare(b.date));

    // Route Performance: group by route name, count trips and average rating
    const routeMap = {};
    pickups.forEach(p => {
      const name = p.routeDetails?.name || 'Unknown';
      if (!routeMap[name]) routeMap[name] = { name, trips: 0, ratingSum: 0, ratingCount: 0 };
      routeMap[name].trips++;
      if (p.routeDetails?.rating) {
        routeMap[name].ratingSum += p.routeDetails.rating;
        routeMap[name].ratingCount++;
      }
    });
    const routePerformance = Object.values(routeMap).map(r => ({
      name: r.name,
      trips: r.trips,
      rating: r.ratingCount ? (r.ratingSum / r.ratingCount) : 0
    }));

    // Driver Status Distribution
    const statusMap = {};
    drivers.forEach(d => {
      const status = d.status || 'unknown';
      if (!statusMap[status]) statusMap[status] = 0;
      statusMap[status]++;
    });
    const driverStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    // Vehicle Utilization: group by vehicle type, count assignments
    const vehicleMap = {};
    drivers.forEach(d => {
      const vehicle = d.vehicle?.vehicleType || d.vehicleType || 'Unassigned';
      if (!vehicleMap[vehicle]) vehicleMap[vehicle] = 0;
      vehicleMap[vehicle]++;
    });
    const vehicleUtilization = Object.entries(vehicleMap).map(([vehicle, utilization]) => ({ vehicle, utilization }));

    return { tripTrends, routePerformance, driverStatus, vehicleUtilization };
  };

  const handleLeaveRequestAction = async (requestId, action, response = '') => {
    try {
      const token = localStorage.getItem('token');
      toast.info(`Processing ${action.toLowerCase()} request...`);
      const result = await axios.put(
        `${API_BASE_URL}/api/leave-requests/${requestId}`,
        { 
          status: action,
          adminResponse: response
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedLeaveRequests = await axios.get(
        `${API_BASE_URL}/api/leave-requests/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeaveRequests(updatedLeaveRequests.data?.data || updatedLeaveRequests.data || []);
      toast.success(`Leave request ${action.toLowerCase()} successfully`);
    } catch (error) {
      console.error('Error updating leave request:', error);
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Server error occurred';
        toast.error(`Failed to update leave request: ${errorMessage}`);
      } else if (error.request) {
        toast.error('Network error: No response from server. Please check your connection.');
      } else {
        toast.error(`Error: ${error.message}`);
      }
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

  const getDriversWithLeaveOnDate = (dateStr) => {
    if (!dateStr) return [];
    
    // Create date objects and normalize to UTC midnight
    const selected = new Date(dateStr);
    selected.setUTCHours(0, 0, 0, 0);
    
    return leaveRequests
      .filter(req => req.status === 'Approved' && req.driver) // Ensure request is approved and has driver data
      .filter(req => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(0, 0, 0, 0);
        return selected >= start && selected <= end;
      })
      .map(req => {
        // Safely access driver properties with fallback
        const firstName = req.driver?.firstName || 'Unknown';
        const lastName = req.driver?.lastName || '';
        return `${firstName} ${lastName}`.trim();
      });
  };

  const renderContent = useCallback(() => {
    switch (activeView) {
      case 'driver-management':
        return <DriverManagement drivers={drivers} onUpdate={refreshData} />;
      case 'fuel-management':
        return (
          <Card className="mb-4 border-success">
            <Card.Body>
              <Card.Title className="text-success">Fuel Management</Card.Title>
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
              <div className="mt-3">
                <strong>Current Fuel Price:</strong> LKR {fuelPrice?.toFixed(2) ?? 'Not set'} /L
              </div>
            </Card.Body>
          </Card>
        );
      case 'pickup-assignment':
        return <PickupAssignment pickups={pickups} drivers={drivers} fuelPrice={fuelPrice} onSuccess={handleOptimizationSuccess} />;
      case 'analytics-dashboard':
        const stats = getDriverStatistics();
        return <AnalyticsDashboard data={{
          drivers: drivers,
          routes: pickups.filter(p => p.status === 'assigned'),
          trips: pickups,
          ratings: drivers.map(d => ({ rating: d.rating || 0 })),
          tripTrends: stats.tripTrends,
          routePerformance: stats.routePerformance,
          driverStatus: stats.driverStatus,
          vehicleUtilization: stats.vehicleUtilization
        }} />;
      case 'system-overview':
        return (
          <div id="system-overview" className="mb-4 pt-4">
            <Card className="mb-4 border-success">
              <Card.Body>
                <Card.Title className="mb-4 text-success">System Overview</Card.Title>
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
                            <td className="text-end">LKR {fuelPrice?.toFixed(2) ?? 'Not set'}/L</td>
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
                {Array.isArray(performance) && performance.length > 0 && (
                  <Card className="mt-4 border-success">
                    <Card.Body>
                      <Card.Title className="text-success">Driver Performance</Card.Title>
                      <Table striped bordered>
                        <thead className="table-success">
                          <tr>
                            <th>Driver Name</th>
                            <th>Total Weight (kg)</th>
                            <th>Total Fuel (L)</th>
                            <th>Total Fuel Cost (Rs.)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {performance.map((stat, idx) => (
                            <tr key={stat.driverId || idx}>
                              <td>{stat.name}</td>
                              <td>{stat.totalWeight}</td>
                              <td>{stat.totalFuel?.toFixed(2) ?? '0.00'}</td>
                              <td>{stat.totalCost?.toFixed(2) ?? '0.00'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      <div className="mt-3">
                        <Button
                          variant="outline-primary"
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              const response = await axios.get(
                                `${API_BASE_URL}/api/drivers/performance-pdf?date=${date}`,
                                { responseType: 'blob', headers: { Authorization: `Bearer ${token}` } }
                              );
                              const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                              const link = document.createElement('a');
                              link.href = url;
                              link.setAttribute('download', `Driver_Performance_${date}.pdf`);
                              document.body.appendChild(link);
                              link.click();
                              link.remove();
                            } catch (err) {
                              toast.error('Failed to download PDF report');
                            }
                          }}
                        >
                          <FaFileDownload className="me-2" /> Download PDF Report
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </Card.Body>
            </Card>
          </div>
        );
      case 'driver-attendance':
        return (
          <div id="driver-attendance" className="mb-4 pt-4">
            <Card className="bg-gray-800 border-0 mb-4">
              <Card.Header className="bg-gray-700">
                <h5 className="text-success">Driver Attendance</h5>
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
          </div>
        );
      case 'leave-requests':
        return (
          <div id="leave-requests" className="mb-4 pt-4">
            <Card className="mb-4">
              <Card.Header className="bg-white border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="text-success mb-0">Leave Requests</h5>
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center">
                      <Form.Control
                        type="date"
                        value={leaveFilterDate}
                        onChange={e => setLeaveFilterDate(e.target.value)}
                        style={{ width: '150px' }}
                        className="me-2"
                      />
                    </div>
                    <Button
                      variant="outline-success"
                      size="sm"
                      disabled={!leaveFilterDate}
                      onClick={() => setShowLeaveDriversModal(true)}
                      className="d-flex align-items-center"
                    >
                      <i className="bi bi-person-check-fill me-2"></i>
                      View Drivers on Leave
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                {leaveRequestsLoading ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" variant="success" />
                    <p className="mt-2 text-muted">Loading leave requests...</p>
                  </div>
                ) : error ? (
                  <Alert variant="danger" className="mb-0">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </Alert>
                ) : leaveRequests.length === 0 ? (
                  <Alert variant="info" className="mb-0 d-flex align-items-center">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    No leave requests found.
                  </Alert>
                ) : (
                  <Table striped bordered hover responsive className="mb-0">
                    <thead>
                      <tr>
                        <th className="text-success">Driver</th>
                        <th className="text-success">Start Date</th>
                        <th className="text-success">End Date</th>
                        <th className="text-success">Type</th>
                        <th className="text-success">Reason</th>
                        <th className="text-success">Status</th>
                        <th className="text-success">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRequests.map((request) => (
                        <tr key={request._id} className={request.type === 'EMERGENCY' ? 'table-danger' : ''}>
                          <td className="fw-medium">
                            {request.driver && typeof request.driver === 'object' && request.driver.firstName
                              ? `${request.driver.firstName} ${request.driver.lastName || ''}`
                              : 'Unknown Driver'}
                          </td>
                          <td>{new Date(request.startDate).toLocaleDateString()}</td>
                          <td>{new Date(request.endDate).toLocaleDateString()}</td>
                          <td>
                            <Badge
                              bg={
                                request.type === 'EMERGENCY'
                                  ? 'danger'
                                  : request.type === 'SICK'
                                  ? 'warning'
                                  : request.type === 'VACATION'
                                  ? 'info'
                                  : 'secondary'
                              }
                            >
                              {request.type}
                            </Badge>
                          </td>
                          <td>{request.reason || 'No reason provided'}</td>
                          <td>
                            <Badge
                              bg={
                                request.status === 'Approved'
                                  ? 'success'
                                  : request.status === 'Rejected'
                                  ? 'danger'
                                  : 'warning'
                              }
                              className="px-3 py-2"
                            >
                              {request.status || 'Pending'}
                            </Badge>
                          </td>
                          <td>
                            {request.status === 'Pending' && (
                              <div className="d-flex gap-2">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleLeaveRequestAction(request._id, 'Approved')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleOpenRejectModal(request._id)}
                                >
                                  Reject
                                </Button>
                                {request.type === 'EMERGENCY' && (
                                  <Badge bg="danger" className="px-3 py-2">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </div>
        );
      case 'pickup-summary':
        return (
          <div className="mb-4 pt-4">
            <Card className="mb-4 border-success">
              <Card.Body>
                <Card.Title className="mb-4 text-success">Pickup Summary</Card.Title>
                <div className="d-flex gap-3 align-items-center mb-3">
                  <Form.Control
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ maxWidth: '200px' }}
                  />
                  <Form.Select
                    style={{ maxWidth: '200px' }}
                    value={summaryStatusFilter || ''}
                    onChange={e => setSummaryStatusFilter(e.target.value)}
                  >
                    <option value="">Select Status</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="assigned">Assigned</option>
                  </Form.Select>
                </div>
                {summaryStatusFilter && (
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Address</th>
                        <th>Telephone</th>
                        <th>Driver Name</th>
                        {summaryStatusFilter === 'completed' && <>
                          <th>Price</th>
                          <th>Weight</th>
                          <th>Proof Image</th>
                        </>}
                        {summaryStatusFilter === 'cancelled' && <>
                          <th>Reason</th>
                        </>}
                      </tr>
                    </thead>
                    <tbody>
                      {pickups.filter(p => {
                        const pickupDate = new Date(p.scheduledTime).toISOString().split('T')[0];
                        return pickupDate === date && p.status === summaryStatusFilter;
                      }).map((pickup, idx) => (
                        <tr key={pickup._id || idx}>
                          <td>{pickup.address}</td>
                          <td>{pickup.contactNumber}</td>
                          <td>{pickup.driverDetails?.name || (pickup.driver?.firstName ? `${pickup.driver.firstName} ${pickup.driver.lastName}` : 'N/A')}</td>
                          {summaryStatusFilter === 'completed' && <>
                            <td>{pickup.amount || pickup.optimizationDetails?.totalCost || 'N/A'}</td>
                            <td>{pickup.weight || pickup.estimatedAmount || 'N/A'}</td>
                            <td>{pickup.image ? <a href={getImageUrl(pickup.image)} target="_blank" rel="noopener noreferrer">View</a> : 'N/A'}</td>
                          </>}
                          {summaryStatusFilter === 'cancelled' && <>
                            <td>{pickup.cancellationReason || 'N/A'}</td>
                          </>}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </div>
        );
      default:
        return null;
    }
  }, [activeView, fuelPrice, handleFuelPriceUpdate]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <SidebarNav activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: 220, minHeight: '100vh', background: '#f8f9fa' }}>
        <Navbar />
        <div className="container-fluid my-5 flex-grow-1" style={{ paddingTop: '50px' }}>
          <h2 className="mb-4 text-success">Admin Dashboard</h2>
          {renderContent()}
        </div>
        <Footer />
      </div>
      <Modal show={showLeaveDriversModal} onHide={() => setShowLeaveDriversModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Drivers on Leave</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ListGroup>
            {getDriversWithLeaveOnDate(leaveFilterDate).map((driver, index) => (
              <ListGroup.Item key={index}>{driver}</ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLeaveDriversModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Leave Request Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reject Leave Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Reason for Rejection</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this leave request"
                required
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
            onClick={() => {
              if (rejectRequestId && rejectReason.trim()) {
                handleLeaveRequestAction(rejectRequestId, 'Rejected', rejectReason.trim());
                setShowRejectModal(false);
                setRejectRequestId(null);
                setRejectReason('');
              }
            }}
            disabled={!rejectReason.trim()}
          >
            Reject Request
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer position="top-right" autoClose={3000} />
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

  useEffect(() => {
    const fetchPendingPickups = async () => {
      if (!date) return;
      
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/pickups/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);

        const filtered = (response.data?.data || response.data || []).filter(pickup => {
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

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const availableDrivers = drivers.filter(d => {
      if (d.status !== 'available') return false;
      return Array.isArray(d.attendance) && d.attendance.some(a => {
        const attendanceDate = new Date(a.date);
        attendanceDate.setHours(0, 0, 0, 0);
        return attendanceDate.getTime() === selectedDate.getTime() && a.status === 'available';
      });
    });
    
    if (availableDrivers.length === 0) {
      toast.error('No available drivers for the selected date. Please ensure drivers are marked as available and have attendance records.');
      return false;
    }

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
        `${API_BASE_URL}/api/pickups/optimize-and-assign`,
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
      setPerformance([]);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to optimize and assign pickups. Please check driver and pickup data.';
      setError(message);
      toast.error(message);
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
                    Array.isArray(d.attendance) && d.attendance.some(a => {
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

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // You can log errorInfo to a service here
    console.error('Dashboard Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger m-3">
          <h4>Something went wrong</h4>
          <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button 
            className="btn btn-outline-danger"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const WrappedAdminDashboard = (props) => (
  <DashboardErrorBoundary>
    <AdminDashboard {...props} />
  </DashboardErrorBoundary>
);

export default WrappedAdminDashboard;