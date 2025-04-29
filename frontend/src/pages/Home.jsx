// frontend/src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import LeaveRequestForm from '../components/LeaveRequestForm';
import { Modal, Button, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_BASE_URL } from '../config.js';

const Home = () => {
  const navigate = useNavigate();
  const driverData = JSON.parse(localStorage.getItem('driverData') || '{}');
  const driverName = driverData.name ? driverData.name.split(' ')[0] : 'Driver';
  const [showLeaveRequestForm, setShowLeaveRequestForm] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    } else {
      fetchLeaveRequests();
    }
    // eslint-disable-next-line
  }, [navigate]);

  const fetchLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/leave-requests/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaveRequests(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch leave requests');
    } finally {
      setLeaveLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
  };

  // Helper to check if a date is today
  const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <div className="container flex-grow-1 py-5">
        <h1 className="text-center text-primary fw-bold mb-3" style={{ paddingTop: '80px' }}>
          Welcome {driverName}!
        </h1>
        
        <div className="d-flex justify-content-center gap-3 mt-4">
          <button
            onClick={() => navigate('/driver-dashboard')}
            className="btn btn-success px-4 py-2"
          >
            Today's Pickup
          </button>
          <button
            onClick={() => navigate('/driver-profile')}
            className="btn btn-primary px-4 py-2"
          >
            User Profile
          </button>
          <button
            onClick={() => setShowLeaveRequestForm(true)}
            className="btn btn-warning px-4 py-2"
          >
            Request Leave
          </button>
        </div>

        {/* Leave Request Status Table */}
        <div className="mt-5">
          <h4 className="mb-3">My Leave Requests</h4>
          {leaveLoading ? (
            <div className="text-center p-3">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : leaveRequests.length === 0 ? (
            <Alert variant="info">No leave requests found.</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Admin Response</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests
                  .filter(req => !isToday(req.startDate))
                  .map((req) => (
                    <tr key={req._id}>
                      <td>{formatDate(req.startDate)}</td>
                      <td>{formatDate(req.endDate)}</td>
                      <td>
                        <Badge
                          bg={
                            req.type === 'EMERGENCY'
                              ? 'danger'
                              : req.type === 'SICK'
                              ? 'warning'
                              : req.type === 'VACATION'
                              ? 'info'
                              : 'secondary'
                          }
                        >
                          {req.type}
                        </Badge>
                      </td>
                      <td>{req.reason}</td>
                      <td>
                        <Badge
                          bg={
                            req.status === 'Approved'
                              ? 'success'
                              : req.status === 'Rejected'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {req.status}
                        </Badge>
                      </td>
                      <td>{req.adminResponse || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          )}
        </div>
      </div>
      <Modal show={showLeaveRequestForm} onHide={() => setShowLeaveRequestForm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Request Leave</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <LeaveRequestForm 
            show={showLeaveRequestForm} 
            onHide={() => setShowLeaveRequestForm(false)} 
            onSuccess={() => {
              setShowLeaveRequestForm(false);
              toast.success('Leave request submitted successfully!');
              fetchLeaveRequests(); // Refresh leave requests after submission
            }} 
          />
        </Modal.Body>
      </Modal>
      <Footer />
    </div>
  );
};

export default Home;