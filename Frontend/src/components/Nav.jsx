import React from 'react';
import "../styles/Nav.css";
import Sidebar from "./Sidebar"

function Nav() {
  return (
    <nav className='navbar'>
      <div className='nav-logo'>
        <img src="/120logo.png" alt="120 East State Logo"></img>
      </div>
      
      <div className='nav-profile'>
        <button>Log in</button>
      </div>

      <div className='dropdown'>
        <Sidebar />
      </div>
    </nav>
  );
};

export default Nav;