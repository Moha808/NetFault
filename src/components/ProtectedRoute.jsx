import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireRole }) {
  const { session, role, loading } = useAuth();

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

  if (!session) return <Navigate to="/login" replace />;
  if (requireRole && role !== requireRole) return <Navigate to="/" replace />;

  return children;
}
