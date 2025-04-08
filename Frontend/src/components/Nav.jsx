import React from 'react';
import axios from 'axios';
import "../styles/Nav.css";
import BASE_API_URL from '../config';

import Sidebar from "./Sidebar"

function Nav({ user, isAuthenticated, onLogout }) {
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
    <nav className='navbar'>
      <div>
        <a href="/" className='nav-logo'><img src="/120logo.png" alt="120 East State Logo"></img></a>
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

      <div className='dropdown'>
        <Sidebar />
      </div>
    </nav>
  );
};

export default Nav;