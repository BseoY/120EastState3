import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../styles/Archive.css";
import Nav from './Nav';
import Form from './Form';
import { PREDEFINED_TAGS, BASE_API_URL } from '../utils/constants';

function Archive({ user, isAuthenticated, authChecked, handleNewPost, handleLoginSuccess, handleLogout }) {
  // Local state
  const [showForm, setShowForm] = useState(false);
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // For handling URL parameters
  const location = useLocation();
  const navigate = useNavigate();
  
  // Search filters
  const [titleFilter, setTitleFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  
  // Check URL for parameters
  useEffect(() => {
    // Check for login_success parameter
    if (isAuthenticated) {
      const urlParams = new URLSearchParams(location.search);
      if (urlParams.has('login_success')) {
        setShowForm(true);
      }
    }
    
    // Check for tag parameter
    const params = new URLSearchParams(location.search);
    const tagParam = params.get('tag');
    if (tagParam) {
      setTagFilter(decodeURIComponent(tagParam));
    }
  }, [isAuthenticated, location.search]);

  // Fetch all posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_API_URL}/api/posts`, {
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
    const newTagFilter = e.target.value;
    setTagFilter(newTagFilter);
    
    // Update URL with tag filter without reloading the page
    const params = new URLSearchParams(location.search);
    if (newTagFilter) {
      params.set('tag', newTagFilter);
    } else {
      params.delete('tag');
    }
    navigate({ search: params.toString() }, { replace: true });
  };
  
  // Clear all filters
  const clearFilters = () => {
    setTitleFilter('');
    setUserFilter('');
    setDateFilter('');
    setTagFilter('');
    setFilteredPosts(posts);
    
    // Clear URL params
    navigate({ search: '' }, { replace: true });
  };
  
  // Form functionality moved to dedicated Share Your Story page
  
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
      {/*<TagCloud />*/}
      <header>
        <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      </header>
      
      <div className="archive-header">
        <br></br>
        <h1>Digital Archive</h1>
        <p>Search and explore historical records, photos, documents, videos, and more. If you would like to use any content, please contact us at 120eaststate@gmail.com</p>
        <div className="archive-actions">
          <a href="/share" className="create-archive-btn">
            Share Your Story
          </a>
        </div>
      </div>
      
      {/* Form functionality moved to dedicated Share Your Story page */}
      
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

          <div className="results-info">
            <p>Found {filteredPosts.length} {filteredPosts.length === 1 ? 'record' : 'records'}</p>
          </div>
          </div>
      </div>
      
      <br></br>
      <div className="archive-grid">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => (
            <Link to={`/post/${post.id}`} className="post-link" key={post.id || index}>
              <div className="archive-item">
                {/* Image/Video at the top with fallback to filler image */}
                <div className="item-image">
                  <img 
                    src={post.image_url || require('../assets/Image/120es_blue.jpg')} 
                    alt={post.title} 
                  />
                </div>
                
                {/* Tag below the image */}
                {post.tag && (
                  <div className="item-tags">
                    <span className="tag">{post.tag}</span>
                  </div>
                )}
                
                {/* Title below the tag */}
                <div className="item-header">
                  <div className="item-metadata">
                    <h3>{post.title}</h3>
                    <div className="item-byline">
                      <span className="contributor-name-subtle">{post.author || 'Unknown contributor'}</span>
                      <span className="item-date-subtle">
                        {post.date_created ? new Date(post.date_created).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Unknown date'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="no-results">
            <p>No records found matching your search criteria.</p>
            <button onClick={clearFilters}>Clear filters and try again</button>
          </div>
        )}
      </div>
      <br></br>
    </div>
  );
}

export default Archive;
