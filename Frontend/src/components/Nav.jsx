import React, { useState, useEffect } from 'react'; 
import "../styles/Nav.css";
import Sidebar from "./Sidebar";
import useIsMobile from '../hooks/useIsMobile';
import useAuth from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';  
import defaultProfile from '../assets/Image/defaultprofile.png';
import axios from 'axios';
import BASE_API_URL from '../config';

function Nav({ user, isAuthenticated, onLogout }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAdmin = user?.role === 'admin';
  
  // Add these state declarations at the top of your component
  const [showUserPosts, setShowUserPosts] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [dropVis, setDropVis] = useState(false);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);

  // Close dropdown when clicking outside
  // Effect to handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropVis && !event.target.closest('.user-nav-info')) {
        setDropVis(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropVis]);
  
  // Effect to check for unread announcements - user specific
  useEffect(() => {
    // Skip if user is not authenticated
    if (!isAuthenticated || !user) {
      return;
    }
    
    // Function to check for new announcements
    const checkForNewAnnouncements = async () => {
      try {
        // Get all announcements
        const response = await axios.get(`${BASE_API_URL}/api/announcements`);
        const announcements = response.data;
        
        // Create a user-specific key for localStorage
        const userKey = `lastViewedAnnouncements_${user.id}`;
        
        // Get the last viewed timestamp from localStorage for this specific user
        const lastViewedTimestamp = localStorage.getItem(userKey) || '0';
        
        // Count announcements created after the last viewed timestamp
        const unreadCount = announcements.filter(announcement => {
          const announcementDate = new Date(announcement.date_created).getTime();
          return announcementDate > parseInt(lastViewedTimestamp);
        }).length;
        
        setUnreadAnnouncementsCount(unreadCount);
      } catch (error) {
        console.error('Error checking for new announcements:', error);
      }
    };
    
    // Check for unread announcements when component mounts
    checkForNewAnnouncements();
    
    // Mark announcements as read when visiting the announcements page
    if (location.pathname === '/announcements' && user) {
      const userKey = `lastViewedAnnouncements_${user.id}`;
      localStorage.setItem(userKey, Date.now().toString());
      setUnreadAnnouncementsCount(0);
    }
  }, [location.pathname, isAuthenticated, user]);  // Re-run when location, auth status, or user changes

  const fetchUserPosts = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoadingPosts(true);
      const response = await axios.get(`${BASE_API_URL}/api/user/posts`, {
        withCredentials: true
      });
      setUserPosts(response.data);
      setShowUserPosts(true);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const isActive = (path) => location.pathname === path;
  
  // Use the shared authentication hook
  const { handleLogin } = useAuth();

  const handleProfileClick = () => {
    setDropVis(prev => !prev);
  };

  return (
    <nav className={`navbar ${isHomePage ? 'navbar-transparent' : ''}`}>
      <div>
        <a href="/" className='nav-logo'><img src="/120logo.png" alt="120 East State Logo"></img></a>
        
        {/* Render desktop nav links only when NOT on mobile */}
        {!isMobile && (
          <div className='nav-links'>
            <a href="/share" className='nav-link'>Share Your Story</a>
            <a href="/archive" className='nav-link'>Archive</a>
            <a href="/announcements" className='nav-link'>
              Announcements
              {unreadAnnouncementsCount > 0 && (
                <span className="notification-badge">{unreadAnnouncementsCount}</span>
              )}
            </a>
            <a href="/about" className='nav-link'>About</a>
            {isAdmin && <a href="/admin" className='nav-link'>Admin</a>}
          </div>
        )}
      </div>
      
      <div className='nav-profile'>
        {isAuthenticated ? (
          <div className="user-nav-info">
            <button className="profile-button" onClick={handleProfileClick}>
              <img
                src={user?.profile_pic || defaultProfile}
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = defaultProfile;
                }}
                alt="Profile"
                className="nav-profile-pic"
              />
            </button>

            {dropVis && (
              <div className='dropdown-menu'>
                <ul className='dropdown-rows'>
                  <li id="user-info">
                    <img
                      id="picture"
                      src={user?.profile_pic || defaultProfile}
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = defaultProfile;
                      }}
                      alt="Profile"
                      className="nav-profile-pic"
                    />
                    <div>
                      <p id="name">{user?.name?.split(" ")[0] || "User"}</p>
                      <p>{user?.role || "user"}</p>
                    </div>
                  </li>
                  <hr id="divider"></hr>
                  <li>
                    <button>
                      <Link to="/your-posts" className='menu-links'>Your Posts</Link>
                    </button>
                  </li>
                  {isAdmin && (
                    <li>
                      <button>
                        <Link to="/admin" className='menu-links'>Admin Dashboard</Link>
                      </button>
                    </li>
                  )}
                  <li>
                    <button onClick={onLogout}>Log out</button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }} className="nav-link login-link">Log in</a>
        )}
      </div>

      {/* Render the Sidebar only on mobile */}
      {isMobile && (
        <div className='dropdown'>
          <Sidebar isAdmin={isAdmin} />
        </div>
      )}
    </nav>
  );
};

export default Nav;