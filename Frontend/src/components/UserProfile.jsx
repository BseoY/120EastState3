import React from 'react';
import axios from 'axios';
import BASE_API_URL from '../config';
import '../styles/UserProfile.css';

function UserProfile({ user, onLogout }) {
  const handleLogout = async () => {
    try {
      await axios.post(`${BASE_API_URL}/api/auth/login`, {}, {
        withCredentials: true
      });
      onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="user-profile">
      <div className="user-info">
        {user.profile_pic && (
          <img 
            src={user.profile_pic} 
            alt={user.name} 
            className="profile-pic" 
          />
        )}
        <div className="user-details">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      </div>
      <button 
        className="logout-btn" 
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
}

export default UserProfile;
