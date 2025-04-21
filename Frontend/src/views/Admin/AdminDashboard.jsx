import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BASE_API_URL from '../../config';
import Nav from '../../components/Nav';
import '../../../src/styles/Admin.css';

function AdminDashboard({ user, isAuthenticated, authChecked, handleLoginSuccess, handleLogout }) {
  const [pendingPosts, setPendingPosts] = useState([]);
  const [deniedPosts, setDeniedPosts] = useState([]);
  const [existingPosts, setExistingPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("pending");



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
  
  const fetchDeniedPosts = async () => {
    try {
      const res = await axios.get(`${BASE_API_URL}/api/admin/denied-posts`, { withCredentials: true });
      setDeniedPosts(res.data);
    } catch (err) {
      console.error('Error fetching denied posts:', err);
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
    fetchDeniedPosts();
    fetchMessages();
    fetchPosts();
  }, []);

  if (loading) return <div>Loading pending posts...</div>;

  return (
    <>
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />

      <div className='admin-container'>
        <div className='admin-sidebar'>
          <h1 id="admin-header">Admin Dashboard</h1>
          <button
            className={`sidebar-button ${activeSection === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveSection("pending")}
          >
            Pending Posts
          </button>
          <button
            className={`sidebar-button ${activeSection === 'denied' ? 'active' : ''}`}
            onClick={() => setActiveSection('denied')}
          >
            Denied Posts
          </button>
          <button
            className={`sidebar-button ${activeSection === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveSection("messages")}
          >
            Messages
          </button>
          <button 
            className={`sidebar-button ${activeSection === 'existing' ? 'active' : ''}`}
            onClick={() => setActiveSection("existing")}
          >
            Existing Archive
          </button>
        </div>

        <div className='admin-main-content'>
          {activeSection === "pending" && (
            <div>
              <h1>Pending Posts</h1>
              {pendingPosts.length === 0 ? (
                <p>No pending posts</p>
              ) : (
                <div className='post-container'>
                  {pendingPosts.map((post) => (
                    <div key={post.id} className='each-post'>
                      <h3>{post.title}</h3>
                      <p>{post.status}</p>
                      <div>
                        <button onClick={() => updateStatus(post.id, 'approve')} className="approve-button">Approve</button>
                        <button onClick={() => updateStatus(post.id, 'deny')} className="deny-button">Deny</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "denied" && (
            <div>
              <h1>Denied Posts</h1>
                {deniedPosts.length === 0 ? (
                  <p>No denied posts</p>
                ) : (
                  <div className='post-container'>
                    {deniedPosts.map((post) => (
                      <div key={post.id} className='each-post'>
                        <h3>{post.title}</h3>
                        <p>Status: {post.status}</p>
                        <p>{post.content?.slice(0, 100)}...</p> {/* optional preview */}
                        {/* Optional: allow re-approval */}
                        <button onClick={() => updateStatus(post.id, 'approve')} className='approve-button'>
                          Re-Approve
                        </button>
                      </div>
                    ))}
                  </div>
              )}
            </div>
          )}
          {activeSection === "messages" && (
            <div>
              <h1>Messages</h1>
                <div className='message-grid'>
                  {messages.length === 0 ? (
                    <p>No pending messages</p>
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
          )}

          {activeSection === "existing" && (
            <div>
              <h1>Existing Archive</h1>
              <div className='post-container'>
                {existingPosts.length === 0 ? (
                  <p>No posts available</p>
                ) : (
                  existingPosts.map(post => (
                    <div key={post.id} className='each-post'>
                      <h3>{post.title}</h3>
                      <p>{post.content?.slice(0, 100)}...</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;

