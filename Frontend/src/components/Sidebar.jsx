import React from 'react';
import { useState } from "react";
import "../styles/sidebar.css"


export default function Sidebar({ isAdmin }) {
  const [open, setOpen] = useState(false);

  return (
    <>
    <button className='menu-btn' onClick={() => setOpen(true)}>
      &#9776;
    </button>

    <div className={`sidebar ${open ? "open" : ""}`}>
      <button className='menu-btn' onClick={() => setOpen(false)}>
        &times;
      </button>

      <ul className='list'>
        <a className='menu-option' href='/archive'>Archive</a>
        <a className='menu-option' href='/share'>Share Your Story</a>
        <a className='menu-option' href='/announcements'>Announcements</a>
        <a className='menu-option' href='/about'>About</a>
        {isAdmin && <a className='menu-option' href='/admin'>Admin</a>}
        
      </ul>
      
      <p id="signature">120EastState</p>
    </div>
    </>
  );
};