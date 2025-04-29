import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { FaUsers, FaRoute, FaCheckCircle, FaTimesCircle, FaArrowCircleRight } from 'react-icons/fa';

const AnalyticsDashboard = ({ data }) => {
  const [timeRange, setTimeRange] = useState('week');
  const [stats, setStats] = useState({
    totalDrivers: 0,
    activeRoutes: 0,
    completedTrips: 0,
    averageRating: 0,
  });

  // Default fallback data
  const tripTrends = Array.isArray(data.tripTrends) && data.tripTrends.length
    ? data.tripTrends
    : [{ date: 'N/A', completed: 0, cancelled: 0 }];

  const routePerformance = Array.isArray(data.routePerformance) && data.routePerformance.length
    ? data.routePerformance
    : [{ name: 'N/A', trips: 0, rating: 0 }];

  const driverStatus = Array.isArray(data.driverStatus) && data.driverStatus.length
    ? data.driverStatus
    : [{ name: 'N/A', value: 0 }];

  const vehicleUtilization = Array.isArray(data.vehicleUtilization) && data.vehicleUtilization.length
    ? data.vehicleUtilization
    : [{ vehicle: 'N/A', utilization: 0 }];

  useEffect(() => {
    const calculateStats = () => {
      const totalDrivers = data.drivers?.length || 0;
      const activeRoutes = data.routes?.filter(route => route.status === 'assigned').length || 0;
      const completedTrips = data.trips?.filter(trip => trip.status === 'completed').length || 0;
      const averageRating = data.ratings?.reduce((acc, curr) => acc + curr.rating, 0) / (data.ratings?.length || 1);

      setStats({ totalDrivers, activeRoutes, completedTrips, averageRating });
    };

    calculateStats();
  }, [data]);

  return (
    <div className="p-6">
      {/* Time Range Selector */}
      <div className="mb-6">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Statistics Cards */}
      
      <div className="row mb-4">
        <div className="col-md-2 mb-3">
          <div className="card text-white bg-primary h-100">
            <div className="card-body d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center mb-2">
                <FaUsers size={28} className="me-2" />
                <span className="h6 mb-0">Total Drivers</span>
              </div>
              <div className="display-4">{stats.totalDrivers}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card text-white bg-success h-100">
            <div className="card-body d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center mb-2">
                <FaRoute size={28} className="me-2" />
                <span className="h6 mb-0">Active Routes</span>
              </div>
              <div className="display-4">{stats.activeRoutes}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card text-white bg-warning h-100">
            <div className="card-body d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center mb-2">
                <FaCheckCircle size={28} className="me-2" />
                <span className="h6 mb-0">Completed Trips</span>
              </div>
              <div className="display-4">{stats.completedTrips}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card text-white bg-danger h-100">
            <div className="card-body d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center mb-2">
                <FaTimesCircle size={28} className="me-2" />
                <span className="h6 mb-0">Cancelled Trips</span>
              </div>
              <div className="display-4">{data.trips?.filter(trip => trip.status === 'cancelled').length || 0}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card text-white bg-secondary h-100">
            <div className="card-body d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center mb-2">
                <FaArrowCircleRight size={28} className="me-2" />
                <span className="h6 mb-0">Pending Trips</span>
              </div>
              <div className="display-4">{data.trips?.filter(trip => trip.status === 'pending').length || 0}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card text-white bg-info h-100">
            <div className="card-body d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center mb-2">
                <FaArrowCircleRight size={28} className="me-2" />
                <span className="h6 mb-0">Assigned Trips</span>
              </div>
              <div className="display-4">{data.trips?.filter(trip => trip.status === 'assigned').length || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trip Completion Chart */}
        <ChartCard title="Trip Completion Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tripTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#43a047" />
              <Line type="monotone" dataKey="cancelled" stroke="#a5d6a7" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

      

        {/* Driver Status Distribution Chart */}
        <ChartCard title="Driver Status Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={driverStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {driverStatus.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={['#3D8A41', '#66bb6a', '#a5d6a7'][idx % 3]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Vehicle Utilization Chart */}
        <ChartCard title="Vehicle Utilization">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vehicleUtilization}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vehicle" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="utilization">
                {vehicleUtilization.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={['#43a047', '#66bb6a', '#a5d6a7', '#388e3c', '#81c784'][idx % 5]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

// Small helper component to avoid repeating chart card styles
const ChartCard = ({ title, children }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    {children}
  </div>
);

export default AnalyticsDashboard;
