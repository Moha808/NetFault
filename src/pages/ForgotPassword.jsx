import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
  }

  return (
    <div className="auth-page">
      <div className="card form-card">
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📧</div>
            <h2 style={{ marginBottom: '12px' }}>Check your email</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              We sent a password reset link to <strong>{email}</strong>. 
              Click the link in the email to set a new password.
            </p>
            <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h2>Forgot password?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', marginTop: '8px' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              {error && <p className="error-text">{error}</p>}
              <button
                className="btn btn-primary"
                type="submit"
                disabled={isSubmitting}
                style={{ width: '100%', marginTop: '12px' }}
              >
                {isSubmitting ? 'Sending link…' : 'Send reset link'}
              </button>
            </form>
            <p className="helper-text" style={{ marginTop: 24 }}>
              Remember your password? <Link to="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
