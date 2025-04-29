import React, { useMemo } from 'react';
import { Card, Table } from 'react-bootstrap';

const SystemOverview = ({ pickups, drivers, fuelPrice }) => {
  const systemStats = useMemo(() => {
    return {
      totalPickups: pickups.length,
      assignedPickups: pickups.filter(p => p.status === 'assigned').length,
      pendingPickups: pickups.filter(p => p.status === 'pending').length,
      completedPickups: pickups.filter(p => p.status === 'completed').length,
      cancelledPickups: pickups.filter(p => p.status === 'cancelled').length,
      totalWeight: pickups.reduce((sum, p) => sum + (parseFloat(p.estimatedAmount) || 0), 0),
      totalDistance: pickups.reduce((sum, p) => sum + (p.routeDetails?.distance || 0), 0),
      totalFuelCost: pickups.reduce((sum, p) => sum + (p.routeDetails?.fuelCost || 0), 0)
    };
  }, [pickups]);

  return (
    <Card className="mb-4 border-success">
      <Card.Body>
        <Card.Title className="text-success">System Overview</Card.Title>
        <div className="row">
          <div className="col-md-6">
            <div className="overview-section">
              <h5 className="text-success mb-3">Pickup Statistics</h5>
              <Table striped bordered hover responsive>
                <tbody>
                  <tr>
                    <td>Total Pickups</td>
                    <td className="text-end">{systemStats.totalPickups}</td>
                  </tr>
                  <tr>
                    <td>Assigned Pickups</td>
                    <td className="text-end">{systemStats.assignedPickups}</td>
                  </tr>
                  <tr>
                    <td>Pending Pickups</td>
                    <td className="text-end">{systemStats.pendingPickups}</td>
                  </tr>
                  <tr>
                    <td>Completed Pickups</td>
                    <td className="text-end">{systemStats.completedPickups}</td>
                  </tr>
                  <tr>
                    <td>Cancelled Pickups</td>
                    <td className="text-end">{systemStats.cancelledPickups}</td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </div>
          <div className="col-md-6">
            <div className="overview-section">
              <h5 className="text-success mb-3">Performance Metrics</h5>
              <Table striped bordered hover responsive>
                <tbody>
                  <tr>
                    <td>Total Weight</td>
                    <td className="text-end">{systemStats.totalWeight.toFixed(2)} kg</td>
                  </tr>
                  <tr>
                    <td>Total Distance</td>
                    <td className="text-end">{systemStats.totalDistance.toFixed(2)} km</td>
                  </tr>
                  <tr>
                    <td>Total Fuel Cost</td>
                    <td className="text-end">LKR {systemStats.totalFuelCost.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Current Fuel Price</td>
                    <td className="text-end">LKR {fuelPrice.toFixed(2)}/L</td>
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
      </Card.Body>
    </Card>
  );
};

export default SystemOverview; 