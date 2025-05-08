import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_API_URL from '../../config';
import Nav from '../../components/Nav';
import '../../styles/Announcements.css';
import '../../styles/App.css';
import { formatLocalDate } from '../../utils/dateUtils';
import Footer from '../../components/Footer';

// Helper to get the auth token for JWT authentication
const getAuthToken = () => localStorage.getItem('authToken') || '';

/**
 * AnnouncementBanner component displays an individual announcement
 * 
 * @param {Object} props - Component props
 * @param {Object} props.announcement - The announcement object to display
 * @returns {JSX.Element} The announcement banner component
 */
const AnnouncementBanner = ({ announcement }) => {
  // Use our utility function for consistent date formatting across the app
  const formatDate = (dateString) => {
    return formatLocalDate(dateString);
  };

  return (
    <>


        <div className="announcement-banner">
          <div className="user-profile">
            <img 
              src={announcement.user.profile_pic || '/default-avatar.png'} 
              alt={announcement.user.name} 
              className="user-profile-pic"
            />
          </div>
          <div className="announcement-title-pub">
            {announcement.title}
          </div>
          <div className="announcement-content-pub">
            {announcement.content}
          </div>
          <div className="announcement-date-pub">
            {formatDate(announcement.date_created)}
          </div>
        </div>

    </>

  );
};

/**
 * Announcements component displays all site announcements
 * 
 * @param {Object} props - Component props 
 * @param {Object} props.user - The current user object
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated
 * @param {Function} props.handleLogout - Function to handle logout
 * @returns {JSX.Element} The announcements page
 */
const Announcements = ({ user, isAuthenticated, handleLogout }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        // Add JWT token to the request header for authentication
        const response = await axios.get(`${BASE_API_URL}/api/announcements`, {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        });
        
        // Sort announcements by date_created in descending order (most recent first)
        const sortedAnnouncements = response.data.sort((a, b) => {
          return new Date(b.date_created) - new Date(a.date_created);
        });
        
        setAnnouncements(sortedAnnouncements);
        setError(null);
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError('Could not load announcements. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <>
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <div className="app-container">
        <div className="content-container">
          <div className="curve-top"></div>
          <div className="announcements-section">
            <div className="section-header">
              <h2>Announcements</h2>
              <div className="section-divider"></div>
            </div>
            
            {loading ? (
              <div className="announcements-loading">Loading announcements...</div>
            ) : error ? (
              <div className="announcements-error">{error}</div>
            ) : announcements.length === 0 ? (
              <div className="announcements-empty">No announcements available at this time.</div>
            ) : (
              <div className="announcements-list">
                <div className="announcement-wrapper">
                <div className="announcement-data">
                  <div>Admin</div>
                  <div>Title</div>
                  <div>Announcement</div>
                  <div>Date Created</div>
                </div>
                {announcements.map(announcement => (
                  <AnnouncementBanner key={announcement.id} announcement={announcement} />
                ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer></Footer>
      </div>
    </>
  );
};

export default Announcements;