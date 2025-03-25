import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const driverName = localStorage.getItem('driverName');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('driverName');
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-md navbar-light fixed-top" style={{ backgroundColor: '#144A20', zIndex: '1000' }}>
      <div className="container">
        <img src={logo} alt="Logo" style={{ width: '80px', height: '40px', marginRight: '20px' }} />
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {driverName && (
              <li className="nav-item me-3">
                <span className="nav-link text-white">Welcome, {driverName}</span>
              </li>
            )}
            <li className="nav-item">
              <button className="btn btn-link text-white" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
