import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BASE_API_URL from '../../config';
import Nav from '../../components/Nav';
import '../../../src/styles/Admin.css';

function AdminDashboard({ user, isAuthenticated, authChecked, handleLoginSuccess, handleLogout }) {
  const [pendingPosts, setPendingPosts] = useState([]);
  const [existingPosts, setExistingPosts] = useState([]);
  const [messages, setMessages] = useState([]);
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

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_API_URL}/api/posts`, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true
      });
      setExistingPosts(response.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${BASE_API_URL}/api/admin/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    fetchPendingPosts();
    fetchMessages();
    fetchPosts();
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
        <h1>Pending Messages</h1>
        <div className='message-grid'>
        {messages.length === 0 ? (
          <p>No pending messages</p> // Show message if no messages are found
        ) : (
          messages.map(msg => (
              <div key={msg.id} className="message-card">
                <p><strong>Name:</strong> {msg.name}</p>
                <p><strong>Email:</strong> {msg.email}</p>
                <p><strong>Message:</strong> {msg.message}</p>
              </div>
          ))
        )}
        </div>
    </div>

    <div className='existing-post-container'>
      <h1>Existing Posts</h1>
      {existingPosts.length === 0 ? (
        <p>No existing posts</p> // Show message if no posts are found
      ) : (
        <div className='post-container'>
          {existingPosts.map((post) => (
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
    </>
  );
}

export default AdminDashboard;

