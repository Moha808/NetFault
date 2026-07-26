import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';

export default function Navbar() {
  const { session, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  async function handleConfirmSignOut() {
    setIsLogoutModalOpen(false);
    await signOut();
    navigate('/');
  }

  const homeLink = role === 'admin' ? '/admin' : role === 'user' ? '/dashboard' : '/';

  return (
    <>
      <nav className="navbar">
        <Link to={homeLink} className="navbar-brand">
          <span className="brand-mark" aria-hidden="true">⌁</span>
          NetFault
        </Link>

        <div className="navbar-links">
          {!session && (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}

          {session && role === 'user' && (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/report">Report Fault</Link>
              <Link to="/my-reports">My Reports</Link>
              <Link to="/profile">Profile</Link>
            </>
          )}

          {session && role === 'admin' && (
            <>
              <Link to="/admin">Dashboard</Link>
              <Link to="/admin/reports">All Reports</Link>
              <Link to="/admin/categories">Categories</Link>
              <Link to="/admin/users">Users</Link>
            </>
          )}

          {session && (
            <button className="btn btn-ghost btn-sm" onClick={() => setIsLogoutModalOpen(true)}>
              {profile?.full_name?.split(' ')[0] ?? 'Account'} · Sign out
            </button>
          )}
        </div>
      </nav>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        onConfirm={handleConfirmSignOut}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
}
