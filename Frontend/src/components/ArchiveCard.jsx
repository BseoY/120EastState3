import React from 'react';
import { Link } from 'react-router-dom';
import defaultPic from '../assets/Image/120es_blue.jpg';
import '../styles/ArchiveCard.css'; // You can extract the necessary CSS

function ArchiveCard({ post }) {
  return (
    <Link to={`/post/${post.id}`} className="post-link">
      <div className="archive-item">
        <div className="item-image">
          <img 
            src={post.image_url || defaultPic} 
            alt={post.title} 
          />
        </div>

        {post.tag && (
          <div className="item-tags">
            <span className="tag">{post.tag}</span>
          </div>
        )}

        <div className="item-header">
          <div className="item-metadata">
            <h3>{post.title}</h3>
            <div className="item-byline">
              <span className="contributor-name-subtle">{post.author || 'Unknown contributor'}</span>
              <span className="item-date-subtle">
                {post.date_created ? new Date(post.date_created).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Unknown date'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ArchiveCard;
