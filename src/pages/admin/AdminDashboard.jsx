import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { StatusBadge, PriorityBadge } from '../../components/Badge';

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchReports() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('fault_reports')
        .select('*, profiles(full_name)')
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
  }, []);

  const counts = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'Pending').length,
    inProgress: reports.filter((r) => r.status === 'In Progress').length,
    resolved: reports.filter((r) => r.status === 'Resolved').length,
    closed: reports.filter((r) => r.status === 'Closed').length,
    critical: reports.filter((r) => r.priority === 'Critical' && r.status !== 'Closed').length
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 260, height: 18 }} />
          </div>
          <div className="skeleton" style={{ width: 150, height: 42, borderRadius: 8 }} />
        </div>
        <div className="stat-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div className="stat-card" key={i}>
              <div className="skeleton" style={{ width: 60, height: 40, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 100, height: 14 }} />
            </div>
          ))}
        </div>
        <div className="skeleton" style={{ width: 140, height: 22, marginBottom: 16 }} />
        <div className="table-wrap">
          <div style={{ padding: 20 }}>
            {[1, 2, 3, 4].map((i) => (
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
          <h1>Admin dashboard</h1>
          <p>Overview of all reported network faults.</p>
        </div>
        <Link to="/admin/reports" className="btn btn-primary">View all reports</Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-number">{counts.total}</div><div className="stat-label">Total reports</div></div>
        <div className="stat-card"><div className="stat-number">{counts.pending}</div><div className="stat-label">Pending</div></div>
        <div className="stat-card"><div className="stat-number">{counts.inProgress}</div><div className="stat-label">In progress</div></div>
        <div className="stat-card"><div className="stat-number">{counts.resolved}</div><div className="stat-label">Resolved</div></div>
        <div className="stat-card"><div className="stat-number">{counts.closed}</div><div className="stat-label">Closed</div></div>
        <div className="stat-card"><div className="stat-number">{counts.critical}</div><div className="stat-label">Open critical</div></div>
      </div>

      <h3>Recent reports</h3>
      <div className="table-wrap">
        {reports.length === 0 ? (
          <div className="empty-state">No reports yet.</div>
        ) : (
          <table>
            <thead>
              <tr><th>Ticket</th><th>Title</th><th>Reporter</th><th>Priority</th><th>Status</th><th>Reported</th></tr>
            </thead>
            <tbody>
              {reports.slice(0, 10).map((r) => (
                <tr key={r.id}>
                  <td><Link to={`/admin/reports/${r.id}`}>{r.ticket_number}</Link></td>
                  <td>{r.title}</td>
                  <td>{r.profiles?.full_name ?? '—'}</td>
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
