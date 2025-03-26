import React from 'react';
import "../styles/Nav.css";
import Sidebar from "./Sidebar"

function Nav() {
  return (
    <nav className='navbar'>
      <div class='nav-logo'>
        <img src="/120logo.png"></img>
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