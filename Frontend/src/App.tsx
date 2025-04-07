import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from "axios";
import "./styles/App.css";
import Grid from "./components/Grid";
import Carousel from "./components/Carousel";
import Nav from "./components/Nav";
import Form from "./components/Form";
import Login from "./components/Login";
import UserProfile from "./components/UserProfile";
import Archive from "./components/Archive";
import AdminDashboard from "./views/Admin/AdminDashboard";

const BASE_API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

// Define prop types for HomePage
interface HomePageProps {
  posts: any[];
  loading: boolean;
  error: string | null;
  user: any;
  isAuthenticated: boolean;
  authChecked: boolean;
  handleNewPost: (newPost: any) => void;
  handleLoginSuccess: (userData: any) => void;
  handleLogout: () => void;
}

// HomePage component
function HomePage({
  posts,
  loading,
  error,
  user,
  isAuthenticated,
  authChecked,
  handleNewPost,
  handleLoginSuccess,
  handleLogout
}: HomePageProps) {
  return (
    <div className="app-container">
      <header>
        <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
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
            <p>
              120 East Group aims to preserve and share the hidden story of a historic church
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

// App component
function App() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(${BASE_API_URL}/api/posts, {
          withCredentials: true
        });
        

        if (response.data.authenticated) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error: any) {
        console.error("Error checking authentication:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(${BASE_API_URL}/api/posts, {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true
        });

        setPosts(response.data);
      } catch (error: any) {
        console.error("Error fetching posts:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleNewPost = (newPost: any) => {
    setPosts((prevPosts: any[]) => [...prevPosts, newPost]);
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5001/api/auth/logout', {}, {
        withCredentials: true
      });

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
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;