import React from 'react';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-green-400 hover:text-green-300 transition-colors duration-300">
            ← Back to Home
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold text-green-400 mb-8">Terms and Conditions</h1>
        
        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to the Driver Route Management System. These Terms and Conditions govern your use of our service, 
              including the website, mobile applications, and any other services provided by us (collectively, the "Service").
            </p>
            <p>
              By accessing or using the Service, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, 
              you may not access the Service.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Definitions</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>"Service"</strong> refers to the Driver Route Management System, including all features, functionalities, and content.</li>
              <li><strong>"User"</strong> refers to any individual who accesses or uses the Service, including drivers, administrators, and other personnel.</li>
              <li><strong>"Driver"</strong> refers to a user with driver privileges who can view assigned routes and manage their schedule.</li>
              <li><strong>"Admin"</strong> refers to a user with administrative privileges who can manage drivers, routes, and system settings.</li>
              <li><strong>"Content"</strong> refers to all information, data, text, software, graphics, and other materials available through the Service.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
            <p className="mb-4">
              To access certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information 
              during the registration process and to update such information to keep it accurate, current, and complete.
            </p>
            <p className="mb-4">
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. 
              You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or 
              unauthorized use of your account.
            </p>
            <p>
              We reserve the right to disable any user account at any time if, in our opinion, you have failed to comply with any provision of these Terms and Conditions.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Driver Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Drivers must maintain accurate and up-to-date profile information, including contact details and vehicle information.</li>
              <li>Drivers are responsible for following assigned routes and schedules as provided through the Service.</li>
              <li>Drivers must report any issues or delays in real-time using the Service's reporting features.</li>
              <li>Drivers must maintain their vehicles in accordance with company standards and applicable regulations.</li>
              <li>Drivers must comply with all traffic laws and regulations while operating vehicles.</li>
              <li>Drivers must submit leave requests at least 24 hours in advance, except in emergency situations.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Leave Request Policy</h2>
            <p className="mb-4">
              Drivers may request leave through the Service. All leave requests must be submitted at least 24 hours before the requested start date, 
              unless there are extenuating circumstances. Leave requests are subject to approval by administrators based on operational requirements 
              and staffing availability.
            </p>
            <p className="mb-4">
              Administrators will review leave requests and may approve, reject, or request modifications. Drivers will be notified of the decision 
              through the Service. Approved leave will be reflected in the driver's schedule, and rejected leave requests may include a reason for rejection.
            </p>
            <p>
              In cases of emergency or unexpected situations, drivers should contact their supervisor directly and follow company emergency procedures.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Route Management</h2>
            <p className="mb-4">
              The Service provides route optimization and management features. Administrators may assign, modify, or cancel routes based on operational needs. 
              Drivers are expected to follow assigned routes unless directed otherwise by an administrator.
            </p>
            <p className="mb-4">
              Route changes may occur due to traffic conditions, weather, or other factors. The Service will notify drivers of any route modifications 
              in real-time. Drivers must acknowledge receipt of route changes through the Service.
            </p>
            <p>
              Drivers are responsible for reporting their location and status as required by the Service. This information is used to optimize routes 
              and provide accurate estimated arrival times.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Data Privacy and Security</h2>
            <p className="mb-4">
              We are committed to protecting your privacy and the security of your data. Our collection and use of personal information is governed by 
              our Privacy Policy, which is incorporated into these Terms and Conditions by reference.
            </p>
            <p className="mb-4">
              The Service collects and processes location data, route information, and other operational data to provide and improve our services. 
              This data may be shared with administrators and other authorized personnel within your organization.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. 
              You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Intellectual Property</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, 
              patent, trade secret, and other intellectual property or proprietary rights laws.
            </p>
            <p>
              You may not copy, modify, distribute, sell, or lease any part of the Service, nor may you reverse engineer or attempt to extract the source 
              code of the Service, unless you have our written permission to do so.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
            <p className="mb-4">
              In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, 
              loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
            <p>
              We do not guarantee that the Service will be uninterrupted, timely, secure, or error-free. We make no warranty regarding the quality, accuracy, 
              timeliness, truthfulness, completeness, or reliability of any content available through the Service.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to Terms and Conditions</h2>
            <p className="mb-4">
              We reserve the right to modify or replace these Terms and Conditions at any time. If a revision is material, we will provide at least 30 days' 
              notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p>
              By continuing to access or use the Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree 
              to the new terms, you are no longer authorized to use the Service.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Information</h2>
            <p>
              If you have any questions about these Terms and Conditions, please contact us at support@driverroutemanagement.com.
            </p>
          </section>
          
          <section className="pt-8 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;