import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/TagBoxes.css';

const BASE_API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

const TagBoxes = () => {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get(`${BASE_API_URL}/api/tags`);
        setTags(response.data);
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  if (loading) return <div>Loading tags...</div>;

  return (
    <div className="tag-boxes-container">
      <h2>Browse by Category</h2>
      <div className="tag-boxes-grid">
        {tags.map((tag) => (
          <Link 
            key={tag} 
            to={`/tag/${tag}`} 
            className="tag-box"
          >
            <div className="tag-content">
              <h3>{tag}</h3>
              <p>View all {tag} archives</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TagBoxes;