import { useCallback } from 'react';
import BASE_API_URL from '../config';

export function useAuth() {
  const handleLogin = useCallback(() => {
    try {
      const returnTo = window.location.pathname + window.location.search;
      window.location.href = `${BASE_API_URL}/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
    } catch (error) {
      console.error('Error initiating Google login:', error);
    }
  }, []);

  return { handleLogin };
}

export default useAuth;
