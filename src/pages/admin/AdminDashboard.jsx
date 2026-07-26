import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { StatusBadge, PriorityBadge } from '../../components/Badge';

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('fault_reports')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports(data || []);
        setLoading(false);
      });
  }, []);

  const counts = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'Pending').length,
    inProgress: reports.filter((r) => r.status === 'In Progress').length,
    resolved: reports.filter((r) => r.status === 'Resolved').length,
    closed: reports.filter((r) => r.status === 'Closed').length,
    critical: reports.filter((r) => r.priority === 'Critical' && r.status !== 'Closed').length
  };

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
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : reports.length === 0 ? (
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
