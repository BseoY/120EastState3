import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import Nav from '../../components/Nav';
import './PostDetail.css';

const BASE_API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

interface Media {
  id: number;
  url: string;
  media_type: string;
  caption: string | null;
  filename: string | null;
}

interface Post {
  id: number;
  title: string;
  content: string;
  tag: string;
  media: Media[];
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
  const [showQRCode, setShowQRCode] = useState<boolean>(false);

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

  const denyPost = async (postId: number) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await axios.post(`${BASE_API_URL}/api/admin/posts/${postId}/deny`, {}, {
          withCredentials: true
        });
        window.location.href = '/archive'; // Redirect after delete
      } catch (err) {
        console.error("Failed to delete post:", err);
        alert("Failed to delete post. Please try again.");
      }
    }
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
            
            {/* Display media content */}
            <div className="post-media-container">
              {post.media && post.media.length > 0 ? (
                <div className="media-gallery">
                  {post.media.map((media, index) => (
                    <div key={index} className={`media-item media-type-${media.media_type}`}>
                      {media.media_type === 'image' && (
                        <div className="post-image-container">
                          <img 
                            src={media.url} 
                            alt={media.caption || post.title} 
                            className="post-image" 
                          />
                          {media.caption && <p className="media-caption">{media.caption}</p>}
                        </div>
                      )}
                      
                      {media.media_type === 'video' && (
                        <div className="post-video-container">
                          <video 
                            src={media.url} 
                            controls 
                            className="post-video"
                          >
                            Your browser does not support the video tag.
                          </video>
                          {media.caption && <p className="media-caption">{media.caption}</p>}
                        </div>
                      )}
                      
                      {media.media_type === 'audio' && (
                        <div className="post-audio-container">
                          <audio 
                            src={media.url} 
                            controls 
                            className="post-audio"
                          >
                            Your browser does not support the audio tag.
                          </audio>
                          <p className="media-filename">{media.filename || 'Audio file'}</p>
                          {media.caption && <p className="media-caption">{media.caption}</p>}
                        </div>
                      )}
                      
                      {media.media_type === 'document' && (
                        <div className="post-document-container">
                          <a href={media.url} target="_blank" rel="noopener noreferrer" className="document-link">
                            <div className="document-icon">📄</div>
                            <p className="media-filename">{media.filename || 'Document'}</p>
                          </a>
                          {media.caption && <p className="media-caption">{media.caption}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-media-message">
                  <p>No media files attached to this post.</p>
                </div>
              )}
            </div>
            
            <div className="post-body">
              {post.content.split('\n').map((paragraph, index) => (
                paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
              ))}
            </div>
            
            <div className="post-footer">
              <div className="post-actions">
                <button 
                  className="share-qr-button" 
                  onClick={() => setShowQRCode(true)}
                >
                  Share with QR Code
                </button>
                {isAuthenticated && user?.role === 'admin' && (
                  <button onClick={() => denyPost(post.id)} className='deny-button'>Deny Post</button>
                )}
                <Link to="/archive" className="back-button">
                  ← Back to Archive
                </Link>
              </div>
            </div>

            {/* QR Code Modal */}
            {showQRCode && (
              <div className="qr-modal-overlay" onClick={() => setShowQRCode(false)}>
                <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Scan this QR Code to share</h3>
                  <div className="qr-code-container">
                    <QRCodeSVG 
                      value={window.location.href}
                      size={250}
                      includeMargin={true}
                    />
                  </div>
                  <p className="qr-code-url">{window.location.href}</p>
                  <button 
                    className="close-qr-button" 
                    onClick={() => setShowQRCode(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </article>
        ) : (
          <div className="not-found">Post not found</div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
