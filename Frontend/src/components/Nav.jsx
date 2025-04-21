import React, { useState } from 'react'; // Make sure to import useState
import "../styles/Nav.css";
import Sidebar from "./Sidebar";
import useIsMobile from '../hooks/useIsMobile';
import useAuth from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';  // Add this import
import defaultProfile from '../assets/Image/defaultprofile.png';

function Nav({ user, isAuthenticated, onLogout }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  // Add these state declarations at the top of your component
  const [showUserPosts, setShowUserPosts] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [dropVis, setDropVis] = useState(false);

  const fetchUserPosts = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoadingPosts(true);
      const response = await axios.get(`${BASE_API_URL}/api/user/posts`, {
        withCredentials: true
      });
      setUserPosts(response.data);
      setShowUserPosts(true);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Use the shared authentication hook
  const { handleLogin } = useAuth();

  const handleProfileClick = () => {
    setDropVis(prev => !prev);
  };

  return (
    <nav className={`navbar ${isHomePage ? 'navbar-transparent' : ''}`}>
      <div>
        <a href="/" className='nav-logo'><img src="/120logo.png" alt="120 East State Logo"></img></a>
        
        {/* Render desktop nav links only when NOT on mobile */}
        {!isMobile && (
          <div className='nav-links'>
            <a href="/share" className='nav-link'>Share Your Story</a>
            <a href="/archive" className='nav-link'>Archive</a>
            <a href="/about" className='nav-link'>About</a>
            <a href="/admin" className='nav-link'>Admin</a>
          </div>
        )}
      </div>
      
      <div className='nav-profile'>
        {isAuthenticated ? (
          <div className="user-nav-info">
            <button onClick={handleProfileClick}>
              <img
                src={user?.profile_pic || defaultProfile}
                onError={(e) => {
                  e.target.onerror = null; // Prevents infinite loop if defaultProfile also fails
                  e.target.src = defaultProfile;
                }}
                alt="Profile"
                className="nav-profile-pic"
              />
            </button>

            {dropVis && (
              <div className='dropdown-menu'>
                <ul className='dropdown-rows'>
                  <li id="user-info">
                  <img
                    id="picture"
                    src={user?.profile_pic || defaultProfile}
                    onError={(e) => {
                      e.target.onerror = null; // Prevents infinite loop if defaultProfile also fails
                      e.target.src = defaultProfile;
                    }}
                    alt="Profile"
                    className="nav-profile-pic"
                  />
                    <div>
                      <p id="name">{user.name}</p>
                      <p>{user.role}</p>
                    </div>
                  </li>
                  <hr id="divider"></hr>
                  <li>
                    <button>
                      <Link to="/your-posts" className='menu-links'>Your Posts</Link>
                    </button>
                  </li>
                  <li>
                    <button onClick={onLogout}>Log out</button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <button onClick={handleLogin} className='nav-button'>Log in</button>
        )}
      </div>

      {/* User Posts Dropdown */}
      {showUserPosts && (
        <div className="user-posts-dropdown">
          <button 
            className="close-posts"
            onClick={() => setShowUserPosts(false)}
          >
            ×
          </button>
          
          <h3>Your Posts</h3>
          
          {userPosts.length > 0 ? (
            <ul>
              {userPosts.map(post => (
                <li key={post.id}>
                  <h4>{post.title}</h4>
                  <p>{post.content.substring(0, 100)}...</p>
                  <small>
                    {new Date(post.date_created).toLocaleDateString()} • 
                    Status: {post.status}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p>You haven't created any posts yet.</p>
          )}
        </div>
      )}

      {/* Render the Sidebar only on mobile */}
      {isMobile && (
        <div className='dropdown'>
          <Sidebar />
        </div>
      )}
    </nav>
  );
};

export default Nav;