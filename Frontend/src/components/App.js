import React, { useEffect, useState } from 'react';
import "../styles/App.css";
import Form from "./Form.js";

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/message', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // credentials: 'include' // Only needed if using cookies/auth
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
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
        {messages.length > 0 ? (
          messages.map(message => (
            <li key={message.id}>{message.content}</li>
          ))
        ) : (
          <li>No items found.</li>
        )}
      </ul>
      <Form onNewMessage={newMessage => setMessages([...messages, newMessage])} />
    </div>
  );
}

export default App;