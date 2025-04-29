import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-vh-100 bg-light text-dark py-5 px-4">
        <div className="container">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline-success mb-4"
          >
            ← Back
          </button>

          <h1 className="display-4 text-success mb-5">Terms and Conditions</h1>

          <section className="mb-5">
            <h2 className="h4 text-success mb-3">1. Introduction</h2>
            <p>
              Welcome to the Driver Route Management System. These Terms and Conditions govern your use of our system. By accessing or using the system, you agree to abide by these terms.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 text-success mb-3">2. Definitions</h2>
            <ul className="list-group list-group-flush">
              <li className="list-group-item"><strong>Service:</strong> The Driver Route Management System web application.</li>
              <li className="list-group-item"><strong>User:</strong> Any person using the system.</li>
              <li className="list-group-item"><strong>Driver:</strong> A user with access to route management functionalities.</li>
              <li className="list-group-item"><strong>Admin:</strong> A user with administrative control over the system.</li>
              <li className="list-group-item"><strong>Content:</strong> All text, data, and other information provided through the system.</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="h4 text-success mb-3">3. User Responsibilities</h2>
            <p>
              Users are responsible for maintaining the confidentiality of their login information and for all activities that occur under their account.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 text-success mb-3">4. Acceptable Use</h2>
            <p>
              You agree not to misuse the system by attempting unauthorized access, distributing malware, or using the service for illegal activities.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 text-success mb-3">5. Privacy Policy</h2>
            <p>
              We respect your privacy and are committed to protecting personal data. Refer to our Privacy Policy for details on data collection and usage.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 text-success mb-3">6. Modifications</h2>
            <p>
              We reserve the right to modify these Terms and Conditions at any time. Continued use of the service implies acceptance of the updated terms.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 text-success mb-3">7. Termination</h2>
            <p>
              We may suspend or terminate access to the service if you violate these terms, without prior notice or liability.
            </p>
          </section>

          <section className="pt-4 border-top mt-5">
            <p className="text-muted small">Last updated: {new Date().toLocaleDateString()}</p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsAndConditions;
