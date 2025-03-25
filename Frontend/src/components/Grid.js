import React, { useEffect, useState } from 'react';
import "../styles/Grid.css";

function Grid({messages, loading, error}) {
  //if (loading) return <p>Loading messages...</p>;
  if (error) return <p className="error">Error: {error}</p>;

  return (
    <div className='grid-container'>
      {messages.length > 0 ? (
        messages.map(message => (
          <div key={message.id} className="grid-item">
            <h3>Message #{message.id}</h3>
            <p>{message.content}</p>
          </div>
        ))
      ) : (
        <p>No items found in the archive.</p>
      )}
    </div>
  )
}

export default Grid;