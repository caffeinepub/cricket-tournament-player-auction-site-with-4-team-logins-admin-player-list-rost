import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

/**
 * Safe redirect component for unknown routes.
 * Automatically redirects to home without showing a full-screen 404 UI.
 */
export default function SafeNotFoundRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home route for unknown paths
    navigate({ to: '/', replace: true });
  }, [navigate]);

  // Return null - no UI shown during redirect
  return null;
}
