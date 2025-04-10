import React, { useEffect, useState } from 'react';
import axios from 'axios';

import Nav from '../../components/Nav';
import '../../../src/styles/Admin.css';
const BASE_API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

function AdminDashboard({ user, isAuthenticated, authChecked, handleLoginSuccess, handleLogout }) {
  const [pendingPosts, setPendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingPosts = async () => {
    try {
      const res = await axios.get(`${BASE_API_URL}/api/admin/pending-posts`, { withCredentials: true });
      setPendingPosts(res.data);
      console.log("success");
    } catch (err) {
      console.error('Error fetching pending posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (postId, action) => {
    try {
      const endpoint = `${BASE_API_URL}/api/admin/posts/${postId}/${action}`;
      await axios.post(endpoint, {}, { withCredentials: true });

      setPendingPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (err) {
      console.error(`Error ${action}ing post:`, err);
    }
  };

  useEffect(() => {
    fetchPendingPosts();
  }, []);

  if (loading) return <div>Loading pending posts...</div>;

  return (
    <>
    <div>
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <h1>Admin Dashboard</h1>
  
      {pendingPosts.length === 0 ? (
        <p>No pending posts</p> // Show message if no posts are found
      ) : (
        <div className='post-container'>
          {pendingPosts.map((post) => (
            <div key={post.id} className='each-post'>
              <div>
                <h3>{post.title}</h3>
                <p>{post.status}</p>
              <div>
                <button
                  onClick={() => updateStatus(post.id, 'approve')}
                  className="approve-button"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(post.id, 'deny')}
                  className="deny-button"
                >
                  Deny
                </button>
              </div>
            </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <div>

    </div>
    </>
  );
}

export default AdminDashboard;

