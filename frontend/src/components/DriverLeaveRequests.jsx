import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LeaveRequestForm from './LeaveRequestForm';
import { API_BASE_URL } from '../config.js';
import { Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';

const DriverLeaveRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchRequests();
        // Set up polling for updates every 30 seconds
        const interval = setInterval(fetchRequests, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/leave-requests/my-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Check for status changes and show notifications
            const newRequests = response.data.data;
            newRequests.forEach(newReq => {
                const oldReq = requests.find(r => r._id === newReq._id);
                if (oldReq && oldReq.status !== newReq.status) {
                    if (newReq.status === 'Approved') {
                        toast.success('Your leave request has been approved!');
                    } else if (newReq.status === 'Rejected') {
                        toast.error('Your leave request has been rejected.');
                    }
                }
            });
            
            setRequests(newRequests);
        } catch (error) {
            toast.error('Error fetching leave requests');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>My Leave Requests</h2>
                <Button 
                    variant="primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Hide Form' : 'New Request'}
                </Button>
            </div>

            {showForm && (
                <div className="mb-4">
                    <LeaveRequestForm 
                        onSuccess={() => {
                            setShowForm(false);
                            fetchRequests();
                        }} 
                    />
                </div>
            )}

            {requests.length === 0 ? (
                <Alert variant="info">No leave requests found.</Alert>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Admin Response</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((req) => (
                            <tr key={req._id}>
                                <td>{formatDate(req.startDate)}</td>
                                <td>{formatDate(req.endDate)}</td>
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
    );
};

export default DriverLeaveRequests; 