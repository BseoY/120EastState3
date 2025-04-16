import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/TagBoxes.css';
import { PREDEFINED_TAGS } from '../utils/constants';

const TagBoxes = () => {

  return (
    <div className="tag-boxes-container">
      <h2>Browse by Category</h2>
      <div className="tag-boxes-grid">
        {PREDEFINED_TAGS.map((tag) => (
          <Link 
            key={tag} 
            to={`/archive?tag=${encodeURIComponent(tag)}`} 
            className="tag-box"
          >
            <div className="tag-content">
              <h3>{tag}</h3>
              <p>View all {tag} archives</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TagBoxes;