import React, { useState } from "react";
import axios from 'axios';
import "../styles/App.css";

function Form() {
  const [formData, setFormData] = useState({
    title: "",    // Add title field
    content: "",  // Add content field
    tag: "",      // Add tag field
  });
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
      const response = await axios.post(
        'http://localhost:5001/api/posts',  // Ensure this is the correct endpoint
        {
          title: formData.title,
          content: formData.content,
          tag: formData.tag || null,  // If tag is empty, send null
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
      console.log('Server response:', response.data);
    } catch (error) {
      console.error('Error adding message:', error);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Failed to send message'
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