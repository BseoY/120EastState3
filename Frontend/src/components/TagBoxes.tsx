import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/TagBoxes.css';
import axios from 'axios';
import BASE_API_URL from '../config';

const TagBoxes = () => {
  // Define Tag interface for proper typing
  interface Tag {
    id: number;
    name: string;
    image_url?: string;
    display_order?: number;
  }
  
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get(`${BASE_API_URL}/api/tags`);
        // Sort tags alphabetically by name
        const sortedTags = response.data.sort((a: Tag, b: Tag) => 
          a.name.localeCompare(b.name)
        );
        setTags(sortedTags);
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
      <div className="section-divider"></div>
      <div className="tag-boxes-grid">
        {loading ? (
          <p>Loading categories...</p>
        ) : tags.length === 0 ? (
          <p>No categories found</p>
        ) : (
          tags.map((tag) => (
            <Link
              key={tag.id}
              to={`/archive?tag=${encodeURIComponent(tag.name)}`}
              className="tag-box"
            >
              {tag.image_url ? (
                <div
                  className="tag-box-background"
                  style={{ backgroundImage: `url(${tag.image_url})` }}
                ></div>
              ) : (
                <div className="tag-box-background tag-box-fallback"></div>
              )}
              <div className="tag-content">
                <h3>{tag.name}</h3>
                <p>View all {tag.name} archives</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default TagBoxes;