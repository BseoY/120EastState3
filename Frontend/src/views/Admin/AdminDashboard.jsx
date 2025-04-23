import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BASE_API_URL from '../../config';
import Nav from '../../components/Nav';
import '../../../src/styles/Admin.css';
import defaultPic from '../../assets/Image/120es_blue.jpg';

function AdminDashboard({ user, isAuthenticated, authChecked, handleLoginSuccess, handleLogout }) {
  const navigate = useNavigate();
  const [pendingPosts, setPendingPosts] = useState([]);
  const [deniedPosts, setDeniedPosts] = useState([]);
  const [existingPosts, setExistingPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("pending");
  const [showDenyModal, setShowDenyModal] = useState(false);
  
  // Log active section changes
  useEffect(() => {
    console.log('Active section changed to:', activeSection);
  }, [activeSection]);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  
  // Tag management states
  const [tags, setTags] = useState([]);
  const [tagFormVisible, setTagFormVisible] = useState(false);
  const [currentTag, setCurrentTag] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagOrder, setNewTagOrder] = useState(0);
  const [newTagImage, setNewTagImage] = useState('');
  const [imageFile, setImageFile] = useState(null);

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
      console.error('Error reapproving posts:', err);
    }
  };
  
  const reApprovePost = async (postId) => {
    try {
      await axios.post(
        `${BASE_API_URL}/api/admin/posts/${postId}/approve`,
        {},
        { withCredentials: true }
      );

      setDeniedPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (err) {
      console.error('Error reapproving post:', err);
    };
  }

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
  
  const handleOpenMessageModal = (message) => {
    setSelectedMessage(message);
    setShowMessageModal(true);
  };
  
  const handleCloseMessageModal = () => {
    setSelectedMessage(null);
    setShowMessageModal(false);
  };
  
  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${BASE_API_URL}/api/admin/messages`, { withCredentials: true });
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleMarkAsResolved = async (messageId) => {
    try {
      await axios.post(
        `${BASE_API_URL}/api/admin/messages/${messageId}/resolve`,
        {},
        { withCredentials: true }
      );
  
      // Remove the resolved message from UI or update its status
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== messageId)
      );
    } catch (error) {
      console.error("Error marking message as resolved:", error);
    }
  };
  

  // Fetch all tags
  const fetchTags = async () => {
    try {
      console.log('Fetching tags from:', `${BASE_API_URL}/api/tags`);
      const res = await axios.get(`${BASE_API_URL}/api/tags`, { withCredentials: true });
      console.log('Tags received:', res.data);
      setTags(res.data);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  // Create a new tag
  const createTag = async () => {
    try {
      // First upload image if there is one
      let imageUrl = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        
        // Upload to Cloudinary via backend
        const uploadRes = await axios.post(
          `${BASE_API_URL}/api/upload`,
          formData,
          { withCredentials: true }
        );
        
        // Get image URL from response
        imageUrl = uploadRes.data.image_url || '';
      }

      // Create tag in database
      const res = await axios.post(
        `${BASE_API_URL}/api/admin/tags`,
        {
          name: newTagName,
          display_order: parseInt(newTagOrder) || 0,
          image_url: imageUrl
        },
        { withCredentials: true }
      );
      
      // Update UI
      setTags([...tags, res.data]);
      resetTagForm();
    } catch (err) {
      console.error('Error creating tag:', err);
      alert('Failed to create tag: ' + (err.message || 'Unknown error'));
    }
  };

  // Update an existing tag
  const updateTag = async () => {
    if (!currentTag) return;
    
    try {
      // Handle image upload if needed
      let imageUrl = newTagImage;
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        
        // Upload to Cloudinary via backend
        const uploadRes = await axios.post(
          `${BASE_API_URL}/api/upload`,
          formData,
          { withCredentials: true }
        );
        
        // Get image URL from response
        imageUrl = uploadRes.data.image_url || imageUrl;
      }

      // Update tag in database
      const res = await axios.put(
        `${BASE_API_URL}/api/admin/tags/${currentTag.id}`,
        {
          name: newTagName,
          display_order: parseInt(newTagOrder) || 0,
          image_url: imageUrl
        },
        { withCredentials: true }
      );
      
      // Update UI
      setTags(tags.map(tag => tag.id === currentTag.id ? res.data : tag));
      resetTagForm();
    } catch (err) {
      console.error('Error updating tag:', err);
      alert('Failed to update tag: ' + (err.message || 'Unknown error'));
    }
  };

  // Delete a tag
  const deleteTag = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return;
    
    try {
      await axios.delete(
        `${BASE_API_URL}/api/admin/tags/${tagId}`,
        { withCredentials: true }
      );
      
      // Remove tag from state
      setTags(tags.filter(tag => tag.id !== tagId));
    } catch (err) {
      console.error('Error deleting tag:', err);
    }
  };

  // Handle edit tag button click
  const handleEditTag = (tag) => {
    setCurrentTag(tag);
    setNewTagName(tag.name);
    setNewTagOrder(tag.display_order || 0);
    setNewTagImage(tag.image_url || '');
    setImageFile(null);
    setTagFormVisible(true);
  };

  // Handle image upload
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      
      // Preview image
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewTagImage(e.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Reset tag form
  const resetTagForm = () => {
    setCurrentTag(null);
    setNewTagName('');
    setNewTagOrder(0);
    setNewTagImage('');
    setImageFile(null);
    setTagFormVisible(false);
  };
  
  // Remove image from tag
  const handleRemoveImage = () => {
    setNewTagImage('');
    setImageFile(null);
  };

  // Submit tag form
  const handleTagFormSubmit = (e) => {
    e.preventDefault();
    if (currentTag) {
      updateTag();
    } else {
      createTag();
    }
  };

  useEffect(() => {
    fetchPendingPosts();
    fetchDeniedPosts();
    fetchPosts();
    fetchTags(); 
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
            className={`sidebar-button ${activeSection === 'tags' ? 'active' : ''}`}
            onClick={() => {
              console.log('Tags button clicked');
              setActiveSection('tags');
              fetchTags(); // Refresh tags when clicking the tab
            }}
          >
            Tags
          </button>
          <button 
            className={`sidebar-button`}
            onClick={() => navigate("/archive")}
          >
            Public Archive
          </button>
        </div>

        <div className='admin-main-content'>
          {/* Tags Section */}
          {activeSection === "tags" && (
            <div style={{padding: '20px'}}>
              <h1>Tag Management</h1>
              <button 
                className="add-tag-button"
                onClick={() => setTagFormVisible(true)}
                style={{padding: '8px 16px', marginBottom: '20px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
              >
                Add New Tag
              </button>
              
              {tagFormVisible && (
                <div className="tag-form-container" style={{border: '1px solid #ddd', padding: '20px', marginBottom: '20px', borderRadius: '4px'}}>
                  <h2>{currentTag ? 'Edit Tag' : 'Create New Tag'}</h2>
                  <form onSubmit={handleTagFormSubmit}>
                    <div className="form-group" style={{marginBottom: '15px'}}>
                      <label>Tag Name:</label>
                      <input 
                        type="text" 
                        value={newTagName} 
                        onChange={(e) => setNewTagName(e.target.value)}
                        required
                        style={{display: 'block', width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc'}}
                      />
                    </div>
                    
                    <div className="form-group" style={{marginBottom: '15px'}}>
                      <label>Display Order:</label>
                        <input 
                          type="number" 
                          value={newTagOrder || 0} 
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value);
                            setNewTagOrder(val === '' ? 0 : val);
                          }}
                          required
                          style={{display: 'block', width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc'}}
                        />
                    </div>
                    
                    <div className="form-group" style={{marginBottom: '15px'}}>
                      <label>Background Image:</label>
                      <input 
                        type="file" 
                        onChange={handleImageChange}
                        accept="image/*"
                        style={{display: 'block', width: '100%', padding: '8px', marginTop: '5px'}}
                      />
                    </div>
                    
                    {newTagImage && (
                      <div className="image-preview" style={{marginBottom: '15px'}}>
                        <img 
                          src={newTagImage} 
                          alt="Tag background preview" 
                          style={{ maxWidth: '200px', maxHeight: '200px' }} 
                        />
                        <button 
                          type="button" 
                          onClick={handleRemoveImage}
                          style={{
                            marginTop: '10px',
                            padding: '5px 10px',
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                    
                    <div className="form-buttons" style={{display: 'flex', gap: '10px'}}>
                      <button type="button" onClick={resetTagForm} style={{padding: '8px 16px', backgroundColor: '#ddd', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Cancel</button>
                      <button type="submit" style={{padding: '8px 16px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>{currentTag ? 'Update' : 'Create'}</button>
                    </div>
                  </form>
                </div>
              )}
              
              {tags.length === 0 ? (
                <p>No tags found</p>
              ) : (
                <div className='tag-container' style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px'}}>
                  {tags.map((tag) => (
                    <div key={tag.id} className='tag-item' style={{width: '250px', height: '250px', position: 'relative', margin: '0 auto 20px auto', borderRadius: '8px', overflow: 'hidden'}}>
                      {/* Background image or fallback */}
                      {tag.image_url ? (
                        <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${tag.image_url})`, backgroundSize: 'cover', filter: 'grayscale(100%)'}}></div>
                      ) : (
                        <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f0f0f0'}}></div>
                      )}
                      
                      {/* Content overlay */}
                      <div style={{position: 'relative', padding: '15px', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', display: 'flex', flexDirection: 'column'}}>
                        <h3>{tag.name}</h3>
                        <p>Order: {tag.display_order}</p>
                        
                        {/* Actions */}
                        <div style={{marginTop: 'auto', display: 'flex', gap: '10px'}}>
                          <button onClick={() => handleEditTag(tag)} style={{flex: 1, padding: '8px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Edit</button>
                          <button onClick={() => deleteTag(tag.id)} style={{flex: 1, padding: '8px', backgroundColor: '#cc3300', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Pending Posts Section */}
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
                        <img
                          className="post-image"
                          src={post.image_url || defaultPic}
                          alt="post"
                        />
                        {post.video_url && (
                          <video className="post-video" controls>
                            <source src={post.video_url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        )}
                        <h1 id="post-title">{post.title}</h1>
                        <div>
                          <p>Status: {post.status}</p>
                          <p>{post.content?.slice(0, 100)}...</p> {/* optional preview */}
                          <button onClick={() => reApprovePost(post.id)} className='approve-button'>
                            Re-Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
              )}
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
              <button onClick={handleCancelFeedback} className="modal-cancel-button">Cancel</button>
              <button onClick={handleSubmitFeedback} className="modal-submit-button">Submit & Deny</button>
            </div>
          </div>
        </div>
      )}

      {showMessageModal && selectedMessage && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h1>Message from <strong>{selectedMessage.name}</strong></h1>
            <p><strong>Email:</strong> {selectedMessage.email}</p>
            <p id='modal-message' style={{ marginTop: '1rem' }}>{selectedMessage.message}</p>
            <div className="modal-buttons">
              <button onClick={handleCloseMessageModal} className="modal-cancel-button">Close</button>
              <button className="modal-respond-button">Respond</button>
            </div>
          </div>
        </div>
      )}



    </>
  );
}

export default AdminDashboard;
