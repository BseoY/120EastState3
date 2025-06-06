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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  const [newTagImage, setNewTagImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  // Announcement management states
  const [announcements, setAnnouncements] = useState([]);
  const [announcementFormVisible, setAnnouncementFormVisible] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  // end date
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
      
      // Show confirmation alert for re-approval
      alert('Post has been re-approved successfully!');
    } catch (err) {
      console.error('Error reapproving post:', err);
      alert(`Error re-approving post: ${err.message || 'Unknown error'}`);
    };
  }

  const deleteAllDeniedPosts = async () => {
    if (!window.confirm('Are you sure you want to permanently delete ALL denied posts?\n\nThis action cannot be undone and will remove all denied posts from the system.')) return;
    
    try {
      if (!window.confirm('WARNING: This will permanently delete all denied posts. Would you like to continue?')) return;
      
      const deletePromises = deniedPosts.map(post => 
        axios.delete(`${BASE_API_URL}/api/admin/posts/${post.id}`, {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        })
      );
      
      await Promise.all(deletePromises); 
      setDeniedPosts([]);
      
      alert('All denied posts have been permanently deleted!');
    } catch (err) {
      console.error('Error deleting all denied posts:', err);
      alert(`Error deleting all denied posts: ${err.message || 'Unknown error'}`);
    }
  };

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
      
      if (action === 'deny') {
        fetchDeniedPosts();
        alert('Post has been denied successfully and feedback has been sent to the contributor.');
      } else if (action === 'approve') {
        alert('Post has been approved successfully!');
      }
      
      if (feedback) {
        setFeedbackText('');
        setShowDenyModal(false);
      }
    } catch (err) {
      console.error(`Error ${action}ing post:`, err);
      alert(`Error ${action}ing post: ${err.message || 'Unknown error'}`);
    }
  };
  
  const handleDenyClick = (postId) => {
    setSelectedPostId(postId);
    setShowDenyModal(true);
  };
  
  const handleSubmitFeedback = () => {
    if (selectedPostId && feedbackText.trim() !== '') {
      if (window.confirm(`Are you sure you want to deny this post?\n\nThis action will mark the post as denied and notify the contributor.`)) {
        updateStatus(selectedPostId, 'deny', feedbackText);
      }
    } else if (feedbackText.trim() === '') {
      alert('Please provide feedback before denying the post.');
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
      let imageUrl = defaultPic;
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        
        // Upload to Cloudinary
        const uploadRes = await axios.post(
          `${BASE_API_URL}/api/upload`,
          formData,
          {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }
        );
        imageUrl = uploadRes.data.image_url || defaultPic;
      }

      const res = await axios.post(
        `${BASE_API_URL}/api/admin/tags`,
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
      
      setTags([...tags, res.data]);
      resetTagForm();
      
      alert(`New tag "${newTagName}" has been created successfully!`);
    } catch (err) {
      console.error('Error creating tag:', err);
      alert('Failed to create tag: ' + (err.message || 'Unknown error'));
    }
  };

  const updateTag = async () => {
    if (!currentTag) return;
    
    try {
      let imageUrl = newTagImage || defaultPic;
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        
        // Upload to Cloudinary
        const uploadRes = await axios.post(
          `${BASE_API_URL}/api/upload`,
          formData,
          {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }
        );
        
        imageUrl = uploadRes.data.image_url || imageUrl;
      }

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
      
      setTags(tags.map(tag => tag.id === currentTag.id ? res.data : tag));
      resetTagForm();
      
      alert(`Tag has been updated successfully!`);
    } catch (err) {
      console.error('Error updating tag:', err);
      alert('Failed to update tag: ' + (err.message || 'Unknown error'));
    }
  };

  const deleteTag = async (tagId) => {
    if (!window.confirm('Are you sure you want to permanently delete this tag?')) return;
    
    try {
      await axios.delete(
        `${BASE_API_URL}/api/admin/tags/${tagId}`,
        {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }
      );

      setTags(tags.filter(tag => tag.id !== tagId));
      
    } catch (err) {
      console.error('Error deleting tag:', err);
    }
  };

  const handleEditTag = (tag) => {
    setCurrentTag(tag);
    setNewTagName(tag.name);
    setNewTagImage(tag.image_url || '');
    setImageFile(null);
    setTagFormVisible(true);
  };

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
      
      // only admis filter
      const admins = res.data.filter(user => user.role === 'admin');
      setAdministrators(admins);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };
  
  const fetchAnnouncements = async () => {
    try {
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
      // Set empty array
      setAnnouncements([]);
    }
  };
  
  // Create a new announcement
  const createAnnouncement = async () => {
    try {
      let endDate = null;
      if (hasExpirationDate && newAnnouncementEndDate) {
        endDate = new Date(newAnnouncementEndDate).toISOString();
      }
      
      const formData = {
        title: newAnnouncementTitle,
        content: newAnnouncementContent,
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
      
      if (res.data.announcement) {
        setAnnouncements([res.data.announcement, ...announcements]);
      } else if (res.data.id) {
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
      let endDate = null;
      if (hasExpirationDate && newAnnouncementEndDate) {
        endDate = new Date(newAnnouncementEndDate).toISOString();
      }
      
      const formData = {
        title: newAnnouncementTitle,
        content: newAnnouncementContent,
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
      
      if (res.data.announcement) {
        setAnnouncements(announcements.map(announcement => 
          announcement.id === currentAnnouncement.id ? res.data.announcement : announcement
        ));
      } else if (res.data.id) {
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
    if (!window.confirm('Are you sure you want to permanently delete this announcement?')) return;
    
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
  
  const handleEditAnnouncement = (announcement) => {
    setCurrentAnnouncement(announcement);
    setNewAnnouncementTitle(announcement.title);
    setNewAnnouncementContent(announcement.content);
    
    // Handle end date if it exists
    if (announcement.date_end) {
      setNewAnnouncementEndDate(formatLocalDateTimeForInput(new Date(announcement.date_end)));
      setHasExpirationDate(true);
    } else {
      setHasExpirationDate(false);
      setNewAnnouncementEndDate('');
    }
    
    setAnnouncementFormVisible(true);
  };
  
  // Reset announcement form

  const resetAnnouncementForm = () => {
    setCurrentAnnouncement(null);
    setNewAnnouncementTitle('');
    setNewAnnouncementContent('');
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
      <Nav user={user} isAuthenticated={isAuthenticated} handleLoginSuccess={handleLoginSuccess} onLogout={handleLogout} />
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle-button">
        {sidebarOpen ? '▲' : '▼'}
      </button>
      <div className="admin-container">
      <div className={`admin-sidebar ${!sidebarOpen ? 'closed' : ''}`}>
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
              fetchTags();
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
                <div className="metrics-box">
                  <p>{users.length}</p>
                  <span>Total Users</span>
                </div>
              </div>
            </div>
          )}
          {/* Tags Section */}
          {activeSection === "tags" && (
            <div>
              <h1>Tag Management</h1>
              <p>Sorted from oldest to newest. Publically sorted alphabetically. </p>
              <br></br>
              <button 
                className="add-tag-button"
                onClick={() => setTagFormVisible(true)}
              >
                Add New Tag
              </button>              
              {tags.length === 0 ? (
                <i>No tags found</i>
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
              <p>Sorted from oldest to newest. </p>
              <br></br>
              {pendingPosts.length === 0 ? (
                <i>No pending posts</i>
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
                <p>Sorted from newest to oldest. </p>
                <br></br>
                <div className='denied-button-container'>
                  {deniedPosts.length > 0 && (
                    <button onClick={deleteAllDeniedPosts} className='denied-delete-button'>Delete All Denied Posts</button>
                  )}
                </div>
      
                {deniedPosts.length === 0 ? (
                  <i>No denied posts</i>
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
                <p>Sorted from newest to oldest. </p>
                <br></br>
                <button 
                  onClick={() => {
                    // Set a default end date 7 days in the future
                    const sevenDaysLater = new Date();
                    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
                    
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

                      <label>Optional End Date:</label>
                      <p className="help-text">Announcements become active when created. End date is optional.</p>
                      <input 
                        type="datetime-local" 
                        value={newAnnouncementEndDate} 
                        onChange={(e) => setNewAnnouncementEndDate(e.target.value)}
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
                  <i>No announcements found</i>
                ) : (
                  <div className="announcements-container">
                    <div className="announcement-data-admin">
                      <div>Admin</div>
                      <div>Title</div>
                      <div>Announcement</div>
                      <div>Start/End</div>
                      <div>Actions</div>
                    </div>
                    {announcements.map((announcement) => (
                      <div key={`announcement-${announcement.id}`} className="announcement-banner-admin">
                        <div className="user-profile">
                          <img 
                            src={announcement.user?.profile_pic || '/default-avatar.png'} 
                            alt={announcement.user?.name || 'User'} 
                            className="user-profile-pic"
                          />
                        </div>
                        <div className="announcement-title-pub">
                          {announcement.title}
                        </div>
                        <div className="announcement-content-pub">
                          {announcement.content}
                        </div>
                        <div className="announcement-date-pub">
                          <p>{formatLocalDate(announcement.date_created)} </p>
                          <p>{formatLocalDate(announcement.date_end)} </p>
                        </div>

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
            <p><strong>Note:</strong> Feedback is mandatory and limited to 500 characters.</p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Please provide specific feedback about why this post was denied..."
              rows={5}
              className="feedback-textarea"
              required
              maxLength={500}
            />
            <div className="character-count">
              <span className={feedbackText.length >= 400 ? "count-warning" : ""}>
                {feedbackText.length}
              </span>
              /500 characters
            </div>
            <div className="modal-buttons">
              <button onClick={handleCancelFeedback} className="modal-cancel-button">Cancel</button>
              <button 
                onClick={handleSubmitFeedback} 
                className="modal-submit-button"
                disabled={feedbackText.trim().length === 0}
              >
                Submit & Deny
              </button>
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

              <div className="file-input-container">
                <label>Background Image:</label>
                <p className="help-text">Upload an image to use as the tag background. If none is provided, a default image will be used.</p>
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
              </div>

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
