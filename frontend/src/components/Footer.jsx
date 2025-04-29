import React from 'react';
import { FaLinkedin, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import logo from '../assets/logo.png';
import { Link } from 'react-router-dom';

const Footer = () => {
  const footerStyle = {
    position: 'relative',
    width: '100%',
    bottom: 0,
    backgroundColor: '#144A20', // Setting background color to #144A20
    zIndex: '1000', // Optional: Only needed if you want to layer it above other content
  };

  return (
    <footer style={footerStyle} className="text-white py-4 mt-auto">
      <div className="container">
        <div className="row">
          {/* Logo and Social Icons */}
          <div className="col-md-3 mb-4 mb-md-0 d-flex flex-column align-items-start">
            <div className="d-flex align-items-center mb-3">
              <img src={logo} alt="Logo" style={{ width: '150px', height: '75px', marginRight: '20px' }} />
            </div>
            <div className="d-flex">
              <a href="#" className="text-white me-3"><FaLinkedin size={20} /></a>
              <a href="#" className="text-white me-3"><FaInstagram size={20} /></a>
              <a href="#" className="text-white me-3"><FaTwitter size={20} /></a>
              <a href="#" className="text-white"><FaFacebook size={20} /></a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="col-md-3 mb-4 mb-md-0">
            <ul className="list-unstyled">
              <li><a href="/about-us" className="text-white text-decoration-none">About Us</a></li>
              <li><a href="/privacy-policy" className="text-white text-decoration-none">Privacy Policy</a></li>
              <li><a href="/terms-and-conditions" className="text-white text-decoration-none">Terms and Conditions</a></li>
              <li><a href="/delivery-details" className="text-white text-decoration-none">Delivery Details</a></li>
              <li><a href="/return-policy" className="text-white text-decoration-none">Return Policy</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="col-md-3 mb-4 mb-md-0">
            <ul className="list-unstyled">
              <li><a href="/contact-us" className="text-white text-decoration-none">Contact Us</a></li>
              <li><a href="/my-orders" className="text-white text-decoration-none">My orders</a></li>
              <li><a href="/faqs" className="text-white text-decoration-none">FAQs</a></li>
            </ul>
          </div>

          {/* Subscribe Section */}
          <div className="col-md-3">
            <h6 className="mb-2 d-flex align-items-center">
              <MdEmail size={20} className="me-2" /> SUBSCRIBE
            </h6>
            <div className="input-group">
              <input type="email" className="form-control" placeholder="Email Address..." />
              <button className="btn btn-light">BUTTON</button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-4">
        <small>&copy; 2025 Yakadabadu.lk. All rights reserved.</small>
      </div>
    </footer>
  );
};

export default Footer;
