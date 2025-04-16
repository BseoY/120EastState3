import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/TagCloud.css'; // We'll create this CSS file next

const BASE_API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

interface TagCloudProps {
  className?: string; // Optional className for styling
}

const TagCloud: React.FC<TagCloudProps> = ({ className = '' }) => {
    const [tags, setTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await axios.get(`${BASE_API_URL}/api/tags`);
                setTags(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch tags');
                setLoading(false);
                console.error('Error fetching tags:', err);
            }
        };

        fetchTags();
    }, []);

    if (loading) return <div className="tag-cloud-loading">Loading tags...</div>;
    if (error) return <div className="tag-cloud-error">{error}</div>;

    return (
        <div className={`tag-cloud ${className}`}>
            <h2 className="tag-cloud-title">Browse by Tag</h2>
            <div className="tags-container">
                {tags.map(tag => (
                    <Link 
                      key={tag} 
                      to={`/tag/${tag}`} 
                      className="tag-item"
                    >
                        #{tag}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default TagCloud;
