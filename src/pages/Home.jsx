import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { session, role, loading, isLoggingOut } = useAuth();

  // Do not redirect to dashboard if a logout action is occurring
  if (isLoggingOut) return null;

  if (loading) return <div className="page-loading">Loading…</div>;

  // Authenticated users landing on "/" are forwarded to their respective dashboard
  if (session) return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;

  return (
    <div className="split-screen">
      <div className="split-left">
        <div className="hero" style={{ padding: 0, textAlign: 'left' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>Report network faults.<br/>Track to resolution.</h1>
          <p style={{ margin: '0 0 32px 0' }}>
            NetFault gives staff a simple way to log network issues — Wi-Fi, routers,
            servers, cabling — and lets admins triage, update, and close them out
            from one unified dashboard.
          </p>
          <div className="hero-actions" style={{ justifyContent: 'flex-start' }}>
            <Link to="/register" className="btn btn-primary">Get started</Link>
            <Link to="/login" className="btn btn-secondary">Sign in</Link>
          </div>
        </div>
      </div>
      <div className="split-right" style={{ backgroundImage: "url('/images/hero.jpg')" }}>
      </div>
    </div>
  );
}
