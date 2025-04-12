import React, {useState} from 'react';
import Nav from '../../components/Nav';
import '../../../src/styles/About.css';
import BASE_API_URL from '../../config';

function About({ user, isAuthenticated, authChecked, handleLoginSuccess, handleLogout }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${BASE_API_URL}/api/about/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setStatusMessage(data.message);

      if (response.ok) {
        setFormData({ name: '', email: '', message: '' });
      }
    } catch(err) {
      console.error(err);
      setStatusMessage('Something went wrong. Please try again later.');
    }
  }


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
          <form id="contact-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
              required
            ></input>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your Email"
              required
            ></input>
            <textarea 
              id="subject"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Message"
              required
            ></textarea>
            <input
              type="submit"
              name="submit"
              id="submit"
             ></input>
          </form>
        </div>
      </div>
    </div>
  );
}

export default About;