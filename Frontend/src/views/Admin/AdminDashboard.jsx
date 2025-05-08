import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BASE_API_URL from '../../config';
import Nav from '../../components/Nav';
// Get token from localStorage for JWT authentication
const getAuthToken = () => localStorage.getItem('authToken') || '';
import '../../../src/styles/Admin.css';
import ArchiveCard from '../../components/ArchiveCard';
import defaultPic from '../../assets/Image/120es_blue.jpg';
import { formatLocalDateTimeForInput, formatLocalDate, toISODateString } from '../../utils/dateUtils';

function AdminDashboard({ user, isAuthenticated, authChecked, handleLoginSuccess, handleLogout }) {
  const navigate = useNavigate();
  const [pendingPosts, setPendingPosts] = useState([]);
  const [deniedPosts, setDeniedPosts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(() => {
    // Initialize from localStorage or default to "metrics"
    return localStorage.getItem('adminActiveSection') || "metrics";
  });
  const setSection = (section) => {
    setActiveSection(section);
    // Save to localStorage whenever section changes
    localStorage.setItem('adminActiveSection', section);
  };
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [approvedPosts, setApprovedPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [administrators, setAdministrators] = useState([]);
  

  const [feedbackText, setFeedbackText] = useState('');
  const [selectedPostId, setSelectedPostId] = useState(null);

  
  // Tag management states
  const [tags, setTags] = useState([]);
  const [tagFormVisible, setTagFormVisible] = useState(false);
  const [currentTag, setCurrentTag] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  // Removed newTagOrder state as we're now sorting alphabetically
  const [newTagImage, setNewTagImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  // Announcement management states
  const [announcements, setAnnouncements] = useState([]);
  const [announcementFormVisible, setAnnouncementFormVisible] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [newAnnouncementStartDate, setNewAnnouncementStartDate] = useState('');
  const [newAnnouncementEndDate, setNewAnnouncementEndDate] = useState('');
  const [hasExpirationDate, setHasExpirationDate] = useState(true);

  const fetchPendingPosts = async () => {
    try {
      const res = await axios.get(`${BASE_API_URL}/api/admin/pending-posts`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      setPendingPosts(res.data);

    } catch (err) {
      console.error('Error fetching pending posts:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDeniedPosts = async () => {
    try {
      const res = await axios.get(`${BASE_API_URL}/api/admin/denied-posts`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
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
        {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }
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
        {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }
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

  // Fetch all tags
  const fetchTags = async () => {
    try {
      const res = await axios.get(`${BASE_API_URL}/api/tags`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      setTags(res.data);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  // Create a new tag
  const createTag = async () => {
    try {
      // First upload image if there is one
      let imageUrl = defaultPic; // Set default image URL
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        
        // Upload to Cloudinary via backend
        const uploadRes = await axios.post(
          `${BASE_API_URL}/api/upload`,
          formData,
          {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }
        );
        
        // Get image URL from response
        imageUrl = uploadRes.data.image_url || defaultPic;
      }

      // Create tag in database
      const res = await axios.post(
        `${BASE_API_URL}/api/admin/tags`,
        {
          name: newTagName,
          // No longer using display_order since we're sorting alphabetically
          image_url: imageUrl
        },
        {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }
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
      let imageUrl = newTagImage || defaultPic; // Use existing image or default
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        
        // Upload to Cloudinary via backend
        const uploadRes = await axios.post(
          `${BASE_API_URL}/api/upload`,
          formData,
          {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }
        );
        
        // Get image URL from response
        imageUrl = uploadRes.data.image_url || imageUrl;
      }

      // Update tag in database
      const res = await axios.put(
        `${BASE_API_URL}/api/admin/tags/${currentTag.id}`,
        {
          name: newTagName,
          image_url: imageUrl
        },
        {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }
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
        {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }
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
    // No longer using display_order
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
    // No longer using display_order
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

  // Fetch approved posts
  const fetchApprovedPosts = async () => {
    try {
      const res = await axios.get(`${BASE_API_URL}/api/posts`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      // Filter only approved posts
      const approved = res.data.filter(post => post.status === 'approved');
      setApprovedPosts(approved);
    } catch (err) {
      console.error('Error fetching approved posts:', err);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${BASE_API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      setUsers(res.data);
      
      // Filter administrators (users with role='admin')
      const admins = res.data.filter(user => user.role === 'admin');
      setAdministrators(admins);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };
  
  // We're now using the shared formatLocalDateTimeForInput utility
  
  // Fetch all announcements
  const fetchAnnouncements = async () => {
    try {
      // First try to get all announcements from admin endpoint
      // If that fails (possibly due to missing backend implementation), fall back to regular endpoint
      try {
        const res = await axios.get(`${BASE_API_URL}/api/announcements`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
        setAnnouncements(res.data);
      } catch (adminErr) {
        console.warn('Admin announcements endpoint failed, trying public endpoint:', adminErr);
        const res = await axios.get(`${BASE_API_URL}/api/announcements`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
        setAnnouncements(res.data);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      // Set empty array to prevent UI errors
      setAnnouncements([]);
    }
  };
  
  // Create a new announcement
  const createAnnouncement = async () => {
    try {
      // Make sure dates are in ISO format for the backend
      const startDate = new Date(newAnnouncementStartDate).toISOString();
      let endDate = null;
      if (hasExpirationDate && newAnnouncementEndDate) {
        endDate = new Date(newAnnouncementEndDate).toISOString();
      }
      
      const formData = {
        title: newAnnouncementTitle,
        content: newAnnouncementContent,
        date_start: startDate,
        date_end: endDate
      };
      
      console.log('Creating announcement with data:', formData);
      
      const res = await axios.post(
        `${BASE_API_URL}/api/announcements`,
        formData,
        {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }
      );
      
      console.log('Announcement created successfully:', res.data);
      
      // Add new announcement to state - handle both response formats
      if (res.data.announcement) {
        setAnnouncements([res.data.announcement, ...announcements]);
      } else if (res.data.id) {
        // If the API returns the announcement directly
        setAnnouncements([res.data, ...announcements]);
      }
      
      // Reset form
      resetAnnouncementForm();
      alert('Announcement created successfully!');
    } catch (err) {
      console.error('Error creating announcement:', err);
      alert('Failed to create announcement: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };
  
  // Update an existing announcement
  const updateAnnouncement = async () => {
    if (!currentAnnouncement) return;
    
    try {
      // Make sure dates are in ISO format for the backend
      const startDate = new Date(newAnnouncementStartDate).toISOString();
      let endDate = null;
      if (hasExpirationDate && newAnnouncementEndDate) {
        endDate = new Date(newAnnouncementEndDate).toISOString();
      }
      
      const formData = {
        title: newAnnouncementTitle,
        content: newAnnouncementContent,
        date_start: startDate,
        date_end: endDate
      };
      
      console.log('Updating announcement with data:', formData);
      
      const res = await axios.put(
        `${BASE_API_URL}/api/announcements/${currentAnnouncement.id}`,
        formData,
        {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }
      );
      
      console.log('Announcement updated successfully:', res.data);
      
      // Update announcement in state - handle both response formats
      if (res.data.announcement) {
        setAnnouncements(announcements.map(announcement => 
          announcement.id === currentAnnouncement.id ? res.data.announcement : announcement
        ));
      } else if (res.data.id) {
        // If the API returns the announcement directly
        setAnnouncements(announcements.map(announcement => 
          announcement.id === currentAnnouncement.id ? res.data : announcement
        ));
      }
      
      // Reset form
      resetAnnouncementForm();
      alert('Announcement updated successfully!');
    } catch (err) {
      console.error('Error updating announcement:', err);
      alert('Failed to update announcement: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };
  
  // Delete an announcement
  const deleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await axios.delete(
        `${BASE_API_URL}/api/announcements/${announcementId}`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          },
          withCredentials: true
        }
      );
      
      // Remove announcement from state
      setAnnouncements(announcements.filter(announcement => announcement.id !== announcementId));
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert('Failed to delete announcement. Please try again.');
    }
  };
  
  // Removed toggle functionality - announcements are now only active or expired based on dates
  
  // Handle edit announcement button click
  const handleEditAnnouncement = (announcement) => {
    setCurrentAnnouncement(announcement);
    setNewAnnouncementTitle(announcement.title);
    setNewAnnouncementContent(announcement.content);
    
    // Format dates for datetime-local input
    if (announcement.date_start) {
      setNewAnnouncementStartDate(formatLocalDateTimeForInput(new Date(announcement.date_start)));
      
      // Handle end date if it exists
      if (announcement.date_end) {
        setNewAnnouncementEndDate(formatLocalDateTimeForInput(new Date(announcement.date_end)));
        setHasExpirationDate(true);
      } else {
        setHasExpirationDate(false);
        setNewAnnouncementEndDate('');
      }
    }
    
    setAnnouncementFormVisible(true);
  };
  
  // Reset announcement form

  const resetAnnouncementForm = () => {
    setCurrentAnnouncement(null);
    setNewAnnouncementTitle('');
    setNewAnnouncementContent('');
    setNewAnnouncementStartDate('');
    setNewAnnouncementEndDate('');
    setAnnouncementFormVisible(false);
  };

  
  // Submit announcement form
  const handleAnnouncementFormSubmit = (e) => {
    e.preventDefault();
    if (currentAnnouncement) {
      updateAnnouncement();
    } else {
      createAnnouncement();
    }
  };
  
  // Character limit handlers
  const handleAnnouncementTitleChange = (e) => {
    // Don't update if exceeding 100 char limit
    if (e.target.value.length <= 100) {
      setNewAnnouncementTitle(e.target.value);
    }
  };
  
  const handleAnnouncementContentChange = (e) => {
    // Don't update if exceeding 500 char limit
    if (e.target.value.length <= 500) {
      setNewAnnouncementContent(e.target.value);
    }
  };
  
  const handleTagNameChange = (e) => {
    // Don't update if exceeding 30 char limit
    if (e.target.value.length <= 30) {
      setNewTagName(e.target.value);
    }
  };

  useEffect(() => {
    fetchPendingPosts();
    fetchDeniedPosts();
    fetchApprovedPosts();
    fetchUsers();
    fetchTags();
    fetchAnnouncements();
  }, []);

  if (loading) return <div><br></br>Loading Admin Dashboard..</div>;

  return (
    <>
      <Nav user={user} isAuthenticated={isAuthenticated} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
      <div className="admin-container">
        <div className="admin-sidebar">
          <div className="admin-logo">
            <h2>Admin Panel</h2>
          </div>
          <button
            className={`sidebar-button ${activeSection === 'metrics' ? 'active' : ''}`}
            onClick={() => setSection('metrics')}
            data-section="metrics"
          >
            Dashboard
          </button>
          <button
            className={`sidebar-button ${activeSection === 'pending' ? 'active' : ''}`}
            onClick={() => setSection('pending')}
            data-section="pending"
          >
            Pending Posts [{pendingPosts.length}]
          </button>
          {/* Approved Posts button removed as requested */}
          <button
            className={`sidebar-button ${activeSection === 'denied' ? 'active' : ''}`}
            onClick={() => setSection('denied')}
            data-section="denied"
          >
            Denied Posts [{deniedPosts.length}]
          </button>
          <button
            className={`sidebar-button ${activeSection === 'tags' ? 'active' : ''}`}
            onClick={() => {
              setSection('tags');
              fetchTags(); // Refresh tags when clicking the tab
            }}
            data-section="tags"
          >
            Tags [{tags.length}]
          </button>
          <button
            className={`sidebar-button ${activeSection === 'announcements' ? 'active' : ''}`}
            onClick={() => setSection('announcements')}
            data-section="announcements"
          >
            Announcements [{announcements.length}]
          </button>
          {/* Users button removed as requested */}
          <button 
            className={`sidebar-button`}
            onClick={() => navigate("/archive")}
          >
            Public Archive
          </button>
        </div>
        <div className="admin-main-content">
          {activeSection === "metrics" && (
            <div>
              <h1>Admin Dashboard</h1>
              <div id="metrics-container">
                <div className="metrics-box">
                  <p>{approvedPosts.length}</p>
                  <span>Approved Posts</span>
                </div>

                <div className="metrics-box">
                  <p>{pendingPosts.length}</p>
                  <span>Pending Posts</span>
                </div>
                <div className="metrics-box">
                  <p>{deniedPosts.length}</p>
                  <span>Denied Posts</span>
                </div>
                <div className="metrics-box">
                  <p>{tags.length}</p>
                  <span>Tags</span>
                </div>
                <div className="metrics-box">
                  <p>{administrators.length}</p>
                  <span>Admins</span>
                </div>
              </div>
            </div>
          )}
          {/* Tags Section */}
          {activeSection === "tags" && (
            <div>
              <h1>Tag Management</h1>
              <button 
                className="add-tag-button"
                onClick={() => setTagFormVisible(true)}
              >
                Add New Tag
              </button>
              <p>Tags shown below are in order of when they were created. Otherwise, tags are sorted alphabetically.</p>
              
              {tags.length === 0 ? (
                <p>No tags found</p>
              ) : (
                <div className='tag-container'>
                  {tags.map((tag) => (
                    <div key={tag.id} className='tag-item'>
                      {/* Background image or defaultPic fallback */}
                      {tag.image_url ? (
                        <div className='tag-image' style={{backgroundImage: `url(${tag.image_url})`}}></div>
                      ) : (
                        <div className='tag-image' style={{backgroundImage: `url(${defaultPic})`}}></div>
                      )}
                      
                      {/* Content overlay */}
                      <div className='tag-content-overlay'>
                        <h3>{tag.name}</h3>
                        {/* Removed display order display */}
                        
                        {/* Actions */}
                        <div className='tag-actions'>
                          <button onClick={() => handleEditTag(tag)} className='tag-edit-button'>Edit</button>
                          <button onClick={() => deleteTag(tag.id)} className='tag-delete-button'>Delete</button>
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
                <div className="archive-grid">
                  {pendingPosts.map((post) => (
                    <div key={post.id} style={{ position: 'relative' }}>
                      <ArchiveCard post={post} />
                      <div className="admin-actions-overlay">
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
                  <div className="archive-grid">
                    {deniedPosts.map((post) => (
                      <div key={post.id} className="archive-post-container">
                        <ArchiveCard post={post} />
                        <div className="admin-actions-overlay">
                          <button onClick={() => reApprovePost(post.id)} className="approve-button">Re-Approve</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Announcements Section */}
            {activeSection === "announcements" && (
              <div>
                <h1>Announcements</h1>
                <button 
                  onClick={() => {
                    const now = new Date();
                    const sevenDaysLater = new Date();
                    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
                    
                    setNewAnnouncementStartDate(formatLocalDateTimeForInput(now));
                    setNewAnnouncementEndDate(formatLocalDateTimeForInput(sevenDaysLater));
                    setHasExpirationDate(true);
                    setAnnouncementFormVisible(true);
                  }}
                  className="add-announcement-button"
                >
                  Add New Announcement
                </button>
                
                {announcementFormVisible && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h2>{currentAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</h2>
                    <form onSubmit={handleAnnouncementFormSubmit}>
                      <label>Title:</label>
                      <input 
                        type="text" 
                        value={newAnnouncementTitle} 
                        onChange={handleAnnouncementTitleChange}
                        required
                        maxLength={100}
                      />
                      <div className="character-count">
                        <span className={newAnnouncementTitle.length >= 75 ? "count-warning" : ""}>
                          {newAnnouncementTitle.length}
                        </span>
                        /100 characters
                      </div>

                      <label>Content:</label>
                      <textarea 
                        value={newAnnouncementContent} 
                        onChange={handleAnnouncementContentChange}
                        required
                        rows={5}
                        maxLength={500}
                      />
                      <div className="character-count">
                        <span className={newAnnouncementContent.length >= 400 ? "count-warning" : ""}>
                          {newAnnouncementContent.length}
                        </span>
                        /500 characters
                      </div>

                      <label>Start Date:</label>
                      <input 
                        type="datetime-local" 
                        value={newAnnouncementStartDate} 
                        onChange={(e) => setNewAnnouncementStartDate(e.target.value)}
                        required
                      />

                      <label>End Date (optional):</label>
                      <input 
                        type="datetime-local" 
                        value={newAnnouncementEndDate} 
                        onChange={(e) => setNewAnnouncementEndDate(e.target.value)}
                        min={newAnnouncementStartDate}
                      />

                      <div className="modal-buttons">
                        <button type="submit" className="submit-button">
                          {currentAnnouncement ? 'Update' : 'Create'}
                        </button>
                        <button type="button" className="cancel-button" onClick={resetAnnouncementForm}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

                
                {announcements.length === 0 ? (
                  <p>No announcements found</p>
                ) : (
                  <div className="announcements-container">
                    {announcements.map((announcement) => (
                      <div key={announcement.id} className="announcement-card">
                        <div className="announcement-header">
                          <div className={`announcement-status-badge status-badge-${announcement.status}`}>
                            {announcement.status}
                          </div>
                          
                          <div className="announcement-content">
                            <h3 className="announcement-title">{announcement.title}</h3>
                            
                            <div className="announcement-dates">
                              <span>Start: {formatLocalDate(announcement.date_start)}</span>
                              {announcement.date_end ? (
                                <span>End: {formatLocalDate(announcement.date_end)}</span>
                              ) : (
                                <span>No Expiration</span>
                              )}
                            </div>
                            
                            <p className="announcement-text">{announcement.content}</p>
                            
                            <div className="announcement-actions">
                              {/* Activate/Deactivate button removed */}
                              
                              <button 
                                onClick={() => handleEditAnnouncement(announcement)}
                                className="announcement-edit-button"
                              >
                                Edit
                              </button>
                              
                              <button 
                                onClick={() => deleteAnnouncement(announcement.id)}
                                className="announcement-delete-button"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
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
      {/* Tag Creation/Edit Modal */}
      {tagFormVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{currentTag ? 'Edit Tag' : 'Create New Tag'}</h2>
            <form onSubmit={handleTagFormSubmit}>
              <label>Tag Name:</label>
              <input
                type="text"
                value={newTagName}
                onChange={handleTagNameChange}
                required
                maxLength={30}
              />
              <div className="character-count">
                <span className={newTagName.length >= 25 ? "count-warning" : ""}>
                  {newTagName.length}
                </span>
                /30 characters
              </div>

              <label>Background Image:</label>
              <input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
              />

              {newTagImage && (
                <div className="image-preview">
                  <img src={newTagImage} alt="Preview" />
                  <button type="button" onClick={handleRemoveImage}>Remove</button>
                </div>
              )}

              <div className="modal-buttons">
                <button type="submit" className="submit-button">
                  {currentTag ? 'Update' : 'Create'}
                </button>
                <button type="button" className="cancel-button" onClick={resetTagForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
  );
}

export default AdminDashboard;
