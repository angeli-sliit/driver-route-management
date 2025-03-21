import React, { useState } from 'react';
import { Button, Alert } from 'react-bootstrap';
import axios from 'axios';

const AdminDashboard = () => {
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');

  const handleAssignPickups = async () => {
    try {
      const response = await axios.post('/api/pickups/assign-pickups', { date });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to assign pickups');
    }
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <Button onClick={handleAssignPickups}>Assign Pickups</Button>
      {message && <Alert variant="info">{message}</Alert>}
    </div>
  );
};

export default AdminDashboard;