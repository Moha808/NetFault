import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/Badge';

export default function UserDashboard() {
  const { user, profile } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchReports() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('fault_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }
      setReports(data || []);
      setLoading(false);
    }

    fetchReports();
    return () => { cancelled = true; };
  }, [user]);

  const counts = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'Pending').length,
    inProgress: reports.filter((r) => r.status === 'In Progress').length,
    resolved: reports.filter((r) => r.status === 'Resolved').length
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ width: 260, height: 28, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 220, height: 18 }} />
          </div>
          <div className="skeleton" style={{ width: 130, height: 42, borderRadius: 8 }} />
        </div>
        <div className="stat-grid">
          {[1, 2, 3, 4].map((i) => (
            <div className="stat-card" key={i}>
              <div className="skeleton" style={{ width: 60, height: 40, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 100, height: 14 }} />
            </div>
          ))}
        </div>
        <div className="table-wrap">
          <div style={{ padding: 20 }}>
            {[1, 2, 3].map((i) => (
              <div className="skeleton" key={i} style={{ height: 20, marginBottom: 16 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-state">
          <p className="error-text">{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Welcome back{profile ? `, ${profile.full_name.split(' ')[0]}` : ''}</h1>
          <p>Here's a snapshot of your reported faults.</p>
        </div>
        <Link to="/report" className="btn btn-primary">Report a fault</Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-number">{counts.total}</div>
          <div className="stat-label">Total reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{counts.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{counts.inProgress}</div>
          <div className="stat-label">In progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{counts.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      <div className="table-wrap">
        {reports.length === 0 ? (
          <div className="empty-state">
            No reports yet. <Link to="/report">Report your first fault.</Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ticket</th><th>Title</th><th>Category</th>
                <th>Priority</th><th>Status</th><th>Reported</th>
              </tr>
            </thead>
            <tbody>
              {reports.slice(0, 8).map((r) => (
                <tr key={r.id}>
                  <td><Link to={`/reports/${r.id}`}>{r.ticket_number}</Link></td>
                  <td>{r.title}</td>
                  <td>{r.category}</td>
                  <td><PriorityBadge priority={r.priority} /></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
