import React from 'react';
import axios from 'axios';
import BASE_API_URL from './config'; // adjust path as needed
import '../styles/Login.css';

function Login({ onLoginSuccess }) {
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
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome to 120 East State</h2>
        <p>Please sign in to continue</p>
        <button 
          className="google-login-btn" 
          onClick={handleGoogleLogin}
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
            alt="Google logo" 
            className="google-icon" 
          />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default Login;
