import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BASE_API_URL from '../../config.js';
import Nav from '../../components/Nav';

function AdminDashboard({ user, isAuthenticated, authChecked, handleLoginSuccess, handleLogout }) {
  const [posts, setPendingPosts] = useState([]);
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
    <div>
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <h1>Admin Dashboard</h1>
  
      {posts.length === 0 ? (
        <p>No pending posts</p> // Show message if no posts are found
      ) : (
        <div>
          {posts.map((post) => (
            <div key={post.id}>
              <h3>{post.title}</h3>
              <p>{post.content}</p>
              <p>{post.status}</p>
              <button
                onClick={() => updateStatus(post.id, 'approve')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition"
              >
                Approve
              </button>
              <button
                onClick={() => updateStatus(post.id, 'deny')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition"
              >
                Deny
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

