import React, {useState} from 'react';
import axios from 'axios';
import BASE_API_URL from '../../config';
import Footer from '../../components/Footer';
import Nav from '../../components/Nav';
import teamPhoto from '../../assets/Image/120ES3_team_photo.png';
import teamPhotoHover from '../../assets/Image/TeamPhotoReal.png';
import churchPhoto from '../../assets/Image/church.jpeg';
import '../../../src/styles/About.css';

function About({ user, isAuthenticated, authChecked, handleLoginSuccess, handleLogout }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const maxNameChars = 50;
  const maxMessageChars = 500;
  
  const [statusMessage, setStatusMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear email error when user types in email field
    if (name === 'email') {
      setEmailError('');
    }
  };
  
  // Character count displays
  const nameCount = `${formData.name.length}/${maxNameChars}`;
  const messageCount = `${formData.message.length}/${maxMessageChars}`;

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email before submission
    if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    try {
      const res = await axios.post(`${BASE_API_URL}/api/about/contact`, formData);
      setStatusMessage('Your message has been sent. Thanks for reaching out!');
      setFormData({ name: '', email: '', message: '' });
      setEmailError('');
      
      setTimeout(() => {
        setStatusMessage('');
      }, 5000);
    } catch (error) {
      console.error(error);
      setStatusMessage('Something went wrong. Please try again.');
      
      setTimeout(() => {
        setStatusMessage('');
      }, 5000);
    }
  };

  return (
    <div className="about-container">
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <div className='main-about'>
        <div className='main-statement'>
          <h1>The Digital Archive</h1>
          <p>120 East State is a digital platform dedicated to preserving and sharing the rich history and culture of 120 East State Street. 
            Through our interactive archive and educational resources, we aim to connect people with the stories and memories that make this place unique.
          </p>
        </div>
        <img id="church-img" src={churchPhoto} alt="Church" />
      </div>

      <div className="mission-container">
        <div className="mission-box">
          <h3>Mission</h3>
          <ul>
            <li>Preserve historical documents and artifacts</li>
            <li>Make historical information accessible to everyone</li>
            <li>Educate visitors about the significance of 120 East State Street</li>
            <li>Engage the community in preserving local history</li>
          </ul>
        </div>

        <div className="mission-box">
          <h3>Values</h3>
          <ul>
            <li>Representation</li>
            <li>Accuracy</li>
            <li>Accessibility</li>
            <li>Knowledge</li>
          </ul>
        </div>
      </div>
        
      <div className='church-container'>
        <div className="church-section">
          <h2>About 120 East State</h2>
          <p id="church-statement">120 East State (120ES) was formed in April 2022 to create The Steeple Center in the heart of Trenton. 
            120ES’s purpose is to transform the First Presbyterian Church complex in the heart of Trenton into a 
            community-centered performing arts venue, an engine of economic development, and an opportunity for local
            empowerment giving voice, space, and welcome to its neighbors. As the steeple of this historic church has 
            stretched high above the downtown skyline signaling hope and mission, 120ES seeks to redirect the path laid 
            300 years ago and create a symbol of shared vision in the community.</p>
          <br></br>
          <h3 id="church-values">Values</h3>
          <ul>
            <li>
            <h4>Continuity</h4>
            <p>For 300 years, First Presbyterian Church has served Trenton. The renovated Steeple Center will carry that legacy forward for future generations.</p>
            </li>
            
            <li>
            <h4>Community</h4>
            <p>Trenton is home to thousands seeking safety and belonging. The Steeple Center will be a welcoming space that serves and grows with the community.</p>
            </li>

            <li>
            <h4>Development</h4>
            <p>The Steeple Center will host mission-driven businesses that create economic opportunities and inspire new investment in downtown Trenton.</p>
            </li>

            <li>
            <h4>Inclusion</h4>
            <p>The Steeple Center will be a place where everyone is welcomed, heard, and empowered to help build a more vibrant and just city.</p>
            </li>

            <li>
            <h4>Belief</h4>
            <p>We believe challenges shouldn’t stop us from imagining and working toward a better future for Trenton.</p>
            </li>

            <li>
            <h4>Hope</h4>
            <p>Hope inspires action. Through collective effort, we will transform perceptions and possibilities—bringing new opportunities to life.</p>
            </li>

          </ul>
        </div>
      </div>

      <div className="contact-section" id="contact-section">
        <h2>Contact Us</h2>
        <p>If you have any questions or inquiries, please contact us at:</p>
        <br></br>
        <form id="contact-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            required
            maxLength={maxNameChars}
          />
          <div className="character-count">
            <span className={formData.name.length >= (maxNameChars * 0.8) ? "count-warning" : ""}>
              {formData.name.length}
            </span>
            /{maxNameChars} characters
          </div>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Your Email"
            required
            pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
            title="Please enter a valid email address"
          />
          {emailError && <p className="email-error">{emailError}</p>}

          <textarea 
            id="subject"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Message"
            required
            maxLength={maxMessageChars}
          ></textarea>
          <div className="character-count">
            <span className={formData.message.length >= (maxMessageChars * 0.8) ? "count-warning" : ""}>
              {formData.message.length}
            </span>
            /{maxMessageChars} characters
          </div>

          <input
            type="submit"
            name="submit"
            id="contact-submit"
          />
        </form>

        {statusMessage && (
          <p id="status-message">
            {statusMessage}
          </p>
        )}
      </div>

      <div className='contact-section'>
        <h2>Developers</h2>
        <figure>
          <div className="team-photo-container">
            <img src={teamPhoto} alt="120 East State Team" className="team-photo" />
            <img src={teamPhotoHover} alt="120 East State Team Alternate View" className="team-photo-hover" />
          </div>
          <figcaption>Henry Li (COS '27), Andrew Cho (COS '27), Brian Seo (COS '27)</figcaption>
        </figure>
        <br></br>
        <p>We are a team of computer science students at Princeton University that were excited to help 120 East State build
          a digital platform for preserving and sharing the rich history and culture of 120 East State Street.
        </p>
      </div>
    <Footer></Footer>
    </div>
  );
}

export default About;