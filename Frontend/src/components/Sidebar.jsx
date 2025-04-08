import React from 'react';
import { useState } from "react";
import "../styles/sidebar.css"


export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
    <button className='menu-btn' onClick={() => setOpen(true)}>
      &#9776;
    </button>

    <div className={`sidebar ${open ? "open" : ""}`}>
      <button className='menu-btn' onClick={() => setOpen(false)}>
        &#9776;
      </button>

      <ul className='list'>
        <a href='/archive'>Archive</a>
        <a href='/about'>About</a>
        <a href='/admin'>Admin</a>
      </ul>
    </div>
    </>
  );
};