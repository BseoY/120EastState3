import { useState } from "react";
import './infomodal.css';

export default function InfoModal({ onClose }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h1>Share Your Story</h1>
        <hr></hr>
        <h3 id='expectation-header'>Expectations</h3>

        <p>Before you share your story...your post should:</p>
        <ul id='share-story-list'>
          <li>Be Respectful</li>
          <li>Be Historically, socially, or culturally relevant</li>
          <li>Not contain sensitive personal information</li>
        </ul>

        <div id='agreement'>
          <label style={{ display: "flex", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => setChecked(!checked)}
              style={{ marginRight: "10px" }}
              id='agreement-button'
            />
            I understand and agree to these expectations
          </label>
        </div>
        <button
          onClick={onClose}
          className={`modal-cancel-button ${checked ? 'enabled' : 'disabled'}`}
          style={{ margin: "10px" }}
          disabled={!checked}
        >
          Got it!
        </button>
      </div>
    </div>
  );
}