import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MapComponent from '../components/MapComponent';

const DriverDashboard = () => {
  const [pickups, setPickups] = useState([]);

  useEffect(() => {
    const fetchPickups = async () => {
      try {
        const token = localStorage.getItem('driverToken');
        const res = await axios.get('http://localhost:5000/api/pickups', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPickups(res.data);
      } catch (error) {
        console.error('Error fetching pickups:', error);
      }
    };
    fetchPickups();
  }, []);

  const updatePickupStatus = async (pickupId, status) => {
    try {
      const token = localStorage.getItem('driverToken');
      await axios.post(
        'http://localhost:5000/api/pickups/update-status',
        { pickupId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPickups(pickups.map(p => p._id === pickupId ? { ...p, status } : p));
    } catch (error) {
      console.error('Error updating pickup status:', error);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="container flex-grow-1 my-4">
        <h1 className="text-center text-primary mb-4">Driver Dashboard</h1>

        {/* Pickup List */}
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="card-title mb-4">Assigned Pickups</h2>
            {pickups.length === 0 ? (
              <p className="text-center text-muted">No pickups assigned.</p>
            ) : (
              <table className="table table-hover">
                <thead className="thead-light">
                  <tr>
                    <th scope="col">Pickup Type</th>
                    <th scope="col">Address</th>
                    <th scope="col">Status</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pickups.map(pickup => (
                    <tr key={pickup._id}>
                      <td>{pickup.pickupType}</td>
                      <td>{pickup.address}</td>
                      <td>{pickup.status}</td>
                      <td>
                        <button
                          onClick={() => updatePickupStatus(pickup._id, 'completed')}
                          className="btn btn-success btn-sm"
                        >
                          Mark as Completed
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default DriverDashboard;