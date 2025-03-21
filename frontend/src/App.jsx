import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DriverProfile from './pages/DriverProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import AddPickup from './pages/AddPickup';
import TermsAndConditions from './pages/TermsAndConditions';
import PickupDetails from './pages/PickupDetails';
import ToBeCollected from './pages/ToBeCollected'; // Import ToBeCollected
import 'bootstrap/dist/css/bootstrap.min.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />

        {/* Protected routes */}
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/driver-dashboard" element={
          <ProtectedRoute>
            <DriverDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin-dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/driver-profile" element={
          <ProtectedRoute>
            <DriverProfile />
          </ProtectedRoute>
        } />
        <Route path="/add-pickup" element={
          <ProtectedRoute>
            <AddPickup />
          </ProtectedRoute>
        } />
        <Route path="/pickup-details/:id" element={
          <ProtectedRoute>
            <PickupDetails />
          </ProtectedRoute>
        } />
        <Route path="/to-be-collected" element={
          <ProtectedRoute>
            <ToBeCollected />
          </ProtectedRoute>
        } />

        {/* Default redirect for unmatched routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
