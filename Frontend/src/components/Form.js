import React, { useState } from "react";
import axios from 'axios';

function Form() {
  const [formData, setFormData] = useState({
    message: "",
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
    if (!formData.message.trim()) {
      setError("Message cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post(
        'http://localhost:5001/api/message',
        { content: formData.message },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: false, // Set to true if using cookies/auth
        }
      );

      setSuccess(true);
      setFormData({ message: "" }); // Clear form on success
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
        <input
          type="text"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Enter your message"
          disabled={isSubmitting}
        />
        <button 
          type="submit" 
          disabled={isSubmitting || !formData.message.trim()}
        >
          {isSubmitting ? 'Sending...' : 'Submit'}
        </button>
      </form>

      {error && <div className="error" style={{ color: 'red' }}>{error}</div>}
      {success && <div className="success" style={{ color: 'green' }}>Message sent successfully!</div>}
    </div>
  );
}

export default Form;

/*
import React, { useState } from "react";
import axios from 'axios';

function Form() {
  const [formData, setFormData] = useState({
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Send the message as JSON data
      const response = await axios.post('http://localhost:5000/api/message', {
        content: formData.message, // Match this with the backend's expected 'content' field
      });
      alert('Message added successfully!');
      console.log(response.data); // Log the response for debugging
    } catch (error) {
      console.error('Error adding message:', error);
      alert('Failed to add message');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="message"
        value={formData.message} // Controlled input
        onChange={handleChange} // Update state on change
        placeholder="Enter your message"
      />
      <button type="submit">Submit</button>
    </form>
  );
}

export default Form;
*/