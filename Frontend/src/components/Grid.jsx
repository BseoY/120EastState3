import React from 'react';
import "../styles/Grid.css";

function Grid({ posts = [], loading, error }) {
  if (error) return <p className="error">Error: {error}</p>;

  return (
    <div className='grid-container'>
      {posts.length > 0 ? (
        posts.map((post, index) => (
          <div className='post-box' key={post.id || index}>
            <div className="post-title">
              <strong>{post.title}</strong>
            </div>
            {post.image_url && (
              <div className="post-image">
                <img src={post.image_url} alt={post.title} />
              </div>
            )}
            <div className="post-content">
              <p>{post.content}</p>
            </div>
            <div className="post-footer">
              <div className="post-tag">
                <span>{post.tag ? post.tag : "No tag"}</span>
              </div>
              <p className="post-date">Created at {post.date_created}</p>
            </div>
          </div>
        ))
      ) : (
        <p>No items found.</p>
      )}
    </div>
  );
}

export default Grid;