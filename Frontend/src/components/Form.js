import React, {useState} from "react";

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
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
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