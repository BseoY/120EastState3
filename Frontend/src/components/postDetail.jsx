import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Nav from './Nav';
import '../styles/PostDetail.css';
import BASE_API_URL from '../config';
import { formatLocalDate, formatLocalDateTime } from '../utils/dateUtils';
import '../../styles/PostDetail.css';

function PostDetail({ user, isAuthenticated, handleLogout }) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    tag: '',
    content: ''
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`${BASE_API_URL}/api/posts/${postId}`);
        setPost(res.data);
        setFormData({
          title: res.data.title,
          tag: res.data.tag,
          content: res.data.content
        });
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

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${BASE_API_URL}/api/admin/posts/${post.id}`, formData, {
        withCredentials: true,
      });
      setPost(res.data);
      setIsEditing(false); 
      alert("Post updated successfully!");
    } catch (err) {
      console.error("Error updating post:", err);
      alert("Error updating post.");
    }
  };

  if (error) return <div className="error">{error}</div>;
  if (!post) return <div className="loading">Loading post...</div>;

  return (
    <div className="post-detail-page">
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />

      <div className="post-detail-container">
        {isEditing ? (
          <form onSubmit={handleSubmitEdit} className="edit-post-form">
            <div>
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Tag:</label>
              <input
                type="text"
                name="tag"
                value={formData.tag}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Content:</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit">Save Changes</button>
            <button type="button" onClick={handleEditToggle}>Cancel</button>
          </form>
        ) : (
          <>
            <h1 className="post-detail-title">{post.title}</h1>
            <p><strong>Tag:</strong> {post.tag}</p>
            <p><strong>By:</strong> {post.author}</p>
            <p><strong>Date:</strong> {formatLocalDateTime(post.date_created)}</p>

            {post.image_url && (
              <img src={post.image_url} alt={post.title} className="post-detail-image" />
            )}

            {post.video_url && (
              <video controls src={post.video_url} className="post-detail-video" />
            )}

            <div className="post-content">
              <p>{post.content}</p>
            </div>

            {user?.role === 'admin' && (
              <div className="admin-actions">
                <button onClick={handleEditToggle}>Edit Post</button>
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PostDetail;
