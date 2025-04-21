import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BASE_API_URL from '../../config';
import Nav from '../../components/Nav';
import '../../../src/styles/Admin.css';

function AdminDashboard({ user, isAuthenticated, authChecked, handleLoginSuccess, handleLogout }) {
  const navigate = useNavigate();
  const [pendingPosts, setPendingPosts] = useState([]);
  const [deniedPosts, setDeniedPosts] = useState([]);
  const [existingPosts, setExistingPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("pending");
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedPostId, setSelectedPostId] = useState(null);



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

  const updateStatus = async (postId, action, feedback = '') => {
    try {
      const endpoint = `${BASE_API_URL}/api/admin/posts/${postId}/${action}`;
      await axios.post(
        endpoint, 
        { feedback }, 
        { withCredentials: true }
      );

      setPendingPosts((prev) => prev.filter((post) => post.id !== postId));
      
      // Reset feedback state if provided
      if (feedback) {
        setFeedbackText('');
        setShowDenyModal(false);
      }
    } catch (err) {
      console.error(`Error ${action}ing post:`, err);
    }
  };
  
  const handleDenyClick = (postId) => {
    setSelectedPostId(postId);
    setShowDenyModal(true);
  };
  
  const handleSubmitFeedback = () => {
    if (selectedPostId) {
      updateStatus(selectedPostId, 'deny', feedbackText);
    }
  };
  
  const handleCancelFeedback = () => {
    setShowDenyModal(false);
    setFeedbackText('');
    setSelectedPostId(null);
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
          <h1 id="admin-header">Dashboard</h1>
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
            className={`sidebar-button`}
            onClick={() => navigate("/archive")}
          >
            Public Archive
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
                        <button onClick={() => handleDenyClick(post.id)} className="deny-button">Deny</button>
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
        </div>
      </div>
      {/* Deny Post Modal */}
      {showDenyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Provide Feedback for Denial</h2>
            <p>This feedback will be sent to the user in the automatic email notification.</p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Please provide specific feedback about why this post was denied..."
              rows={5}
              className="feedback-textarea"
            />
            <div className="modal-buttons">
              <button onClick={handleCancelFeedback} className="cancel-button">Cancel</button>
              <button onClick={handleSubmitFeedback} className="submit-button">Submit & Deny</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminDashboard;

