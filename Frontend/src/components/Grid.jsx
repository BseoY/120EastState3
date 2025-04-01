import React, { useState } from 'react';
import "../styles/Grid.css";

function Grid({ posts = [], loading, error }) {
  const [imageDimensions, setImageDimensions] = useState({});

  const handleImageLoad = (e, postId) => {
    const { naturalWidth, naturalHeight } = e.target;
    setImageDimensions(prevState => ({
      ...prevState,
      [postId]: { width: naturalWidth, height: naturalHeight },
    }));
  };

  if (error) return <p className="error">Error: {error}</p>;

  return (
    <div className='grid-container'>
      {posts.length > 0 ? (
        posts.map((post, index) => (
          <div className='post-box' key={post.id || index}>
            <div className="post-header">
              <div className="post-author">
                {post.profile_pic ? (
                  <img 
                    src={post.profile_pic} 
                    alt={post.author} 
                    className="author-profile-pic"
                  />
                ) : (
                  <div className="author-profile-pic-placeholder"></div>
                )}
                <span className="author-name">{post.author}</span>
              </div>
            </div>
            <div className="post-title-container">
              <strong className="post-title">{post.title}</strong>
            </div>
            {post.image_url && (
              <div className="post-image">
                <img 
                  src={post.image_url} 
                  alt={post.title} 
                  onLoad={(e) => handleImageLoad(e, post.id || index)} 
                  style={{
                    maxWidth: '100%',  // Ensures image width is contained within the parent
                    maxHeight: '300px', // Optional: Adjust to fit your design
                    borderRadius: '12px',  // Make the image corners round
                    objectFit: 'contain',  // Make sure the image fits without distortion
                  }}
                />
              </div>
            )}
            {post.video_url && (
              <div className="post-video">
                <video
                  src={post.video_url}
                  controls
                  style={{
                    maxWidth: '100%',  // Ensures video width is contained within the parent
                    maxHeight: '300px', // Optional: Adjust to fit your design
                    borderRadius: '12px',  // Make the video corners round
                  }}
                />
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