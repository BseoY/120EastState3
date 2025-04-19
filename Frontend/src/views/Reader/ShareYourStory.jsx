import React from "react";
import axios from 'axios';
import Nav from "../../components/Nav";
import Form from "../../components/Form";
import BASE_API_URL from "../../config";
import "../../styles/ShareYourStory.css";

function ShareYourStory({ user, isAuthenticated, authChecked, handleNewPost, handleLoginSuccess, handleLogout }) {
  // If the user isn't authenticated, display a message
  const showLoginMessage = !isAuthenticated && authChecked;

  return (
    <div className="share-story-container">
      <header>
        <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      </header>
      <div className="share-story-header">
        <br></br>
        <h1>Share Your Story</h1>
        <p>
          Contribute to our archive by sharing your memories, photos, and stories about Trenton
          and its rich history. Your experiences help preserve the past for future generations.
        </p>
        <br></br>
      </div>
      {isAuthenticated ? (
        <div className="share-story-form-container">
          <Form onNewPost={handleNewPost} user={user} />
        </div>
      ) : (
        <div className="login-required-message">
          <h2>Authentication Required</h2>
          <p>You need to be logged in to share your story.</p>
          <div className="login-actions">
            <button
              onClick={async () => {
                try {
                  // Get the Google login URL from the backend
                  const response = await axios.get(`${BASE_API_URL}/api/auth/login`);
                  
                  // Redirect to Google login page
                  window.location.href = response.data.redirect_url;
                } catch (error) {
                  console.error('Error initiating Google login:', error);
                }
              }}
              className="login-btn"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShareYourStory;
