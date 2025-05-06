import { useState } from "react";
import '../../styles/infomodal.css';

export default function InfoModal({ onClose }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h1>Post Expectations</h1>
        <hr></hr>
        <br></br>
        <p>Before you share your story, make sure your post:</p>
        <ul id='share-story-list'>
          <li>Is respectful</li>
          <li>Is historically, socially, or culturally relevant</li>
          <li>Does not contain sensitive personal information</li>
        </ul>
        <p>After you submit your post, we will review it to ensure it meets our expectations. You will recieve a decision through email.</p>
        <br></br>
        <div id='agreement'>
        I understand and agree to these expectations
            <input
              type="checkbox"
              checked={checked}
              onChange={() => setChecked(!checked)}
              style={{ marginRight: "10px" }}
              id='agreement-button'
            />

        </div>
        <br></br>
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