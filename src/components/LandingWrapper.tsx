import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Landing } from './Landing';
import { Navigate } from 'react-router-dom';

export function LandingWrapper() {
  const [showLanding, setShowLanding] = useState(true);
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return null; // Let the auth guard handle loading state
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show auth page if user has dismissed landing
  if (!showLanding) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Landing
      onGetStarted={() => navigate('/auth')}
      onSignUp={() => navigate('/auth')}
    />
  );
}
