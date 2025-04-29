import React, { useCallback, useState } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_BASE_URL } from '../config.js';

const FuelPriceManagement = () => {
  const [fuelPrice, setFuelPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleFuelPriceUpdate = useCallback(async () => {
    try {
      if (fuelPrice < 0 || isNaN(fuelPrice)) {
        toast.error('Please enter a valid positive number for fuel price');
        return;
      }

      setIsLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/fuel-price/update`,
        { price: parseFloat(fuelPrice) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.data) {
        toast.success('Fuel price updated successfully!');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update fuel price. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fuelPrice]);

  return (
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
            aria-label="Fuel price input"
          />
          <Button 
            onClick={handleFuelPriceUpdate}
            variant="outline-success"
            disabled={isLoading}
            aria-label="Update fuel price"
          >
            <i className="bi bi-fuel-pump me-2"></i>
            {isLoading ? 'Updating...' : 'Update Fuel Price'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default FuelPriceManagement; 