import React, {useState} from "react";
import axios from 'axios';

function Form() {
  const [formData, setFormData] = useState({
    message: "",
  });

  const handleChange = (e) => {
    const {name, value} = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/message', formData);
      alert(response.data.message);  // "Item added successfully!"
      // Clear form after submission
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
    <input
      type="text"
      name="message"
      value={formData.message} // Controlled input
      onChange={handleChange} // Update state on change
      placeholder="text"
    />
    <button type="submit">Submit</button>
    </form>
  );
}

export default Form;