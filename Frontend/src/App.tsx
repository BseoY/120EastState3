import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from "axios";
import "./styles/App.css";
import Grid from "./components/Grid";
import Nav from "./components/Nav";
import Form from "./components/Form";
import Login from "./components/Login";
import UserProfile from "./components/UserProfile";
import Archive from "./components/Archive";
import AdminDashboard from "./views/Admin/AdminDashboard";
import About from "./views/Reader/About";

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
      <Nav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />

      <section className="video-hero-section">
        <div className="video-container">
          <video autoPlay muted loop className="background-video">
            <source src="/DJI_0699.MP4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="video-overlay">
            <h1>120 East State</h1>
            <h4>Preserving Trenton's Rich History</h4>
            <div className="video-cta">
              <Link to="/archive" className="video-btn">Explore the Archive</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="content-container">
        <div className="curve-top"></div>
        <div className="mission-section">
          <div className="section-header">
            <h2>Our Mission</h2>
            <div className="section-divider"></div>
          </div>
          <div className="mission-content">
            <p>
              120 East Group aims to preserve and share the hidden story of a historic church
              with nearly 300 years of history. A platform for local and global communities to
              connect and rebuild an auditory of life in the old city of Trenton. What was life
              like decades ago?
            </p>
          </div>
        </div>
        <div className="archive-section">
          <p id="explore-text">Explore our historical collection</p>
          <div className="action-buttons">
            <Link to="/archive" className="archive-btn">View Archive</Link>
          </div>
        </div>
      </section>

      {/* <section className="carousel-section">
        <Carousel posts={posts} loading={loading} error={error} />
      </section> */}
    </div>
  );
}

// App component
function App() {
  // Define a type for posts to fix the TypeScript error
type PostType = any;
const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${BASE_API_URL}/api/auth/user`, {
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
        const response = await axios.get(`${BASE_API_URL}/api/posts`, {
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
    setPosts((prevPosts) => [...prevPosts, newPost]);
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${BASE_API_URL}/api/auth/logout`, {}, {
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
        <Route path="/admin" element={
          <AdminDashboard 
            user={user}
            isAuthenticated={isAuthenticated}
            authChecked={authChecked}
            handleLoginSuccess={handleLoginSuccess}
            handleLogout={handleLogout}
          />
        } />
        <Route path="/about" element={
          <About 
            user={user}
            isAuthenticated={isAuthenticated}
            authChecked={authChecked}
            handleLoginSuccess={handleLoginSuccess}
            handleLogout={handleLogout}
          />
        } />
      </Routes>
    </Router>
  );
}

export default App;