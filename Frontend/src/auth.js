/**
 * Auth service for handling JWT authentication
 */
import axios from 'axios';
import BASE_API_URL from './config';

// Configure axios defaults
axios.defaults.baseURL = BASE_API_URL;
console.log('Auth service initialized with baseURL:', BASE_API_URL);

// Add a request interceptor to attach the JWT token to all requests
axios.interceptors.request.use(config => {
  // For JWT auth, we don't need withCredentials
  config.withCredentials = false;
  
  // For all requests, add the Authorization header if we have a token
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Add a response interceptor to handle errors globally
axios.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 errors (unauthorized) globally
    if (error.response && error.response.status === 401) {
      console.log('Authentication error - clearing token');
      localStorage.removeItem('authToken');
      // Redirect to login if configured
      // window.location.href = '/login';
    }
    
    // Specific handling for CORS errors
    if (error.message && error.message.includes('Network Error')) {
      console.error('Possible CORS error:', error);
    }
    
    return Promise.reject(error);
  }
);

// Auth service object
const authService = {
  /**
   * Initialize auth by checking URL for token parameter
   * This is called when the app loads
   */
  initAuth() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      console.log('Token found in URL, saving to localStorage');
      // Save token to localStorage
      localStorage.setItem('authToken', token);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
    
    // Check if we already have a token stored
    const existingToken = localStorage.getItem('authToken');
    return !!existingToken;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },

  /**
   * Get the current user's information from the server
   * @returns {Promise} Promise that resolves to user object
   */
  async getCurrentUser() {
    try {
      const response = await axios.get('/api/auth/user');
      return response.data;
    } catch (error) {
      this.handleAuthError(error);
      return null;
    }
  },

  /**
   * Redirect to Google login
   * @param {string} returnTo - Path to return to after login
   */
  login(returnTo = '') {
    window.location.href = `${BASE_API_URL}/api/auth/login?returnTo=${returnTo}`;
  },

  /**
   * Logout the user
   */
  logout() {
    // Clear the auth token immediately
    localStorage.removeItem('authToken');
    
    // Call the backend to clear any session data
    axios.post(`${BASE_API_URL}/api/auth/logout`, {}, {
      withCredentials: true
    })
      .catch(error => {
        console.error('Logout error:', error);
      });
    
    // Instead of redirecting immediately, return a promise that resolves when ready
    return new Promise((resolve) => {
      // Give the component a chance to clean up
      setTimeout(() => {
        window.location.href = '/';
        resolve();
      }, 100); // Small delay to prevent white flash
    });
  },

  /**
   * Handle authentication errors
   * @param {Error} error - The error object
   */
  handleAuthError(error) {
    if (error.response) {
      // If token is expired or invalid, clear it and redirect to login
      if (error.response.status === 401) {
        console.log('Authentication error:', error.response.data);
        localStorage.removeItem('authToken');
      }
    }
    return error;
  },

  /**
   * Make an authenticated API request
   * @param {string} method - HTTP method (get, post, put, delete)
   * @param {string} url - API endpoint
   * @param {object} data - Request data (for POST, PUT)
   * @returns {Promise} Axios promise
   */
  async apiRequest(method, url, data = null) {
    try {
      const response = await axios[method](url, data);
      return response.data;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }
};

export default authService;
