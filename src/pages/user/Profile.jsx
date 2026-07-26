import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, department })
      .eq('id', profile.id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    refreshProfile();
    setSaved(true);
  }

  if (!profile) return <div className="page"><div className="empty-state">Loading…</div></div>;

  return (
    <div className="page">
      <div className="card form-card">
        <h2>My profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input value={profile.email} disabled />
          </div>
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="department">Department / Unit</label>
            <input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          {error && <p className="error-text">{error}</p>}
          {saved && <p className="success-text">Profile updated.</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
