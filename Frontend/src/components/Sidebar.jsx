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
        <a>Home</a>
        <a>About</a>
        <a>Contact Us</a>
      </ul>
    </div>
    </>
  );
};