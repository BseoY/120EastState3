// Use environment variable if set, otherwise use Heroku backend URL for production
const BASE_API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";
export default BASE_API_URL;