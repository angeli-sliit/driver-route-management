import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Spinner, Card, ListGroup } from 'react-bootstrap';

const ToBeCollected = () => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPickups = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/pickups', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPickups(response.data);
      } catch (error) {
        console.error('Error fetching pickups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPickups();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>To Be Collected</h2>
      {pickups.length > 0 ? (
        <ListGroup>
          {pickups.map((pickup) => (
            <ListGroup.Item key={pickup._id}>
              <Card>
                <Card.Body>
                  <h5>Contact Number: {pickup.contactNumber}</h5>
                  <h6>Scheduled Time: {new Date(pickup.scheduledTime).toLocaleString()}</h6>
                  <p><strong>Item: </strong>{pickup.chooseItem}</p>
                  <p><strong>Estimated Amount: </strong>{pickup.estimatedAmount}</p>
                  <p><strong>Pickup Type: </strong>{pickup.pickupType}</p>
                  <p><strong>Address: </strong>{pickup.address}</p>
                  <p><strong>Status: </strong>{pickup.status}</p>
                </Card.Body>
              </Card>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <p>No pickups scheduled.</p>
      )}
    </div>
  );
};

export default ToBeCollected;