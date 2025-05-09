const isProduction = process.env.NODE_ENV === "production";

const BASE_API_URL = process.env.REACT_APP_BACKEND_URL || 
  (isProduction ? "https://one20es-backend-bd090d21d298.herokuapp.com" : "http://localhost:5001");

export default BASE_API_URL;