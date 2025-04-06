import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from "axios";
import "./styles/App.css";
import Grid from "./components/Grid";
import Carousel from "./components/Carousel";
import Nav from "./components/Nav";
import Form from "./components/Form";
import Login from "./components/Login";
import UserProfile from "./components/UserProfile";
import Archive from "./components/Archive";

function HomePage({ posts, loading, error, user, isAuthenticated, authChecked, handleNewPost, handleLoginSuccess, handleLogout }) {
  return (
    <div className="app-container">
      <header>
        <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        {/* UserProfile is now optional since Nav will show login/logout */}
        {false && isAuthenticated && user && (
          <UserProfile user={user} onLogout={handleLogout} />
        )}
      </header>

      <section className="content-container">
        <div className='title-div'>
          <p id="ESStart">120 East State's</p>
          <h1>Trenton Archive</h1>
        </div>
        <div className="hero-page">
        <img src="/headimg.png" alt="Header" className="header-image" />
        <div className="hero-text">
          <h2>Our Mission</h2>
          <p>120 East Group aims to preserve and share the hidden story of a historic church
            with nearly 300 years of history. A platform for local and global communities to
              connect and rebuild an auditory of life in the old city of Trenton. What was life
              like decades ago?
          </p>
        </div>
        </div>
        <p id="explore-text">Explore the archive</p>
        <div className="action-buttons">
          <Link to="/archive" className="archive-btn">View Archive</Link>
        </div>
        <p id="caron">&#711;</p>
      </section>

      <section className="carousel-section">
        <Carousel posts={posts} loading={loading} error={error} />
      </section>
    </div>
  );
}

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication status when the component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/auth/user", {
          withCredentials: true
        });
        
        if (response.data.authenticated) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, []);

  // Fetch posts when the component mounts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/posts", {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true
        });

        setPosts(response.data); // Store the posts in state
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Handle new post submission and add it to the list of posts
  const handleNewPost = (newPost) => {
    setPosts((prevPosts) => [...prevPosts, newPost]);
  };

  // Handle user login
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      // Call the logout endpoint with POST method
      await axios.post('http://localhost:5001/api/auth/logout', {}, {
        withCredentials: true
      });
      
      // Update local state
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <HomePage 
            posts={posts} 
            loading={loading} 
            error={error} 
            user={user} 
            isAuthenticated={isAuthenticated} 
            authChecked={authChecked} 
            handleNewPost={handleNewPost} 
            handleLoginSuccess={handleLoginSuccess} 
            handleLogout={handleLogout} 
          />
        } />
        <Route path="/archive" element={
          <Archive 
            user={user}
            isAuthenticated={isAuthenticated}
            authChecked={authChecked}
            handleNewPost={handleNewPost}
            handleLoginSuccess={handleLoginSuccess}
            handleLogout={handleLogout}
          />
        } />
      </Routes>
    </Router>
  );
}

export default App;
/*
function PostForm({ onNewPost }) {
  // ✅ Fix: Separate state for form inputs
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tag: "",
  });

  // ✅ Fix: Separate state for storing fetched posts
  const [posts, setPosts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = false;

  // ✅ Fetch posts from the correct API endpoint
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/post");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError(error.message);
      }
    };
  
    fetchPosts();
  }, [success]); 

  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ✅ Submit new post to the correct API endpoint
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and content cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post(
        "http://localhost:5001/api/post", // ✅ Correct API endpoint
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setSuccess(true);
      setFormData({ title: "", content: "", tag: "" }); // Clear form

      if (onNewPost) {
        onNewPost(response.data);
      }

      // ✅ Update displayed posts
      setPosts([...posts, response.data]);
    } catch (error) {
      setError(
        error.response?.data?.message || error.message || "Failed to submit post"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Nav />
      <h3>120 East State's</h3>
      <h1>Trenton Archive</h1>
      <img src="Assets/Image/headimg.png" alt="Header" />
      <h2>Our Mission</h2>
      <p>120 East Group aims to preserve and share the hidden story of a historic church with nearly 300 years of history...</p>
      <p>Items from the backend:</p>

      <ul>
        {posts.length > 0 ? (
          posts.map((post) => (
            <li key={post.id}>
              <strong>{post.title}</strong>: {post.content} {post.tag && `(${post.tag})`}
            </li>
          ))
        ) : (
          <li>No posts found.</li>
        )}
      </ul>

      <form onSubmit={handleSubmit}>
        <label>Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="Enter post title"
        />

        <label>Content</label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          required
          placeholder="Write your post content here"
        />

        <label>Tag (optional)</label>
        <input
          type="text"
          name="tag"
          value={formData.tag}
          onChange={handleChange}
          placeholder="Enter a tag"
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>Post submitted successfully!</p>}
    </div>
  );
}

export default PostForm;
*/