import React from 'react';
import axios from 'axios';
import "../styles/Nav.css";
import BASE_API_URL from '../config';
import Sidebar from "./Sidebar";
import useIsMobile from '../hooks/useIsMobile';
import { useLocation } from 'react-router-dom'

function Nav({ user, isAuthenticated, onLogout }) {
  const isMobile = useIsMobile(); // custom hook detects screen size
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
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

  return (
    <nav className={`navbar ${isHomePage ? 'navbar-transparent' : ''}`}>
      <div>
        <a href="/" className='nav-logo'><img src="/120logo.png" alt="120 East State Logo"></img></a>
        
        {/* Render desktop nav links only when NOT on mobile */}
        {!isMobile && (
          <div className='nav-links'>
            <a href="/archive" className='nav-link'>Archive</a>
            <a href="/about" className='nav-link'>About</a>
            <a href="/admin" className='nav-link'>Admin</a>
          </div>
        )}
      </div>
      
      <div className='nav-profile'>
        {isAuthenticated ? (
          <div className="user-nav-info">
            {user?.profile_pic && (
              <img 
                src={user.profile_pic} 
                alt={user.name} 
                className="nav-profile-pic"
              />
            )}
            <button onClick={onLogout}>Log out</button>
          </div>
        ) : (
          <button onClick={handleGoogleLogin}>Log in</button>
        )}
      </div>

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