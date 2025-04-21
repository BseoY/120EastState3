import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Nav from '../../components/Nav';
import './PostDetail.css';

const BASE_API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

interface Post {
  id: number;
  title: string;
  content: string;
  tag: string;
  image_url: string | null;
  video_url: string | null;
  date_created: string;
  author: string;
  profile_pic: string | null;
}

interface PostDetailProps {
  user: any;
  isAuthenticated: boolean;
  authChecked: boolean;
  handleLoginSuccess: (userData: any) => void;
  handleLogout: () => void;
}

const PostDetail: React.FC<PostDetailProps> = ({
  user,
  isAuthenticated,
  authChecked,
  handleLoginSuccess,
  handleLogout
}) => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_API_URL}/api/posts/${postId}`, {
          withCredentials: true
        });
        setPost(response.data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching post:', err);
        setError('Failed to load post. Please try again later.');
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="post-detail-page">
      <Nav 
        user={user} 
        isAuthenticated={isAuthenticated} 
        onLogout={handleLogout} 
      />
      
      <div className="post-detail-container">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : post ? (
          <article className="post-content">
            <header>
              <div className="post-meta">
                <Link to={`/tag/${post.tag}`} className="post-tag">#{post.tag}</Link>
                <span className="post-date">{formatDate(post.date_created)}</span>
              </div>
              <h1 className="post-title">{post.title}</h1>
              <div className="post-author">
                {post.profile_pic ? (
                  <img src={post.profile_pic} alt={post.author} className="author-avatar" />
                ) : (
                  <div className="author-avatar-placeholder"></div>
                )}
                <span>{post.author}</span>
              </div>
            </header>
            
            {post.image_url && (
              <div className="post-image-container">
                <img 
                  src={post.image_url} 
                  alt={post.title} 
                  className="post-image" 
                  style={{ maxWidth: "100%", width: "auto", height: "auto" }} 
                />
              </div>
            )}
            
            <div className="post-body">
              {post.content.split('\n').map((paragraph, index) => (
                paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
              ))}
            </div>
            
            {post.video_url && (
              <div className="post-video-container">
                <video 
                  src={post.video_url} 
                  controls 
                  className="post-video"
                  poster={post.image_url || undefined}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            
            <div className="post-footer">
              <Link to="/archive" className="back-button">
                ← Back to Archive
              </Link>
            </div>
          </article>
        ) : (
          <div className="not-found">Post not found</div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
