import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_API_URL from '../config';
import { useNavigate } from 'react-router-dom';
import '../styles/UserPosts.css';
import Nav from './Nav';

function UserPosts({ user, isAuthenticated, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('approved');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const response = await axios.get(`${BASE_API_URL}/api/user/posts`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        setPosts(response.data);
      } catch (err) {
        console.error('Full error:', {
          message: err.message,
          response: err.response,
          stack: err.stack
        });
        setError(err.response?.data?.error || 'Failed to fetch your posts');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUserPosts();
    }
  }, [isAuthenticated]);

  const handleDelete = async (postId) => {
    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) return;

    try {
      await axios.delete(`${BASE_API_URL}/api/user/posts/${postId}`, {
        withCredentials: true
      });
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      alert("Failed to delete post");
      console.error(err);
    }
  };

  const filteredPosts = posts.filter(post => post.status === selectedTab);

  if (!isAuthenticated) {
    return (
      <div className="auth-required">
        <Nav user={user} isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <div className="auth-message">
          <h2>Please log in to view your posts</h2>
          <button onClick={() => navigate('/')}>Go to Home</button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="loading-container">
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <div className="loading">Loading your posts...</div>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <div className="error">Error: {error}</div>
    </div>
  );

  return (
    <div className="user-posts-page">
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <div className="user-posts-container">
        <h1>Your Posts</h1>
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>

        {/* Tabs */}
        <div className="post-tabs">
          <button 
            className={`tab ${selectedTab === 'approved' ? 'active' : ''}`}
            onClick={() => setSelectedTab('approved')}
          >
            Approved
          </button>
          <button 
            className={`tab ${selectedTab === 'denied' ? 'active' : ''}`}
            onClick={() => setSelectedTab('denied')}
          >
            Denied
          </button>
        </div>

        {/* Posts */}
        {filteredPosts.length === 0 ? (
          <div className="no-posts">
            <p>No {selectedTab} posts found.</p>
          </div>
        ) : (
          <div className="posts-grid">
            {filteredPosts.map(post => (
              <div 
                key={post.id} 
                className={`post-card ${post.status}`}
                style={{ cursor: post.status === 'approved' ? 'pointer' : 'default' }}
              >
                <div onClick={() => {
                  if (post.status === 'approved') navigate(`/post/${post.id}`);
                }}>
                  <h2>{post.title}</h2>
                  <p className="post-content">{post.content.substring(0, 150)}...</p>

                  {post.image_url && (
                    <img src={post.image_url} alt={post.title} className="post-image" />
                  )}

                  <div className="post-meta">
                    <span className="post-tag">{post.tag}</span>
                    <span className="post-date">
                      {new Date(post.date_created).toLocaleDateString()}
                    </span>
                    <span className={`post-status ${post.status}`}>
                      {post.status}
                    </span>
                  </div>
                </div>

                {/* Delete button only for approved posts */}
                {post.status === 'approved' && (
                  <div className="post-actions">
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(post.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserPosts;