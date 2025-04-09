// Use environment variable if set, otherwise use Heroku backend URL for production
const BASE_API_URL = process.env.REACT_APP_BACKEND_URL || "https://one20es-backend-bd090d21d298.herokuapp.com";
export default BASE_API_URL;