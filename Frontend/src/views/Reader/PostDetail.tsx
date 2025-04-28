import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_API_URL from '../../config';
import { QRCodeSVG } from 'qrcode.react';
import Nav from '../../components/Nav';
import './PostDetail.css';

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
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedPost, setEditedPost] = useState<Partial<Post> | null>(null);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_API_URL}/api/posts/${postId}`, {
          withCredentials: true
        });
        setPost(response.data);
        // Initialize editedPost with the fetched post data
        setEditedPost({
          title: response.data.title,
          content: response.data.content,
          tag: response.data.tag
        });
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
        navigate('/archive'); // Using navigate instead of window.location for better React practice
      } catch (err) {
        console.error("Failed to delete post:", err);
        alert("Failed to delete post. Please try again.");
      }
    }
  };

  // Handle edit form changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedPost(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: value
      };
    });
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !editedPost) return;
    
    try {
      setUpdateLoading(true);
      setUpdateError(null);
      
      await axios.put(
        `${BASE_API_URL}/api/admin/posts/${post.id}/edit`,
        editedPost,
        { withCredentials: true }
      );
      
      // Update the post state with edited content
      setPost({
        ...post,
        title: editedPost.title || post.title,
        content: editedPost.content || post.content,
        tag: editedPost.tag || post.tag
      });
      
      setIsEditing(false);
      setUpdateLoading(false);
    } catch (err: any) {
      console.error('Error updating post:', err);
      setUpdateError(err.response?.data?.message || 'Failed to update post. Please try again.');
      setUpdateLoading(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    if (post) {
      setEditedPost({
        title: post.title,
        content: post.content,
        tag: post.tag
      });
    }
    setIsEditing(false);
    setUpdateError(null);
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
            {!isEditing ? (
              // VIEW MODE
              <>
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
                      <div>
                        <button onClick={() => setIsEditing(true)} className="edit-button">Edit Post</button>
                        <button onClick={() => denyPost(post.id)} className="deny-button">Deny Post</button>
                      </div>
                    )}
                    <Link to="/archive" className="back-button">
                      ← Back to Archive
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              // EDIT MODE
              <div className="edit-post-form">
                <h2>Edit Post</h2>
                {updateError && <div className="error-message">{updateError}</div>}
                <form onSubmit={handleEditSubmit}>
                  <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input 
                      type="text"
                      id="title"
                      name="title"
                      value={editedPost?.title || ''}
                      onChange={handleEditChange}
                      required
                      className="form-control"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="tag">Tag</label>
                    <input 
                      type="text"
                      id="tag"
                      name="tag"
                      value={editedPost?.tag || ''}
                      onChange={handleEditChange}
                      required
                      className="form-control"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="content">Content</label>
                    <textarea 
                      id="content"
                      name="content"
                      value={editedPost?.content || ''}
                      onChange={handleEditChange}
                      required
                      className="form-control"
                      rows={10}
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="save-button"
                      disabled={updateLoading}
                    >
                      {updateLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      type="button" 
                      onClick={cancelEditing}
                      className="cancel-button"
                      disabled={updateLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
                
                <div className="media-edit-note">
                  <p>Note: Media files cannot be edited here. To modify media, please contact the system administrator.</p>
                </div>
              </div>
            )}

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