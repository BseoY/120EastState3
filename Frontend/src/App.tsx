import React, { useEffect, useState } from 'react';

import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from "axios";
import "./styles/App.css";
import Nav from "./components/Nav";
import UserPosts from './components/Userposts';
import TagBoxes from './components/TagBoxes';
import ProtectedRoute from './components/ProtectedRoute';
import Archive from "./components/Archive";
import AdminDashboard from "./views/Admin/AdminDashboard";
import About from "./views/Reader/About";
import PostDetail from './views/Reader/PostDetail';
import ShareYourStory from './views/Reader/ShareYourStory';
import PendingPosts from './views/Admin/PendingPosts';
import NotFound from './components/NotFound'; // 👈 create this component
import Error from "./views/Admin/Error";
// Define Cloudinary video URL
const videoSource = "https://res.cloudinary.com/djxgotyg7/video/upload/v1744492203/d7g6opgxja7baqep1x3y.mp4"; // Replace with your actual Cloudinary URL

// Change this import (note the exact filename case)

const BASE_API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

// Standalone video element removed - using the one in HomePage component


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
            <source src={videoSource} type="video/mp4" />
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
        </section>

        <section className="archive-section">
          <TagBoxes />
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
        console.log('Checking authentication status...');
        const response = await axios.get(`${BASE_API_URL}/api/auth/user`, {
          withCredentials: true
        });
        
        console.log('Auth response:', response.data);
        if (response.data.authenticated) {
          console.log('User is authenticated:', response.data.user);
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          console.log('User is not authenticated');
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
    
    // Add event listener for OAuth redirect completion
    const handleAuthRedirect = () => {
      // If we detect this might be a redirect from OAuth (URL contains code/token params)
      if (window.location.search.includes('code=') || 
          window.location.search.includes('token=') ||
          window.location.pathname.includes('callback')) {
        console.log('Detected possible auth redirect, rechecking authentication');
        checkAuth();
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    
    // Check immediately in case we're on a redirect
    handleAuthRedirect();
    
    // Add listener for URL changes (e.g. history navigation)
    window.addEventListener('popstate', handleAuthRedirect);
    
    return () => {
      window.removeEventListener('popstate', handleAuthRedirect);
    };
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
          <ProtectedRoute
            user={user}
            authChecked={authChecked}
            isAuthenticated={isAuthenticated}
            allowedRoles={['admin']} // You can allow other roles too if needed
          >
          <AdminDashboard 
            user={user}
            isAuthenticated={isAuthenticated}
            authChecked={authChecked}
            handleLoginSuccess={handleLoginSuccess}
            handleLogout={handleLogout}
          />
          </ProtectedRoute>
        } />
        <Route path="/your-posts" element={
          <UserPosts 
            user={user}
            isAuthenticated={isAuthenticated}
            onLogout={handleLogout}
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
        {/* Redirect tag routes to archive with filter */}
        <Route path="/tag/:tag" element={
          <Navigate to="/archive" replace />
        } />
        <Route path="/post/:postId" element={
          <PostDetail 
            user={user}
            isAuthenticated={isAuthenticated}
            authChecked={authChecked}
            handleLoginSuccess={handleLoginSuccess}
            handleLogout={handleLogout}
          />
        } />
        <Route path="/share" element={
          <ShareYourStory
            user={user}
            isAuthenticated={isAuthenticated}
            authChecked={authChecked}
            handleNewPost={handleNewPost}
            handleLoginSuccess={handleLoginSuccess}
            handleLogout={handleLogout}
          />
        } />
        <Route path="/admin/pending" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} authChecked={authChecked} allowedRoles={['admin']} user={user}>
            <PendingPosts user={user} isAuthenticated={isAuthenticated} handleLogout={handleLogout} />
          </ProtectedRoute>
        } />
        <Route path="/error" element={<Error />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;