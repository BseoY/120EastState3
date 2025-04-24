import React from "react";

export default function InfoModal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Welcome to Share Your Story</h2>
        <p>
          Before you share your story, please make sure your post is respectful,
          historically relevant, and does not contain sensitive personal information.
        </p>
        <button onClick={onClose} className="modal-cancel-button" style={{margin: 10 + 'px'}}>Got it!</button>
      </div>
    </div>
  );
}
