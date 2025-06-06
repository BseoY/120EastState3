import React, { useEffect, useState } from 'react';

import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from "axios";
import "./styles/App.css";
import Nav from "./components/Nav";
import authService from './auth';
import UserPosts from './views/Writer/Userposts';
import TagBoxes from './components/TagBoxes';
import ProtectedRoute from './components/ProtectedRoute';
import Archive from "./components/Archive";
import AdminDashboard from "./views/Admin/AdminDashboard";
import About from "./views/Reader/About";
import PostDetail from './views/Reader/PostDetail';
import ShareYourStory from './views/Writer/ShareYourStory';
import PendingPosts from './views/Admin/PendingPosts';
import NotFound from './components/NotFound';
import Announcements from './views/Reader/Announcements';
const videoSource = "https://res.cloudinary.com/djxgotyg7/video/upload/v1744492203/d7g6opgxja7baqep1x3y.mp4";
import BASE_API_URL from './config';
import Footer from './components/Footer';

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
              120 East State aims to preserve and share the hidden stories and nearly 300 years of rich history of the First Presbyterian Church of Trenton and the surrounding area
              A platform for local and global communities to connect and rebuild an auditory of life in the old city of Trenton. What was life like decades ago?
            </p>
          </div>
        </div>
      </section>
      <div className='archive-button-div'><Link to="/about" className='video-btn'>More About Us</Link></div>
      <section className="archive-section">

        <TagBoxes />
      </section>

      <Footer></Footer>
    </div>
  );
}


function App() {

type PostType = any;
const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);


  useEffect(() => {
    const tokenReceived = authService.initAuth();
    if (tokenReceived) {
      console.log('Token received from URL and stored');
    }
    
  
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        if (authService.isAuthenticated()) {
          // Get user data with the token
          const userData = await authService.getCurrentUser();
          if (userData && userData.authenticated) {
            console.log('User is authenticated:', userData.user);
            setUser(userData.user);
            setIsAuthenticated(true);
          } else {
            console.log('Token invalid or expired');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          console.log('No auth token found');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error: any) {
        console.error('Error checking authentication:', error);
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
        const response = await axios.get(`${BASE_API_URL}/api/posts`);
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

    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
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
            allowedRoles={['admin']}
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
        <Route path="/announcements" element={
          <Announcements
            user={user}
            isAuthenticated={isAuthenticated}
            handleLogout={handleLogout}
          />
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;