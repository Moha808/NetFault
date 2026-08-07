import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  // Supabase sends the user here with an access token in the URL hash.
  // onAuthStateChange fires a PASSWORD_RECOVERY event automatically.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Session is now valid — user can update their password
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
    setTimeout(() => navigate('/login'), 2500);
  }

  const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );

  return (
    <div className="auth-page">
      <div className="card form-card">
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
            <h2 style={{ marginBottom: '12px' }}>Password updated!</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Your password has been changed successfully. Redirecting you to sign in…
            </p>
          </div>
        ) : (
          <>
            <h2>Set new password</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', marginTop: '8px' }}>
              Choose a strong new password for your account.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="password">New password</label>
                <div className="password-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div className="field">
                <label htmlFor="confirmPassword">Confirm new password</label>
                <div className="password-input-wrap">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              {error && <p className="error-text">{error}</p>}
              <button
                className="btn btn-primary"
                type="submit"
                disabled={isSubmitting}
                style={{ width: '100%', marginTop: '12px' }}
              >
                {isSubmitting ? 'Updating password…' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
