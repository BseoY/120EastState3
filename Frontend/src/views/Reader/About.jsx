import React from 'react';
import Nav from '../../components/Nav';
import '../../../src/styles/About.css';

function About({ user, isAuthenticated, authChecked, handleLoginSuccess, handleLogout }) {
  return (
    <div className="about-container">
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <div className="about-content">
        <h1>About 120 East State</h1>
        <div className="about-section">
          <h2>Welcome to 120 East State</h2>
          <p>120 East State is a digital platform dedicated to preserving and sharing the rich history and culture of 120 East State Street. Through our interactive archive and educational resources, we aim to connect people with the stories and memories that make this place unique.</p>
        </div>
        
        <div className="about-section">
          <h2>Our Mission</h2>
          <p>Our mission is to:</p>
          <ul>
            <li>Preserve historical documents and artifacts</li>
            <li>Make historical information accessible to everyone</li>
            <li>Educate visitors about the significance of 120 East State Street</li>
            <li>Engage the community in preserving local history</li>
          </ul>
        </div>

        <div className="about-section">
          <h2>Contact Us</h2>
          <p>If you have any questions or would like to contribute to our archive, please contact us at:</p>
          <p>Email: info@120eaststate.com</p>
        </div>
      </div>
    </div>
  );
}

export default About;