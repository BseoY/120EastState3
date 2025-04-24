import React, { useState, useEffect } from 'react'; 
import "../styles/Nav.css";
import Sidebar from "./Sidebar";
import useIsMobile from '../hooks/useIsMobile';
import useAuth from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';  
import defaultProfile from '../assets/Image/defaultprofile.png';

function Nav({ user, isAuthenticated, onLogout }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAdmin = user?.role === 'admin';
  
  // Add these state declarations at the top of your component
  const [showUserPosts, setShowUserPosts] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [dropVis, setDropVis] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropVis && !event.target.closest('.user-nav-info')) {
        setDropVis(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropVis]);

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

  const isActive = (path) => location.pathname === path;
  
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
            {isAdmin && <a href="/admin" className='nav-link'>Admin</a>}
          </div>
        )}
      </div>
      
      <div className='nav-profile'>
        {isAuthenticated ? (
          <div className="user-nav-info">
            <button className="profile-button" onClick={handleProfileClick}>
              <img
                src={user?.profile_pic || defaultProfile}
                onError={(e) => {
                  e.target.onerror = null; 
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
                        e.target.onerror = null; 
                        e.target.src = defaultProfile;
                      }}
                      alt="Profile"
                      className="nav-profile-pic"
                    />
                    <div>
                      <p id="name">{user?.name?.split(" ")[0] || "User"}</p>
                      <p>{user?.role || "user"}</p>
                    </div>
                  </li>
                  <hr id="divider"></hr>
                  <li>
                    <button>
                      <Link to="/your-posts" className='menu-links'>Your Posts</Link>
                    </button>
                  </li>
                  {isAdmin && (
                    <li>
                      <button>
                        <Link to="/admin" className='menu-links'>Admin Dashboard</Link>
                      </button>
                    </li>
                  )}
                  <li>
                    <button onClick={onLogout}>Log out</button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }} className="nav-link login-link">Log in</a>
        )}
      </div>

      {/* Render the Sidebar only on mobile */}
      {isMobile && (
        <div className='dropdown'>
          <Sidebar isAdmin={isAdmin} />
        </div>
      )}
    </nav>
  );
};

export default Nav;