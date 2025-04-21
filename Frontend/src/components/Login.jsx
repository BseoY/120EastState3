import React from 'react';
import useAuth from '../hooks/useAuth';
import '../styles/Login.css';

function Login({ onLoginSuccess }) {
  // Use the shared authentication hook
  const { handleLogin } = useAuth();

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome to 120 East State</h2>
        <p>Please sign in to continue</p>
        <button 
          className="google-login-btn" 
          onClick={handleLogin}
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
