import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Nav from '../../components/Nav';
import { BASE_API_URL } from '../../utils/constants';

function PostDetail({ user, isAuthenticated, handleLogout }) {
  const { postId } = useParams();
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

  if (error) return <div className="error">{error}</div>;
  if (!post) return <div className="loading">Loading post...</div>;

  return (
    <div className="post-detail-page">
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <div className="post-detail-container">
        <h1>{post.title}</h1>
        <p><strong>Tag:</strong> {post.tag}</p>
        <p><strong>By:</strong> {post.author}</p>
        <p><strong>Date:</strong> {new Date(post.date_created).toLocaleDateString()}</p>
        <div className="post-media">
          {post.image_url && <img src={post.image_url} alt={post.title} className="post-image" />}
          {post.video_url && <video src={post.video_url} controls className="post-video" />}
        </div>
        <div className="post-content">
          <p>{post.content}</p>
        </div>
      </div>
    </div>
  );
}

export default PostDetail;
