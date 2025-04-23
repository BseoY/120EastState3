import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Nav from '../../components/Nav';
import { BASE_API_URL } from '../../utils/constants';
import '../../styles/PostDetail.css'; // Optional, for styling

function PostDetail({ user, isAuthenticated, handleLogout }) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`${BASE_API_URL}/api/posts/${postId}`);
        setPost(res.data);
      } catch (err) {
        setError('Could not load post.');
      }
    };

    fetchPost();
  }, [postId]);

  const handleAdminDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this post?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${BASE_API_URL}/api/admin/posts/${post.id}`, {
        withCredentials: true,
      });

      alert("Post deleted successfully.");
      navigate("/archive");
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Error deleting post.");
    }
  };

  if (error) return <div className="error">{error}</div>;
  if (!post) return <div className="loading">Loading post...</div>;
  console.log("👤 User Info in PostDetail:", user);
  return (
    <div className="post-detail-page">
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />

      <div className="post-detail-container">
        <h1>{post.title}</h1>
        <p><strong>Tag:</strong> {post.tag}</p>
        <p><strong>By:</strong> {post.author}</p>
        <p><strong>Date:</strong> {new Date(post.date_created).toLocaleDateString()}</p>

        {post.image_url && (
          <img src={post.image_url} alt={post.title} className="post-detail-image" />
        )}

        {post.video_url && (
          <video controls src={post.video_url} className="post-detail-video" />
        )}

        <div className="post-content">
          <p>{post.content}</p>
        </div>

        <div style={{ border: '2px dashed red', padding: '1rem', marginTop: '2rem' }}>
            <p>Admin Debug Box — role: {user?.role}</p>
            {user?.role === 'admin' ? (
                <button onClick={handleAdminDelete} style={{
                padding: '10px 16px',
                fontSize: '16px',
                backgroundColor: 'red',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
                }}>
                🗑️ Delete Post
                </button>
            ) : (
                <p>You are not an admin.</p>
            )}
            </div>
      </div>
    </div>
  );
}

export default PostDetail;