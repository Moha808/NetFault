import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireRole }) {
  const { session, role, loading, isLoggingOut } = useAuth();

  // If a logout is currently in progress, do not redirect to /login
  if (isLoggingOut) {
    return null;
  }

  // Display loading skeleton while session or role is being resolved
  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-skeleton-container">
          <div className="skeleton skeleton-header" />
          <div className="skeleton-row">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
          <div className="skeleton skeleton-block" />
        </div>
      </div>
    );
  }

  // Unauthenticated users are redirected to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required and known, check permission
  if (requireRole && role && role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
