import React from 'react';
import "../styles/Nav.css";

function Nav() {
  return (
    <nav className='navbar'>
      <div class='nav-logo'>
        <a>LOGO</a>
      </div>
      
      <div className='nav-profile'>
        Log in
      </div>

      <div className='dropdown'>
        drop
      </div>
    </nav>
  );
};

export default Nav;