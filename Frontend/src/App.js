import React, { useEffect, useState } from 'react';
import "./styles/App.css"

function App() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Fetch items from the backend API
    fetch('http://localhost:5000/api/items')
      .then(response => response.json())
      .then(data => setItems(data))
      .catch(error => console.error("Error fetching items:", error));
  }, []);

  return (
    <div>
      <h1 className='red'>Community Archive</h1>
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
    </div>
  );
}

export default App;