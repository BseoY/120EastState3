import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_API_URL } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import '../../styles/Archive.css'; // reuse archive styles

function PendingPosts({ user, isAuthenticated, handleLogout }) {
  const [pendingPosts, setPendingPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPending = async () => {
      const res = await axios.get(`${BASE_API_URL}/api/admin/pending-posts`, {
        withCredentials: true,
      });
      setPendingPosts(res.data);
    };
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    await axios.post(`${BASE_API_URL}/api/admin/posts/${id}/approve`, {}, { withCredentials: true });
    setPendingPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleDeny = async (id) => {
    const reason = prompt("Enter denial reason (optional):");
    await axios.post(`${BASE_API_URL}/api/admin/posts/${id}/deny`, { feedback: reason }, { withCredentials: true });
    setPendingPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="archive-container">
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <h1>Pending Posts</h1>
      <div className="archive-grid">
        {pendingPosts.map(post => (
          <div className="archive-item" key={post.id}>
            <div className="item-image">
              <img src={post.image_url || require('../../assets/Image/120es_blue.jpg')} alt={post.title} />
            </div>
            {post.tag && <div className="item-tags"><span className="tag">{post.tag}</span></div>}
            <div className="item-header">
              <h3>{post.title}</h3>
              <div className="item-byline">
                <span className="contributor-name-subtle">{post.author}</span>
                <span className="item-date-subtle">
                  {new Date(post.date_created).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="moderation-buttons" style={{ marginTop: '10px' }}>
              <button onClick={() => handleApprove(post.id)} style={{ marginRight: '8px' }}>✅ Approve</button>
              <button onClick={() => handleDeny(post.id)}>❌ Deny</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PendingPosts;
