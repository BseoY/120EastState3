import { useCallback } from 'react';
import BASE_API_URL from '../config';

export function useAuth() {
  /**
   * Handles the Google login process, preserving the current page for redirect after authentication
   */
  const handleLogin = useCallback(() => {
    try {
      // Get the current page path and query parameters
      const returnTo = window.location.pathname + window.location.search;
      
      // Directly redirect to backend login endpoint - no API calls needed
      window.location.href = `${BASE_API_URL}/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
    } catch (error) {
      console.error('Error initiating Google login:', error);
    }
  }, []);

  return { handleLogin };
}

export default useAuth;
