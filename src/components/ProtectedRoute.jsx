import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireRole }) {
  const { session, role, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (requireRole && role !== requireRole) return <Navigate to="/" replace />;

  return children;
}
