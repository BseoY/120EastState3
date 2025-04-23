import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/TagBoxes.css';
import axios from 'axios';
import { BASE_API_URL } from '../utils/constants';

const TagBoxes = () => {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get(`${BASE_API_URL}/api/tags`);
        setTags(response.data);
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTags();
  }, []);

  return (
    <div className="tag-boxes-container">
      <h2>Browse by Category</h2>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px'}}>
        {loading ? (
          <p>Loading categories...</p>
        ) : tags.length === 0 ? (
          <p>No categories found</p>
        ) : tags.map((tag) => (
          <Link 
            key={tag.id} 
            to={`/archive?tag=${encodeURIComponent(tag.name)}`} 
            style={{width: '250px', height: '250px', position: 'relative', margin: '0 auto', borderRadius: '8px', overflow: 'hidden', textDecoration: 'none'}}
          >
            {/* Background image or fallback */}
            {tag.image_url ? (
              <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${tag.image_url})`, backgroundSize: 'cover', filter: 'grayscale(100%)'}}></div>
            ) : (
              <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f0f0f0'}}></div>
            )}
            
            {/* Content overlay */}
            <div style={{position: 'relative', padding: '15px', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
              <h3>{tag.name}</h3>
              <p>View all {tag.name} archives</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TagBoxes;