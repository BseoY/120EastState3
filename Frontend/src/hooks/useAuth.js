import { useCallback } from 'react';
import axios from 'axios';
import BASE_API_URL from '../config';

export function useAuth() {
  /**
   * Handles the Google login process, preserving the current page for redirect after authentication
   */
  const handleLogin = useCallback(async () => {
    try {
      // Get the current page path and query parameters
      const returnTo = window.location.pathname + window.location.search;
      
      // Get the Google login URL from the backend with returnTo parameter
      const response = await axios.get(
        `${BASE_API_URL}/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
      );
      
      // Redirect to Google login page
      window.location.href = response.data.redirect_url;
    } catch (error) {
      console.error('Error initiating Google login:', error);
    }
  }, []);

  return { handleLogin };
}

export default useAuth;
