import { useState } from "react";
import '../../styles/infomodal.css';

export default function InfoModal({ onClose }) {
  const [checked, setChecked] = useState(false);
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h1>Post Expectations</h1>
        
        <p>Before sharing your story, please ensure your submission:</p>
        
        <ul id='share-story-list'>
          <li>Respects others and avoids offensive content</li>
          <li>Relates to a historical, social, or cultural topic</li>
          <li>Does not include sensitive personal information (like addresses, phone numbers, etc.)</li>
        </ul>
        
        <p>Once submitted, your post will be reviewed by our team. You'll receive an approval or denial email once a decision has been made.</p>
        
        <div id='agreement'>
          By continuing, you confirm that you've read and agree to these expectations.
          <input
            type="checkbox"
            checked={checked}
            onChange={() => setChecked(!checked)}
            id='agreement-button'
          />
        </div>
        
        <button
          onClick={onClose}
          className={`modal-cancel-button ${checked ? 'enabled' : 'disabled'}`}
          disabled={!checked}
        >
          Continue
        </button>
      </div>
    </div>
  );
}