import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../config.js';
import { toast } from 'react-toastify';

const LeaveRequestForm = ({ show, onHide, onSuccess }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startSet, setStartSet] = useState(false);
  const [endSet, setEndSet] = useState(false);
  const [existingRequests, setExistingRequests] = useState([]);

  useEffect(() => {
    // Fetch existing leave requests for this driver
    const fetchExisting = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/leave-requests/my-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExistingRequests(response.data.data || []);
      } catch (e) {
        // ignore
      }
    };
    fetchExisting();
  }, []);

  // Helper to check for overlap
  const isOverlapping = (start1, end1, start2, end2) => {
    return (
      (start1 <= end2 && end1 >= start2)
    );
  };

  const validateDates = () => {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const now = new Date();
    
    // Check if start date is in the future
    if (start < now) {
      setError('Start date must be in the future');
      return false;
    }
    
    // Check if request is made at least 24 hours before start date
    const hoursDiff = (start - now) / (1000 * 60 * 60);
    if (hoursDiff < 24) {
      setError('Leave requests must be made at least 24 hours in advance');
      return false;
    }
    
    // Check if end date is after start date
    if (end <= start) {
      setError('End date must be after start date');
      return false;
    }
    
    // Check if leave duration is not more than 30 days
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      setError('Leave duration cannot exceed 30 days');
      return false;
    }
    
    // Check for overlapping requests
    const overlap = existingRequests.some(req => {
      if (['Approved', 'Pending'].includes(req.status)) {
        const reqStart = new Date(req.startDate);
        const reqEnd = new Date(req.endDate);
        return isOverlapping(start, end, reqStart, reqEnd);
      }
      return false;
    });
    if (overlap) {
      setError('You already have a leave request that overlaps with these dates.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateDates()) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/leave-requests`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Leave request submitted successfully');
      onSuccess?.();
      setFormData({ startDate: '', endDate: '', reason: '' });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error submitting leave request';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user makes changes
    setError('');
  };

  // Calculate minimum date (24 hours from now)
  const getMinDate = () => {
    const now = new Date();
    now.setHours(now.getHours() + 24);
    return now.toISOString().slice(0, 10);
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form.Group className="mb-3">
        <Form.Label>Start Date</Form.Label>
        <InputGroup>
          <Form.Control
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            min={getMinDate()}
            disabled={startSet}
          />
          {!startSet ? (
            <Button
              variant="outline-success"
              onClick={() => setStartSet(!!formData.startDate)}
              disabled={!formData.startDate}
              type="button"
            >
              Set
            </Button>
          ) : (
            <Button
              variant="outline-secondary"
              onClick={() => setStartSet(false)}
              type="button"
            >
              Edit
            </Button>
          )}
        </InputGroup>
        <Form.Text className="text-muted">
          Leave requests must be made at least 24 hours in advance
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>End Date</Form.Label>
        <InputGroup>
          <Form.Control
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
            min={formData.startDate || getMinDate()}
            disabled={endSet}
          />
          {!endSet ? (
            <Button
              variant="outline-success"
              onClick={() => setEndSet(!!formData.endDate)}
              disabled={!formData.endDate}
              type="button"
            >
              Set
            </Button>
          ) : (
            <Button
              variant="outline-secondary"
              onClick={() => setEndSet(false)}
              type="button"
            >
              Edit
            </Button>
          )}
        </InputGroup>
        <Form.Text className="text-muted">
          Leave duration cannot exceed 30 days
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Reason</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          required
          placeholder="Please provide a reason for your leave request"
          minLength={10}
        />
      </Form.Group>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          type="submit" 
          disabled={loading || !startSet || !endSet}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </Form>
  );
};

export default LeaveRequestForm; 
