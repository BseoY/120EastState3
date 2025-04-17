import React, { useState } from 'react'; // Make sure to import useState
import axios from 'axios';
import "../styles/Nav.css";
import Sidebar from "./Sidebar";
import useIsMobile from '../hooks/useIsMobile';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';  // Add this import
import defaultProfile from '../assets/Image/defaultprofile.png';

const BASE_API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

function Nav({ user, isAuthenticated, onLogout }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  // Add these state declarations at the top of your component
  const [showUserPosts, setShowUserPosts] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [dropVis, setDropVis] = useState(false);

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

  const handleGoogleLogin = async () => {
    try {
      // Get the Google login URL from the backend
      const response = await axios.get(`${BASE_API_URL}/api/auth/login`);
      // Redirect to Google login page
      window.location.href = response.data.redirect_url;
    } catch (error) {
      console.error('Error initiating Google login:', error);
    }
  };

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
            <a href="/about" className='nav-link'>About</a>
            <a href="/admin" className='nav-link'>Admin</a>
          </div>
        )}
      </div>
      
      <div className='nav-profile'>
        {isAuthenticated ? (
          <div className="user-nav-info">
            <button onClick={handleProfileClick}>
              {user?.profile_pic ? (
                <img
                  src={user.profile_pic}
                  alt="User profile"
                  className="nav-profile-pic"
                />
              ) : (
                <img
                  src={defaultProfile} // Use the imported image
                  alt="Default profile"
                  className="nav-profile-pic"
                />
              )}
            </button>

            {dropVis && (
              <div className='dropdown-menu'>
                <ul className='dropdown-rows'>
                  <li id="user-info">
                    <img src={user.profile_pic} id="picture"></img>
                    <div>
                      <p id="name">{user.name}</p>
                      <p>{user.role}</p>
                    </div>
                  </li>
                  <hr id="divider"></hr>
                  <li>
                    <button className='nav-button'>
                      <Link to="/your-posts" className="nav-link">Your Posts</Link>
                    </button>
                  </li>
                  <li>
                    <button onClick={onLogout} className='nav-button'>Log out</button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <button onClick={handleGoogleLogin} className='nav-button'>Log in</button>
        )}
      </div>

      {/* User Posts Dropdown */}
      {showUserPosts && (
        <div className="user-posts-dropdown">
          <button 
            className="close-posts"
            onClick={() => setShowUserPosts(false)}
          >
            ×
          </button>
          
          <h3>Your Posts</h3>
          
          {userPosts.length > 0 ? (
            <ul>
              {userPosts.map(post => (
                <li key={post.id}>
                  <h4>{post.title}</h4>
                  <p>{post.content.substring(0, 100)}...</p>
                  <small>
                    {new Date(post.date_created).toLocaleDateString()} • 
                    Status: {post.status}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p>You haven't created any posts yet.</p>
          )}
        </div>
      )}

      {/* Render the Sidebar only on mobile */}
      {isMobile && (
        <div className='dropdown'>
          <Sidebar />
        </div>
      )}
    </nav>
  );
};

export default Nav;