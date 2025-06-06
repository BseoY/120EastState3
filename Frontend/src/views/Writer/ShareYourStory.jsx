import React, {useEffect, useState} from "react";
import Nav from "../../components/Nav";
import Form from "../../components/Form";
import useAuth from "../../hooks/useAuth";
import "../../styles/ShareYourStory.css";
import { Link } from 'react-router-dom';
import InfoModal from "../Reader/InfoModal";
import Footer from "../../components/Footer";

function ShareYourStory({ user, isAuthenticated, authChecked, handleNewPost, handleLoginSuccess, handleLogout }) {
  // If the user isn't authenticated, display a message
  const showLoginMessage = !isAuthenticated && authChecked;
  
  // Use the shared authentication hook
  const { handleLogin } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const modalSeen = localStorage.getItem("seenStoryIntroModal");
    if (!modalSeen) {
      setShowModal(true);
      localStorage.setItem("seenStoryIntroModal", "true");
    }
  }, []);

  return (
    <div>
      {showModal && <InfoModal onClose={() => setShowModal(false)} />}
      <div className="share-story-container">
        <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <div className="share-story-header">
          <br></br>
          <h1>Share Your Story</h1>
          <p>
            Contribute to our archive by sharing your memories, photos, and stories about Trenton
            and its rich history. Your experiences help preserve the past for future generations. 
            Contact us <a href="/about">here</a> if you have helpful information about a certain topic/person or recommendations of institutions or other sites (online and on land)
            that will further the work on 120ES historical interpretation.
          </p>
          <br></br>
        </div>
        {isAuthenticated ? (
          <div className="share-story-form-container">
            <button onClick={() => setShowModal(true)} id='show-expectations'>
              ?
            </button>
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
      <Footer />
    </div>

  );
}

export default ShareYourStory;
