import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Spinner, Card } from 'react-bootstrap';

const PickupDetails = () => {
  const { id } = useParams();
  const [pickupData, setPickupData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPickupDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/pickups/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPickupData(response.data);
      } catch (error) {
        console.error('Error fetching pickup details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPickupDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  if (!pickupData) {
    return <p>Pickup details not found.</p>;
  }

  return (
    <div className="container mt-4">
      <h2>Pickup Details</h2>
      <Card>
        <Card.Body>
          <h5>Contact Number: {pickupData.contactNumber}</h5>
          <h6>Scheduled Time: {new Date(pickupData.scheduledTime).toLocaleString()}</h6>
          <p><strong>Item: </strong>{pickupData.chooseItem}</p>
          <p><strong>Estimated Amount: </strong>{pickupData.estimatedAmount}</p>
          <p><strong>Pickup Type: </strong>{pickupData.pickupType}</p>
          <p><strong>Address: </strong>{pickupData.address}</p>
          <p><strong>Status: </strong>{pickupData.status}</p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PickupDetails;