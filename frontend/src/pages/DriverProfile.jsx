import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const DriverProfile = () => {
  const [profilePicture, setProfilePicture] = useState(null);
  const [driverData, setDriverData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchDriverProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/drivers/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch driver data');

        setDriverData(data);
        data.profilePicture && setProfilePicture(data.profilePicture);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverProfile();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicture(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch('http://localhost:5000/api/drivers/upload-profile-picture', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to update profile picture');
      
      const { profilePicture } = await response.json();
      setProfilePicture(profilePicture);
    } catch (err) {
      console.error('Upload error:', err);
      alert(err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return (
    <div className="text-center mt-5 text-danger">
      Error: {error}
      <button className="btn btn-link" onClick={() => window.location.reload()}>
        Try Again
      </button>
    </div>
  );

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <div className="container my-5 flex-grow-1">
        <h1 className="text-center text-success mb-5 fw-bold display-4">
          Driver Profile
        </h1>

        <div className="card shadow-lg rounded-4 border-0 p-4 mx-auto" style={{ maxWidth: '900px' }}>
          <div className="text-center mb-4">
            <div className="position-relative d-inline-block mb-3">
              <img
                src={profilePicture ? `http://localhost:5000/${profilePicture}` : "https://via.placeholder.com/150"}
                alt="Profile"
                className="rounded-circle border border-success border-3 shadow-sm"
                style={{ width: '140px', height: '140px', objectFit: 'cover' }}
              />
              <label className="position-absolute bottom-0 end-0 bg-success text-white p-2 rounded-circle" style={{ cursor: 'pointer' }}>
                <i className="bi bi-camera"></i>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="d-none"
                  ref={fileInputRef}
                />
              </label>
            </div>
            <form onSubmit={handleSubmit}>
              <button type="submit" className="btn btn-success px-4 rounded-pill">
                Save Picture
              </button>
            </form>
          </div>


          {/* Info Cards */}
          <div className="row g-4">
            {/* Personal Info */}
            <div className="col-md-6">
              <div className="card border-success-subtle h-100 shadow-sm hover-shadow">
                <div className="card-body">
                  <h5 className="card-title text-success text-center fw-semibold mb-4">
                    Personal Information
                  </h5>
                  {[ 
                    { label: "First Name", value: driverData.firstName },
                    { label: "Middle Name", value: driverData.middleName || '' },
                    { label: "Last Name", value: driverData.lastName },
                    { label: "NIC", value: driverData.nic },
                    { label: "Email", value: driverData.email },
                    { label: "Birthday", value: formatDate(driverData.birthday) },
                    { label: "Nationality", value: driverData.nationality },
                  ].map((item, idx) => (
                    <div className="mb-3" key={idx}>
                      <label className="form-label text-muted">{item.label}</label>
                      <input 
                        type="text" 
                        value={item.value} 
                        readOnly 
                        className="form-control bg-light" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Employee Info */}
            <div className="col-md-6">
              <div className="card border-success-subtle h-100 shadow-sm hover-shadow">
                <div className="card-body">
                  <h5 className="card-title text-success text-center fw-semibold mb-4">
                    Employee Details
                  </h5>
                  {[ 
                    { label: "Employee ID", value: driverData.employeeId },
                    { label: "Employee Type", value: driverData.employeeType },
                    { label: "Employee Status", value: driverData.employeeStatus },
                    { label: "Joined Date", value: formatDate(driverData.joinedDate) },
                    { label: "Status", value: driverData.status },
                    { label: "Vehicle Category", value: driverData.vehicleCategory || 'N/A' },
                  ].map((item, idx) => (
                    <div className="mb-3" key={idx}>
                      <label className="form-label text-muted">{item.label}</label>
                      <input 
                        type="text" 
                        value={item.value} 
                        readOnly 
                        className="form-control bg-light" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DriverProfile;


