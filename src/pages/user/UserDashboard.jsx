import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/Badge';

export default function UserDashboard() {
  const { user, profile } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('fault_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports(data || []);
        setLoading(false);
      });
  }, [user]);

  const counts = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'Pending').length,
    inProgress: reports.filter((r) => r.status === 'In Progress').length,
    resolved: reports.filter((r) => r.status === 'Resolved').length
  };

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
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : reports.length === 0 ? (
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
