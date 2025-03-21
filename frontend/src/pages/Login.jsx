import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user' // Default role is 'user'
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Determine the login endpoint based on the selected role
      let loginEndpoint;
      switch (formData.role) {
        case 'user':
          loginEndpoint = 'http://localhost:5000/api/users/login';
          break;
        case 'driver':
          loginEndpoint = 'http://localhost:5000/api/drivers/login';
          break;
        case 'admin':
          loginEndpoint = 'http://localhost:5000/api/admins/login';
          break;
        default:
          throw new Error('Invalid role selected');
      }

      const response = await axios.post(loginEndpoint, {
        email: formData.email,
        password: formData.password
      });

      // Store authentication data in local storage
      localStorage.setItem('token', response.data.token);

      switch (formData.role) {
        case 'user':
          localStorage.setItem('userData', JSON.stringify({
            id: response.data._id,
            name: response.data.name
          }));
          navigate('/add-pickup'); // Redirect to user dashboard
          break;
        case 'driver':
          localStorage.setItem('driverData', JSON.stringify({
            id: response.data._id,
            name: `${response.data.firstName} ${response.data.lastName}`
          }));
          navigate('/home'); // Redirect to driver dashboard
          break;
        case 'admin':
          localStorage.setItem('adminData', JSON.stringify({
            id: response.data._id,
            name: response.data.name
          }));
          navigate('/admin-dashboard'); // Redirect to admin dashboard
          break;
        default:
          throw new Error('Invalid role selected');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.message || 
                          'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow-lg">
            <div className="card-body p-4">
              <h2 className="text-center mb-4 fw-bold text-primary">Login</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              
              <form onSubmit={handleSubmit}>
                {/* Role Selection */}
                <div className="mb-3">
                  <label htmlFor="role" className="form-label">Login As</label>
                  <select
                    className="form-select"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="user">User</option>
                    <option value="driver">Driver</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Email Input */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="mb-4">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                      Logging in...
                    </>
                  ) : 'Login'}
                </button>
              </form>

              {/* Register Link */}
              <div className="mt-3 text-center">
                <p>
                  Don't have an account?{' '}
                  <button 
                    className="btn btn-link p-0"
                    onClick={() => navigate('/register')}
                  >
                    Register here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;