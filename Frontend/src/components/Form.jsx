import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../styles/Form.css";
import { BASE_API_URL } from '../utils/constants';
import { FaImage, FaVideo, FaFileAudio, FaFile, FaTimes, FaPlus } from 'react-icons/fa';

function Form({ onNewPost, user }) {
  const [formData, setFormData] = useState({
    title: "",    // Add title field
    content: "",  // Add content field
    tag: "",      // Add tag field
  });
  
  // Media state - for handling multiple media files
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaInputKey, setMediaInputKey] = useState(Date.now()); // For forcing input refresh
  const mediaInputRef = useRef(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  
  // Fetch tags when component mounts
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setTagsLoading(true);
        const response = await axios.get(`${BASE_API_URL}/api/tags`);
        // Sort tags alphabetically by name
        const sortedTags = response.data.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setTags(sortedTags);
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setTagsLoading(false);
      }
    };
    
    fetchTags();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Apply character limits
    if (name === 'title' && value.length > 100) {
      return; // Don't update if exceeding 100 char limit for title
    }
    if (name === 'content' && value.length > 1500) {
      return; // Don't update if exceeding 1500 char limit for content
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle media file selection
  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check if adding these files would exceed the limit
    if (mediaFiles.length + files.length > 5) {
      setError("You can only upload up to 5 files");
      return;
    }
    
    // Process each selected file
    const newMediaPromises = files.map(file => {
      return new Promise((resolve) => {
        // Determine file type
        const fileExt = file.name.split('.').pop().toLowerCase();
        let mediaType = 'document'; // Default type
        
        // Determine media type based on extension
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'].includes(fileExt)) {
          mediaType = 'image';
        } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(fileExt)) {
          mediaType = 'video';
        } else if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(fileExt)) {
          mediaType = 'audio';
        }
        
        // Create preview URL
        if (mediaType === 'image') {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              file,
              type: mediaType,
              preview: reader.result,
              caption: ''
            });
          };
          reader.readAsDataURL(file);
        } else {
          // For video, audio, documents - use URL.createObjectURL
          const preview = URL.createObjectURL(file);
          resolve({
            file,
            type: mediaType,
            preview,
            caption: ''
          });
        }
      });
    });
    
    // Add all new media files to state
    Promise.all(newMediaPromises).then(newMediaFiles => {
      setMediaFiles(prev => [...prev, ...newMediaFiles]);
      // Clear the file input to allow selecting the same file again
      setMediaInputKey(Date.now());
    });
  };
  
  // Remove a media file
  const handleMediaRemove = (index) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      // If it's a video/audio with an object URL, revoke it to free memory
      if (newFiles[index].type !== 'image' && newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
  
  // Update media caption
  const handleCaptionChange = (index, caption) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      newFiles[index].caption = caption;
      return newFiles;
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      tag: ""
    });
    
    // Reset media files
    mediaFiles.forEach(media => {
      if (media.type !== 'image' && media.preview) {
        URL.revokeObjectURL(media.preview);
      }
    });
    setMediaFiles([]);
    setMediaInputKey(Date.now());
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
      
      // Append all media files to the form data
      mediaFiles.forEach((media, index) => {
        // Use a unique field name for each file
        formPayload.append(`media_${index}`, media.file);
        
        // If there's a caption, add it with a matching field name
        if (media.caption) {
          formPayload.append(`media_${index}_caption`, media.caption);
        }
      });
  
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
      
      // If onNewPost function is provided, call it with the new post data
      if (onNewPost && response.data && response.data.post) {
        onNewPost(response.data.post);
      }
  
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
    <>
      <div>
        <form onSubmit={handleSubmit} className="form-container">
          <div className="media-upload-container">
            <div className="media-upload-header">
              <h3>Upload Media</h3>
              <p className="media-upload-info">Upload up to 5 files (images, videos, audio, documents)</p>
            </div>
            
            {/* Media Upload Button */}
            <div className="media-upload-button-container">
              <button 
                type="button" 
                className="media-upload-button"
                onClick={() => mediaInputRef.current.click()}
                disabled={mediaFiles.length >= 5}
              >
                <FaPlus className="media-upload-icon" />
                <span>Add Media ({mediaFiles.length}/5)</span>
              </button>
              <input
                key={mediaInputKey}
                type="file"
                id="media-input"
                name="media"
                onChange={handleMediaChange}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                ref={mediaInputRef}
                className="media-input"
                style={{ display: 'none' }}
                multiple
              />
            </div>
            
            {/* Error message if too many files */}
            {error && error.includes("upload up to 5 files") && (
              <div className="media-upload-error">{error}</div>
            )}
            
            {/* Media Previews */}
            {mediaFiles.length > 0 && (
              <div className="media-preview-grid">
                {mediaFiles.map((media, index) => (
                  <div key={index} className={`media-preview-item media-type-${media.type}`}>
                    {/* Preview based on media type */}
                    {media.type === 'image' && (
                      <img src={media.preview} alt="Preview" className="media-preview-image" />
                    )}
                    
                    {media.type === 'video' && (
                      <div className="media-preview-wrapper">
                        <video 
                          src={media.preview} 
                          controls 
                          className="media-preview-video" 
                        />
                        <div className="media-type-icon video-icon">
                          <FaVideo />
                        </div>
                      </div>
                    )}
                    
                    {media.type === 'audio' && (
                      <div className="media-preview-wrapper">
                        <audio 
                          src={media.preview} 
                          controls 
                          className="media-preview-audio" 
                        />
                        <div className="media-type-icon audio-icon">
                          <FaFileAudio />
                        </div>
                      </div>
                    )}
                    
                    {media.type === 'document' && (
                      <div className="media-preview-wrapper document-preview">
                        <div className="media-type-icon document-icon">
                          <FaFile />
                        </div>
                        <p className="document-name">{media.file.name}</p>
                      </div>
                    )}
                    
                    {/* Caption input */}
                    <input
                      type="text"
                      placeholder="Add a caption"
                      value={media.caption}
                      onChange={(e) => handleCaptionChange(index, e.target.value)}
                      className="media-caption-input"
                    />
                    
                    {/* Remove button */}
                    <button 
                      type="button" 
                      onClick={() => handleMediaRemove(index)} 
                      className="remove-media-btn"
                      aria-label="Remove media"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-input-container">
            {/* Title Input */}
            <div className="form-group" id='title'>
              <label htmlFor="title-input" id='title-label'>Title</label>
              <input
                type="text"
                id="title-input"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter post title"
                maxLength={100}
              />
              <div className="character-count">
                {/* Warning near 75 characters out of 100*/}
                <span className={formData.title.length >= 75 ? "count-warning" : ""}>
                  {formData.title.length}
                </span>
                /100 characters
              </div>
            </div>

            {/* Content */}
            <div className="form-group" id='content'>
              <label htmlFor="content-input">Content</label>
              <textarea
                id="content-input"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                placeholder="Enter content"
                maxLength={1500}
              />
              <div className="character-count">
                {/* Warning near 1400 characters out of 1500*/}
                <span className={formData.content.length >= 1400 ? "count-warning" : ""}>
                  {formData.content.length}
                </span>
                /1500 characters
              </div>
            </div>


            <div className="other-input-container">
              {/* Tag Input */}
              <div className="form-group" id='tag'>
                <label htmlFor="tag-input">Tag</label>
                <select
                  id="tag-input"
                  name="tag"
                  value={formData.tag}
                  onChange={handleChange}
                  required
                  className="tag-dropdown"
                  disabled={tagsLoading}
                >
                  <option value="">{tagsLoading ? "Loading tags..." : "Select a tag"}</option>
                  {!tagsLoading && tags.map(tag => (
                    <option key={tag.id} value={tag.name}>{tag.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div> 
            {/* Submit Button */}
            <button type="submit" disabled={isSubmitting} className="submit-button">
              {isSubmitting ? "Submitting..." : "Share Your Story"}
            </button>
        </form>
        
        {error && <div className="form-status error">{error}</div>}
        {success && <div className="form-status success">Your story has been sent for review! You will recieve an email regarding the status of your submission.</div>}
      </div>
    </>
    
  );
  
}

export default Form;