import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#222' }}>
        Page Not Found
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#555', maxWidth: '500px' }}>
        The page you're looking for doesn’t exist. It might have been removed, renamed, or never existed at all.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#003366',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1rem',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = '#001f4d';
        }}
        onMouseOut={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = '#003366';
        }}
      >
        Go Back Home
      </button>
    </div>
  );
}

export default NotFound;
