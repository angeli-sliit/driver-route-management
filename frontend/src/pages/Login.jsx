import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useForm } from 'react-hook-form';

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setError('');
    setIsSubmitting(true);

    try {
      let loginEndpoint;
      switch (data.role) {
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
        email: data.email,
        password: data.password,
      });

      // Always save the token if present
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      switch (data.role) {
        case 'user':
          localStorage.setItem('userData', JSON.stringify({
            id: response.data._id,
            name: response.data.name,
          }));
          navigate('/add-pickup');
          break;
        case 'driver': {
          // Use response.data.driver if present, fallback to response.data
          const driver = response.data.driver || response.data;
          localStorage.setItem('driverData', JSON.stringify({
            id: driver.id || driver._id,
            name: driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim(),
          }));
          navigate('/home');
          break;
        }
        case 'admin':
          localStorage.setItem('adminData', JSON.stringify({
            id: response.data._id,
            name: response.data.name,
          }));
          navigate('/admin-dashboard');
          break;
        default:
          throw new Error('Invalid role selected');
      }

      // Debug: log what is saved
      console.log('Token:', localStorage.getItem('token'));
      console.log('UserData:', localStorage.getItem('userData'));
      console.log('DriverData:', localStorage.getItem('driverData'));
      console.log('AdminData:', localStorage.getItem('adminData'));
    } catch (err) {
      const errorMessage = err.response?.data?.error ||
        err.message ||
        'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#e6f4ea' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg rounded-4 border-0">
              <div className="card-body p-5 bg-white">
                <h2 className="text-center mb-4 fw-bold text-success">Login</h2>
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)}>
                  {/* Role Selection */}
                  <div className="mb-3">
                    <label htmlFor="role" className="form-label fw-semibold">Login As</label>
                    <select
                      className="form-select rounded-3"
                      id="role"
                      {...register('role', { required: 'Role is required' })}
                    >
                      <option value="user">User</option>
                      <option value="driver">Driver</option>
                      <option value="admin">Admin</option>
                    </select>
                    {errors.role && <span className="text-danger small">{errors.role.message}</span>}
                  </div>

                  {/* Email Input */}
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">Email</label>
                    <input
                      type="email"
                      className="form-control rounded-3"
                      id="email"
                      {...register('email', { required: 'Email is required' })}
                    />
                    {errors.email && <span className="text-danger small">{errors.email.message}</span>}
                  </div>

                  {/* Password Input */}
                  <div className="mb-4">
                    <label htmlFor="password" className="form-label fw-semibold">Password</label>
                    <input
                      type="password"
                      className="form-control rounded-3"
                      id="password"
                      {...register('password', { required: 'Password is required' })}
                    />
                    {errors.password && <span className="text-danger small">{errors.password.message}</span>}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-success w-100 py-2 rounded-3 shadow-sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2 align-middle" aria-hidden="true"></span>
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
                      className="btn btn-link p-0 text-success text-decoration-none fw-semibold"
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
    </div>
  );
};

export default Login;
