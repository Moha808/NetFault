import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { session, role, loading: authLoading, isLoggingOut } = useAuth();

  if (isLoggingOut) return null;
  if (authLoading) return <div className="page-loading">Loading…</div>;
  if (session) return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    setIsSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Fill in department after the profile row is auto-created by the trigger.
    setDone(true);
    setTimeout(() => navigate('/login'), 1800);
  }

  return (
    <div className="auth-page">
      <div className="card form-card">
        <h2>Create your account</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" required value={fullName}
              onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="department">Department / Unit</label>
            <input id="department" value={department}
              onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrap">
              <input id="password" type={showPassword ? "text" : "password"} required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)} />
              <button 
                type="button" 
                className="password-toggle" 
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          {done && <p className="success-text">Account created — redirecting to sign in…</p>}
          <button className="btn btn-primary" type="submit" disabled={isSubmitting} style={{ width: '100%', marginTop: '12px' }}>
            {isSubmitting ? 'Creating account…' : 'Register'}
          </button>
        </form>
        <p className="helper-text" style={{ marginTop: 24 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
