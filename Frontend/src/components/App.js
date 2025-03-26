import React, { useEffect, useState } from 'react';
import axios from "axios";
import "../styles/App.css";
import Grid from "./Grid.js";
import Form from "./Form.js";


function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch posts when the component mounts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/posts", {
          headers: {
            "Content-Type": "application/json",
          },
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

  return (
    <div className="app-container">
      <div className="content-container">
        <p id="ESStart">120 East State's</p>
        <h1>Trenton Archive</h1>
        <img src="/headimg.png" alt="Header" className="header-image" />
        <h2>Our Mission</h2>
        <p>120 East Group aims to preserve and share the hidden story of a historic church with nearly 300 years of history. A platform for local and global communities to connect and rebuild an auditory of life in the old city of Trenton. What was life like decades ago?</p>
        
        {/* Pass the handleNewPost function to Form */}
        <Form onNewPost={handleNewPost} />
  
      </div>
      <p id="CreatedStories">Created Stories:</p>
      {/* Grid stays outside of the content-container */}
      <Grid posts={posts} loading={loading} error={error} />
    </div>
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