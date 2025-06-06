import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import defaultPic from '../assets/Image/120es_blue.jpg';
import '../styles/ArchiveCard.css';
import { formatLocalDate } from '../utils/dateUtils';

function ArchiveCard({ post }) {
  const location = useLocation();
  
  return (
    <Link 
      to={`/post/${post.id}`} 
      className="post-link" 
      state={{ from: location.pathname }}>
      <div className="archive-item">
        <div className="item-image">
          {post.media && post.media.length > 0 ? (
            // Display first media item based on type
            post.media[0].media_type === 'image' ? (
              <img src={post.media[0].url} alt={post.media[0].caption || post.title} />
            ) : post.media[0].media_type === 'video' ? (
              <div className="video-thumbnail">
                <video src={post.media[0].url} />
                <div className="video-icon-overlay">▶</div>
              </div>
            ) : post.media[0].media_type === 'audio' ? (
              <div className="audio-thumbnail">
                <div className="audio-icon">🎵</div>
                <p>{post.media[0].filename || 'Audio file'}</p>
              </div>
            ) : (
              <div className="document-thumbnail">
                <div className="document-icon">📄</div>
                <p>{post.media[0].filename || 'Document'}</p>
              </div>
            )
          ) : (
            // Default placeholder if no media
            <div className="placeholder-image">
              <img src={defaultPic} alt={post.title} />
            </div>
          )}
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
                {formatLocalDate(post.date_created)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ArchiveCard;
