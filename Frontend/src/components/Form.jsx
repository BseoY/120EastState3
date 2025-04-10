import React, { useState, useRef } from "react";
import axios from "axios";
import "../styles/App.css";

const BASE_API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

// Predefined tags for dropdown selection
const PREDEFINED_TAGS = ['Church', 'Family', 'History', 'Trenton', 'Community'];

function Form({ onNewPost, user }) {
  const [formData, setFormData] = useState({
    title: "",    // Add title field
    content: "",  // Add content field
    tag: "",      // Add tag field
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedVideo(file);
      // Create a preview URL
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleVideoRemove = () => {
    setSelectedVideo(null);
    setVideoPreview(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    // Revoke the object URL to free up memory
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      tag: ""
    });
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedVideo(null);
    setVideoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and content are required");
      return;
    }
  
    setIsSubmitting(true);
    setError(null);
  
    try {
      const formPayload = new FormData();
      formPayload.append('title', formData.title);
      formPayload.append('content', formData.content);
      if (formData.tag) formPayload.append('tag', formData.tag);
      if (selectedImage) formPayload.append('image', selectedImage);
      if (selectedVideo) formPayload.append('video', selectedVideo);
  
      const response = await axios.post(
        `${BASE_API_URL}/api/posts`,
        formPayload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true
        }
      );
  
      // Success handling
      setSuccess(true);
      resetForm();
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.error || 'Failed to submit post');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Title and Tag Side by Side */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title-input">Title</label>
            <input
              type="text"
              id="title-input"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter post title"
            />
          </div>
  
          <div className="form-group">
            <label htmlFor="tag-input">Tag (optional)</label>
            <select
              id="tag-input"
              name="tag"
              value={formData.tag}
              onChange={handleChange}
              className="tag-dropdown"
            >
              <option value="">Select a tag</option>
              {PREDEFINED_TAGS.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
  
        {/* Content below Title and Tag */}
        <div>
          <label htmlFor="content-input">Content</label>
          <textarea
            id="content-input"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            placeholder="Write your post content here"
          />
        </div>

        {/* Image Upload */}
        <div className="form-group">
          <label htmlFor="image-input">Image (optional)</label>
          <div className="custom-file-upload" onClick={() => fileInputRef.current.click()}>
            <input
              type="file"
              id="image-input"
              name="image"
              onChange={handleImageChange}
              accept="image/*"
              ref={fileInputRef}
              className="image-input"
            />
            <div className="file-upload-label">Choose an image</div>
          </div>
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button 
                type="button" 
                onClick={handleImageRemove} 
                className="remove-image-btn"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Video Upload */}
        <div className="form-group">
          <label htmlFor="video-input">Video (optional)</label>
          <div className="custom-file-upload" onClick={() => videoInputRef.current.click()}>
            <input
              type="file"
              id="video-input"
              name="video"
              onChange={handleVideoChange}
              accept="video/*"
              ref={videoInputRef}
              className="video-input"
            />
            <div className="file-upload-label">Choose a video</div>
          </div>
          
          {/* Video Preview */}
          {videoPreview && (
            <div className="video-preview-container">
              <video 
                src={videoPreview} 
                controls 
                className="video-preview" 
                style={{ maxWidth: '100%', maxHeight: '300px' }}
              />
              <button 
                type="button" 
                onClick={handleVideoRemove} 
                className="remove-video-btn"
              >
                ✕
              </button>
            </div>
          )}
        </div>
  
        {/* Submit Button */}
        <div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Share Your Story"}
          </button>
        </div>
      </form>
  
      {error && <div className="error" style={{ color: 'red' }}>{error}</div>}
      {success && <div className="success" style={{ color: 'green' }}>Message sent successfully!</div>}
    </div>
  );
  
}

export default Form;