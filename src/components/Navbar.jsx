import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';

export default function Navbar() {
  const { session, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  async function handleConfirmSignOut() {
    setIsLogoutModalOpen(false);
    setIsMobileMenuOpen(false);
    await signOut();
  }

  const homeLink = role === 'admin' ? '/admin' : role === 'user' ? '/dashboard' : '/';

  function isActive(path) {
    return location.pathname === path;
  }

  const navLinks = (
    <>
      {!session && (
        <>
          <Link to="/login" className={isActive('/login') ? 'nav-active' : ''}>Login</Link>
          <Link to="/register" className={`btn btn-primary btn-sm${isActive('/register') ? ' nav-active' : ''}`}>Register</Link>
        </>
      )}

      {session && role === 'user' && (
        <>
          <Link to="/dashboard" className={isActive('/dashboard') ? 'nav-active' : ''}>Dashboard</Link>
          <Link to="/report" className={isActive('/report') ? 'nav-active' : ''}>Report Fault</Link>
          <Link to="/my-reports" className={isActive('/my-reports') ? 'nav-active' : ''}>My Reports</Link>
          <Link to="/profile" className={isActive('/profile') ? 'nav-active' : ''}>Profile</Link>
        </>
      )}

      {session && role === 'admin' && (
        <>
          <Link to="/admin" className={isActive('/admin') ? 'nav-active' : ''}>Dashboard</Link>
          <Link to="/admin/reports" className={isActive('/admin/reports') ? 'nav-active' : ''}>All Reports</Link>
          <Link to="/admin/categories" className={isActive('/admin/categories') ? 'nav-active' : ''}>Categories</Link>
          <Link to="/admin/users" className={isActive('/admin/users') ? 'nav-active' : ''}>Users</Link>
        </>
      )}

      {session && (
        <button className="btn btn-ghost btn-sm" onClick={() => { setIsMobileMenuOpen(false); setIsLogoutModalOpen(true); }}>
          {profile?.full_name?.split(' ')[0] ?? 'Account'} · Sign out
        </button>
      )}
    </>
  );

  return (
    <>
      <nav className="navbar" ref={menuRef}>
        <div className="navbar-top">
          <Link to={homeLink} className="navbar-brand">
            <span className="brand-mark" aria-hidden="true">⌁</span>
            NetFault
          </Link>

          {/* Hamburger button - mobile only */}
          <button
            className="hamburger-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            <span className={`hamburger-icon${isMobileMenuOpen ? ' open' : ''}`}>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>

        {/* Desktop links */}
        <div className="navbar-links navbar-desktop">
          {navLinks}
        </div>

        {/* Mobile drawer */}
        <div className={`navbar-mobile-drawer${isMobileMenuOpen ? ' drawer-open' : ''}`}>
          <div className="navbar-mobile-links">
            {navLinks}
          </div>
        </div>
      </nav>

      {/* Overlay behind mobile drawer */}
      {isMobileMenuOpen && <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)} />}

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
