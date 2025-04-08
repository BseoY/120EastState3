import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BASE_API_URL from '../config';
import axios from 'axios';
import "../styles/Archive.css";
import Nav from './Nav';
import Form from './Form';

// Predefined tags for dropdown selection
const PREDEFINED_TAGS = ['Church', 'Family', 'History', 'Trenton', 'Community'];

function Archive({ user, isAuthenticated, authChecked, handleNewPost, handleLoginSuccess, handleLogout }) {
  // Local state
  const [showForm, setShowForm] = useState(false);
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search filters
  const [titleFilter, setTitleFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  
  // Check URL for login_success parameter to show form
  useEffect(() => {
    // If authenticated and URL has login_success parameter, show the form
    if (isAuthenticated) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('login_success')) {
        setShowForm(true);
      }
    }
  }, [isAuthenticated]);

  // Fetch all posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_API_URL}/api/auth/login`, {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true
        });
        setPosts(response.data);
        setFilteredPosts(response.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, []);
  
  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters();
  }, [titleFilter, userFilter, dateFilter, tagFilter, posts]);
  
  // Function to apply all filters
  const applyFilters = () => {
    let filtered = [...posts];
    
    // Filter by title
    if (titleFilter) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(titleFilter.toLowerCase())
      );
    }
    
    // Filter by user
    if (userFilter) {
      filtered = filtered.filter(post => 
        post.author && post.author.toLowerCase().includes(userFilter.toLowerCase())
      );
    }
    
    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter(post => {
        if (!post.date_created) return false;
        
        const postDate = new Date(post.date_created).toISOString().split('T')[0];
        return postDate === dateFilter;
      });
    }
    
    // Filter by tag
    if (tagFilter) {
      filtered = filtered.filter(post => 
        post.tag === tagFilter
      );
    }
    
    setFilteredPosts(filtered);
  };
  
  // Handle filter changes
  const handleTitleFilterChange = (e) => {
    setTitleFilter(e.target.value);
  };
  
  const handleUserFilterChange = (e) => {
    setUserFilter(e.target.value);
  };
  
  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
  };
  
  const handleTagFilterChange = (e) => {
    setTagFilter(e.target.value);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setTitleFilter('');
    setUserFilter('');
    setDateFilter('');
    setTagFilter('');
    setFilteredPosts(posts);
  };
  
  // Handle login success
  // Toggle form visibility
  const toggleForm = () => {
    if (isAuthenticated) {
      setShowForm(!showForm);
    }
  };
  
  // Handle logout is passed through props
  
  // Handle form submission locally
  const onNewPost = (newPost) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
    setFilteredPosts((prevPosts) => [newPost, ...prevPosts]);
    setShowForm(false); // Hide the form after submission
    // Also pass to parent component
    handleNewPost(newPost);
  };

  if (loading) return <div className="loading">Loading archive...</div>;
  if (error) return <div className="error">Error loading archive: {error}</div>;

  return (
    <div className="archive-container">
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      
      <div className="archive-header">
        <h1>Archive</h1>
        <p>Search and explore historical records</p>
        <div className="archive-actions">
          {isAuthenticated ? (
            <button className="create-archive-btn" onClick={toggleForm}>
              {showForm ? 'Hide Form' : 'Create Archive'}
            </button>
          ) : authChecked && (
            <button 
              className="create-archive-btn" 
              onClick={() => setShowLoginMessage(!showLoginMessage)}
            >
              Create Archive
            </button>
          )}
        </div>
      </div>
      
      {/* Show login message if not authenticated */}
      {showLoginMessage && !isAuthenticated && (
        <div className="login-message">
          <div className="login-message-content">
            <h3>Authentication Required</h3>
            <p>You need to be logged in to create archive entries.</p>
            <div className="login-message-actions">
              <a href="http://localhost:5001/api/auth/login" className="login-btn">Sign in with Google</a>
              <button onClick={() => setShowLoginMessage(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Show form if authenticated and showForm is true */}
      {showForm && isAuthenticated && (
        <div className="archive-form-container">
          <Form onNewPost={onNewPost} user={user} />
        </div>
      )}
      
      {/* Show login if not authenticated and trying to access form */}
      {!isAuthenticated && showForm && authChecked && (
        <div className="archive-login-container">
          <Login onLoginSuccess={handleLoginSuccess} />
        </div>
      )}
      
      <div className="search-container">
        <h2>Search Archives</h2>
        <div className="search-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="title-filter">Title</label>
              <input 
                type="text" 
                id="title-filter" 
                value={titleFilter}
                onChange={handleTitleFilterChange}
                placeholder="Search by title"
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="user-filter">Contributor</label>
              <input 
                type="text" 
                id="user-filter" 
                value={userFilter}
                onChange={handleUserFilterChange}
                placeholder="Search by contributor"
              />
            </div>
          </div>
          
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="date-filter">Date</label>
              <input 
                type="date" 
                id="date-filter" 
                value={dateFilter}
                onChange={handleDateFilterChange}
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="tag-filter">Tag</label>
              <select
                id="tag-filter"
                value={tagFilter}
                onChange={handleTagFilterChange}
              >
                <option value="">All Tags</option>
                {PREDEFINED_TAGS.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filter-actions">
            <button className="clear-filters" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      
      <div className="results-info">
        <p>Found {filteredPosts.length} {filteredPosts.length === 1 ? 'record' : 'records'}</p>
      </div>
      
      <div className="archive-grid">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => (
            <div className="archive-item" key={post.id || index}>
              <div className="item-header">
                <div className="item-metadata">
                  <h3>{post.title}</h3>
                  <div className="item-contributor">
                    {post.profile_pic && (
                      <img 
                        src={post.profile_pic} 
                        alt={post.author} 
                        className="contributor-avatar"
                      />
                    )}
                    <span className="contributor-name">{post.author || 'Unknown contributor'}</span>
                  </div>
                  <div className="item-date">
                    {post.date_created ? new Date(post.date_created).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown date'}
                  </div>
                </div>
              </div>
              
              {post.image_url && (
                <div className="item-image">
                  <img src={post.image_url} alt={post.title} />
                </div>
              )}
              
              <div className="item-content">
                <p>{post.content}</p>
              </div>
              
              {post.tag && (
                <div className="item-tags">
                  <span className="tag">{post.tag}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No records found matching your search criteria.</p>
            <button onClick={clearFilters}>Clear filters and try again</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Archive;
