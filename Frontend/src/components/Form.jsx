import React, { useState, useRef } from "react";
import axios from 'axios';
import "../styles/App.css";

function Form() {
  const [formData, setFormData] = useState({
    title: "",    // Add title field
    content: "",  // Add content field
    tag: "",      // Add tag field
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and content are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        
        const uploadResponse = await axios.post(
          'http://localhost:5001/api/upload',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        
        if (uploadResponse.data.success) {
          imageUrl = uploadResponse.data.image_url;
        }
      }

      // Submit post with image URL if available
      const response = await axios.post(
        'http://localhost:5001/api/posts',
        {
          title: formData.title,
          content: formData.content,
          tag: formData.tag || null,
          image: imageUrl,
          date_created: formData.date_created
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setSuccess(true);
      setFormData({ title: "", content: "", tag: "" }); // Clear form on success
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      console.log('Server response:', response.data);
    } catch (error) {
      console.error('Error adding post:', error);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Failed to submit post'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Title and Tag Side by Side */}
        <div className="form-row">
          <div className="form-group" id ="title">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter post title"
            />
          </div>
  
          <div className="form-group" id ="tag">
            <label htmlFor="tag">Tag (optional)</label>
            <input
              type="text"
              id="tag"
              name="tag"
              value={formData.tag}
              onChange={handleChange}
              placeholder="Enter a tag"
            />
          </div>
        </div>
  
        {/* Content below Title and Tag */}
        <div>
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            placeholder="Write your post content here"
          />
        </div>

        {/* Image Upload */}
        <div className="form-group">
          <label htmlFor="image">Image (optional)</label>
          <div className="custom-file-upload" onClick={() => fileInputRef.current.click()}>
            <input
              type="file"
              id="image"
              name="image"
              onChange={handleImageChange}
              accept="image/*"
              ref={fileInputRef}
              className="image-input"
            />
            <div className="file-upload-label">Choose a file</div>
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