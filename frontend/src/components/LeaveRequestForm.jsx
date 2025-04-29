import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, InputGroup, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../config.js';
import { toast } from 'react-toastify';
import useFormValidation from '../hooks/useFormValidation';
import { leaveRequestValidationRules } from '../utils/validation';

const LeaveRequestForm = ({ show, onHide, onSuccess }) => {
  const [startSet, setStartSet] = useState(false);
  const [endSet, setEndSet] = useState(false);
  const [existingRequests, setExistingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    values,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleBlur,
    validateForm,
    resetForm
  } = useFormValidation(
    {
      startDate: '',
      endDate: '',
      reason: '',
      type: ''
    },
    leaveRequestValidationRules
  );

  useEffect(() => {
    const fetchExisting = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/leave-requests/my-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExistingRequests(response.data.data || []);
      } catch (error) {
        toast.error('Failed to fetch existing leave requests');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExisting();
  }, []);

  // Helper to check for overlap
  const isOverlapping = (start1, end1, start2, end2) => {
    return (start1 <= end2 && end1 >= start2);
  };

  const validateOverlap = () => {
    if (!values.startDate || !values.endDate) return true;
    
    const start = new Date(values.startDate);
    const end = new Date(values.endDate);
    
    const overlap = existingRequests.some(req => {
      if (['Approved', 'Pending'].includes(req.status)) {
        const reqStart = new Date(req.startDate);
        const reqEnd = new Date(req.endDate);
        return isOverlapping(start, end, reqStart, reqEnd);
      }
      return false;
    });

    if (overlap) {
      toast.error('You already have a leave request that overlaps with these dates.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || !validateOverlap()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/leave-requests`,
        values,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Leave request submitted successfully');
      onSuccess?.();
      resetForm();
      onHide();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error submitting leave request';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate minimum date (24 hours from now)
  const getMinDate = () => {
    const now = new Date();
    now.setHours(now.getHours() + 24);
    return now.toISOString().slice(0, 10);
  };

  if (isLoading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading leave request data...</p>
      </div>
    );
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <Form.Group className="mb-3">
        <Form.Label>Start Date</Form.Label>
        <InputGroup>
          <Form.Control
            type="date"
            name="startDate"
            value={values.startDate}
            onChange={handleChange}
            onBlur={handleBlur}
            min={getMinDate()}
            disabled={startSet}
            isInvalid={touched.startDate && errors.startDate}
          />
          {!startSet ? (
            <Button
              variant="outline-success"
              onClick={() => setStartSet(!!values.startDate)}
              disabled={!values.startDate}
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
        {touched.startDate && errors.startDate && (
          <Form.Control.Feedback type="invalid">
            {errors.startDate}
          </Form.Control.Feedback>
        )}
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
            value={values.endDate}
            onChange={handleChange}
            onBlur={handleBlur}
            min={values.startDate || getMinDate()}
            disabled={endSet}
            isInvalid={touched.endDate && errors.endDate}
          />
          {!endSet ? (
            <Button
              variant="outline-success"
              onClick={() => setEndSet(!!values.endDate)}
              disabled={!values.endDate}
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
        {touched.endDate && errors.endDate && (
          <Form.Control.Feedback type="invalid">
            {errors.endDate}
          </Form.Control.Feedback>
        )}
        <Form.Text className="text-muted">
          Leave duration cannot exceed 30 days
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Leave Type</Form.Label>
        <Form.Select
          name="type"
          value={values.type}
          onChange={handleChange}
          onBlur={handleBlur}
          isInvalid={touched.type && errors.type}
        >
          <option value="">Select leave type</option>
          <option value="SICK">Sick Leave</option>
          <option value="VACATION">Vacation</option>
          <option value="PERSONAL">Personal Leave</option>
          <option value="EMERGENCY">Emergency Leave</option>
        </Form.Select>
        {touched.type && errors.type && (
          <Form.Control.Feedback type="invalid">
            {errors.type}
          </Form.Control.Feedback>
        )}
        {values.type === 'EMERGENCY' && (
          <Form.Text className="text-danger">
            Emergency leave requests will be processed immediately. Please ensure this is a genuine emergency.
          </Form.Text>
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Reason</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="reason"
          value={values.reason}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Please provide a reason for your leave request"
          isInvalid={touched.reason && errors.reason}
        />
        {touched.reason && errors.reason && (
          <Form.Control.Feedback type="invalid">
            {errors.reason}
          </Form.Control.Feedback>
        )}
      </Form.Group>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          type="submit" 
          disabled={isSubmitting || !startSet || !endSet}
        >
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
              Submitting...
            </>
          ) : (
            'Submit Request'
          )}
        </Button>
      </div>
    </Form>
  );
};

export default LeaveRequestForm; 
