import axios from 'axios';
import BASE_API_URL from './config';

axios.defaults.baseURL = BASE_API_URL;
console.log('Auth service initialized with baseURL:', BASE_API_URL);

axios.interceptors.request.use(config => {
  config.withCredentials = false;
  
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.log('Authentication error - clearing token');
      localStorage.removeItem('authToken');
    }
    
    if (error.message && error.message.includes('Network Error')) {
      console.error('Possible CORS error:', error);
    }
    
    return Promise.reject(error);
  }
);

const authService = {
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

  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },

  async getCurrentUser() {
    try {
      const response = await axios.get('/api/auth/user');
      return response.data;
    } catch (error) {
      this.handleAuthError(error);
      return null;
    }
  },

  login(returnTo = '') {
    window.location.href = `${BASE_API_URL}/api/auth/login?returnTo=${returnTo}`;
  },

  logout() {

    localStorage.removeItem('authToken');
    

    axios.post(`${BASE_API_URL}/api/auth/logout`, {}, {
      withCredentials: true
    })
      .catch(error => {
        console.error('Logout error:', error);
      });
    

    return new Promise((resolve) => {

      setTimeout(() => {
        window.location.href = '/';
        resolve();
      }, 100);
    });
  },

  handleAuthError(error) {
    if (error.response) {

      if (error.response.status === 401) {
        console.log('Authentication error:', error.response.data);
        localStorage.removeItem('authToken');
      }
    }
    return error;
  },

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
