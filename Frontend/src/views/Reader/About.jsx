import React, {useState} from 'react';
import Nav from '../../components/Nav';
import teamPhoto from '../../assets/Image/120ES3_team_photo.png';
import teamPhotoHover from '../../assets/Image/TeamPhotoReal.png'; // Add your hover image
import '../../../src/styles/About.css';
import BASE_API_URL from '../../config';

function About({ user, isAuthenticated, authChecked, handleLoginSuccess, handleLogout }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const [statusMessage, setStatusMessage] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ... (keep your existing submit logic)
  }

  return (
    <div className="about-container">
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <div className="about-content">
        <h1>About</h1>
        <div className="about-section">
          <h2>The Digital Archive</h2>
          <p>120 East State is a digital platform dedicated to preserving and sharing the rich history and culture of 120 East State Street. 
            Through our interactive archive and educational resources, we aim to connect people with the stories and memories that make this place unique.</p>
            <figure>
              <div className="team-photo-container">
                <img src={teamPhoto} alt="120 East State Team" className="team-photo" />
                <img src={teamPhotoHover} alt="120 East State Team Alternate View" className="team-photo-hover" />
              </div>
              <figcaption>Brian Seo (COS '27), Andrew Cho (COS '27), and Henry Li (COS '27)</figcaption>
            </figure>
        </div>
        
        <div className="about-section">
          <h2>120 East State</h2>
          <ul>
            <li>Preserve historical documents and artifacts</li>
            <li>Make historical information accessible to everyone</li>
            <li>Educate visitors about the significance of 120 East State Street</li>
            <li>Engage the community in preserving local history</li>
          </ul>
        </div>

        <div className="about-section">
          <h2>Contact Us</h2>
          <p>If you have any questions or inquiries, please contact us at:</p>
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
          {statusMessage && (
            <p id="status-message">
              {statusMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default About;