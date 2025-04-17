import React from "react";
import Nav from "../../components/Nav";
import Form from "../../components/Form";
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
        <h1>Share Your Story</h1>
        <p>
          Contribute to our archive by sharing your memories, photos, and stories about Trenton
          and its rich history. Your experiences help preserve the past for future generations.
        </p>
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
            <a href={`${process.env.REACT_APP_BACKEND_URL || "http://localhost:5001"}/api/auth/login`} 
               className="login-btn">
              Sign in with Google
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShareYourStory;
