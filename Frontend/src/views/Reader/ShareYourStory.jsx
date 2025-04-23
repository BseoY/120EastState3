import React from "react";
import Nav from "../../components/Nav";
import Form from "../../components/Form";
import useAuth from "../../hooks/useAuth";
import "../../styles/ShareYourStory.css";
import { Link } from 'react-router-dom';

function ShareYourStory({ user, isAuthenticated, authChecked, handleNewPost, handleLoginSuccess, handleLogout }) {
  // If the user isn't authenticated, display a message
  const showLoginMessage = !isAuthenticated && authChecked;
  
  // Use the shared authentication hook
  const { handleLogin } = useAuth();

  return (
    <div>
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
                onClick={handleLogin}
                className="login-btn"
              >
                Sign in with Google
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="sharestory-footer">
        <p>
          Thanks for your interest in sharing your story
        </p>
        <p>
          If you have any concerns, please contact us at our 
           <Link to="/about" id="about-link"> About Page</Link>
        </p>
      </div>

    </div>

  );
}

export default ShareYourStory;
