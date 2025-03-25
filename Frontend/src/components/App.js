import React, { useEffect, useState } from 'react';
import "../styles/App.css";
import Form from "./Form.js";

function App() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Fetch items from the backend API
    fetch('http://localhost:5001/api/message', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => setItems(data))
      .catch(error => console.error("Error fetching items:", error));
  }, []);

  return (
    <div>
      <h3>120 East State's</h3>
      <h1>Trenton Archive</h1>
      <img src="Assets/Image/headimg.png"></img>
      <h2>Our Mission</h2>
      <p>120 East Group aims to preserve and share the hidden story of a historic church with nearly 300 years of history. A platform for local and global communities to connect and rebuild an auditory of life in the old city of Trenton. What was life like decades ago?</p>
      <p>Items from the backend:</p>
      <ul>
        {items.length > 0 ? (
          items.map(item => (
            <li key={item.id}>{item.title}: {item.description}</li>
          ))
        ) : (
          <li>No items found.</li>
        )}
      </ul>
      <Form />
    </div>
  );
}

export default App;